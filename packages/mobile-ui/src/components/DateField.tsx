import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  WEEKDAY_LABELS,
  formatPickerDate,
  isSameDay,
  isToday,
  monthGridDays,
  shiftAnchor,
} from '../lib/fullCalendarUtils'
import { controlFieldClass } from '../lib/controlStyles'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'
import { Button } from './Button'
import { CustomDialog } from './CustomDialog'
import { FormField } from './FormField'
import { Body, Muted } from './Typography'

export interface DateFieldProps {
  label?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  error?: string
  required?: boolean
  hint?: string
  disabled?: boolean
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  required,
  hint,
  disabled,
}: DateFieldProps) {
  const iconColor = useThemedControlIconColor({ hasValue: Boolean(value) })
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(() => value ?? new Date())
  const [draft, setDraft] = useState<Date | undefined>(value)
  const monthDays = useMemo(() => monthGridDays(anchor), [anchor])
  const periodLabel = anchor.toLocaleDateString('en', { month: 'short', year: 'numeric' })

  function openPicker() {
    if (disabled) return
    const next = value ?? new Date()
    setAnchor(next)
    setDraft(value)
    setOpen(true)
  }

  function confirm() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <>
      <FormField label={label} required={required} error={error} hint={hint}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label ?? placeholder}
          disabled={disabled}
          onPress={openPicker}
          className={cn(controlFieldClass(error), 'flex-row items-center justify-between', disabled && 'opacity-50')}
        >
          <Text className={value ? 'text-base text-foreground' : 'text-base text-muted'}>
            {value ? formatPickerDate(value) : placeholder}
          </Text>
          <CalendarDays size={20} color={iconColor} />
        </Pressable>
      </FormField>

      <CustomDialog
        open={open}
        onOpenChange={setOpen}
        title={label ?? 'Select date'}
        sizeWidth="medium"
        sizeHeight="auto"
        footer={
          <View className="flex-row flex-wrap justify-end gap-2">
            <Button variant="outline" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onPress={confirm} disabled={!draft}>
              Done
            </Button>
          </View>
        }
      >
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              accessibilityLabel="Previous month"
              onPress={() => setAnchor(shiftAnchor(anchor, 'month', -1))}
            >
              <ChevronLeft size={20} color={iconColor} />
            </Button>
            <Body className="flex-1 text-center text-sm font-medium">{periodLabel}</Body>
            <Button
              variant="outline"
              size="icon"
              accessibilityLabel="Next month"
              onPress={() => setAnchor(shiftAnchor(anchor, 'month', 1))}
            >
              <ChevronRight size={20} color={iconColor} />
            </Button>
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              const today = new Date()
              setAnchor(today)
              setDraft(today)
            }}
          >
            Today
          </Button>
          <View className="overflow-hidden rounded-lg border border-border">
            <View className="flex-row border-b border-border bg-surface">
              {WEEKDAY_LABELS.map((day) => (
                <Muted key={day} className="flex-1 py-1 text-center text-[11px] font-medium">
                  {day}
                </Muted>
              ))}
            </View>
            <View className="flex-row flex-wrap">
              {monthDays.map((day) => {
                const inMonth = day.getMonth() === anchor.getMonth()
                const selected = draft ? isSameDay(day, draft) : false
                return (
                  <Pressable
                    key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                    onPress={() => setDraft(day)}
                    className={cn(
                      'h-10 w-[14.28%] items-center justify-center border-b border-r border-border',
                      selected && 'bg-primary',
                      !selected && isToday(day) && 'bg-primary/10',
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        selected
                          ? 'font-semibold text-primary-foreground'
                          : inMonth
                            ? 'text-foreground'
                            : 'text-muted',
                      )}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>
      </CustomDialog>
    </>
  )
}
