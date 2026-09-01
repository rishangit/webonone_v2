import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlatformPeerPanelEmbedPage,
  usePlatformPeerFilterPanelSubmit,
} from '@webonone/platform-embed'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { StatusFilterFields } from '@/shared/components/StatusFilterFields'

export type AttributesFilterDraft = {
  status: string
  value_type: string
}

export function AttributesFilterEmbedPage() {
  const { t } = useTranslation('attributes')
  const { t: tc } = useTranslation('common')

  return (
    <PlatformPeerPanelEmbedPage<AttributesFilterDraft>
      isAllowedParentOrigin={isAllowedParentOrigin}
    >
      {({ parentOrigin, requestId, initialDraft }) => (
        <AttributesFilterEmbedBody
          parentOrigin={parentOrigin}
          requestId={requestId}
          initialDraft={initialDraft}
          valueTypeLabel={t('valueType')}
          numberLabel={t('number')}
          textLabel={t('text')}
          verifiedLabel={t('verified')}
          unverifiedLabel={t('unverified')}
          allLabel={tc('all')}
        />
      )}
    </PlatformPeerPanelEmbedPage>
  )
}

function AttributesFilterEmbedBody({
  parentOrigin,
  requestId,
  initialDraft,
  valueTypeLabel,
  numberLabel,
  textLabel,
  verifiedLabel,
  unverifiedLabel,
  allLabel,
}: {
  parentOrigin: string
  requestId: string
  initialDraft: AttributesFilterDraft | null
  valueTypeLabel: string
  numberLabel: string
  textLabel: string
  verifiedLabel: string
  unverifiedLabel: string
  allLabel: string
}) {
  const [status, setStatus] = useState(initialDraft?.status ?? 'all')
  const [valueType, setValueType] = useState(initialDraft?.value_type ?? 'all')

  usePlatformPeerFilterPanelSubmit<AttributesFilterDraft>({
    parentOrigin,
    requestId,
    getDraft: () => ({ status, value_type: valueType }),
    resetDraft: () => {
      setStatus('all')
      setValueType('all')
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <StatusFilterFields
        idPrefix="attributes"
        value={status}
        onChange={setStatus}
        verifiedLabel={verifiedLabel}
        unverifiedLabel={unverifiedLabel}
      />
      <FormField label={valueTypeLabel} htmlFor="attributes-value-type">
        <Select value={valueType} onValueChange={setValueType}>
          <SelectTrigger id="attributes-value-type">
            <SelectValue placeholder={allLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{allLabel}</SelectItem>
            <SelectItem value="number">{numberLabel}</SelectItem>
            <SelectItem value="text">{textLabel}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}
