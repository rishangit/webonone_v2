import type { Knex } from 'knex'

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
     LEFT JOIN company_event_session_runs AS run
       ON run.event_id = token.event_id
      AND run.company_id = token.company_id
      AND DATE(run.occurrence_date) = DATE(token.occurrence_date)
     LEFT JOIN company_event_session_check_ins AS cin
       ON cin.event_id = token.event_id
      AND cin.company_id = token.company_id
      AND cin.user_id = token.user_id
      AND DATE(cin.occurrence_date) = DATE(token.occurrence_date)
     SET token.current_workflow_item_id = checkin.id
     WHERE token.workflow_completed_at IS NULL
       AND token.status <> 'completed'
       AND (
         cin.id IS NULL
         OR run.id IS NULL
         OR run.status <> 'started'
       )`,
  )
}

export async function down(): Promise<void> {
  // Irreversible correction of workflow pointers.
}
