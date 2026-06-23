import { useState, type MouseEvent } from 'react'
import { Button, CustomDialog } from '@webonone/ui-kit'
import type { ParsedThemeColors } from '../utils/parseCssThemeVariables'
import { parseCssThemeVariables } from '../utils/parseCssThemeVariables'

const PLACEHOLDER = `:root {
  --color-1: #2563EB;
  --color-2: #3B82F6;
  --color-3: #F59E0B;
  --color-4: #F8FAFC;
  --color-5: #1E293B;
}`

interface ThemeCssImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (colors: ParsedThemeColors) => void
}

export function ThemeCssImportDialog({ open, onOpenChange, onImport }: ThemeCssImportDialogProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setText('')
      setError(null)
    }
    onOpenChange(next)
  }

  function handleApply(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()

    const parsed = parseCssThemeVariables(text)
    if (!parsed) {
      setError('Paste a valid :root block with --color-1 through --color-5 in #RRGGBB format.')
      return
    }

    onImport(parsed)
    setText('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Import palette"
      description={
        <>
          Paste the <code className="text-xs">:root {'{ … }'}</code> block from{' '}
          <a
            href="https://ccolorpalette.com/"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            CColorPalette
          </a>{' '}
          (Export → CSS variables).
        </>
      }
      sizeWidth="auto"
      maxWidth="max-w-md"
      onInteractOutside={(e) => e.preventDefault()}
      onPointerDownOutside={(e) => e.preventDefault()}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="h-10" onClick={handleApply}>
            Apply
          </Button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (error) setError(null)
        }}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full rounded-md border border-input bg-input-background px-3 py-2 font-mono text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </CustomDialog>
  )
}
