interface StaffWizardProgressProps {
  currentStep: number
  totalSteps?: number
}

export function StaffWizardProgress({ currentStep, totalSteps = 3 }: StaffWizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mx-auto w-1/2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
