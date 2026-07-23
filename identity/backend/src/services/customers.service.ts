import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { AuthError } from './auth.service.js'
import {
  createPasswordResetToken,
  createUser,
  db,
  findUserByEmail,
  findUserById,
  findUserByPhoneNumber,
  invalidateUnusedPasswordResetTokens,
} from '../models/user.repository.js'
import * as roleRepo from '../repositories/userRole.repository.js'
import {
  findCompanyCustomers,
  type CompanyCustomerRow,
} from '../repositories/users.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { getGatewayStatus, sendTransactionalSms } from './smsClient.service.js'
import { generatePasswordResetToken, hashToken } from './token.service.js'

const INVITE_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
const E164_PHONE = /^\+\d{7,15}$/

export type CustomerDto = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  phone: string | null
  role: 'member'
  companyId: string
  addedAt: string
  isEmailVerified?: boolean
}

export type ListCustomersResult = {
  items: CustomerDto[]
  total: number
  page: number
  pageSize: number
}

export type AddCustomerResult = {
  customer: CustomerDto
  warnings: string[]
}

function toCustomerDto(row: CompanyCustomerRow): CustomerDto {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    phone: row.phone_number,
    role: 'member',
    companyId: row.company_id,
    addedAt: row.added_at.toISOString(),
  }
}

export async function listCompanyCustomers(input: {
  companyId: string
  search: string
  page: number
  pageSize: number
}): Promise<ListCustomersResult> {
  const result = await findCompanyCustomers(input)
  return {
    items: result.items.map(toCustomerDto),
    total: result.total,
    page: input.page,
    pageSize: input.pageSize,
  }
}

async function loadCustomerDto(userId: string, companyId: string): Promise<CustomerDto | null> {
  const memberRole = await roleRepo.findCompanyMemberRole(userId, companyId)
  const user = await findUserById(userId)
  if (!memberRole || !user) {
    return null
  }
  return {
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    phone: user.phone_number,
    role: 'member',
    companyId,
    addedAt: memberRole.created_at.toISOString(),
    isEmailVerified: Boolean(user.is_email_verified),
  }
}

async function notifyWelcome(input: {
  companyId: string
  companyName: string
  user: { email: string | null; displayName: string; phoneNumber: string | null }
}): Promise<string[]> {
  const warnings: string[] = []
  const payload = {
    userName: input.user.displayName,
    companyName: input.companyName,
  }

  const email = input.user.email?.trim()
  if (email) {
    const emailOk = await sendTransactionalEmail({
      templateSlug: 'welcome',
      toEmail: email,
      payload,
      companyId: input.companyId,
      requestedByService: 'identity',
    })
    if (!emailOk) {
      warnings.push('welcome_email_failed')
    }
  }

  const phone = input.user.phoneNumber?.trim()
  if (!phone) {
    return warnings
  }

  const gateway = await getGatewayStatus(input.companyId)
  if (!gateway?.configured) {
    return warnings
  }

  const smsOk = await sendTransactionalSms({
    toNumber: phone,
    templateSlug: 'welcome',
    payload,
    companyId: input.companyId,
    requestedByService: 'identity',
  })
  if (!smsOk) {
    warnings.push('welcome_sms_failed')
  }

  return warnings
}

async function issueInviteSetPasswordToken(userId: string): Promise<string> {
  await invalidateUnusedPasswordResetTokens(userId)
  const token = generatePasswordResetToken()
  await createPasswordResetToken({
    id: nanoid(),
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_TOKEN_EXPIRY_MS),
  })
  return token
}

async function notifyInviteSetPassword(input: {
  companyId: string
  companyName: string
  user: { email: string | null; displayName: string; phoneNumber: string }
  actionUrl: string
}): Promise<string[]> {
  const warnings: string[] = []
  let emailSent = false
  let smsSent = false

  const email = input.user.email?.trim()
  if (email) {
    emailSent = await sendTransactionalEmail({
      templateSlug: 'invite_set_password',
      toEmail: email,
      payload: {
        userName: input.user.displayName,
        companyName: input.companyName,
        actionUrl: input.actionUrl,
      },
      companyId: input.companyId,
      requestedByService: 'identity',
    })
    if (!emailSent) {
      warnings.push('invite_email_failed')
    }
  }

  const gateway = await getGatewayStatus(input.companyId)
  if (gateway?.configured) {
    smsSent = await sendTransactionalSms({
      toNumber: input.user.phoneNumber,
      body: `Hi ${input.user.displayName}, you were added to ${input.companyName}. Set your password: ${input.actionUrl}`,
      companyId: input.companyId,
      requestedByService: 'identity',
    })
    if (!smsSent) {
      warnings.push('invite_sms_failed')
    }
  }

  if (!email && !smsSent) {
    warnings.push('invite_delivery_failed')
  }

  return warnings
}

export async function addCompanyCustomer(input: {
  companyId: string
  userId: string
  companyName: string
}): Promise<AddCustomerResult> {
  const user = await findUserById(input.userId)
  if (!user) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND')
  }

  const adminRole = await roleRepo.findCompanyAdminRole(input.userId, input.companyId)
  if (adminRole) {
    throw new AuthError('User is already an owner of this company.', 409, 'ALREADY_OWNER')
  }

  const existingMember = await roleRepo.findCompanyMemberRole(input.userId, input.companyId)
  let created = false
  if (!existingMember) {
    await roleRepo.insertUserRole({
      id: nanoid(),
      user_id: input.userId,
      role: 'member',
      company_id: input.companyId,
    })
    created = true
  }

  const customer = await loadCustomerDto(input.userId, input.companyId)
  if (!customer) {
    throw new AuthError('Failed to add customer', 500, 'INTERNAL_ERROR')
  }

  const warnings = created
    ? await notifyWelcome({
        companyId: input.companyId,
        companyName: input.companyName,
        user: {
          email: user.email,
          displayName: user.display_name,
          phoneNumber: user.phone_number,
        },
      })
    : []

  return { customer, warnings }
}

export async function createCompanyCustomer(input: {
  companyId: string
  companyName: string
  firstName: string
  lastName: string
  email?: string | null
  phoneNumber: string
}): Promise<AddCustomerResult> {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phoneNumber = input.phoneNumber.trim()
  const email =
    typeof input.email === 'string' && input.email.trim()
      ? input.email.trim().toLowerCase()
      : null

  if (!firstName || !lastName) {
    throw new AuthError('First name and last name are required', 400, 'VALIDATION_ERROR')
  }
  if (!E164_PHONE.test(phoneNumber)) {
    throw new AuthError('Phone number must be E.164 format', 400, 'VALIDATION_ERROR')
  }

  if (email) {
    const existingEmail = await findUserByEmail(email)
    if (existingEmail) {
      throw new AuthError('Email is already registered', 409, 'EMAIL_EXISTS')
    }
  }

  const existingPhone = await findUserByPhoneNumber(phoneNumber)
  if (existingPhone) {
    throw new AuthError('Phone number is already registered', 409, 'PHONE_EXISTS')
  }

  const userId = nanoid()
  const displayName = `${firstName} ${lastName}`.trim()

  // 1) Identity DB: unverified passwordless user
  // 2) Then company membership (member) — same transaction
  await db.transaction(async (trx) => {
    await createUser(
      {
        id: userId,
        email,
        firstName,
        lastName,
        displayName,
        phoneNumber,
        passwordless: true,
        isEmailVerified: false,
      },
      trx,
    )

    await roleRepo.insertUserRole(
      {
        id: nanoid(),
        user_id: userId,
        role: 'member',
        company_id: input.companyId,
      },
      trx,
    )
  })

  const inviteToken = await issueInviteSetPasswordToken(userId)
  const actionUrl = `${env.identityFrontendOrigin}/reset-password?token=${encodeURIComponent(inviteToken)}`

  const warnings = await notifyInviteSetPassword({
    companyId: input.companyId,
    companyName: input.companyName,
    user: {
      email,
      displayName,
      phoneNumber,
    },
    actionUrl,
  })

  const customer = await loadCustomerDto(userId, input.companyId)
  if (!customer) {
    throw new AuthError('Failed to create customer', 500, 'INTERNAL_ERROR')
  }

  return { customer, warnings }
}
