import { useState, type MouseEvent } from 'react'
import { Save } from 'lucide-react'
import { Button, CustomDialog } from '@webonone/ui-kit'
import type { ParsedThemeColors } from '../utils/parseCssThemeVariables'
import { parseCssThemeVariables } from '../utils/parseCssThemeVariables'

const PLACEHOLDER = `:root {
  --color-primary: #344CE2;
  --color-secondary: #3578E8;
  --color-background: #EFF3FA;
  --color-surface: #FFFFFF;
  --color-text: #17211D;
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
      setError('Paste a valid :root block with semantic --color-* vars or legacy --color-1 through --color-5.')
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
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" className="h-10" onClick={handleApply}>
            <Save className="mr-2 h-4 w-4" />
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
