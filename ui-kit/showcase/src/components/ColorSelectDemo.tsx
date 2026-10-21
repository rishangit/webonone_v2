import { useState } from 'react'
import { ColorPaletteSelect, ColorSelect, FormField } from '@webonone/ui-kit'
import { DemoSection } from '@/components/DemoSection'

const COLORS = [
  { id: '1', label: 'Ink (#111827)', swatch: '#111827' },
  { id: '2', label: 'Paper (#F8FAFC)', swatch: '#F8FAFC' },
  { id: '3', label: 'Blue (#2563EB)', swatch: '#2563EB' },
]

const PALETTES = [
  { id: 'brand', name: 'Brand', colors: ['#111827', '#F8FAFC', '#2563EB'] },
  { id: 'forest', name: 'Forest', colors: ['#14532D', '#DCFCE7', '#166534'] },
]

export function ColorSelectDemo() {
  const [paletteId, setPaletteId] = useState('')
  const [colorId, setColorId] = useState('')

  return (
    <DemoSection
      id="complex-color-select"
      title="Color palette and color"
      description="None is the first item in both lists. Choosing it clears the palette or the color."
    >
      <div className="grid max-w-md grid-cols-1 gap-4">
        <FormField label="Color palette" htmlFor="demo-color-palette">
          <ColorPaletteSelect
            id="demo-color-palette"
            value={paletteId}
            options={PALETTES}
            noneLabel="None"
            onChange={setPaletteId}
          />
        </FormField>
        <FormField label="Color" htmlFor="demo-color">
          <ColorSelect
            id="demo-color"
            value={colorId}
            options={COLORS}
            noneLabel="None"
            onChange={setColorId}
          />
        </FormField>
      </div>
    </DemoSection>
  )
}
