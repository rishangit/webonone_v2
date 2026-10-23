import { useState } from 'react'
import { ColorPaletteSelect, ColorSelect, FormField, PaletteColorSelect } from '@webonone/ui-kit'
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
  const [groupedPaletteId, setGroupedPaletteId] = useState('brand')
  const [groupedColorId, setGroupedColorId] = useState('1')

  return (
    <DemoSection
      id="complex-color-select"
      title="Color palette and color"
      description="None is the first item in both lists. Choosing it clears the palette or the color. PaletteColorSelect groups both pickers in one control."
    >
      <div className="grid max-w-md grid-cols-1 gap-6">
        <FormField label="Palette & color (grouped)" htmlFor="demo-palette-color-palette">
          <PaletteColorSelect
            idPrefix="demo-palette-color"
            paletteId={groupedPaletteId}
            colorId={groupedColorId}
            paletteOptions={PALETTES}
            colorOptions={COLORS}
            paletteNoneLabel="None"
            colorNoneLabel="None"
            onChange={({ paletteId: nextPaletteId, colorId: nextColorId }) => {
              setGroupedPaletteId(nextPaletteId)
              setGroupedColorId(nextColorId)
            }}
          />
        </FormField>
        <FormField label="Color palette (separate)" htmlFor="demo-color-palette">
          <ColorPaletteSelect
            id="demo-color-palette"
            value={paletteId}
            options={PALETTES}
            noneLabel="None"
            onChange={setPaletteId}
          />
        </FormField>
        <FormField label="Color (separate)" htmlFor="demo-color">
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
