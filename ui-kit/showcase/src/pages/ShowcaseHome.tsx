import { useState } from 'react'
import { z } from 'zod'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AppHeader,
  AuthLayout,
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  PageShell,
  Spinner,
  useToast,
} from '@webonone/ui-kit'

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

        <Section title="Overlays">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>Dialog description text goes here.</DialogDescription>
              </DialogHeader>
              <p className="text-sm">Dialog body content.</p>
            </DialogContent>
          </Dialog>
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
