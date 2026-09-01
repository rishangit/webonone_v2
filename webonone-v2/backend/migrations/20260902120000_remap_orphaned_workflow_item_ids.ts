import type { Knex } from 'knex'

/**
 * Session tokens can reference deleted workflow item ids after a workflow save
 * that regenerated step ids. Remap orphans onto the current catalog workflow.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `UPDATE company_event_session_tokens AS token
     INNER JOIN company_events AS event
       ON event.id = token.event_id
      AND event.company_id = token.company_id
     INNER JOIN company_service_workflow_items AS checkin
       ON checkin.service_id = event.service_id
      AND checkin.company_id = token.company_id
      AND checkin.kind = 'check_in'
     LEFT JOIN company_service_workflow_items AS current_step
       ON current_step.id = token.current_workflow_item_id
      AND current_step.service_id = event.service_id
      AND current_step.company_id = token.company_id
     LEFT JOIN company_event_session_check_ins AS cin
       ON cin.event_id = token.event_id
      AND cin.company_id = token.company_id
      AND cin.user_id = token.user_id
      AND DATE(cin.occurrence_date) = DATE(token.occurrence_date)
     LEFT JOIN company_service_workflow_items AS first_space
       ON first_space.service_id = event.service_id
      AND first_space.company_id = token.company_id
      AND first_space.kind = 'space'
      AND first_space.sort_order = (
        SELECT MIN(step.sort_order)
        FROM company_service_workflow_items AS step
        WHERE step.service_id = event.service_id
          AND step.company_id = token.company_id
          AND step.kind = 'space'
      )
     SET token.current_workflow_item_id = CASE
       WHEN cin.id IS NOT NULL AND first_space.id IS NOT NULL THEN first_space.id
       ELSE checkin.id
     END
     WHERE token.workflow_completed_at IS NULL
       AND token.status <> 'completed'
       AND token.current_workflow_item_id IS NOT NULL
       AND current_step.id IS NULL`,
  )
}

export async function down(): Promise<void> {
  // Orphaned workflow item ids cannot be restored reliably.
}
