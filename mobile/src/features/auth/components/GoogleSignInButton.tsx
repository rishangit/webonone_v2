import { Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@webonone/mobile-ui'
import { GoogleGIcon } from './GoogleGIcon'

type GoogleSignInButtonProps = {
  loading?: boolean
  disabled?: boolean
  onPress: () => void
}

export function GoogleSignInButton({ loading, disabled, onPress }: GoogleSignInButtonProps) {
  const { t } = useTranslation('auth')

  return (
    <Button
      variant="outline"
      className="w-full border-border bg-white"
      loading={loading}
      disabled={disabled}
      onPress={onPress}
    >
      <GoogleGIcon />
      <Text className="text-base font-medium text-neutral-900">{t('continueWithGoogle')}</Text>
    </Button>
  )
}
