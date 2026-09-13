import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import {
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { pickElementChrome } from '../document/chrome'
import { websiteDatasetsActions } from '../store'
import { childGroupNames } from '../document/dataBinding'
import { blockSettingsSchema } from '../schemas/websiteDesignerSchemas'
import type { BlockDataBinding, ElementChrome, WebsiteBlock, WebsiteDataset } from '../types'
import { BindingValueTypeBadge } from './BindingValueTypeBadge'
import { BoundDatasetSelect } from './BoundDatasetSelect'
import { ElementChromeSettingsFields } from './ElementChromeSettingsFields'
import { ParentPropertySelect } from './ParentPropertySelect'

export const BLOCK_SETTINGS_DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'auto' as const,
}

export type BlockSettingsPatch = ElementChrome & {
  groupName: string | undefined
  dataBinding: BlockDataBinding | undefined
}

/** Dataset already supplied by a parent owner (e.g. content slider). */
export type InheritedBlockBinding = {
  datasetId: string
  datasetName: string
  /** i18n key fragment or plain label — "slider" | "block" */
  source: 'slider' | 'block'
  /** Parent slider/block item group this element matches, if any. */
  itemGroup?: string | null
}

interface ContentBlockSettingsDialogProps {
  open: boolean
  block: WebsiteBlock | null
  /** When set, Data Binding shows inherited rows and skips local dataset owner UI. */
  inheritedBinding?: InheritedBlockBinding | null
  onOpenChange: (open: boolean) => void
  onSave: (blockId: string, patch: BlockSettingsPatch) => void
}

export function ContentBlockSettingsDialog({
  open,
  block,
  inheritedBinding = null,
  onOpenChange,
  onSave,
}: ContentBlockSettingsDialogProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const datasetsState = useAppSelector((s) => s.websiteDatasets)
  const [tab, setTab] = useState('basic')
  const [chrome, setChrome] = useState<ElementChrome>({})
  const [groupName, setGroupName] = useState(block?.groupName ?? '')
  const [datasetId, setDatasetId] = useState(block?.dataBinding?.datasetId ?? '')
  const [itemGroup, setItemGroup] = useState(block?.dataBinding?.itemGroup ?? '')
  const [itemGap, setItemGap] = useState(String(block?.dataBinding?.itemGap ?? 0))
  const [itemsPath, setItemsPath] = useState(block?.dataBinding?.itemsPath ?? '')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  const childGroups = useMemo(() => (block ? childGroupNames(block) : []), [block])
  const activeDatasets = useMemo(
    () => datasetsState.items.filter((item: WebsiteDataset) => item.status === 'active'),
    [datasetsState.items],
  )
  const inheritedDataset = useMemo(
    () =>
      inheritedBinding?.datasetId
        ? (datasetsState.items.find((item) => item.id === inheritedBinding.datasetId) ?? null)
        : null,
    [datasetsState.items, inheritedBinding?.datasetId],
  )

  const inheritsFromParent = Boolean(inheritedBinding?.datasetId)
  const isParentItemGroup =
    inheritsFromParent &&
    Boolean(
      inheritedBinding?.itemGroup?.trim() &&
        block?.groupName?.trim() &&
        inheritedBinding.itemGroup.trim() === block.groupName.trim(),
    )

  useEffect(() => {
    if (!open) return
    setTab('basic')
    setChrome(block ? pickElementChrome(block) : {})
    setGroupName(block?.groupName ?? '')
    setDatasetId(block?.dataBinding?.datasetId ?? '')
    setItemGroup(block?.dataBinding?.itemGroup ?? '')
    setItemGap(String(block?.dataBinding?.itemGap ?? 0))
    setItemsPath(block?.dataBinding?.itemsPath ?? '')
    setFieldErrors({})
    dispatch(websiteDatasetsActions.loadListRequested({ page: 1, pageSize: 100, force: false }))
  }, [block, dispatch, open])

  function clearDataBinding() {
    setDatasetId('')
    setItemGroup('')
    setItemGap('0')
    setItemsPath('')
  }

  function submit() {
    const dataBinding = inheritsFromParent
      ? itemsPath.trim()
        ? {
            datasetId: null as string | null,
            itemsPath: itemsPath.trim(),
            itemGroup: null as string | null,
            itemGap: 0,
          }
        : undefined
      : datasetId.trim() || itemGroup.trim()
        ? {
            datasetId: datasetId.trim() || null,
            itemGroup: itemGroup.trim() || null,
            itemGap: Number(itemGap) || 0,
            itemsPath: null as string | null,
          }
        : undefined
    const parsed = blockSettingsSchema.safeParse({
      ...chrome,
      backgroundColor: chrome.backgroundColor || undefined,
      borderColor: chrome.borderColor || undefined,
      groupName: groupName.trim() || undefined,
      dataBinding,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    if (!block) return
    setFieldErrors({})
    const nextBinding = parsed.data.dataBinding
    onSave(block.id, {
      backgroundColor: parsed.data.backgroundColor || undefined,
      borderColor: parsed.data.borderColor || undefined,
      borderRadius: parsed.data.borderRadius,
      boxShadow: parsed.data.boxShadow,
      padding: parsed.data.padding,
      margin: parsed.data.margin,
      groupName: parsed.data.groupName || undefined,
      dataBinding: nextBinding
        ? {
            datasetId: inheritsFromParent ? null : nextBinding.datasetId,
            itemGroup: inheritsFromParent ? null : (nextBinding.itemGroup ?? null),
            itemGap: inheritsFromParent ? 0 : nextBinding.itemGap,
            itemsPath: nextBinding.itemsPath ?? null,
          }
        : undefined,
    })
    onOpenChange(false)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('blockSettings')}
      description={t('blockSettingsDescription')}
      icon={<Settings2 className="size-5" aria-hidden />}
      sizeWidth={BLOCK_SETTINGS_DIALOG_SIZE.sizeWidth}
      sizeHeight={BLOCK_SETTINGS_DIALOG_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10 px-4" onClick={submit} disabled={!block}>
            {tc('save')}
          </Button>
        </>
      }
    >
      <Form className="space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label={t('blockSettingsDescription')}>
            <TabsTrigger value="basic">{t('basicSetting')}</TabsTrigger>
            <TabsTrigger value="settings">{t('settingsTab')}</TabsTrigger>
            <TabsTrigger value="dataBinding">{t('dataBindingTab')}</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4">
            <FormField label={t('groupName')} htmlFor="block-settings-group-name">
              <Input
                id="block-settings-group-name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={t('groupNamePlaceholder')}
              />
            </FormField>
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <ElementChromeSettingsFields
              value={chrome}
              onChange={setChrome}
              fieldErrors={fieldErrors}
              idPrefix="block-settings"
            />
          </TabsContent>
          <TabsContent value="dataBinding" className="space-y-4">
            {inheritsFromParent && inheritedBinding ? (
              <div className="space-y-4">
                <div className="space-y-3 rounded-md border border-[hsl(var(--glass-border))] bg-muted/30 p-3">
                  <p className="text-sm text-muted-foreground">
                    {isParentItemGroup
                      ? t('inheritedBindingItemGroupHelp', {
                          dataset: inheritedBinding.datasetName,
                          group: inheritedBinding.itemGroup,
                        })
                      : t('inheritedBindingFromSliderHelp', {
                          dataset: inheritedBinding.datasetName,
                        })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <BindingValueTypeBadge valueType="array" />
                    <span className="font-medium">{inheritedBinding.datasetName}</span>
                    <span className="text-muted-foreground">({t('inheritedFromSlider')})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('inheritedBindingSkipDataset')}</p>
                </div>
                <ParentPropertySelect
                  id="block-settings-items-path"
                  dataset={inheritedDataset}
                  value={itemsPath}
                  onChange={setItemsPath}
                  complexOnly
                  hint={t('parentPropertyHint')}
                />
                {itemsPath ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-4"
                    onClick={() => setItemsPath('')}
                  >
                    {t('clearParentProperty')}
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('dataBindingBlockHelp')}</p>
                <BoundDatasetSelect
                  id="block-settings-dataset"
                  value={datasetId || null}
                  datasets={activeDatasets}
                  onChange={(next) => setDatasetId(next ?? '')}
                />
                <FormField label={t('itemGroup')} htmlFor="block-settings-item-group">
                  {childGroups.length > 0 ? (
                    <Select
                      value={itemGroup || '__none__'}
                      onValueChange={(value) => setItemGroup(value === '__none__' ? '' : value)}
                    >
                      <SelectTrigger id="block-settings-item-group">
                        <SelectValue placeholder={t('itemGroupPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
                        {childGroups.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="block-settings-item-group"
                      value={itemGroup}
                      onChange={(event) => setItemGroup(event.target.value)}
                      placeholder={t('itemGroupPlaceholder')}
                    />
                  )}
                </FormField>
                <p className="text-xs text-muted-foreground">{t('itemGroupHint')}</p>
                <FormField
                  label={t('itemGap')}
                  htmlFor="block-settings-item-gap"
                  error={fieldErrors['dataBinding.itemGap']}
                >
                  <Input
                    id="block-settings-item-gap"
                    type="number"
                    min={0}
                    value={itemGap}
                    onChange={(event) => setItemGap(event.target.value)}
                  />
                </FormField>
                <Button type="button" variant="outline" className="h-10 px-4" onClick={clearDataBinding}>
                  {t('clearDataBinding')}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Form>
    </CustomDialog>
  )
}
