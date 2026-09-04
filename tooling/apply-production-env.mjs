/**
 * Expand root production.env into each service's backend/.env and
 * frontend/.env.production (deploy-time only).
 *
 * Usage (from repo root):
 *   node tooling/apply-production-env.mjs
 *   npm run env:apply
 *
 * Does not touch local-dev frontend/.env. Services never load production.env
 * at runtime — only the generated per-service files.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const masterPath = join(repoRoot, 'production.env');

function parseEnvFile(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * @param {Record<string, string>} env
 * @param {string} key
 * @param {{ required?: boolean }} [opts]
 */
function get(env, key, opts = {}) {
  const value = env[key];
  if (value === undefined || value === '') {
    if (opts.required) {
      throw new Error(`production.env missing required key: ${key}`);
    }
    return '';
  }
  return value;
}

/**
 * @param {string[]} lines
 */
function formatEnv(lines) {
  return `${lines.filter((l) => l !== null && l !== undefined).join('\n')}\n`;
}

/**
 * @param {string} relativePath
 * @param {string} contents
 */
function writeEnv(relativePath, contents) {
  const abs = join(repoRoot, relativePath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents, 'utf8');
  return relativePath;
}

/**
 * @param {string} origin
 */
function apiBase(origin) {
  return `${origin.replace(/\/$/, '')}/api/v1`;
}

/**
 * Hostname used for company public sites: `{slug}.{host}`.
 * Prefer explicit COMPANY_SITE_HOST, else strip `design.` from ORIGIN_DESIGN
 * so staging `design.staging.webonone.com` → `staging.webonone.com`.
 * @param {Record<string, string>} master
 */
function companySiteHost(master) {
  const explicit = get(master, 'COMPANY_SITE_HOST');
  if (explicit) {
    try {
      if (/^https?:\/\//i.test(explicit)) {
        return new URL(explicit).hostname.replace(/^www\./i, '') || 'webonone.com';
      }
    } catch {
      // fall through to raw hostname
    }
    return explicit.replace(/^www\./i, '').replace(/\/.*$/, '') || 'webonone.com';
  }
  const originDesign = get(master, 'ORIGIN_DESIGN');
  try {
    const host = new URL(originDesign).hostname.replace(/^www\./i, '');
    if (host.startsWith('design.')) return host.slice('design.'.length);
    return host || 'webonone.com';
  } catch {
    return 'webonone.com';
  }
}

/**
 * @param {string[]} origins
 */
function joinOrigins(origins) {
  return origins.filter(Boolean).join(',');
}

function main() {
  if (!existsSync(masterPath)) {
    console.error(
      [
        'Missing production.env at repo root.',
        'Copy production.env.example → production.env, fill production values, then retry.',
        '  copy production.env.example production.env',
        '',
        'Do not run env:apply on a laptop that uses local backend/.env for npm run dev',
        'unless you intend to overwrite those files with production values.',
      ].join('\n'),
    );
    process.exit(1);
  }

  const master = parseEnvFile(readFileSync(masterPath, 'utf8'));

  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'JWT_SECRET',
    'ORIGIN_WEBONONE',
    'ORIGIN_IDENTITY',
    'ORIGIN_MEDIA',
    'ORIGIN_EMAIL',
    'ORIGIN_DATA',
    'ORIGIN_SMS',
    'ORIGIN_PAYMENT',
    'ORIGIN_WEBSITE',
    'ORIGIN_DESIGN',
    'ORIGIN_AI',
    'ORIGIN_SUPPORT',
    'IDENTITY_DB_NAME',
    'WEBONONE_DB_NAME',
    'MEDIA_DB_NAME',
    'EMAIL_DB_NAME',
    'DATA_DB_NAME',
    'SMS_DB_NAME',
    'PAYMENT_DB_NAME',
    'WEBSITE_DB_NAME',
    'DESIGN_DB_NAME',
    'AI_DB_NAME',
    'SUPPORT_DB_NAME',
  ];
  for (const key of required) {
    get(master, key, { required: true });
  }

  const dbHost = get(master, 'DB_HOST');
  const dbPort = get(master, 'DB_PORT');
  const dbUser = get(master, 'DB_USER');
  const dbPassword = get(master, 'DB_PASSWORD');
  const jwt = get(master, 'JWT_SECRET');

  const originWebonone = get(master, 'ORIGIN_WEBONONE');
  const originIdentity = get(master, 'ORIGIN_IDENTITY');
  const originMedia = get(master, 'ORIGIN_MEDIA');
  const originEmail = get(master, 'ORIGIN_EMAIL');
  const originData = get(master, 'ORIGIN_DATA');
  const originSms = get(master, 'ORIGIN_SMS');
  const originPayment = get(master, 'ORIGIN_PAYMENT');
  const originWebsite = get(master, 'ORIGIN_WEBSITE');
  const originDesign = get(master, 'ORIGIN_DESIGN');
  const originAi = get(master, 'ORIGIN_AI');
  const originSupport = get(master, 'ORIGIN_SUPPORT');

  const emailKey = get(master, 'EMAIL_SERVICE_API_KEY');
  const smsKey = get(master, 'SMS_SERVICE_API_KEY');
  const smsGatewayEncryptionKey = get(master, 'SMS_GATEWAY_ENCRYPTION_KEY');
  const identityKey = get(master, 'IDENTITY_SERVICE_API_KEY');
  const dataKey = get(master, 'DATA_SERVICE_API_KEY');
  const paymentKey = get(master, 'PAYMENT_SERVICE_API_KEY');
  const designKey = get(master, 'DESIGN_SERVICE_API_KEY');
  const webononeKey = get(master, 'WEBONONE_SERVICE_API_KEY');

  const googleClientId = get(master, 'GOOGLE_CLIENT_ID');
  const googleMapsKey = get(master, 'GOOGLE_MAPS_API_KEY');
  const allowedRedirect = get(master, 'ALLOWED_REDIRECT_URIS') || 'https://*.webonone.com';

  const superAdminUserId = get(master, 'SUPER_ADMIN_USER_ID');
  const superAdminEmail = get(master, 'SUPER_ADMIN_EMAIL') || 'superadmin@webonone.local';
  const superAdminName = get(master, 'SUPER_ADMIN_DISPLAY_NAME') || 'Super Admin';

  /** @param {string} dbName */
  function dbBlock(dbName) {
    return [
      `DB_HOST=${dbHost}`,
      `DB_PORT=${dbPort}`,
      `DB_USER=${dbUser}`,
      `DB_PASSWORD=${dbPassword}`,
      `DB_NAME=${dbName}`,
      '',
      'HOST=127.0.0.1',
    ];
  }

  const written = [];

  // ----- identity -----
  written.push(
    writeEnv(
      'identity/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — do not edit by hand on the server.',
        '# Source: production.env',
        '',
        ...dbBlock(get(master, 'IDENTITY_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `ACCESS_TOKEN_EXPIRY_SECONDS=${get(master, 'ACCESS_TOKEN_EXPIRY_SECONDS') || '604800'}`,
        `REFRESH_TOKEN_EXPIRY_DAYS=${get(master, 'REFRESH_TOKEN_EXPIRY_DAYS') || '7'}`,
        '',
        `ALLOWED_REDIRECT_URIS=${allowedRedirect}`,
        '',
        `EMAIL_API_BASE_URL=${originEmail}`,
        `EMAIL_SERVICE_API_KEY=${emailKey}`,
        '',
        `SMS_API_BASE_URL=${originSms}`,
        `SMS_SERVICE_API_KEY=${smsKey}`,
        '',
        `IDENTITY_FRONTEND_ORIGIN=${originIdentity}`,
        '',
        `WEBONONE_FRONTEND_ORIGIN=${originWebonone}`,
        '',
        `EMAIL_VERIFICATION_EXPIRY_HOURS=${get(master, 'EMAIL_VERIFICATION_EXPIRY_HOURS') || '24'}`,
        '',
        `GOOGLE_CLIENT_ID=${googleClientId}`,
        '',
        `SUPER_ADMIN_USER_ID=${superAdminUserId}`,
        `SUPER_ADMIN_EMAIL=${superAdminEmail}`,
        `SUPER_ADMIN_DISPLAY_NAME=${superAdminName}`,
        '',
        `IDENTITY_SERVICE_API_KEY=${identityKey}`,
        '',
        `WEBONONE_API_BASE_URL=${originWebonone}`,
        `WEBONONE_SERVICE_API_KEY=${webononeKey}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'identity/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_MEDIA_ORIGIN=${originMedia}`,
        `VITE_EMAIL_ORIGIN=${originEmail}`,
        `VITE_SMS_ORIGIN=${originSms}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originWebsite])}`,
        `VITE_WEBSITE_ORIGIN=${originWebsite}`,
        `VITE_ALLOWED_REDIRECT_URIS=${allowedRedirect}`,
        `VITE_GOOGLE_CLIENT_ID=${googleClientId}`,
      ]),
    ),
  );

  // ----- webonone-v2 -----
  written.push(
    writeEnv(
      'webonone-v2/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'WEBONONE_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `SUPER_ADMIN_USER_ID=${superAdminUserId}`,
        `SUPER_ADMIN_EMAIL=${superAdminEmail}`,
        `SUPER_ADMIN_DISPLAY_NAME=${superAdminName}`,
        '',
        `IDENTITY_API_BASE_URL=${originIdentity}`,
        `IDENTITY_SERVICE_API_KEY=${identityKey}`,
        `IDENTITY_DB_NAME=${get(master, 'IDENTITY_DB_NAME')}`,
        '',
        `EMAIL_API_BASE_URL=${originEmail}`,
        `EMAIL_SERVICE_API_KEY=${emailKey}`,
        '',
        `SMS_API_BASE_URL=${originSms}`,
        `SMS_SERVICE_API_KEY=${smsKey}`,
        '',
        `PAYMENT_API_BASE_URL=${originPayment}`,
        `PAYMENT_SERVICE_API_KEY=${paymentKey}`,
        '',
        `DATA_API_BASE_URL=${originData}`,
        `DATA_SERVICE_API_KEY=${dataKey}`,
        '',
        `WEBONONE_SERVICE_API_KEY=${webononeKey}`,
        `COMPANY_SITE_HOST=${companySiteHost(master)}`,
      ]),
    ),
  );

  const webononeFeLines = [
    '# Generated by tooling/apply-production-env.mjs — source: production.env',
    '',
    'VITE_API_BASE_URL=/api/v1',
    `VITE_IDENTITY_ORIGIN=${originIdentity}`,
    `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
    `VITE_MEDIA_ORIGIN=${originMedia}`,
    `VITE_EMAIL_ORIGIN=${originEmail}`,
    `VITE_DATA_ORIGIN=${originData}`,
    `VITE_DATA_API_BASE_URL=${apiBase(originData)}`,
    `VITE_SMS_ORIGIN=${originSms}`,
    `VITE_PAYMENT_ORIGIN=${originPayment}`,
    `VITE_WEBSITE_ORIGIN=${originWebsite}`,
    `VITE_DESIGN_ORIGIN=${originDesign}`,
    `VITE_DESIGN_API_BASE_URL=${apiBase(originDesign)}`,
    `VITE_AI_ORIGIN=${originAi}`,
    `VITE_AI_API_BASE_URL=${apiBase(originAi)}`,
    `VITE_SUPPORT_ORIGIN=${originSupport}`,
    `VITE_COMPANY_SITE_HOST=${companySiteHost(master)}`,
  ];
  if (googleMapsKey) {
    webononeFeLines.push(`VITE_GOOGLE_MAPS_API_KEY=${googleMapsKey}`);
  }
  written.push(writeEnv('webonone-v2/frontend/.env.production', formatEnv(webononeFeLines)));

  // ----- website -----
  written.push(
    writeEnv(
      'website/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'WEBSITE_DB_NAME')),
        '',
        `WEBONONE_API_BASE_URL=${originWebonone}`,
        `WEBONONE_SERVICE_API_KEY=${webononeKey}`,
        '',
        `FRONTEND_BASE_URL=${originWebsite}`,
      ]),
    ),
  );

  const websiteFeLines = [
    '# Generated by tooling/apply-production-env.mjs — source: production.env',
    '',
    'VITE_API_BASE_URL=/api/v1',
    `VITE_WEBONONE_ORIGIN=${originWebonone}`,
    `VITE_IDENTITY_ORIGIN=${originIdentity}`,
    `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
    `VITE_AI_ORIGIN=${originAi}`,
    `VITE_AI_API_BASE_URL=${apiBase(originAi)}`,
    `VITE_SUPPORT_ORIGIN=${originSupport}`,
  ];
  if (googleMapsKey) {
    websiteFeLines.push(`VITE_GOOGLE_MAPS_API_KEY=${googleMapsKey}`);
  }
  written.push(writeEnv('website/frontend/.env.production', formatEnv(websiteFeLines)));

  // ----- media -----
  const mediaPublicBase = apiBase(originMedia);
  const mediaBackendLines = [
    '# Generated by tooling/apply-production-env.mjs — source: production.env',
    '',
    ...dbBlock(get(master, 'MEDIA_DB_NAME')),
    '',
    `JWT_SECRET=${jwt}`,
    '',
    `MEDIA_STORAGE_DRIVER=${get(master, 'MEDIA_STORAGE_DRIVER') || 'local'}`,
    `MEDIA_LOCAL_STORAGE_PATH=${get(master, 'MEDIA_LOCAL_STORAGE_PATH') || './storage'}`,
    `MEDIA_PUBLIC_BASE_URL=${mediaPublicBase}`,
    `MEDIA_MAX_FILE_SIZE_BYTES=${get(master, 'MEDIA_MAX_FILE_SIZE_BYTES') || '26214400'}`,
    `MEDIA_ALLOWED_MIME_TYPES=${get(master, 'MEDIA_ALLOWED_MIME_TYPES') || 'image/*,video/*,application/pdf,text/plain'}`,
  ];
  const s3Bucket = get(master, 'MEDIA_S3_BUCKET');
  const s3Region = get(master, 'MEDIA_S3_REGION');
  if (s3Bucket) {
    mediaBackendLines.push(`MEDIA_S3_BUCKET=${s3Bucket}`);
  }
  if (s3Region) {
    mediaBackendLines.push(`MEDIA_S3_REGION=${s3Region}`);
  }
  written.push(writeEnv('media/backend/.env', formatEnv(mediaBackendLines)));

  written.push(
    writeEnv(
      'media/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([
          originWebonone,
          originIdentity,
          originData,
          originPayment,
          originDesign,
        ])}`,
      ]),
    ),
  );

  // ----- email -----
  written.push(
    writeEnv(
      'email/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'EMAIL_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `EMAIL_SERVICE_API_KEY=${emailKey}`,
        '',
        `SMTP_HOST=${get(master, 'SMTP_HOST')}`,
        `SMTP_PORT=${get(master, 'SMTP_PORT') || '587'}`,
        `SMTP_SECURE=${get(master, 'SMTP_SECURE') || 'false'}`,
        `SMTP_USER=${get(master, 'SMTP_USER')}`,
        `SMTP_PASSWORD=${get(master, 'SMTP_PASSWORD')}`,
        `SMTP_FROM_ADDRESS=${get(master, 'SMTP_FROM_ADDRESS') || 'noreply@webonone.com'}`,
        `SMTP_FROM_NAME=${get(master, 'SMTP_FROM_NAME') || 'WebOnOne'}`,
        `SMTP_TLS_REJECT_UNAUTHORIZED=${get(master, 'SMTP_TLS_REJECT_UNAUTHORIZED') || 'true'}`,
        `FRONTEND_BASE_URL=${originEmail}`,
        `QUEUE_WORKER_INTERVAL_MS=${get(master, 'QUEUE_WORKER_INTERVAL_MS') || '5000'}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'email/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_DATA_ORIGIN=${originData}`,
        `VITE_SMS_ORIGIN=${originSms}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity])}`,
      ]),
    ),
  );

  // ----- data -----
  written.push(
    writeEnv(
      'data/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'DATA_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `FRONTEND_BASE_URL=${originData}`,
        '',
        `DATA_SERVICE_API_KEY=${dataKey}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'data/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_EMAIL_ORIGIN=${originEmail}`,
        `VITE_SMS_ORIGIN=${originSms}`,
        `VITE_MEDIA_ORIGIN=${originMedia}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity])}`,
      ]),
    ),
  );

  // ----- sms -----
  written.push(
    writeEnv(
      'sms/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'SMS_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `SMS_SERVICE_API_KEY=${smsKey}`,
        '',
        `SMS_GATEWAY_ENCRYPTION_KEY=${smsGatewayEncryptionKey}`,
        '',
        `OTP_TTL_SECONDS=${get(master, 'OTP_TTL_SECONDS') || '300'}`,
        `OTP_MAX_ATTEMPTS=${get(master, 'OTP_MAX_ATTEMPTS') || '3'}`,
        '',
        `DEVICE_STALE_MS=${get(master, 'DEVICE_STALE_MS') || '120000'}`,
        `PROCESSING_TIMEOUT_MS=${get(master, 'PROCESSING_TIMEOUT_MS') || '120000'}`,
        `QUEUE_WORKER_INTERVAL_MS=${get(master, 'QUEUE_WORKER_INTERVAL_MS') || '5000'}`,
        '',
        `FRONTEND_BASE_URL=${originSms}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'sms/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity])}`,
      ]),
    ),
  );

  // ----- payment -----
  written.push(
    writeEnv(
      'payment/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'PAYMENT_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `PAYMENT_SERVICE_API_KEY=${paymentKey}`,
        `SYSTEM_MONTHLY_AMOUNT_LKR=${get(master, 'SYSTEM_MONTHLY_AMOUNT_LKR') || '3000'}`,
        `BILLING_TIMEZONE=${get(master, 'BILLING_TIMEZONE') || 'Asia/Colombo'}`,
        `INVOICE_GENERATOR_INTERVAL_MS=${get(master, 'INVOICE_GENERATOR_INTERVAL_MS') || '3600000'}`,
        `INVOICE_DUE_DAYS=${get(master, 'INVOICE_DUE_DAYS') || '14'}`,
        `FRONTEND_BASE_URL=${originPayment}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'payment/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_MEDIA_ORIGIN=${originMedia}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity])}`,
      ]),
    ),
  );

  // ----- design -----
  written.push(
    writeEnv(
      'design/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'DESIGN_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `DESIGN_SERVICE_API_KEY=${designKey}`,
        `FRONTEND_BASE_URL=${originDesign}`,
        '',
        `WEBONONE_API_BASE_URL=${originWebonone}`,
        `WEBONONE_SERVICE_API_KEY=${webononeKey}`,
        '',
        `IDENTITY_API_BASE_URL=${originIdentity}`,
        `IDENTITY_SERVICE_API_KEY=${identityKey}`,
        '',
        `DATA_API_BASE_URL=${originData}`,
        `DATA_SERVICE_API_KEY=${dataKey}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'design/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_MEDIA_ORIGIN=${originMedia}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity, originDesign])}`,
        `VITE_COMPANY_SITE_HOST=${companySiteHost(master)}`,
      ]),
    ),
  );

  // ----- ai -----
  written.push(
    writeEnv(
      'ai/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'AI_DB_NAME')),
        '',
        `JWT_SECRET=${jwt}`,
        '',
        `FRONTEND_BASE_URL=${originAi}`,
        `WEBSITE_ORIGIN=${originWebsite}`,
        `WEBONONE_ORIGIN=${originWebonone}`,
        `ALLOWED_ORIGINS=${joinOrigins([originAi, originWebsite, originWebonone])}`,
        '',
        `WEBONONE_API_BASE_URL=${originWebonone}`,
        `WEBONONE_SERVICE_API_KEY=${webononeKey}`,
        `DATA_API_BASE_URL=${originData}`,
        `DATA_SERVICE_API_KEY=${dataKey}`,
        '',
        `AI_PROVIDER=${get(master, 'AI_PROVIDER') || 'ollama'}`,
        `AI_MODEL=${get(master, 'AI_MODEL') || 'llama3.2'}`,
        `AI_PROVIDER_BASE_URL=${get(master, 'AI_PROVIDER_BASE_URL') || 'http://127.0.0.1:11434'}`,
        `AI_PROVIDER_API_KEY=${get(master, 'AI_PROVIDER_API_KEY')}`,
        `AI_PROVIDER_TIMEOUT_MS=${get(master, 'AI_PROVIDER_TIMEOUT_MS') || '60000'}`,
        `AI_SYSTEM_PROMPT=${get(master, 'AI_SYSTEM_PROMPT')}`,
        `AI_CREDENTIALS_ENCRYPTION_KEY=${get(master, 'AI_CREDENTIALS_ENCRYPTION_KEY')}`,
        `AI_GUEST_TOKEN_EXPIRY_SECONDS=${get(master, 'AI_GUEST_TOKEN_EXPIRY_SECONDS') || '86400'}`,
        `AI_GUEST_RATE_LIMIT_MAX=${get(master, 'AI_GUEST_RATE_LIMIT_MAX') || '30'}`,
        `AI_GUEST_RATE_LIMIT_WINDOW_MS=${get(master, 'AI_GUEST_RATE_LIMIT_WINDOW_MS') || '60000'}`,
        `AI_CAPABILITY_REFRESH_MS=${get(master, 'AI_CAPABILITY_REFRESH_MS') || '300000'}`,
        `AI_TOOL_HTTP_TIMEOUT_MS=${get(master, 'AI_TOOL_HTTP_TIMEOUT_MS') || '15000'}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'ai/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_IDENTITY_ORIGIN=${originIdentity}`,
        `VITE_IDENTITY_API_BASE_URL=${apiBase(originIdentity)}`,
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBONONE_API_BASE_URL=${apiBase(originWebonone)}`,
        `VITE_ALLOWED_PARENT_ORIGINS=${joinOrigins([originWebonone, originIdentity, originAi])}`,
      ]),
    ),
  );

  // ----- support -----
  written.push(
    writeEnv(
      'support/backend/.env',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        ...dbBlock(get(master, 'SUPPORT_DB_NAME')),
        '',
        `FRONTEND_BASE_URL=${originSupport}`,
      ]),
    ),
  );

  written.push(
    writeEnv(
      'support/frontend/.env.production',
      formatEnv([
        '# Generated by tooling/apply-production-env.mjs — source: production.env',
        '',
        'VITE_API_BASE_URL=/api/v1',
        `VITE_WEBONONE_ORIGIN=${originWebonone}`,
        `VITE_WEBSITE_ORIGIN=${originWebsite}`,
      ]),
    ),
  );

  console.log(`Applied ${masterPath}`);
  console.log(`Wrote ${written.length} files:`);
  for (const path of written) {
    console.log(`  ${path}`);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
