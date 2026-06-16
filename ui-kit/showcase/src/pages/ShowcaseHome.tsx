import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AuthLayout,
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
  Label,
  PageShell,
  Spinner,
  useToast,
} from '@webonone/ui-kit'

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
  const [inputValue, setInputValue] = useState('')

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
              <CardDescription>Input, Label, and FormField</CardDescription>
            </CardHeader>
            <CardContent>
              <Form>
                <FormField label="Email" htmlFor="showcase-email">
                  <Input
                    id="showcase-email"
                    type="email"
                    placeholder="you@example.com"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </FormField>
                <div className="space-y-2">
                  <Label htmlFor="showcase-name">Display name</Label>
                  <Input id="showcase-name" placeholder="Jane Doe" />
                </div>
              </Form>
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
