import type { Knex } from 'knex'

/** Empty base migration — company/user stubs removed; ids live on domain tables. */
export async function up(_knex: Knex): Promise<void> {
  // intentionally empty (historical: design_users + design_companies)
}

export async function down(_knex: Knex): Promise<void> {
  // intentionally empty
}
