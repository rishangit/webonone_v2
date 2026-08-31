import { useEffect, useRef, useState } from 'react'
import { applyThemeVariables, type ColorMode } from '@webonone/theme'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@webonone/ui-kit'
import type { ThemeFormValues } from '../schemas/themeFormSchema'
import { themeFormToPreviewDto } from '../utils/themeFormMapping'

interface ThemePreviewProps {
  values: ThemeFormValues
  colorMode: ColorMode
  className?: string
}

export function ThemePreview({ values, colorMode: initialColorMode, className }: ThemePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewMode, setPreviewMode] = useState<ColorMode>(initialColorMode)

  useEffect(() => {
    setPreviewMode(initialColorMode)
  }, [initialColorMode])

  useEffect(() => {
    if (!previewRef.current) return

    applyThemeVariables(
      {
        theme: themeFormToPreviewDto(values),
        colorMode: previewMode,
      },
      previewRef.current,
    )
  }, [values, previewMode])

  return (
    <div
      ref={previewRef}
      className={cn(
        'glass-card flex h-full min-h-[min(28rem,60vh)] flex-col gap-4 rounded-lg border border-[var(--color-border-light)] p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Preview</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={previewMode === 'light' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('light')}
          >
            Light
          </Button>
          <Button
            type="button"
            size="sm"
            variant={previewMode === 'dark' ? 'default' : 'outline'}
            onClick={() => setPreviewMode('dark')}
          >
            Dark
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button">Primary</Button>
        <Button type="button" variant="secondary">
          Secondary
        </Button>
        <Button type="button" variant="outline">
          Outline
        </Button>
        <Button type="button" variant="destructive">
          Error
        </Button>
      </div>

      <Tabs defaultValue="tab-a" className="w-full">
        <TabsList>
          <TabsTrigger value="tab-a">Active tab</TabsTrigger>
          <TabsTrigger value="tab-b">Inactive tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-a" className="text-sm text-[var(--color-text-muted)]">
          Tab content uses semantic tokens.
        </TabsContent>
      </Tabs>

      <Input placeholder="Sample input" readOnly />

      <Card className="border border-[var(--color-border-light)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sample card</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-text-muted)]">
          Cards use surface and border tokens.
        </CardContent>
      </Card>

      <nav className="flex gap-2 rounded-md border border-[var(--color-border-light)] p-2">
        <span className="text-sm text-label">Nav item</span>
        <span className="rounded-md bg-[var(--color-selection)] px-3 py-2 text-sm text-primary">
          Selected
        </span>
      </nav>

      <div className="overflow-hidden rounded-md border border-[var(--color-border-light)]">
        <div className="grid grid-cols-2 gap-px bg-[var(--color-border-light)] text-sm">
          <div className="bg-surface-hover px-3 py-2 font-medium text-[var(--color-text)]">Name</div>
          <div className="bg-surface-hover px-3 py-2 font-medium text-[var(--color-text)]">Status</div>
          <div className="bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]">Row one</div>
          <div className="bg-surface-selected px-3 py-2 text-primary">Selected row</div>
        </div>
      </div>
    </div>
  )
}
