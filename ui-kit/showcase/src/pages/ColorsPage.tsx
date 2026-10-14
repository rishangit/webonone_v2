import {
  FIXED_APP_COLOR_CSS_VARS,
  FIXED_APP_COLOR_SWATCHES,
  PriceDisplay,
  StockBatchPriceRow,
} from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

export function ColorsPage() {
  return (
    <div className="space-y-10">
      <DemoSection
        id="fixed-semantic-colors"
        title="Fixed semantic colors"
        description="These hues stay the same across UI themes and light/dark mode. Use Tailwind utilities text-fixed-pending, text-fixed-approved, and text-fixed-rejected — not theme success/warning when the meaning must not shift (e.g. stock cost vs sell)."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {FIXED_APP_COLOR_SWATCHES.map((swatch) => (
            <div
              key={swatch.id}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div
                className="mb-3 h-10 w-full rounded-md border border-border/60"
                style={{ backgroundColor: `var(${FIXED_APP_COLOR_CSS_VARS[swatch.id]})` }}
              />
              <p className="font-medium">{swatch.label}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{swatch.utility}</p>
              <p className="mt-2 text-sm text-muted-foreground">{swatch.usage}</p>
              <p className={`mt-3 text-lg font-semibold ${swatch.utility}`}>Sample text</p>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection
        id="price-display"
        title="Price display"
        description="Fixed sizes for list rows, cards, and totals. Cost and sell variants use fixed semantic colors."
      >
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Small</p>
              <PriceDisplay value={1800} size="sm" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Medium</p>
              <PriceDisplay value={4500.5} size="md" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Large</p>
              <PriceDisplay value={3000} size="lg" />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <PriceDisplay value={1250} size="md" variant="cost" />
            <PriceDisplay value={1890} size="md" variant="sell" />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        id="stock-batch-price-row"
        title="Stock batch price row"
        description="Right-aligned cost (pending) and sell (approved) for stock list items."
      >
        <div className="max-w-md rounded-lg border border-border bg-card p-4">
          <StockBatchPriceRow
            costLabel="Cost"
            sellLabel="Sell"
            costValue={1250}
            sellValue={1890}
          />
        </div>
      </DemoSection>
    </div>
  )
}
