import { useEffect, useRef } from 'react'
import { applyThemeVariables, type ColorMode } from '@webonone/theme'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '@webonone/ui-kit'
import type { ThemeFormValues } from '../schemas/themeFormSchema'

interface ThemePreviewProps {
  values: ThemeFormValues
  colorMode: ColorMode
  className?: string
}

export function ThemePreview({ values, colorMode, className }: ThemePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!previewRef.current) return

    applyThemeVariables(
      {
        theme: {
          id: 'preview',
          name: values.name,
          color1: values.color1,
          color2: values.color2,
          color3: values.color3,
          color4: values.color4,
          color5: values.color5,
        },
        colorMode,
      },
      previewRef.current,
    )
  }, [values, colorMode])

  return (
    <div ref={previewRef} className={cn('glass-card flex h-full min-h-[min(24rem,55vh)] flex-col space-y-4 rounded-lg p-4', className)}>
      <h3 className="text-lg font-semibold text-foreground">Preview</h3>
      <div className="flex flex-wrap gap-2">
        <Button type="button">Primary</Button>
        <Button type="button" variant="secondary">
          Secondary
        </Button>
        <Button type="button" variant="destructive">
          Destructive
        </Button>
        <Button type="button" variant="outline">
          Outline
        </Button>
      </div>
      <Input placeholder="Sample input" readOnly />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sample card</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Border and text use theme tokens.</CardContent>
      </Card>
      <div className="scrollbar-themed h-28 overflow-y-auto rounded-md border p-2 text-xs text-muted-foreground">
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} className="py-0.5">
            Scroll line {i + 1}
          </p>
        ))}
      </div>
    </div>
  )
}
