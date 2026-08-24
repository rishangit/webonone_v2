import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'

type WorkflowWizardStepQueueProps = {
  sessionQueue: boolean
  onChange: (sessionQueue: boolean) => void
}

export function WorkflowWizardStepQueue({ sessionQueue, onChange }: WorkflowWizardStepQueueProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Show a session queue card on this workflow step during Specific time sessions.
      </p>
      <FormField label="Session queue" htmlFor="workflow-wizard-session-queue" required>
        <Select
          value={sessionQueue ? 'yes' : 'no'}
          onValueChange={(value) => onChange(value === 'yes')}
        >
          <SelectTrigger id="workflow-wizard-session-queue" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}
