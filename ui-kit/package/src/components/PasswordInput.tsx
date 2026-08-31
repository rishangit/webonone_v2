import * as React from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { interactiveHoverTextClassName } from '../lib/selectionStyles'
import { Input, type InputProps } from './Input'
import { InputGroup, InputGroupIcon } from './InputGroup'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showToggle?: boolean
  withIcon?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, withIcon = false, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    const input = (
      <Input
        ref={ref}
        inGroup
        type={visible ? 'text' : 'password'}
        className={className}
        {...props}
      />
    )

    if (!withIcon && !showToggle) {
      return <Input ref={ref} type={visible ? 'text' : 'password'} className={className} {...props} />
    }

    return (
      <InputGroup invalid={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}>
        {withIcon ? <InputGroupIcon icon={Lock} /> : null}
        {input}
        {showToggle ? (
          <button
            type="button"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted-foreground transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${interactiveHoverTextClassName}`}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            disabled={props.disabled}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </InputGroup>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
