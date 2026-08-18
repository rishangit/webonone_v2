import { ArrowRight, Calendar, CalendarDays, CalendarRange, Mail, Plus, RefreshCw, Tags, User } from 'lucide-react'
import {
  Button,
  Checkbox,
  ColorInput,
  DatePicker,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  getPhoneCountryByIso2,
  Input,
  InputGroup,
  InputGroupIcon,
  OtpInput,
  Label,
  MultiSelect,
  PasswordInput,
  PhoneInput,
  SearchInput,
  RadioGroup,
  RadioGroupItem,
  SegmentedSwitch,
  SegmentedSwitchItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@webonone/ui-kit'
import { useMemo, useState } from 'react'
import { DemoSection } from '@/components/DemoSection'

const tagOptions = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'radix', label: 'Radix' },
]

export function ControlsPage() {
  const [sliderValue, setSliderValue] = useState([40])
  const [tags, setTags] = useState<string[]>(['react'])
  const [date, setDate] = useState<Date | undefined>()
  const [country, setCountry] = useState('')
  const [plan, setPlan] = useState('starter')
  const [terms, setTerms] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [period, setPeriod] = useState('week')
  const [iconPeriod, setIconPeriod] = useState('week')
  const [smPeriod, setSmPeriod] = useState('day')
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [phoneWithIconNational, setPhoneWithIconNational] = useState('')
  const [accentColor, setAccentColor] = useState('#2563EB')
  const [otp4, setOtp4] = useState('')
  const [otp6, setOtp6] = useState('')
  const [searchDemo, setSearchDemo] = useState('Glass')
  const browserDefaultCountry = useMemo(() => getBrowserDefaultCountryIso2(), [])
  const phoneE164 = formatPhoneE164(phoneCountry, phoneNational)

  return (
    <>
      <DemoSection id="buttons" title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </DemoSection>

      <DemoSection id="buttons-with-icons" title="Buttons with icons">
        <div className="flex flex-wrap gap-2">
          <Button>
            <Plus className="h-4 w-4" />
            Create
          </Button>
          <Button>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </DemoSection>

      <DemoSection id="input-text" title="Input text">
        <div className="grid max-w-md gap-4">
          <Input placeholder="Plain text" />
          <Input placeholder="Disabled" disabled />
        </div>
      </DemoSection>

      <DemoSection id="input-text-with-icon" title="Input text (with icon)">
        <div className="grid max-w-md gap-4">
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input placeholder="Username" inGroup />
          </InputGroup>
          <InputGroup>
            <InputGroupIcon icon={Mail} />
            <Input placeholder="Email" inGroup />
          </InputGroup>
        </div>
      </DemoSection>

      <DemoSection id="search-input" title="Search">
        <div className="grid max-w-md gap-4">
          <SearchInput
            value=""
            onChange={() => undefined}
            placeholder="Search…"
            aria-label="Search empty demo"
            readOnly
          />
          <SearchInput
            value={searchDemo}
            onChange={(event) => setSearchDemo(event.target.value)}
            placeholder="Search themes…"
            aria-label="Search filled demo"
          />
          <SearchInput placeholder="Disabled" disabled />
        </div>
      </DemoSection>

      <DemoSection id="password" title="Password">
        <div className="max-w-md space-y-4">
          <PasswordInput placeholder="Enter password" />
          <PasswordInput placeholder="Disabled" disabled showToggle={false} />
        </div>
      </DemoSection>

      <DemoSection id="password-with-icon" title="Password (with icon)">
        <div className="max-w-md">
          <PasswordInput withIcon placeholder="Enter password" />
        </div>
      </DemoSection>

      <DemoSection id="email-text" title="Email text">
        <div className="max-w-md">
          <Input type="email" placeholder="you@example.com" autoComplete="email" />
        </div>
      </DemoSection>

      <DemoSection id="email-text-with-icon" title="Email text (with icon)">
        <div className="max-w-md">
          <InputGroup>
            <InputGroupIcon icon={Mail} />
            <Input
              type="email"
              placeholder="you@example.com"
              inGroup
            />
          </InputGroup>
        </div>
      </DemoSection>

      <DemoSection id="color-picker" title="Color picker">
        <div className="max-w-md space-y-2">
          <ColorInput value={accentColor} onChange={setAccentColor} />
          <p className="text-sm text-muted-foreground">Value: {accentColor}</p>
        </div>
      </DemoSection>

      <DemoSection id="color-picker-disabled" title="Color picker (disabled)">
        <div className="max-w-md">
          <ColorInput value="#3B82F6" onChange={() => undefined} disabled />
        </div>
      </DemoSection>

      <DemoSection id="phone-input-with-country" title="Phone input (with country)">
        <div className="max-w-md space-y-2">
          <PhoneInput
            country={phoneCountry}
            onCountryChange={(next) => setPhoneCountry(next.iso2)}
            value={phoneNational}
            onChange={(event) => setPhoneNational(event.target.value)}
            placeholder="555-0100"
          />
          <p className="text-sm text-muted-foreground">
            Browser default: {browserDefaultCountry} ({getPhoneCountryByIso2(browserDefaultCountry)?.dialCode})
            {phoneNational ? ` · E.164: ${phoneE164}` : null}
          </p>
        </div>
      </DemoSection>

      <DemoSection id="phone-input-with-icon" title="Phone input (with icon)">
        <div className="max-w-md">
          <PhoneInput
            withIcon
            value={phoneWithIconNational}
            onChange={(event) => setPhoneWithIconNational(event.target.value)}
            placeholder="555-0100"
          />
        </div>
      </DemoSection>

      <DemoSection id="date-picker" title="Date picker">
        <div className="max-w-md">
          <DatePicker value={date} onChange={setDate} />
        </div>
      </DemoSection>

      <DemoSection id="date-picker-with-icon" title="Date picker (with icon)">
        <div className="max-w-md">
          <DatePicker value={date} onChange={setDate} withIcon />
        </div>
      </DemoSection>

      <DemoSection id="select-option" title="Select option">
        <div className="max-w-md">
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
              <SelectItem value="ca">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DemoSection>

      <DemoSection id="select-option-with-icon" title="Select option (with icon)">
        <div className="max-w-md">
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger leadingIcon={User}>
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DemoSection>

      <DemoSection id="multi-select" title="Multi select option">
        <div className="max-w-md">
          <MultiSelect options={tagOptions} value={tags} onValueChange={setTags} placeholder="Select tags" />
        </div>
      </DemoSection>

      <DemoSection id="multi-select-with-icon" title="Multi select option (with icon)">
        <div className="max-w-md">
          <MultiSelect
            id="tags-icon"
            leadingIcon={Tags}
            options={tagOptions}
            value={tags}
            onValueChange={setTags}
            placeholder="Select tags"
          />
        </div>
      </DemoSection>

      <DemoSection id="checkbox" title="Checkbox">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" checked={terms} onCheckedChange={(v: boolean | 'indeterminate') => setTerms(v === true)} />
            <Label htmlFor="terms">Accept terms</Label>
          </div>
          <Checkbox disabled />
        </div>
      </DemoSection>

      <DemoSection id="switch" title="Switch">
        <div className="flex items-center gap-2">
          <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          <Label htmlFor="notifications">Email notifications</Label>
        </div>
      </DemoSection>

      <DemoSection
        id="segmented-switch"
        title="Segmented switch"
        description="Exclusive pick among several items. One selected at a time; not tabs and not radio circles."
      >
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label>Period</Label>
            <SegmentedSwitch value={period} onValueChange={setPeriod} aria-label="Period">
              <SegmentedSwitchItem value="day">Day</SegmentedSwitchItem>
              <SegmentedSwitchItem value="week">Week</SegmentedSwitchItem>
              <SegmentedSwitchItem value="month">Month</SegmentedSwitchItem>
            </SegmentedSwitch>
            <p className="text-sm text-muted-foreground">Selected: {period}</p>
          </div>
          <div className="space-y-2">
            <Label>With icons</Label>
            <SegmentedSwitch value={iconPeriod} onValueChange={setIconPeriod} aria-label="Period with icons">
              <SegmentedSwitchItem value="day">
                <Calendar className="h-4 w-4" />
                Day
              </SegmentedSwitchItem>
              <SegmentedSwitchItem value="week">
                <CalendarRange className="h-4 w-4" />
                Week
              </SegmentedSwitchItem>
              <SegmentedSwitchItem value="month">
                <CalendarDays className="h-4 w-4" />
                Month
              </SegmentedSwitchItem>
            </SegmentedSwitch>
          </div>
          <div className="space-y-2">
            <Label>Small</Label>
            <SegmentedSwitch value={smPeriod} onValueChange={setSmPeriod} size="sm" aria-label="Small period">
              <SegmentedSwitchItem value="day">Day</SegmentedSwitchItem>
              <SegmentedSwitchItem value="week">Week</SegmentedSwitchItem>
              <SegmentedSwitchItem value="month">Month</SegmentedSwitchItem>
            </SegmentedSwitch>
          </div>
          <div className="space-y-2">
            <Label>Disabled</Label>
            <SegmentedSwitch value="week" disabled aria-label="Disabled period">
              <SegmentedSwitchItem value="day">Day</SegmentedSwitchItem>
              <SegmentedSwitchItem value="week">Week</SegmentedSwitchItem>
              <SegmentedSwitchItem value="month">Month</SegmentedSwitchItem>
            </SegmentedSwitch>
          </div>
        </div>
      </DemoSection>

      <DemoSection id="radio-option" title="Radio option">
        <RadioGroup value={plan} onValueChange={setPlan} className="space-y-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="starter" id="r-starter" />
            <Label htmlFor="r-starter">Starter</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="pro" id="r-pro" />
            <Label htmlFor="r-pro">Pro</Label>
          </div>
        </RadioGroup>
      </DemoSection>

      <DemoSection
        id="tabs"
        title="Tabs"
        description="Classic tab strip: no bottom border on the list; selected tab shows a top primary border."
      >
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <p className="text-sm text-muted-foreground">Account settings panel content.</p>
          </TabsContent>
          <TabsContent value="theme">
            <p className="text-sm text-muted-foreground">Theme settings panel content.</p>
          </TabsContent>
          <TabsContent value="billing">
            <p className="text-sm text-muted-foreground">Billing settings panel content.</p>
          </TabsContent>
        </Tabs>
      </DemoSection>

      <DemoSection id="text-area" title="Text area">
        <div className="max-w-md space-y-4">
          <Textarea placeholder="Write a message…" />
          <Textarea placeholder="Disabled" disabled />
        </div>
      </DemoSection>

      <DemoSection id="otp-input" title="OTP input">
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label>4-digit code (default)</Label>
            <OtpInput value={otp4} onChange={setOtp4} />
            <p className="text-sm text-muted-foreground">Value: {otp4 || '—'}</p>
          </div>
          <div className="space-y-2">
            <Label>6-digit code</Label>
            <OtpInput length={6} value={otp6} onChange={setOtp6} />
            <p className="text-sm text-muted-foreground">Value: {otp6 || '—'}</p>
          </div>
          <OtpInput value="" onChange={() => undefined} disabled />
        </div>
      </DemoSection>

      <DemoSection id="slider" title="Slider">
        <div className="max-w-md space-y-2">
          <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
          <p className="text-sm text-muted-foreground">Value: {sliderValue[0]}</p>
        </div>
      </DemoSection>
    </>
  )
}
