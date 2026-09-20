import { useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  ConfirmDialog,
  CustomDialog,
  Muted,
  TextField,
  type DialogSizePreset,
} from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'

const WIDTHS: DialogSizePreset[] = ['small', 'medium', 'large', 'xlarge', 'auto']

export function DialogsShowcase() {
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [size, setSize] = useState<DialogSizePreset>('medium')
  const [name, setName] = useState('Summer')

  return (
    <View className="gap-4">
      <DemoSection
        title="Custom dialog"
        description="Header, scrollable body, and footer — same slots as web CustomDialog."
      >
        <Button onPress={() => setFormOpen(true)}>Open form dialog</Button>
        <CustomDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Edit theme — Basics"
          description="Step 1 of 3. Name your theme."
          sizeWidth="large"
          sizeHeight="xlarge"
          footer={
            <>
              <Button variant="outline" onPress={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button onPress={() => setFormOpen(false)}>Next</Button>
            </>
          }
        >
          <TextField label="Theme name" required value={name} onChangeText={setName} />
          <Muted>Dialog width stays fixed across wizard steps.</Muted>
        </CustomDialog>
      </DemoSection>

      <DemoSection title="Confirm dialog" description="Destructive confirmation with busy state support.">
        <Button variant="destructive" onPress={() => setConfirmOpen(true)}>
          Delete theme
        </Button>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete Summer?"
          description="This action cannot be undone. The theme will be permanently removed."
          confirmLabel="Delete"
          destructive
          onConfirm={() => setConfirmOpen(false)}
        />
      </DemoSection>

      <DemoSection title="Size presets" description="small, medium, large, xlarge, and auto.">
        <View className="flex-row flex-wrap gap-2">
          {WIDTHS.map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={size === preset ? 'default' : 'outline'}
              onPress={() => {
                setSize(preset)
                setSizeOpen(true)
              }}
            >
              {preset}
            </Button>
          ))}
        </View>
        <CustomDialog
          open={sizeOpen}
          onOpenChange={setSizeOpen}
          title={`Size: ${size}`}
          description="Reuse these presets for every popup."
          sizeWidth={size}
          sizeHeight={size === 'auto' ? 'auto' : 'medium'}
          footer={<Button onPress={() => setSizeOpen(false)}>Close</Button>}
        >
          <Body>Body content for the {size} preset.</Body>
        </CustomDialog>
      </DemoSection>
    </View>
  )
}
