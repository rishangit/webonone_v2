import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import {
  Button,
  FormField,
  ImagePreview,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { BoundDatasetSelect } from '../../components/BoundDatasetSelect'
import { ParentPropertySelect } from '../../components/ParentPropertySelect'
import { WebsiteImagePicker } from '../../components/WebsiteImagePicker'
import { childGroupNames } from '../../document/dataBinding'
import {
  collectBindableFieldsFromTemplate,
  createEmptyManualSlide,
} from '../../document/slider'
import { websiteDatasetsActions } from '../../store'
import { MAX_SLIDER_DATA_ITEMS, type MediaRef } from '../../types'
import type { AddonPropsFieldsProps } from '../types'

function mediaRefFromData(value: unknown): MediaRef | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const url = typeof record.url === 'string' ? record.url : null
  const fileId = typeof record.fileId === 'string' ? record.fileId : null
  if (!url || !fileId) return null
  return {
    fileId,
    url,
    fileName: typeof record.fileName === 'string' ? record.fileName : undefined,
    mimeType: typeof record.mimeType === 'string' ? record.mimeType : undefined,
  }
}

/** Dataset owner controls for the content slider — Data Binding tab only. */
export function SliderDataBindingFields({
  addon,
  onChange,
  onNestedDialogOpenChange,
  inheritedFromParent = false,
  parentDataset = null,
}: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const datasetsState = useAppSelector((s) => s.websiteDatasets)
  const [mediaPicker, setMediaPicker] = useState<{ slideId: string; path: string; multi: boolean } | null>(
    null,
  )

  if (addon.type !== 'slider') return null
  const sliderAddon = addon

  const bindableFields = useMemo(
    () => collectBindableFieldsFromTemplate(sliderAddon.props.slideTemplate),
    [sliderAddon.props.slideTemplate],
  )

  const itemGroups = useMemo(
    () => (sliderAddon.props.slideTemplate ? childGroupNames(sliderAddon.props.slideTemplate) : []),
    [sliderAddon.props.slideTemplate],
  )

  const activeDatasets = useMemo(
    () => datasetsState.items.filter((item) => item.status === 'active'),
    [datasetsState.items],
  )

  useEffect(() => {
    dispatch(websiteDatasetsActions.loadListRequested({ page: 1, pageSize: 100, force: false }))
  }, [dispatch])

  useEffect(() => {
    if (!inheritedFromParent) return
    if (sliderAddon.props.dataSource === 'dataset' || !sliderAddon.props.dataSource) {
      updateProps({ dataSource: 'parent', datasetId: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot coerce when opening under parent
  }, [inheritedFromParent])

  function updateProps(partial: Partial<typeof sliderAddon.props>) {
    onChange({
      ...sliderAddon,
      props: { ...sliderAddon.props, ...partial },
    })
  }

  function setMediaPickerOpen(open: boolean, next: typeof mediaPicker = null) {
    setMediaPicker(open ? next : null)
    onNestedDialogOpenChange?.(open)
  }

  function updateManualSlideData(slideId: string, path: string, value: unknown) {
    updateProps({
      manualSlides: sliderAddon.props.manualSlides.map((slide) =>
        slide.id === slideId ? { ...slide, data: { ...slide.data, [path]: value } } : slide,
      ),
    })
  }

  function moveManualSlide(from: number, to: number) {
    const slides = [...sliderAddon.props.manualSlides]
    if (to < 0 || to >= slides.length) return
    const [item] = slides.splice(from, 1)
    if (!item) return
    slides.splice(to, 0, item)
    updateProps({ manualSlides: slides })
  }

  const itemGroupValue = sliderAddon.props.itemGroup ?? ''

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {inheritedFromParent ? t('dataBindingSliderInheritedHelp') : t('dataBindingSliderHelp')}
      </p>

      <FormField label={t('sliderDataSource')} htmlFor="slider-data-source">
        <Select
          value={
            inheritedFromParent && sliderAddon.props.dataSource === 'dataset'
              ? 'parent'
              : sliderAddon.props.dataSource
          }
          onValueChange={(value) =>
            updateProps({
              dataSource: value as 'dataset' | 'manual' | 'parent',
              ...(value === 'parent' ? { datasetId: null } : {}),
              ...(value !== 'parent' ? { itemsPath: null } : {}),
            })
          }
        >
          <SelectTrigger id="slider-data-source">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inheritedFromParent ? (
              <SelectItem value="parent">{t('sliderDataSourceParent')}</SelectItem>
            ) : null}
            <SelectItem value="manual">{t('sliderDataSourceManual')}</SelectItem>
            {!inheritedFromParent ? (
              <SelectItem value="dataset">{t('sliderDataSourceDataset')}</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </FormField>

      {sliderAddon.props.dataSource === 'parent' ||
      (inheritedFromParent && sliderAddon.props.dataSource !== 'manual') ? (
        <ParentPropertySelect
          id="slider-items-path"
          dataset={parentDataset}
          value={sliderAddon.props.itemsPath ?? ''}
          onChange={(itemsPath) =>
            updateProps({
              dataSource: 'parent',
              itemsPath: itemsPath || null,
              datasetId: null,
            })
          }
          complexOnly
          hint={t('parentPropertyHint')}
        />
      ) : null}

      {sliderAddon.props.dataSource === 'dataset' && !inheritedFromParent ? (
        <BoundDatasetSelect
          id="slider-dataset"
          value={sliderAddon.props.datasetId}
          datasets={activeDatasets}
          onChange={(datasetId) => updateProps({ datasetId })}
          hint={t('sliderDatasetHint')}
        />
      ) : null}

      {sliderAddon.props.dataSource === 'manual' ? (
        <FormField label={t('sliderManualSlides')} htmlFor="slider-manual-slides">
          <div id="slider-manual-slides" className="space-y-3">
            {bindableFields.length === 0 && sliderAddon.props.slideTemplate ? (
              <p className="text-xs text-muted-foreground">{t('sliderNoBindableFields')}</p>
            ) : null}
            {!sliderAddon.props.slideTemplate ? (
              <p className="text-xs text-muted-foreground">{t('sliderPickPresetFirst')}</p>
            ) : null}
            {sliderAddon.props.manualSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="space-y-2 rounded-md border border-[hsl(var(--glass-border))] p-3"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t('sliderSlideN', { index: index + 1 })}</p>
                  <div className="ml-auto flex shrink-0 flex-col gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={t('moveSlideUp')}
                      disabled={index === 0}
                      onClick={() => moveManualSlide(index, index - 1)}
                    >
                      <ChevronUp className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={t('moveSlideDown')}
                      disabled={index === sliderAddon.props.manualSlides.length - 1}
                      onClick={() => moveManualSlide(index, index + 1)}
                    >
                      <ChevronDown className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8 shrink-0"
                    aria-label={t('removeSlide')}
                    onClick={() =>
                      updateProps({
                        manualSlides: sliderAddon.props.manualSlides.filter((item) => item.id !== slide.id),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
                {bindableFields.map((field) => {
                  if (field.kind === 'text') {
                    return (
                      <FormField key={field.path} label={field.path} htmlFor={`${slide.id}-${field.path}`}>
                        <Input
                          id={`${slide.id}-${field.path}`}
                          value={typeof slide.data[field.path] === 'string' ? String(slide.data[field.path]) : ''}
                          onChange={(event) =>
                            updateManualSlideData(slide.id, field.path, event.target.value)
                          }
                        />
                      </FormField>
                    )
                  }
                  const media = mediaRefFromData(slide.data[field.path])
                  return (
                    <FormField key={field.path} label={field.path} htmlFor={`${slide.id}-${field.path}`}>
                      <div className="flex items-center gap-2">
                        <ImagePreview
                          src={media?.url ?? null}
                          alt={field.path}
                          mode="view"
                          className="h-12 w-16 shrink-0 rounded-md"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9"
                          onClick={() =>
                            setMediaPickerOpen(true, {
                              slideId: slide.id,
                              path: field.path,
                              multi: field.kind === 'images',
                            })
                          }
                        >
                          {t('pickImage')}
                        </Button>
                      </div>
                    </FormField>
                  )
                })}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              disabled={
                !sliderAddon.props.slideTemplate ||
                sliderAddon.props.manualSlides.length >= MAX_SLIDER_DATA_ITEMS
              }
              onClick={() =>
                updateProps({
                  manualSlides: [
                    ...sliderAddon.props.manualSlides,
                    createEmptyManualSlide(bindableFields),
                  ],
                })
              }
            >
              {t('addSlide')}
            </Button>
          </div>
        </FormField>
      ) : null}

      <FormField label={t('itemGroup')} htmlFor="slider-item-group">
        {itemGroups.length > 0 ? (
          <Select
            value={itemGroupValue || '__none__'}
            onValueChange={(value) =>
              updateProps({ itemGroup: value === '__none__' ? null : value })
            }
          >
            <SelectTrigger id="slider-item-group">
              <SelectValue placeholder={t('itemGroupPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
              {itemGroups.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="slider-item-group"
            value={itemGroupValue}
            onChange={(event) => updateProps({ itemGroup: event.target.value || null })}
            placeholder={t('itemGroupPlaceholder')}
          />
        )}
      </FormField>
      <p className="text-xs text-muted-foreground">{t('sliderItemGroupHint')}</p>

      <WebsiteImagePicker
        open={mediaPicker != null}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(picked) => {
          if (!mediaPicker) return
          if (mediaPicker.multi) {
            const slide = sliderAddon.props.manualSlides.find((item) => item.id === mediaPicker.slideId)
            const existing = Array.isArray(slide?.data[mediaPicker.path])
              ? (slide!.data[mediaPicker.path] as MediaRef[])
              : []
            updateManualSlideData(mediaPicker.slideId, mediaPicker.path, [...existing, picked])
          } else {
            updateManualSlideData(mediaPicker.slideId, mediaPicker.path, picked)
          }
          setMediaPickerOpen(false)
        }}
      />
    </div>
  )
}
