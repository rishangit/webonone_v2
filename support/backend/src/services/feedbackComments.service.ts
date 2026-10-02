import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { db } from '../models/db.js'
import type { CreateFeedbackCommentBody } from '../schemas/feedbackSchemas.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import type { FeedbackReportRow } from './feedback.service.js'

const FEEDBACK_COMMENT_TEMPLATE_SLUG = 'feedback_comment'

export interface FeedbackCommentDto {
  id: string
  feedbackReportId: string
  authorUserId: string
  authorEmail: string
  body: string
  createdAt: string
}

interface FeedbackCommentRow {
  id: string
  feedback_report_id: string
  author_user_id: string
  author_email: string
  body: string
  created_at: Date
}

function rowToDto(row: FeedbackCommentRow): FeedbackCommentDto {
  return {
    id: row.id,
    feedbackReportId: row.feedback_report_id,
    authorUserId: row.author_user_id,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listFeedbackComments(feedbackReportId: string): Promise<FeedbackCommentDto[]> {
  const rows = await db<FeedbackCommentRow>('feedback_comments')
    .where({ feedback_report_id: feedbackReportId })
    .orderBy('created_at', 'asc')
  return rows.map(rowToDto)
}

export async function markFeedbackReportViewed(
  feedbackReportId: string,
  userId: string,
): Promise<void> {
  const now = db.fn.now(3)
  const existing = await db('feedback_report_views')
    .where({ user_id: userId, feedback_report_id: feedbackReportId })
    .first()
  if (existing) {
    await db('feedback_report_views')
      .where({ user_id: userId, feedback_report_id: feedbackReportId })
      .update({ last_viewed_at: now })
    return
  }
  await db('feedback_report_views').insert({
    user_id: userId,
    feedback_report_id: feedbackReportId,
    last_viewed_at: now,
  })
}

async function notifyCommentByEmail(
  report: { title: string; reporterEmail: string; reporterUserId: string },
  comment: FeedbackCommentDto,
  authorIsReporter: boolean,
): Promise<void> {
  const feedbackUrl = `${env.frontendBaseUrl.replace(/\/$/, '')}/feedback`
  const payload = {
    ticketTitle: report.title,
    commentBody: comment.body,
    commentAuthorEmail: comment.authorEmail,
    feedbackUrl,
  }

  const recipients: string[] = []
  if (authorIsReporter) {
    recipients.push(env.superAdminEmail)
  } else if (report.reporterEmail && report.reporterEmail !== comment.authorEmail) {
    recipients.push(report.reporterEmail)
  }

  for (const toEmail of recipients) {
    await sendTransactionalEmail({
      templateSlug: FEEDBACK_COMMENT_TEMPLATE_SLUG,
      toEmail,
      payload,
    })
  }
}

export async function createFeedbackComment(
  feedbackReportId: string,
  body: CreateFeedbackCommentBody,
  author: { id: string; email: string },
): Promise<FeedbackCommentDto> {
  const reportRow = await db<FeedbackReportRow>('feedback_reports')
    .where({ id: feedbackReportId })
    .first()
  if (!reportRow) {
    throw new Error('NOT_FOUND')
  }
  const report = {
    title: reportRow.title,
    reporterEmail: reportRow.reporter_email,
    reporterUserId: reportRow.reporter_user_id,
  }

  const id = nanoid()
  const now = db.fn.now(3)
  await db('feedback_comments').insert({
    id,
    feedback_report_id: feedbackReportId,
    author_user_id: author.id,
    author_email: author.email,
    body: body.body,
    created_at: now,
  })

  const row = await db<FeedbackCommentRow>('feedback_comments').where({ id }).first()
  if (!row) {
    throw new Error('Failed to create comment')
  }

  const dto = rowToDto(row)
  const authorIsReporter = author.id === report.reporterUserId
  await notifyCommentByEmail(report, dto, authorIsReporter)

  return dto
}

export async function countUnreadCommentsForReports(
  reportIds: string[],
  viewerUserId: string,
): Promise<Record<string, number>> {
  if (reportIds.length === 0) return {}

  const views = await db('feedback_report_views')
    .where({ user_id: viewerUserId })
    .whereIn('feedback_report_id', reportIds)
  const lastViewedByReport = new Map(
    views.map((v: { feedback_report_id: string; last_viewed_at: Date }) => [
      v.feedback_report_id,
      v.last_viewed_at,
    ]),
  )

  const comments = await db<FeedbackCommentRow>('feedback_comments')
    .whereIn('feedback_report_id', reportIds)
    .whereNot({ author_user_id: viewerUserId })

  const counts: Record<string, number> = {}
  for (const comment of comments) {
    const lastViewed = lastViewedByReport.get(comment.feedback_report_id)
    if (lastViewed && comment.created_at <= lastViewed) continue
    counts[comment.feedback_report_id] = (counts[comment.feedback_report_id] ?? 0) + 1
  }
  return counts
}
