import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Menu, Plus, Save, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  ConfirmDialog,
  FeatureScreen,
  HeaderIconButton,
  SegmentedSwitch,
  SegmentedSwitchItem,
  Spinner,
  Body,
  useThemedControlIconColor,
  useThemeColors,
  useToast,
} from '@webonone/mobile-ui'
import { AddAddonDialog } from '@/features/design/website/components/AddAddonDialog'
import { AddonSettingsDialog } from '@/features/design/website/components/AddonSettingsDialog'
import { BlockSettingsDialog } from '@/features/design/website/components/BlockSettingsDialog'
import { ContainerSettingsDialog } from '@/features/design/website/components/ContainerSettingsDialog'
import { WebsiteDesignerShellTree } from '@/features/design/website/components/WebsiteDesignerShellTree'
import { WebsitePresetDialog } from '@/features/design/website/components/WebsitePresetDialog'
import { WebsiteDesignerCanvas } from '@/features/design/website/canvas/WebsiteDesignerCanvas'
import {
  addAddon,
  addAddonToSliderTemplate,
  addBlock,
  addBlockToSliderTemplate,
  addBlocksFromPreset,
  addBlocksFromPresetToSliderTemplate,
  documentFromBlock,
  snapshotDocument,
} from '@/features/design/website/document/mutate'
import { findBlock, updateAddon, updateBlockById } from '@/features/design/website/document/blockTree'
import {
  findBlockInTree,
  findSliderHostContext,
  resolveTemplateAddon,
  updateTemplateAddon,
  updateTemplateBlock,
} from '@/features/design/website/document/slider'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { websiteHubPath } from '@/features/design/utils/designPaths'
import {
  emptyWebsiteDocument,
  WEBSITE_BREAKPOINTS,
  type DesignerMode,
  type DesignerSelection,
  type WebsiteBreakpoint,
  type WebsiteDataset,
  type WebsiteDesignerKind,
  type WebsiteDocumentV1,
  type WebsitePage,
  type WebsitePreset,
  type WebsiteTheme,
} from '@/features/design/website/types'
import { websiteAdminApi } from '@/shared/services/websiteAdminApi'

const KIND_SECTION: Record<WebsiteDesignerKind, 'pages' | 'headers' | 'footers' | 'presets'> = {
  pages: 'pages',
  headers: 'headers',
  footers: 'footers',
  presets: 'presets',
}

export function WebsiteDesignerScreen({
  kind,
  id,
}: {
  kind: WebsiteDesignerKind
  id: string
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const colors = useThemeColors()
  const iconColor = useThemedControlIconColor()
  const { canManage, hasCompany } = useDesignPermissions()

  const [name, setName] = useState('')
  const [document, setDocument] = useState<WebsiteDocumentV1>(emptyWebsiteDocument())
  const [saved, setSaved] = useState(() => JSON.stringify(emptyWebsiteDocument()))
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [headerDocument, setHeaderDocument] = useState<WebsiteDocumentV1 | null>(null)
  const [footerDocument, setFooterDocument] = useState<WebsiteDocumentV1 | null>(null)
  const [pages, setPages] = useState<WebsitePage[]>([])
  const [presets, setPresets] = useState<WebsitePreset[]>([])
  const [datasets, setDatasets] = useState<WebsiteDataset[]>([])
  const [mode, setMode] = useState<DesignerMode>('edit')
  const [breakpoint, setBreakpoint] = useState<WebsiteBreakpoint>('sm')
  const [selection, setSelection] = useState<DesignerSelection>({ kind: 'container' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [containerOpen, setContainerOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [addonOpen, setAddonOpen] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)
  const [presetBlockId, setPresetBlockId] = useState<string | null>(null)
  const [presetSaving, setPresetSaving] = useState(false)
  const [presetError, setPresetError] = useState<string | null>(null)

  const dirty = JSON.stringify(document) !== saved
  const selectedBlock = resolveSelectedBlock(document, selection)
  const selectedAddon = resolveSelectedAddon(document, selection)
  const canAddAddon =
    selection.kind === 'block' ||
    selection.kind === 'templateBlock' ||
    (selection.kind === 'addon' && selectedAddon?.type === 'slider')

  useEffect(() => {
    if (!id || !hasCompany) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const [loaded, pageList, presetList, datasetList, themeList] = await Promise.all([
          loadDocument(kind, id),
          websiteAdminApi.listPages({ page: 1, pageSize: 100 }),
          websiteAdminApi.listPresets({ page: 1, pageSize: 100 }),
          websiteAdminApi.listDatasets({ page: 1, pageSize: 100 }),
          websiteAdminApi.listThemes({ page: 1, pageSize: 48 }),
        ])
        if (cancelled) return
        setName(loaded.name)
        setDocument(loaded.document)
        setSaved(JSON.stringify(loaded.document))
        setPages(pageList.items)
        setPresets(presetList.items)
        setDatasets(datasetList.items)
        setTheme(loaded.theme ?? themeList.items.find((item) => item.isDefault) ?? themeList.items[0] ?? null)
        setHeaderDocument(loaded.headerDocument)
        setFooterDocument(loaded.footerDocument)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('saveFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hasCompany, id, kind, t])

  function goToList() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(websiteHubPath(KIND_SECTION[kind]))
  }

  function requestLeave() {
    if (dirty) {
      setLeaveOpen(true)
      return
    }
    goToList()
  }

  function handleAddBlock() {
    if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
      setDocument((prev) =>
        addBlockToSliderTemplate(prev, selection.hostBlockId, selection.sliderAddonId, selection.templateBlockId),
      )
      return
    }
    if (selection.kind === 'addon' && selectedAddon?.type === 'slider') {
      setDocument((prev) => addBlockToSliderTemplate(prev, selection.blockId, selection.addonId))
      return
    }
    const parentId = selection.kind === 'block' ? selection.blockId : null
    setDocument((prev) => addBlock(prev, parentId))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const next = snapshotDocument(document, theme)
      await persistDocument(kind, id, next)
      setDocument(next)
      setSaved(JSON.stringify(next))
      toast({ title: t('saved') })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('saveFailed')
      setError(message)
      toast({ title: t('saveFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAsPreset(presetName: string) {
    if (!presetBlockId) return
    const block = findBlock(document, presetBlockId)
    if (!block) return
    setPresetSaving(true)
    setPresetError(null)
    try {
      const created = await websiteAdminApi.createPreset({
        name: presetName,
        document: documentFromBlock(block),
      })
      setPresets((prev) => [created, ...prev])
      setPresetOpen(false)
      setPresetBlockId(null)
      toast({ title: t('saved') })
    } catch (err) {
      setPresetError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setPresetSaving(false)
    }
  }

  if (!hasCompany) {
    return (
      <FeatureScreen title={t('designer')} onBack={goToList} backLabel={tc('back')}>
        <Alert>
          <AlertDescription>{t('needCompany')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (loading) {
    return (
      <FeatureScreen title={name || t('designer')} onBack={goToList} backLabel={tc('back')}>
        <Spinner label={t('loading')} />
      </FeatureScreen>
    )
  }

  const interactive = mode === 'edit'

  return (
    <FeatureScreen
      title={name || t('designer')}
      onBack={requestLeave}
      backLabel={tc('back')}
      scroll={false}
    >
      <View className="min-h-0 flex-1 gap-3">
        <View className="flex-row items-center gap-2">
          {interactive ? (
            <HeaderIconButton
              label={treeOpen ? t('closeContentTree') : t('openContentTree')}
              variant="ghost"
              onPress={() => setTreeOpen((open) => !open)}
            >
              {treeOpen ? (
                <X size={20} color={iconColor} strokeWidth={2} />
              ) : (
                <Menu size={20} color={iconColor} strokeWidth={2} />
              )}
            </HeaderIconButton>
          ) : null}
          <View className="min-w-0 flex-1">
            <SegmentedSwitch
              value={mode}
              onValueChange={(value) => setMode(value as DesignerMode)}
            >
              <SegmentedSwitchItem value="visual">{t('visual')}</SegmentedSwitchItem>
              <SegmentedSwitchItem value="edit">{t('edit')}</SegmentedSwitchItem>
            </SegmentedSwitch>
          </View>
          {canManage ? (
            <Button size="sm" onPress={() => void handleSave()} disabled={saving || !dirty}>
              <Save size={16} color={colors.primaryText} strokeWidth={2} />
              <Body className="text-base font-medium text-primary-foreground">
                {saving ? t('saving') : t('save')}
              </Body>
            </Button>
          ) : null}
        </View>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-2">
          {interactive && canManage ? (
            <Button size="sm" variant="outline" onPress={handleAddBlock}>
              <Plus size={16} color={iconColor} strokeWidth={2} />
              <Body>{t('addBlock')}</Body>
            </Button>
          ) : null}
          {interactive && canManage && canAddAddon ? (
            <Button size="sm" variant="outline" onPress={() => setAddOpen(true)}>
              <Plus size={16} color={iconColor} strokeWidth={2} />
              <Body>{t('addAddon')}</Body>
            </Button>
          ) : null}
          <View className="min-w-[220px] flex-1">
            <SegmentedSwitch
              value={breakpoint}
              onValueChange={(value) => setBreakpoint(value as WebsiteBreakpoint)}
            >
              {WEBSITE_BREAKPOINTS.map((item) => (
                <SegmentedSwitchItem key={item} value={item}>
                  {item}
                </SegmentedSwitchItem>
              ))}
            </SegmentedSwitch>
          </View>
        </View>

        <WebsiteDesignerCanvas
          document={document}
          breakpoint={breakpoint}
          theme={theme}
          selection={selection}
          kind={kind}
          mode={mode}
          headerDocument={headerDocument}
          footerDocument={footerDocument}
          onSelect={setSelection}
          onDocumentChange={setDocument}
        />
      </View>

      <WebsiteDesignerShellTree
        open={treeOpen}
        onClose={() => setTreeOpen(false)}
        document={document}
        selection={selection}
        canManage={canManage}
        kind={kind}
        onSelect={setSelection}
        onDocumentChange={setDocument}
        onSelectionChange={setSelection}
        onOpenContainerSettings={() => setContainerOpen(true)}
        onOpenBlockSettings={() => setBlockOpen(true)}
        onOpenAddonSettings={() => setAddonOpen(true)}
        onSaveAsPreset={(blockId) => {
          setPresetBlockId(blockId)
          setPresetError(null)
          setPresetOpen(true)
        }}
      />

      <AddAddonDialog
        open={addOpen}
        kind={kind}
        presets={presets}
        onOpenChange={setAddOpen}
        onAddAddon={(type) => {
          if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
            setDocument((prev) =>
              addAddonToSliderTemplate(
                prev,
                selection.hostBlockId,
                selection.sliderAddonId,
                type,
                selection.templateBlockId,
              ),
            )
            return
          }
          if (selection.kind === 'addon' && selectedAddon?.type === 'slider') {
            setDocument((prev) => addAddonToSliderTemplate(prev, selection.blockId, selection.addonId, type))
            return
          }
          if (selection.kind !== 'block') return
          setDocument((prev) => addAddon(prev, selection.blockId, type))
        }}
        onAddPreset={(preset) => {
          if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
            setDocument((prev) =>
              addBlocksFromPresetToSliderTemplate(
                prev,
                selection.hostBlockId,
                selection.sliderAddonId,
                preset.document,
                selection.templateBlockId,
                preset.name,
              ),
            )
            return
          }
          if (selection.kind === 'addon' && selectedAddon?.type === 'slider') {
            setDocument((prev) =>
              addBlocksFromPresetToSliderTemplate(
                prev,
                selection.blockId,
                selection.addonId,
                preset.document,
                null,
                preset.name,
              ),
            )
            return
          }
          const parentId = selection.kind === 'block' ? selection.blockId : null
          setDocument((prev) => addBlocksFromPreset(prev, parentId, preset.document, kind, preset.name))
        }}
      />
      <ContainerSettingsDialog
        open={containerOpen}
        document={document}
        onOpenChange={setContainerOpen}
        onChange={setDocument}
      />
      <BlockSettingsDialog
        open={blockOpen}
        block={selectedBlock}
        datasets={datasets}
        onOpenChange={setBlockOpen}
        onChange={(block) => {
          if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
            setDocument((prev) =>
              updateTemplateBlock(
                prev,
                selection.hostBlockId,
                selection.sliderAddonId,
                block.id,
                () => block,
              ),
            )
            return
          }
          setDocument((prev) => updateBlockById(prev, block.id, () => block))
        }}
      />
      <AddonSettingsDialog
        open={addonOpen}
        addon={selectedAddon}
        breakpoint={breakpoint}
        theme={theme}
        pages={pages}
        datasets={datasets}
        onOpenChange={setAddonOpen}
        onChange={(addon) => {
          if (selection.kind === 'templateAddon') {
            setDocument((prev) =>
              updateTemplateAddon(
                prev,
                selection.hostBlockId,
                selection.sliderAddonId,
                selection.templateBlockId,
                addon,
              ),
            )
            return
          }
          if (selection.kind !== 'addon') return
          setDocument((prev) => updateAddon(prev, selection.blockId, addon))
        }}
      />
      <WebsitePresetDialog
        open={presetOpen}
        isSaving={presetSaving}
        error={presetError}
        saveAs
        onOpenChange={(open) => {
          setPresetOpen(open)
          if (!open) setPresetBlockId(null)
        }}
        onSubmit={(presetName) => {
          void handleSaveAsPreset(presetName)
        }}
      />
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title={t('unsavedTitle')}
        description={t('unsavedDescription')}
        confirmLabel={t('leave')}
        cancelLabel={t('stay')}
        onConfirm={() => {
          setLeaveOpen(false)
          goToList()
        }}
      />
    </FeatureScreen>
  )
}

function resolveSelectedBlock(document: WebsiteDocumentV1, selection: DesignerSelection) {
  if (selection.kind === 'block' || selection.kind === 'addon') {
    return findBlock(document, selection.blockId)
  }
  if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
    const ctx = findSliderHostContext(document, selection.hostBlockId, selection.sliderAddonId)
    return ctx ? findBlockInTree(ctx.slideTemplate, selection.templateBlockId) : null
  }
  return null
}

function resolveSelectedAddon(document: WebsiteDocumentV1, selection: DesignerSelection) {
  if (selection.kind === 'addon') {
    return findBlock(document, selection.blockId)?.addons.find((addon) => addon.id === selection.addonId) ?? null
  }
  if (selection.kind === 'templateAddon') {
    return resolveTemplateAddon(
      document,
      selection.hostBlockId,
      selection.sliderAddonId,
      selection.templateBlockId,
      selection.templateAddonId,
    )
  }
  return null
}

async function loadDocument(kind: WebsiteDesignerKind, id: string): Promise<{
  name: string
  document: WebsiteDocumentV1
  theme: WebsiteTheme | null
  headerDocument: WebsiteDocumentV1 | null
  footerDocument: WebsiteDocumentV1 | null
}> {
  if (kind === 'pages') {
    const page = await websiteAdminApi.getPage(id)
    let theme: WebsiteTheme | null = null
    let headerDocument: WebsiteDocumentV1 | null = null
    let footerDocument: WebsiteDocumentV1 | null = null
    if (page.layoutId) {
      const layout = await websiteAdminApi.getLayout(page.layoutId)
      if (layout.themeId) theme = await websiteAdminApi.getTheme(layout.themeId)
      if (layout.headerId) {
        const header = await websiteAdminApi.getChrome('headers', layout.headerId)
        headerDocument = header.document
      }
      if (layout.footerId) {
        const footer = await websiteAdminApi.getChrome('footers', layout.footerId)
        footerDocument = footer.document
      }
    }
    return { name: page.name, document: page.document, theme, headerDocument, footerDocument }
  }
  if (kind === 'presets') {
    const preset = await websiteAdminApi.getPreset(id)
    return { name: preset.name, document: preset.document, theme: null, headerDocument: null, footerDocument: null }
  }
  const chrome = await websiteAdminApi.getChrome(kind, id)
  return { name: chrome.name, document: chrome.document, theme: null, headerDocument: null, footerDocument: null }
}

async function persistDocument(kind: WebsiteDesignerKind, id: string, document: WebsiteDocumentV1) {
  if (kind === 'pages') {
    await websiteAdminApi.updatePage(id, { document })
    return
  }
  if (kind === 'presets') {
    await websiteAdminApi.updatePreset(id, { document })
    return
  }
  await websiteAdminApi.updateChrome(kind, id, { document })
}
