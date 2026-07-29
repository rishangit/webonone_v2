import type { Knex } from 'knex'

/**
 * MySQL DAYOFWEEK: 1=Sunday … 7=Saturday.
 * JS getDay(): 0=Sunday … 6=Saturday → DAYOFWEEK - 1.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.json('weekdays').nullable()
  })

  const rows = await knex('company_events').select('id', 'starts_on', 'recurrence', 'recurrence_until')
  for (const row of rows as Array<{
    id: string
    starts_on: string | Date
    recurrence: string
    recurrence_until: string | Date | null
  }>) {
    const startsOn =
      typeof row.starts_on === 'string'
        ? row.starts_on.slice(0, 10)
        : [
            row.starts_on.getFullYear(),
            String(row.starts_on.getMonth() + 1).padStart(2, '0'),
            String(row.starts_on.getDate()).padStart(2, '0'),
          ].join('-')
    const [y, m, d] = startsOn.split('-').map(Number)
    const weekday = new Date(y!, m! - 1, d!).getDay()
    const until =
      row.recurrence === 'weekly' && row.recurrence_until
        ? typeof row.recurrence_until === 'string'
          ? row.recurrence_until.slice(0, 10)
          : [
              row.recurrence_until.getFullYear(),
              String(row.recurrence_until.getMonth() + 1).padStart(2, '0'),
              String(row.recurrence_until.getDate()).padStart(2, '0'),
            ].join('-')
        : startsOn

    await knex('company_events')
      .where({ id: row.id })
      .update({
        weekdays: JSON.stringify([weekday]),
        recurrence: 'weekly',
        recurrence_until: until,
      })
  }

  await knex.schema.alterTable('company_events', (table) => {
    table.json('weekdays').notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('company_events', (table) => {
    table.dropColumn('weekdays')
  })
}
