import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  Form,
  FormField,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  Input,
  PhoneInput,
  RadioGroup,
  RadioGroupItem,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { parseShareLinkContacts } from '@/features/company-catalog/schemas/catalogShareSchemas'
import type { CatalogShareResult } from '@/features/company-catalog/services/companyCatalogApi'
import { companyCatalogActions } from '@/features/company-catalog/store/companyCatalogStore'
import type { CatalogGalleryKind } from '@/features/company-catalog/types/companyCatalog.types'
import { getWebsiteOrigin } from '@/features/auth/utils/websiteConfig'

type ShareChannel = 'whatsapp' | 'facebook' | 'link'

type CatalogShareDialogProps = {
  open: boolean
  kind: CatalogGalleryKind
  id: string
  itemName: string
  onOpenChange: (open: boolean) => void
}

function publicCatalogItemUrl(companyId: string, kind: string, id: string): string {
  return `${getWebsiteOrigin()}/catalog/${encodeURIComponent(companyId)}/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`
}

function shareFeedback(
  result: CatalogShareResult,
  t: (key: string) => string,
): { title: string; description?: string } {
  if (result.email === 'sent' && result.sms === 'sent') {
    return { title: t('share.sent') }
  }
  if (result.email === 'sent' && result.sms === 'failed') {
    return { title: t('share.sentEmail'), description: t('share.smsFailed') }
  }
  if (result.sms === 'sent' && result.email === 'failed') {
    return { title: t('share.sentSms'), description: t('share.emailFailed') }
  }
  if (result.email === 'sent') return { title: t('share.sentEmail') }
  return { title: t('share.sentSms') }
}

export function CatalogShareDialog({
  open,
  kind,
  id,
  itemName,
  onOpenChange,
}: CatalogShareDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const companyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const shareStatus = useAppSelector((s) => s.companyCatalog.shareStatus)
  const shareError = useAppSelector((s) => s.companyCatalog.shareError)
  const shareResult = useAppSelector((s) => s.companyCatalog.shareResult)
  const [channel, setChannel] = useState<ShareChannel | null>(null)
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(getBrowserDefaultCountryIso2)
  const [phoneNational, setPhoneNational] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'phone', string>>>({})
  const pendingRef = useRef(false)
  const busy = shareStatus === 'saving'

  useEffect(() => {
    if (!open) return
    setChannel(null)
    setEmail('')
    setPhoneCountry(getBrowserDefaultCountryIso2())
    setPhoneNational('')
    setFieldErrors({})
    pendingRef.current = false
    dispatch(companyCatalogActions.clearShareLink())
  }, [open, dispatch])

  useEffect(() => {
    if (!pendingRef.current || shareStatus === 'saving') return
    pendingRef.current = false
    if (shareStatus === 'error') {
      toast({
        title: t('share.failed'),
        description: shareError ?? undefined,
        variant: 'destructive',
      })
      return
    }
    if (shareResult) {
      const feedback = shareFeedback(shareResult, t)
      toast(feedback)
      onOpenChange(false)
    }
  }, [onOpenChange, shareError, shareResult, shareStatus, t, toast])

  function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  function handlePrimary() {
    if (!channel || busy || !companyId) return
    const shareUrl = publicCatalogItemUrl(companyId, kind, id)
    if (channel === 'whatsapp') {
      const text = `${itemName}\n${shareUrl}`
      openExternal(`https://wa.me/?text=${encodeURIComponent(text)}`)
      return
    }
    if (channel === 'facebook') {
      openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
      return
    }

    const parsed = parseShareLinkContacts(
      { email, phone: formatPhoneE164(phoneCountry, phoneNational) },
      {
        emailInvalid: t('share.emailInvalid'),
        phoneInvalid: t('share.phoneInvalid'),
        contactRequired: t('share.contactRequired'),
      },
    )
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    pendingRef.current = true
    dispatch(
      companyCatalogActions.shareLinkRequested({
        kind,
        id,
        email: parsed.data.email,
        phone: parsed.data.phone,
      }),
    )
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
      title={t('share.title', { name: itemName })}
      description={t('share.description')}
      sizeWidth="small"
      sizeHeight="auto"
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10" onClick={handlePrimary} disabled={!channel || busy}>
            {channel === 'link' ? t('share.send') : t('share.open')}
          </Button>
        </>
      }
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          handlePrimary()
        }}
      >
        <FormField label={t('share.channel')} htmlFor="catalog-share-channel" required>
          <RadioGroup
            value={channel ?? ''}
            onValueChange={(value) => setChannel(value as ShareChannel)}
            disabled={busy}
            className="grid gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="whatsapp" id="catalog-share-whatsapp" />
              <label htmlFor="catalog-share-whatsapp" className="text-sm text-foreground">
                {t('share.whatsapp')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="facebook" id="catalog-share-facebook" />
              <label htmlFor="catalog-share-facebook" className="text-sm text-foreground">
                {t('share.facebook')}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="link" id="catalog-share-link" />
              <label htmlFor="catalog-share-link" className="text-sm text-foreground">
                {t('share.link')}
              </label>
            </div>
          </RadioGroup>
        </FormField>

        {channel === 'link' ? (
          <>
            <p className="text-sm text-muted-foreground">{t('share.contactHint')}</p>
            <FormField
              label={t('share.email')}
              htmlFor="catalog-share-email"
              error={fieldErrors.email}
            >
              <Input
                id="catalog-share-email"
                type="email"
                autoComplete="email"
                value={email}
                disabled={busy}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField
              label={t('share.phone')}
              htmlFor="catalog-share-phone"
              error={fieldErrors.phone}
            >
              <PhoneInput
                id="catalog-share-phone"
                country={phoneCountry}
                value={phoneNational}
                disabled={busy}
                onCountryChange={(country) => setPhoneCountry(country.iso2)}
                onChange={(event) => setPhoneNational(event.target.value)}
              />
            </FormField>
          </>
        ) : null}
      </Form>
    </CustomDialog>
  )
}
