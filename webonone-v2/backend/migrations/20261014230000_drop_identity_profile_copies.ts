import type { Knex } from 'knex'

async function dropColumnsIfExist(
  knex: Knex,
  tableName: string,
  columns: string[],
): Promise<void> {
  const hasTable = await knex.schema.hasTable(tableName)
  if (!hasTable) return

  const present: string[] = []
  for (const column of columns) {
    if (await knex.schema.hasColumn(tableName, column)) present.push(column)
  }
  if (present.length === 0) return

  await knex.schema.alterTable(tableName, (table) => {
    for (const column of present) table.dropColumn(column)
  })
}

async function addNullableStringColumn(
  knex: Knex,
  tableName: string,
  column: string,
  length: number,
): Promise<void> {
  const hasTable = await knex.schema.hasTable(tableName)
  if (!hasTable) return
  if (await knex.schema.hasColumn(tableName, column)) return
  await knex.schema.alterTable(tableName, (table) => {
    table.string(column, length).nullable()
  })
}

export async function up(knex: Knex): Promise<void> {
  await dropColumnsIfExist(knex, 'company_events', [
    'staff_display_name',
    'attendee_display_name',
    'attendee_email',
  ])
  await dropColumnsIfExist(knex, 'company_event_session_tokens', [
    'user_display_name',
    'user_email',
    'user_avatar_url',
  ])
  await dropColumnsIfExist(knex, 'company_event_session_check_ins', [
    'user_display_name',
    'user_email',
    'user_avatar_url',
  ])
  await dropColumnsIfExist(knex, 'company_staff', ['display_name', 'email', 'avatar_url'])
  await dropColumnsIfExist(knex, 'company_sales', ['customer_display_name', 'customer_email'])
}

export async function down(knex: Knex): Promise<void> {
  await addNullableStringColumn(knex, 'company_events', 'staff_display_name', 255)
  await addNullableStringColumn(knex, 'company_events', 'attendee_display_name', 255)
  await addNullableStringColumn(knex, 'company_events', 'attendee_email', 255)
  await addNullableStringColumn(knex, 'company_event_session_tokens', 'user_display_name', 255)
  await addNullableStringColumn(knex, 'company_event_session_tokens', 'user_email', 255)
  await addNullableStringColumn(knex, 'company_event_session_tokens', 'user_avatar_url', 2048)
  await addNullableStringColumn(knex, 'company_event_session_check_ins', 'user_display_name', 255)
  await addNullableStringColumn(knex, 'company_event_session_check_ins', 'user_email', 255)
  await addNullableStringColumn(knex, 'company_event_session_check_ins', 'user_avatar_url', 2048)
  await addNullableStringColumn(knex, 'company_staff', 'display_name', 255)
  await addNullableStringColumn(knex, 'company_staff', 'email', 255)
  await addNullableStringColumn(knex, 'company_staff', 'avatar_url', 2048)
  await addNullableStringColumn(knex, 'company_sales', 'customer_display_name', 255)
  await addNullableStringColumn(knex, 'company_sales', 'customer_email', 255)
}
