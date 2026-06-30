import type { Knex } from 'knex'

/** Company registrants should hold company_admin, not member. */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE users_roles ur
    INNER JOIN companies c ON c.id = ur.company_id AND c.created_by_user_id = ur.user_id
    SET ur.role = 'company_admin', ur.updated_at = CURRENT_TIMESTAMP(3)
    WHERE ur.role = 'member'
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE users_roles ur
    INNER JOIN companies c ON c.id = ur.company_id AND c.created_by_user_id = ur.user_id
    SET ur.role = 'member', ur.updated_at = CURRENT_TIMESTAMP(3)
    WHERE ur.role = 'company_admin'
      AND c.status = 'pending'
  `)
}
