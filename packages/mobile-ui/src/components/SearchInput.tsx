import { useEffect, useLayoutEffect, useRef } from 'react'
import { Pressable, TextInput, View, type TextInputProps } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { cn } from '../lib/cn'
import {
  CONTROL_HEIGHT_SM_CLASS,
  controlGroupClassName,
  controlGroupCompactClassName,
  controlInGroupFieldClassName,
  controlTextInputProps,
} from '../lib/controlStyles'
import { useListPageActions, type SearchOverlayConfig } from '../layouts/pageHeaderSearchContext'
import { useThemeColors } from '../theme/ThemeProvider'
import { useThemedControlIconColor } from '../theme/useThemedControlIconColor'

export interface SearchInputProps extends TextInputProps {
  onClear?: () => void
  compactOnMobile?: boolean
}

export function SearchInputField({
  className,
  value,
  onClear,
  inputRef,
  expanded = true,
  compact = false,
  onChangeText,
  placeholder,
  editable,
  accessibilityLabel,
  onSubmitEditing,
  onBlur,
}: SearchOverlayConfig & { className?: string; expanded?: boolean; compact?: boolean }) {
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor({ hasValue: Boolean(value) })
  const showClear = Boolean(expanded && onClear && value)

  return (
    <View
      className={cn(
        compact
          ? cn(controlGroupCompactClassName, expanded ? 'gap-2 px-2' : 'justify-center gap-0 px-0')
          : controlGroupClassName,
        className,
      )}
      onTouchStart={compact ? (event) => event.stopPropagation() : undefined}
    >
      <Search size={18} color={iconColor} strokeWidth={2} />
      <TextInput
        ref={inputRef}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        editable={expanded && editable !== false}
        className={cn(controlInGroupFieldClassName, !expanded && 'max-w-0')}
        style={{ opacity: expanded ? 1 : 0 }}
        {...controlTextInputProps()}
      />
      {showClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          className="h-8 w-8 items-center justify-center"
        >
          <X size={20} color={iconColor} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function SearchInput({
  className,
  value,
  onClear,
  compactOnMobile,
  onSubmitEditing,
  onChangeText,
  placeholder,
  editable,
  accessibilityLabel = 'Search',
  onBlur,
}: SearchInputProps) {
  const listPageActions = useListPageActions()
  const compact = compactOnMobile ?? listPageActions !== null
  const inputRef = useRef<TextInput>(null)
  const setOverlayRef = useRef(listPageActions?.setSearchOverlay)
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value)
  const searchExpanded = listPageActions?.searchExpanded ?? false
  const searchRevealed = listPageActions?.searchRevealed ?? false

  setOverlayRef.current = listPageActions?.setSearchOverlay

  useEffect(() => {
    if (!compact || !searchExpanded) return
    inputRef.current?.focus()
  }, [compact, searchExpanded])

  useLayoutEffect(() => {
    if (!compact) return
    setOverlayRef.current?.({
      inputRef,
      value,
      onClear,
      onChangeText,
      placeholder,
      editable,
      accessibilityLabel,
      onSubmitEditing,
      onBlur,
    })
  }, [
    compact,
    value,
    onClear,
    onChangeText,
    placeholder,
    editable,
    accessibilityLabel,
    onSubmitEditing,
    onBlur,
  ])

  useEffect(() => {
    if (!compact) return
    return () => setOverlayRef.current?.(null)
  }, [compact])

  if (!compact || !listPageActions) {
    return (
      <SearchInputField
        className={className}
        value={value}
        onClear={onClear}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={onSubmitEditing}
      />
    )
  }

  const iconTone = useThemedControlIconColor({ hasValue })

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: searchExpanded }}
      onPress={listPageActions.openSearch}
      onTouchStart={(event) => event.stopPropagation()}
      pointerEvents={searchRevealed ? 'none' : 'auto'}
      className={cn(
        CONTROL_HEIGHT_SM_CLASS,
        'w-11 shrink-0 items-center justify-center rounded-control border border-input-border bg-transparent',
        searchRevealed && 'opacity-0',
        hasValue && !searchRevealed && 'border-primary',
      )}
    >
      <Search size={18} color={iconTone} strokeWidth={2} />
    </Pressable>
  )
}
