const TOTAL_STEPS = 3

interface RegisterWizardProgressProps {
  currentStep: number
}

export function RegisterWizardProgress({ currentStep }: RegisterWizardProgressProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="w-1/2 mx-auto">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
