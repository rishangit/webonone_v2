import type { NextFunction, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { ConversationService } from '../services/conversation.service.js'
import { createConversationSchema, sendMessageSchema } from '../schemas/conversationSchemas.js'

function contextOrThrow(req: AuthenticatedRequest) {
  if (!req.aiContext) {
    throw new Error('Missing AI request context')
  }
  return req.aiContext
}

export function createConversationControllers(service: ConversationService) {
  return {
    list: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const page = req.query.page ? Number(req.query.page) : undefined
        const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
        const result = await service.listConversations(contextOrThrow(req), page, pageSize)
        res.json(result)
      } catch (err) {
        next(err)
      }
    },

    create: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const body = createConversationSchema.parse(req.body ?? {})
        const conversation = await service.createConversation(contextOrThrow(req), body.title)
        res.status(201).json({ conversation })
      } catch (err) {
        next(err)
      }
    },

    get: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const conversation = await service.getConversation(contextOrThrow(req), String(req.params.id))
        res.json({ conversation })
      } catch (err) {
        next(err)
      }
    },

    listMessages: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await service.listMessages(contextOrThrow(req), String(req.params.id))
        res.json(result)
      } catch (err) {
        next(err)
      }
    },

    sendMessage: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const body = sendMessageSchema.parse(req.body)
        const result = await service.sendMessage(contextOrThrow(req), String(req.params.id), body.content)
        res.status(201).json(result)
      } catch (err) {
        next(err)
      }
    },

    confirmToolCall: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await service.confirmToolCall(
          contextOrThrow(req),
          String(req.params.id),
          String(req.params.toolCallId),
        )
        res.json(result)
      } catch (err) {
        next(err)
      }
    },

    rejectToolCall: async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const remaining = Boolean(
          req.body && typeof req.body === 'object' && (req.body as { remaining?: unknown }).remaining === true,
        )
        const result = await service.rejectToolCall(
          contextOrThrow(req),
          String(req.params.id),
          String(req.params.toolCallId),
          { remaining },
        )
        res.json(result)
      } catch (err) {
        next(err)
      }
    },
  }
}
