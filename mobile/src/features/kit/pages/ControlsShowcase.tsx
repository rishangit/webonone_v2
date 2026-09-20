import { useState } from 'react'
import { View } from 'react-native'
import { ArrowRight, Plus, RefreshCw } from 'lucide-react-native'
import {
  Body,
  Button,
  Checkbox,
  ColorInput,
  Muted,
  OtpInput,
  PasswordInput,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  SearchInput,
  SegmentedSwitch,
  SegmentedSwitchItem,
  DateField,
  NativeSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  Textarea,
  useThemedControlIconColor,
  useThemeColors,
} from '@webonone/mobile-ui'
import { DemoSection } from '@/features/kit/DemoSection'

export function ControlsShowcase() {
  const colors = useThemeColors()
  const controlIconColor = useThemedControlIconColor()
  const [search, setSearch] = useState('Glass')
  const [password, setPassword] = useState('')
  const [color, setColor] = useState('#344CE2')
  const [otp, setOtp] = useState('')
  const [country, setCountry] = useState('LK')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [notify, setNotify] = useState(true)
  const [plan, setPlan] = useState('starter')
  const [period, setPeriod] = useState('week')
  const [role, setRole] = useState('admin')
  const [companySize, setCompanySize] = useState('')
  const [tab, setTab] = useState('account')
  const [pickedDate, setPickedDate] = useState<Date | undefined>(new Date())

  return (
    <View className="gap-4">
      <DemoSection title="Buttons" description="Variants and sizes used across the mobile shell.">
        <View className="flex-row flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </View>
      </DemoSection>

      <DemoSection title="Buttons with icons">
        <View className="flex-row flex-wrap gap-2">
          <Button>
            <View className="flex-row items-center gap-2">
              <Plus size={20} color={colors.primaryText} />
              <Body className="text-base font-medium leading-none text-primary-foreground">Create</Body>
            </View>
          </Button>
          <Button>
            <View className="flex-row items-center gap-2">
              <Body className="text-base font-medium leading-none text-primary-foreground">Next</Body>
              <ArrowRight size={20} color={colors.primaryText} />
            </View>
          </Button>
          <Button size="icon" variant="outline" accessibilityLabel="Refresh">
            <RefreshCw size={20} color={controlIconColor} />
          </Button>
        </View>
      </DemoSection>

      <DemoSection title="Input text">
        <TextField label="Display name" required placeholder="Plain text" defaultValue="Acme" />
        <TextField label="Disabled" editable={false} value="Read only" />
      </DemoSection>

      <DemoSection title="Date field" description="Month calendar picker. Display shape is Oct 10, 2026.">
        <DateField
          label="Starts on"
          required
          value={pickedDate}
          onChange={setPickedDate}
          placeholder="Select date"
        />
      </DemoSection>

      <DemoSection title="Search">
        <SearchInput placeholder="Search…" value="" />
        <SearchInput value={search} onChangeText={setSearch} onClear={() => setSearch('')} placeholder="Search themes…" />
        <SearchInput placeholder="Disabled" editable={false} />
      </DemoSection>

      <DemoSection title="Password">
        <PasswordInput label="Password" placeholder="Enter password" value={password} onChangeText={setPassword} />
        <PasswordInput label="Disabled" placeholder="Disabled" editable={false} showToggle={false} />
      </DemoSection>

      <DemoSection title="Textarea">
        <Textarea label="Notes" placeholder="Write a longer note…" />
      </DemoSection>

      <DemoSection title="Color picker">
        <ColorInput label="Accent" value={color} onChange={setColor} />
        <Muted>Value: {color}</Muted>
      </DemoSection>

      <DemoSection title="OTP">
        <OtpInput label="6-digit code" required value={otp} onChange={setOtp} />
      </DemoSection>

      <DemoSection title="Phone input (with country)">
        <PhoneInput country={country} onCountryChange={setCountry} value={phone} onChangeText={setPhone} />
      </DemoSection>

      <DemoSection title="Checkbox, switch, radio">
        <Checkbox checked={terms} onCheckedChange={setTerms} label="Accept terms" />
        <Switch checked={notify} onCheckedChange={setNotify} label="Notifications" />
        <RadioGroup value={plan} onValueChange={setPlan}>
          <RadioGroupItem value="starter" label="Starter" />
          <RadioGroupItem value="pro" label="Pro" />
        </RadioGroup>
      </DemoSection>

      <DemoSection title="Segmented switch">
        <SegmentedSwitch value={period} onValueChange={setPeriod}>
          <SegmentedSwitchItem value="day">Day</SegmentedSwitchItem>
          <SegmentedSwitchItem value="week">Week</SegmentedSwitchItem>
          <SegmentedSwitchItem value="month">Month</SegmentedSwitchItem>
        </SegmentedSwitch>
      </DemoSection>

      <DemoSection
        title="Native select"
        description="Options-based select with the same trigger and dropdown menu as web mobile."
      >
        <NativeSelect
          label="Company size"
          value={companySize}
          onValueChange={setCompanySize}
          placeholder="Select company size"
          options={['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => ({
            value: size,
            label: `${size} employees`,
          }))}
        />
      </DemoSection>

      <DemoSection title="Select" description="Web-aligned trigger + anchored dropdown menu with checkmarks.">
        <Select value={role} onValueChange={setRole} placeholder="Select role">
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </DemoSection>

      <DemoSection title="Tabs" description="Same API as web `@webonone/ui-kit` Tabs.">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Demo sections">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Body>Account settings panel.</Body>
          </TabsContent>
          <TabsContent value="theme">
            <Body>Theme settings panel.</Body>
          </TabsContent>
          <TabsContent value="billing">
            <Body>Billing settings panel.</Body>
          </TabsContent>
        </Tabs>
      </DemoSection>
    </View>
  )
}
