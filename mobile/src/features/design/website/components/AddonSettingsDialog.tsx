import { useState } from 'react'
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
  Switch,
  TextField,
} from '@webonone/mobile-ui'
import { ElementChromeFields } from '@/features/design/website/components/ElementChromeFields'
import { WebsiteImagePickerDialog } from '@/features/design/website/components/WebsiteImagePickerDialog'
import {
  addSubItem,
  createMenuItem,
  moveMenuItem,
  removeMenuItem,
  updateMenuItem,
} from '@/features/design/website/addons/menu/menuItemUtils'
import { pickElementChrome } from '@/features/design/website/document/chrome'
import { DEFAULT_SLIDER_DISPLAY_SETTINGS } from '@/features/design/website/document/slider'
import { nanoid } from '@/features/design/website/nanoid'
import type {
  MenuDisplayMode,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDataset,
  WebsitePage,
  WebsiteTheme,
} from '@/features/design/website/types'

const MENU_MODES: MenuDisplayMode[] = ['inline', 'hamburger', 'wrap', 'scroll']

export function AddonSettingsDialog({
  open,
  addon,
  breakpoint,
  theme,
  pages,
  datasets,
  onOpenChange,
  onChange,
}: {
  open: boolean
  addon: WebsiteAddon | null
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: WebsitePage[]
  datasets: WebsiteDataset[]
  onOpenChange: (open: boolean) => void
  onChange: (next: WebsiteAddon) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!addon) return null

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t(addon.type)}
        description={t('addonSettingsDescription')}
        sizeWidth="medium"
        sizeHeight="large"
        footer={<Button onPress={() => onOpenChange(false)}>{tc('done')}</Button>}
      >
        <View className="gap-4">
          {addon.type === 'image' ? (
            <ImageFields
              addon={addon}
              onChange={onChange}
              onPickImage={() => setPickerOpen(true)}
            />
          ) : null}
          {addon.type === 'text' ? <TextFields addon={addon} theme={theme} onChange={onChange} /> : null}
          {addon.type === 'button' ? (
            <ButtonFields addon={addon} theme={theme} pages={pages} onChange={onChange} />
          ) : null}
          {addon.type === 'menu' ? (
            <MenuFields addon={addon} breakpoint={breakpoint} theme={theme} pages={pages} onChange={onChange} />
          ) : null}
          {addon.type === 'slider' ? (
            <SliderFields addon={addon} breakpoint={breakpoint} datasets={datasets} onChange={onChange} />
          ) : null}
          <ElementChromeFields
            value={pickElementChrome(addon)}
            onChange={(chrome) => onChange({ ...addon, ...chrome } as WebsiteAddon)}
          />
        </View>
      </CustomDialog>
      {addon.type === 'image' ? (
        <WebsiteImagePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={(media) =>
            onChange({
              ...addon,
              props: {
                ...addon.props,
                mediaByBreakpoint: { ...addon.props.mediaByBreakpoint, [breakpoint]: media },
              },
            })
          }
        />
      ) : null}
    </>
  )
}

function ImageFields({
  addon,
  onChange,
  onPickImage,
}: {
  addon: Extract<WebsiteAddon, { type: 'image' }>
  onChange: (next: WebsiteAddon) => void
  onPickImage: () => void
}) {
  const { t } = useTranslation('website')
  return (
    <>
      <Button variant="outline" onPress={onPickImage}>
        {t('pickImage')}
      </Button>
      <FormField label={t('fitCover')}>
        <Select
          value={addon.props.fit}
          onValueChange={(fit) =>
            onChange({ ...addon, props: { ...addon.props, fit: fit as 'cover' | 'contain' } })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="cover">{t('fitCover')}</SelectItem>
            <SelectItem value="contain">{t('fitContain')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}

function TextFields({
  addon,
  theme,
  onChange,
}: {
  addon: Extract<WebsiteAddon, { type: 'text' }>
  theme: WebsiteTheme | null
  onChange: (next: WebsiteAddon) => void
}) {
  const { t } = useTranslation('website')
  return (
    <>
      <FormField label={t('content')}>
        <TextField
          multiline
          value={addon.props.content}
          onChangeText={(content) => onChange({ ...addon, props: { ...addon.props, content } })}
        />
      </FormField>
      <FormField label={t('textStyle')}>
        <Select
          value={addon.props.textStyleId || 'none'}
          onValueChange={(textStyleId) =>
            onChange({
              ...addon,
              props: { ...addon.props, textStyleId: textStyleId === 'none' ? '' : textStyleId },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('bindingNone')}</SelectItem>
            {(theme?.textStyles ?? []).map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}

function ButtonFields({
  addon,
  theme,
  pages,
  onChange,
}: {
  addon: Extract<WebsiteAddon, { type: 'button' }>
  theme: WebsiteTheme | null
  pages: WebsitePage[]
  onChange: (next: WebsiteAddon) => void
}) {
  const { t } = useTranslation('website')
  return (
    <>
      <FormField label={t('label')}>
        <TextField
          value={addon.props.label}
          onChangeText={(label) => onChange({ ...addon, props: { ...addon.props, label } })}
        />
      </FormField>
      <FormField label={t('buttonStyle')}>
        <Select
          value={addon.props.buttonStyleId || 'none'}
          onValueChange={(buttonStyleId) =>
            onChange({
              ...addon,
              props: { ...addon.props, buttonStyleId: buttonStyleId === 'none' ? '' : buttonStyleId },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('bindingNone')}</SelectItem>
            {(theme?.buttonStyles ?? []).map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('linkPage')}>
        <Select
          value={addon.props.linkPageId ?? 'none'}
          onValueChange={(linkPageId) =>
            onChange({
              ...addon,
              props: { ...addon.props, linkPageId: linkPageId === 'none' ? null : linkPageId },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('noLink')}</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}

function MenuFields({
  addon,
  breakpoint,
  theme,
  pages,
  onChange,
}: {
  addon: Extract<WebsiteAddon, { type: 'menu' }>
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: WebsitePage[]
  onChange: (next: WebsiteAddon) => void
}) {
  const { t } = useTranslation('website')
  const settings = addon.props.displayByBreakpoint[breakpoint] ?? { mode: 'inline' as const, align: 'start' as const }

  function patchItems(items: typeof addon.props.items) {
    onChange({ ...addon, props: { ...addon.props, items } })
  }

  return (
    <>
      <FormField label={t('menuDisplayMode')} hint={t('menuBreakpointHint')}>
        <Select
          value={settings.mode}
          onValueChange={(mode) =>
            onChange({
              ...addon,
              props: {
                ...addon.props,
                displayByBreakpoint: {
                  ...addon.props.displayByBreakpoint,
                  [breakpoint]: { ...settings, mode: mode as MenuDisplayMode },
                },
              },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            {MENU_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t(
                  mode === 'inline'
                    ? 'menuModeInline'
                    : mode === 'hamburger'
                      ? 'menuModeHamburger'
                      : mode === 'wrap'
                        ? 'menuModeWrap'
                        : 'menuModeScroll',
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('align')}>
        <Select
          value={settings.align}
          onValueChange={(align) =>
            onChange({
              ...addon,
              props: {
                ...addon.props,
                displayByBreakpoint: {
                  ...addon.props.displayByBreakpoint,
                  [breakpoint]: { ...settings, align: align as 'start' | 'center' | 'end' },
                },
              },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="start">{t('alignStart')}</SelectItem>
            <SelectItem value="center">{t('alignCenter')}</SelectItem>
            <SelectItem value="end">{t('alignEnd')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <View className="gap-3">
        {addon.props.items.length === 0 ? (
          <FormField label={t('menuItems')}>
            <TextField editable={false} value={t('menuItemsEmpty')} />
          </FormField>
        ) : (
          addon.props.items.map((item) => (
            <View key={item.id} className="gap-2 rounded-lg border border-border p-3">
              <TextField
                label={t('menuItem')}
                value={item.label}
                onChangeText={(label) => patchItems(updateMenuItem(addon.props.items, item.id, { label }))}
              />
              <FormField label={t('linkPage')}>
                <Select
                  value={item.linkPageId ?? 'none'}
                  onValueChange={(linkPageId) =>
                    patchItems(
                      updateMenuItem(addon.props.items, item.id, {
                        linkPageId: linkPageId === 'none' ? null : linkPageId,
                      }),
                    )
                  }
                >
                  <SelectTrigger />
                  <SelectContent>
                    <SelectItem value="none">{t('noLink')}</SelectItem>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label={t('textStyle')}>
                <Select
                  value={item.textStyleId || 'none'}
                  onValueChange={(textStyleId) =>
                    patchItems(
                      updateMenuItem(addon.props.items, item.id, {
                        textStyleId: textStyleId === 'none' ? '' : textStyleId,
                      }),
                    )
                  }
                >
                  <SelectTrigger />
                  <SelectContent>
                    <SelectItem value="none">{t('bindingNone')}</SelectItem>
                    {(theme?.textStyles ?? []).map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <View className="flex-row flex-wrap gap-2">
                <Button size="sm" variant="outline" onPress={() => patchItems(addSubItem(addon.props.items, item.id))}>
                  {t('addSubItem')}
                </Button>
                <Button size="sm" variant="outline" onPress={() => patchItems(moveMenuItem(addon.props.items, item.id, -1))}>
                  {t('moveItemUp')}
                </Button>
                <Button size="sm" variant="outline" onPress={() => patchItems(moveMenuItem(addon.props.items, item.id, 1))}>
                  {t('moveItemDown')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => patchItems(removeMenuItem(addon.props.items, item.id))}
                >
                  {t('removeMenuItem')}
                </Button>
              </View>
              {item.children.map((child) => (
                <View key={child.id} className="gap-2 pl-3">
                  <TextField
                    label={t('subItems')}
                    value={child.label}
                    onChangeText={(label) => patchItems(updateMenuItem(addon.props.items, child.id, { label }))}
                  />
                </View>
              ))}
            </View>
          ))
        )}
        <Button variant="outline" onPress={() => patchItems([...addon.props.items, createMenuItem()])}>
          {t('addMenuItem')}
        </Button>
      </View>
    </>
  )
}

function SliderFields({
  addon,
  breakpoint,
  datasets,
  onChange,
}: {
  addon: Extract<WebsiteAddon, { type: 'slider' }>
  breakpoint: WebsiteBreakpoint
  datasets: WebsiteDataset[]
  onChange: (next: WebsiteAddon) => void
}) {
  const { t } = useTranslation('website')
  const display = addon.props.displayByBreakpoint?.[breakpoint] ?? DEFAULT_SLIDER_DISPLAY_SETTINGS

  function patchDisplay(next: typeof display) {
    onChange({
      ...addon,
      props: {
        ...addon.props,
        displayByBreakpoint: { ...addon.props.displayByBreakpoint, [breakpoint]: next },
      },
    })
  }

  return (
    <>
      <FormField label={t('sliderDataSource')} hint={t('sliderBreakpointHint')}>
        <Select
          value={addon.props.dataSource}
          onValueChange={(dataSource) =>
            onChange({
              ...addon,
              props: {
                ...addon.props,
                dataSource: dataSource as 'dataset' | 'manual' | 'parent',
              },
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="manual">{t('sliderDataSourceManual')}</SelectItem>
            <SelectItem value="dataset">{t('sliderDataSourceDataset')}</SelectItem>
            <SelectItem value="parent">{t('sliderDataSourceParent')}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      {addon.props.dataSource === 'dataset' ? (
        <FormField label={t('boundDataset')} hint={t('sliderDatasetHint')}>
          <Select
            value={addon.props.datasetId ?? 'none'}
            onValueChange={(datasetId) =>
              onChange({
                ...addon,
                props: { ...addon.props, datasetId: datasetId === 'none' ? null : datasetId },
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
      ) : null}
      <FormField label={t('itemGroup')} hint={t('sliderItemGroupHint')}>
        <TextField
          value={addon.props.itemGroup ?? ''}
          onChangeText={(itemGroup) =>
            onChange({ ...addon, props: { ...addon.props, itemGroup: itemGroup || null } })
          }
        />
      </FormField>
      <Switch
        checked={display.showNavigation}
        onCheckedChange={(showNavigation) => patchDisplay({ ...display, showNavigation })}
        label={t('showNavigation')}
      />
      <Switch
        checked={display.autoSlide}
        onCheckedChange={(autoSlide) => patchDisplay({ ...display, autoSlide })}
        label={t('autoSlide')}
      />
      <FormField label={t('itemsPerSlide')} hint={t('itemsPerSlideHint')}>
        <TextField
          keyboardType="number-pad"
          value={String(display.itemsPerView)}
          onChangeText={(value) =>
            patchDisplay({ ...display, itemsPerView: Math.max(1, Number(value) || 1) })
          }
        />
      </FormField>
      {addon.props.dataSource === 'manual' ? (
        <View className="gap-2">
          {addon.props.manualSlides.map((slide, index) => (
            <View key={slide.id} className="flex-row items-center gap-2">
              <TextField
                className="flex-1"
                value={t('sliderSlideN', { index: index + 1 })}
                editable={false}
              />
              <Button
                size="sm"
                variant="outline"
                onPress={() =>
                  onChange({
                    ...addon,
                    props: {
                      ...addon.props,
                      manualSlides: addon.props.manualSlides.filter((item) => item.id !== slide.id),
                    },
                  })
                }
              >
                {t('removeSlide')}
              </Button>
            </View>
          ))}
          <Button
            variant="outline"
            onPress={() =>
              onChange({
                ...addon,
                props: {
                  ...addon.props,
                  manualSlides: [...addon.props.manualSlides, { id: nanoid(10), data: {} }],
                },
              })
            }
          >
            {t('addSlide')}
          </Button>
        </View>
      ) : null}
    </>
  )
}
