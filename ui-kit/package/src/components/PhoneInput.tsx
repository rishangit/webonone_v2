import * as React from 'react'
import { Phone } from 'lucide-react'
import type { PhoneCountry } from '../data/phoneCountries'
import { getBrowserDefaultCountryIso2 } from '../lib/getBrowserDefaultCountryIso2'
import { Input, type InputProps } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'
import { PhoneCountrySelect } from './PhoneCountrySelect'

export interface PhoneInputProps extends Omit<InputProps, 'type'> {
  withIcon?: boolean
  /** When true (default), show searchable country/dial-code selector. */
  showCountrySelector?: boolean
  /** ISO 3166-1 alpha-2 for uncontrolled initial selection; overrides browser locale when set. */
  defaultCountry?: string
  /** Controlled ISO 3166-1 alpha-2 country selection. */
  country?: string
  onCountryChange?: (country: PhoneCountry) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      withIcon = false,
      showCountrySelector = true,
      defaultCountry,
      country,
      onCountryChange,
      disabled,
      ...props
    },
    ref,
  ) => {
    const browserDefault = React.useMemo(() => getBrowserDefaultCountryIso2(), [])
    const [internalCountry, setInternalCountry] = React.useState(
      () => defaultCountry ?? browserDefault,
    )

    const selectedIso2 = country ?? internalCountry

    function handleCountryChange(next: PhoneCountry) {
      if (country === undefined) {
        setInternalCountry(next.iso2)
      }
      onCountryChange?.(next)
    }

    const input = (
      <Input
        ref={ref}
        inGroup
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        className={className}
        {...props}
      />
    )

    if (!showCountrySelector && !withIcon) {
      return (
        <Input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          className={className}
          {...props}
        />
      )
    }

    return (
      <InputGroup invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}>
        {withIcon ? <InputGroupIcon icon={Phone} /> : null}
        {showCountrySelector ? (
          <PhoneCountrySelect
            value={selectedIso2}
            onValueChange={handleCountryChange}
            disabled={disabled}
          />
        ) : null}
        {input}
      </InputGroup>
    )
  },
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }
