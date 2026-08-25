import { nanoid } from 'nanoid'
import { env } from '../config/env.js'
import { AuthError } from './auth.service.js'
import { rewriteOptionalMediaFileUrl } from '../utils/rewriteMediaFileUrl.js'
import {
  createUser,
  db,
  findUserByEmail,
  findUserById,
  findUserByPhoneNumber,
} from '../models/user.repository.js'
import * as roleRepo from '../repositories/userRole.repository.js'
import {
  findCompanyCustomers,
  type CompanyCustomerRow,
} from '../repositories/users.repository.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { getGatewayStatus, sendTransactionalSms } from './smsClient.service.js'
import { getCompanyName } from './webononeCompanyClient.service.js'
import { notifyCompanyAdminsCustomerAdded } from './webononeNotify.service.js'

const COMPANY_NAME_FALLBACK = 'your company'
const E164_PHONE = /^\+\d{7,15}$/

export type CustomerDto = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
  phoneNumber: string | null
  role: 'member'
  companyId: string
  addedAt: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
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
    avatarUrl: rewriteOptionalMediaFileUrl(row.avatar_url),
    phoneNumber: row.phone_number,
    role: 'member',
    companyId: row.company_id,
    addedAt: row.added_at.toISOString(),
    isEmailVerified: Boolean(row.is_email_verified),
    isPhoneVerified: Boolean(row.is_phone_verified),
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
    avatarUrl: rewriteOptionalMediaFileUrl(user.avatar_url),
    phoneNumber: user.phone_number,
    role: 'member',
    companyId,
    addedAt: memberRole.created_at.toISOString(),
    isEmailVerified: Boolean(user.is_email_verified),
    isPhoneVerified: Boolean(user.is_phone_verified),
  }
}

async function resolveCompanyName(companyId: string, hint?: string): Promise<string> {
  const trimmedHint = hint?.trim()
  if (trimmedHint) {
    return trimmedHint
  }

  const resolved = await getCompanyName(companyId)
  if (resolved) {
    return resolved
  }

  return COMPANY_NAME_FALLBACK
}

async function notifyCompanyAdminsInApp(input: {
  companyId: string
  companyName: string
  customerUserId: string
  customerDisplayName: string
}): Promise<void> {
  try {
    const adminUserIds = await roleRepo.listCompanyAdminUserIds(input.companyId)
    if (adminUserIds.length === 0) return
    await notifyCompanyAdminsCustomerAdded({
      companyId: input.companyId,
      companyName: input.companyName,
      customerUserId: input.customerUserId,
      customerDisplayName: input.customerDisplayName,
      adminUserIds,
    })
  } catch (err) {
    console.error('[customers] in-app customer_added notify failed:', err)
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

async function notifyInviteSetPassword(input: {
  companyId: string
  companyName: string
  user: { email: string | null; displayName: string; phoneNumber: string | null }
  actionUrl: string
}): Promise<string[]> {
  const warnings: string[] = []
  let smsSent = false

  const email = input.user.email?.trim()
  if (email) {
    const emailSent = await sendTransactionalEmail({
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

  const phone = input.user.phoneNumber?.trim()
  const gateway = await getGatewayStatus(input.companyId)
  if (phone && gateway?.configured) {
    smsSent = await sendTransactionalSms({
      toNumber: phone,
      body: `Hi ${input.user.displayName}, you were added to ${input.companyName}. Set your password at ${input.actionUrl} — enter your email to receive a verification code.`,
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
  companyName?: string
}): Promise<AddCustomerResult> {
  const companyName = await resolveCompanyName(input.companyId, input.companyName)
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
        companyName,
        user: {
          email: user.email,
          displayName: user.display_name,
          phoneNumber: user.phone_number,
        },
      })
    : []

  if (created) {
    void notifyCompanyAdminsInApp({
      companyId: input.companyId,
      companyName,
      customerUserId: user.id,
      customerDisplayName: user.display_name,
    })
  }

  return { customer, warnings }
}

export async function createCompanyCustomer(input: {
  companyId: string
  companyName?: string
  firstName: string
  lastName: string
  email?: string | null
  phoneNumber?: string | null
}): Promise<AddCustomerResult> {
  const companyName = await resolveCompanyName(input.companyId, input.companyName)
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const phoneNumber =
    typeof input.phoneNumber === 'string' && input.phoneNumber.trim()
      ? input.phoneNumber.trim()
      : null
  const email =
    typeof input.email === 'string' && input.email.trim()
      ? input.email.trim().toLowerCase()
      : null

  if (!firstName || !lastName) {
    throw new AuthError('First name and last name are required', 400, 'VALIDATION_ERROR')
  }
  if (!email && !phoneNumber) {
    throw new AuthError('Email or phone number is required', 400, 'VALIDATION_ERROR')
  }
  if (phoneNumber && !E164_PHONE.test(phoneNumber)) {
    throw new AuthError('Phone number must be E.164 format', 400, 'VALIDATION_ERROR')
  }

  if (email) {
    const existingEmail = await findUserByEmail(email)
    if (existingEmail) {
      throw new AuthError('Email is already registered', 409, 'EMAIL_EXISTS')
    }
  }

  if (phoneNumber) {
    const existingPhone = await findUserByPhoneNumber(phoneNumber)
    if (existingPhone) {
      throw new AuthError('Phone number is already registered', 409, 'PHONE_EXISTS')
    }
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

  const actionUrl = `${env.webononeFrontendOrigin}/forgot-password`

  const warnings = await notifyInviteSetPassword({
    companyId: input.companyId,
    companyName,
    user: {
      email,
      displayName,
      phoneNumber,
    },
    actionUrl,
  })

  void notifyCompanyAdminsInApp({
    companyId: input.companyId,
    companyName,
    customerUserId: userId,
    customerDisplayName: displayName,
  })

  const customer = await loadCustomerDto(userId, input.companyId)
  if (!customer) {
    throw new AuthError('Failed to create customer', 500, 'INTERNAL_ERROR')
  }

  return { customer, warnings }
}
