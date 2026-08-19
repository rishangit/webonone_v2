import { ShowcaseLiveDemoAuthBanner } from '@/components/ShowcaseLiveDemoAuthBanner'
import { RemainingTimeDemo } from '@/components/RemainingTimeDemo'
import { SelectMediaControlsDemo } from '@/components/SelectMediaDemo'
import { SelectTagControlsDemo } from '@/components/SelectTagDemo'
import { SelectUserControlsDemo } from '@/components/SelectUserDemo'

export function ComplexControlsPage() {
  return (
    <div className="space-y-10">
      <ShowcaseLiveDemoAuthBanner />
      <RemainingTimeDemo />
      <SelectUserControlsDemo />
      <SelectMediaControlsDemo />
      <SelectTagControlsDemo />
    </div>
  )
}
