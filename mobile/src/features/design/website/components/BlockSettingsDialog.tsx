import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Button,
  CustomDialog,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  TextField,
} from '@webonone/mobile-ui'
import { ElementChromeFields } from '@/features/design/website/components/ElementChromeFields'
import { pickElementChrome } from '@/features/design/website/document/chrome'
import type { WebsiteBlock, WebsiteDataset } from '@/features/design/website/types'

export function BlockSettingsDialog({
  open,
  block,
  datasets,
  onOpenChange,
  onChange,
}: {
  open: boolean
  block: WebsiteBlock | null
  datasets: WebsiteDataset[]
  onOpenChange: (open: boolean) => void
  onChange: (next: WebsiteBlock) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  if (!block) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('blockSettingsTitle')}
      description={t('blockSettingsDescription')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={<Button onPress={() => onOpenChange(false)}>{tc('done')}</Button>}
    >
      <View className="gap-4">
        <FormField label={t('groupName')} hint={t('groupNameHint')}>
          <TextField
            value={block.groupName ?? ''}
            onChangeText={(groupName) => onChange({ ...block, groupName: groupName || undefined })}
            placeholder={t('groupNamePlaceholder')}
          />
        </FormField>
        <ElementChromeFields
          value={pickElementChrome(block)}
          onChange={(chrome) => onChange({ ...block, ...chrome })}
        />
        <FormField label={t('boundDataset')} hint={t('dataBindingBlockHelp')}>
          <Select
            value={block.dataBinding?.datasetId ?? 'none'}
            onValueChange={(datasetId) =>
              onChange({
                ...block,
                dataBinding:
                  datasetId === 'none'
                    ? undefined
                    : { ...block.dataBinding, datasetId, itemGroup: block.dataBinding?.itemGroup ?? null },
              })
            }
          >
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="none">{t('bindingNone')}</SelectItem>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('itemGroup')} hint={t('itemGroupHint')}>
          <TextField
            value={block.dataBinding?.itemGroup ?? ''}
            onChangeText={(itemGroup) =>
              onChange({
                ...block,
                dataBinding: {
                  datasetId: block.dataBinding?.datasetId ?? null,
                  ...block.dataBinding,
                  itemGroup: itemGroup || null,
                },
              })
            }
            placeholder={t('itemGroupPlaceholder')}
          />
        </FormField>
        {block.dataBinding?.datasetId ? (
          <Button
            variant="outline"
            onPress={() => onChange({ ...block, dataBinding: undefined })}
          >
            {t('clearDataBinding')}
          </Button>
        ) : null}
      </View>
    </CustomDialog>
  )
}
