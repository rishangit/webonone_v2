import { useState } from 'react'
import { z } from 'zod'
import { Home, Image, Palette, Settings } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppHeader,
  AppShell,
  AuthLayout,
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  PageShell,
  Spinner,
  useToast,
  type NavConfigItem,
} from '@webonone/ui-kit'

const showcaseNav: NavConfigItem[] = [
  { type: 'item', to: '#home', label: 'Home', icon: Home },
  { type: 'item', to: '#media', label: 'Media demo', icon: Image },
  {
    type: 'group',
    label: 'Settings',
    icon: Settings,
    children: [{ to: '#theme', label: 'System Theme', icon: Palette }],
  },
]

const platformColors = [
  { name: 'color1', var: '--color-1' },
  { name: 'color2', var: '--color-2' },
  { name: 'color3', var: '--color-3' },
  { name: 'color4', var: '--color-4' },
  { name: 'color5', var: '--color-5' },
]

const showcaseFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  displayName: z.string().optional(),
})

type ShowcaseFormValues = z.infer<typeof showcaseFormSchema>

function ShowcaseFormDemo() {
  const [values, setValues] = useState<ShowcaseFormValues>({ email: '', displayName: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShowcaseFormValues, string>>>(
    {},
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = showcaseFormSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormField label="Email" htmlFor="showcase-email" required error={fieldErrors.email}>
        <Input
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>
      <FormField label="Display name" htmlFor="showcase-name" error={fieldErrors.displayName}>
        <Input
          placeholder="Jane Doe (optional)"
          value={values.displayName ?? ''}
          onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
        />
      </FormField>
      <Button type="submit">Validate</Button>
    </Form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

const dialogSizes: DialogSize[] = ['sm', 'md', 'lg', 'xl', '2xl']

function DialogSizeDemo() {
  const [nestedOpen, setNestedOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {dialogSizes.map((size) => (
          <Dialog key={size}>
            <DialogTrigger asChild>
              <Button variant="outline">{size.toUpperCase()}</Button>
            </DialogTrigger>
            <DialogContent size={size}>
              <DialogHeader>
                <DialogTitle>{size} dialog</DialogTitle>
                <DialogDescription>
                  Fixed header and footer; only the body scrolls when content overflows.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <p className="text-sm text-muted-foreground">
                  Dialog body content. Size preset: {size}.
                </p>
                {size === 'lg' || size === 'xl' || size === '2xl' ? (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {Array.from({ length: 16 }, (_, i) => (
                      <p key={i}>Scrollable line {i + 1}</p>
                    ))}
                  </div>
                ) : null}
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="button">Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Nested dialog (lg → sm)</Button>
        </DialogTrigger>
        <DialogContent
          size="lg"
          onInteractOutside={(e) => {
            if (nestedOpen) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (nestedOpen) e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>Outer dialog</DialogTitle>
            <DialogDescription>Open a smaller nested dialog from inside this panel.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Button type="button" variant="outline" onClick={() => setNestedOpen(true)}>
              Open inner dialog
            </Button>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline">
              Close outer
            </Button>
          </DialogFooter>
          <Dialog open={nestedOpen} onOpenChange={setNestedOpen}>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Inner dialog</DialogTitle>
                <DialogDescription>Nested sm dialog — closing this keeps the outer dialog open.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNestedOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ThemingDemo() {
  const [dark, setDark] = useState(false)

  function toggleMode() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={toggleMode}>
          {dark ? 'Switch to light' : 'Switch to dark'}
        </Button>
        <Button>Primary gradient</Button>
        <Button variant="link">Link accent</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {platformColors.map((color) => (
          <div key={color.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-8 w-8 rounded border"
              style={{ backgroundColor: `var(${color.var})` }}
            />
            <span className="text-muted-foreground">{color.name}</span>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Scrollbar demo</CardTitle>
          <CardDescription>Scrollable panel uses scrollbar-themed utility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="scrollbar-themed h-32 overflow-y-auto rounded-md border p-3 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i} className="py-1 text-muted-foreground">
                Scroll line {i + 1} — thumb uses accent token.
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ShowcaseHome() {
  const { toast } = useToast()
  return (
    <PageShell title="UI Kit Showcase">
      <div className="space-y-10">
        <p className="text-muted-foreground">
          Live preview of every exported component from @webonone/ui-kit
        </p>

        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Forms">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Form example</CardTitle>
              <CardDescription>Required fields, optional fields, and inline validation errors</CardDescription>
            </CardHeader>
            <CardContent>
              <ShowcaseFormDemo />
            </CardContent>
          </Card>
        </Section>

        <Section title="Feedback">
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>This is a default alert message.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong.</AlertDescription>
            </Alert>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
            <Button
              variant="outline"
              onClick={() => toast({ title: 'Toast', description: 'Notification sent' })}
            >
              Show toast
            </Button>
          </div>
        </Section>

        <Section title="Dialog">
          <DialogSizeDemo />
        </Section>

        <Section title="Avatar">
          <div className="flex flex-wrap items-end gap-4">
            <Avatar size="xs" fallback="JD" />
            <Avatar size="sm" fallback="JD" />
            <Avatar size="md" fallback="JD" />
            <Avatar size="lg" fallback="JD" />
            <Avatar size="xl" fallback="JD" />
          </div>
        </Section>

        <Section title="App header">
          <div className="space-y-4 overflow-hidden rounded-lg border">
            <AppHeader />
            <AppHeader
              user={{ displayName: 'Jane Doe', email: 'jane@example.com' }}
              onProfileClick={() => toast({ title: 'Open profile' })}
              onLogout={() => toast({ title: 'Logged out' })}
            />
          </div>
        </Section>

        <Section title="App Shell">
          <p className="text-sm text-muted-foreground">
            Collapsible sidebar, mobile drawer below md, and Settings group with nested item.
          </p>
          <div className="overflow-hidden rounded-lg border">
            <div className="max-w-sm border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground md:max-w-none">
              Narrow container simulates mobile; resize viewport for hamburger vs fixed sidebar.
            </div>
            <AppShell
              nav={showcaseNav}
              activePath="#home"
              user={{ displayName: 'Demo User', email: 'demo@example.com' }}
            >
              <h1 className="text-2xl font-semibold text-foreground">Home</h1>
              <p className="mt-2 text-muted-foreground">Main content area with scrollbar-themed utility.</p>
            </AppShell>
          </div>
        </Section>

        <Section title="Theming">
          <ThemingDemo />
        </Section>

        <Section title="Layout">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card</CardTitle>
                <CardDescription>Card component with header and content</CardDescription>
              </CardHeader>
              <CardContent>Card body content.</CardContent>
            </Card>
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-sm font-medium">AuthLayout (minimal)</p>
              <AuthLayout title="Sign in" description="Minimal embed variant" variant="minimal">
                <Button className="w-full">Sign in</Button>
              </AuthLayout>
            </div>
          </div>
        </Section>
      </div>
    </PageShell>
  )
}
