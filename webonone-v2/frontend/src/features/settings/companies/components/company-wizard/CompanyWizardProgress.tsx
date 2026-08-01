interface CompanyWizardProgressProps {
  currentStep: number
  totalSteps?: number
}

export function CompanyWizardProgress({
  currentStep,
  totalSteps = 6,
}: CompanyWizardProgressProps) {
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
