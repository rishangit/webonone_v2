import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  cn,
  SegmentedSwitch,
  SegmentedSwitchItem,
  useToast,
} from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin, sendPlatformNavigate } from '@webonone/platform-embed'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { openWebsiteDesigner } from '@/features/shell/utils/navigateDesign'
import { websiteFootersActions, websiteHeadersActions, websiteLayoutsActions, websitePagesActions, websitePresetsActions, websiteThemesActions } from '../store'
import { websiteApi } from '../api'
import { ContentTree } from '../components/ContentTree'
import { DesignerCanvas } from '../components/DesignerCanvas'
import { ContentContainerSettingsDialog } from '../components/ContentContainerSettingsDialog'
import { ContentBlockSettingsDialog } from '../components/ContentBlockSettingsDialog'
import { AddonSettingsDialog } from '../components/AddonSettingsDialog'
import { WebsitePresetDialog } from '../components/WebsiteEntityDialogs'
import { websiteLiveUrl } from '../components/WebsiteHubTabs'
import { useWebsiteLiveOrigin } from '../hooks/useWebsiteLiveOrigin'
import { minContainerHeightForDesignerKind } from '../document/layout'
import { slugifyGroupName } from '../document/blockTree'
import { collectBoundDatasetIds } from '../document/dataBinding'
import {
  changeTemplateAddonLayer,
  changeTemplateBlockLayer,
  deleteTemplateAddon,
  deleteTemplateBlock,
  duplicateTemplateBlock,
  findBlockInTree,
  findEnclosingSliderItemsPath,
  findSliderHostContext,
  normalizeSliderSlideShells,
  resolveTemplateAddon,
  updateTemplateAddon,
  updateTemplateBlock,
} from '../document/slider'
import {
  addAddon,
  addAddonToSliderTemplate,
  addBlock,
  addBlockToSliderTemplate,
  addBlocksFromPreset,
  addBlocksFromPresetToSliderTemplate,
  changeLayer,
  collectGoogleFontUrls,
  deleteAddon,
  deleteBlock,
  documentFromBlock,
  duplicateAddon,
  duplicateBlock,
  findBlock,
  reorderAddons,
  reorderBlocks,
  snapshotDocument,
  updateAddon,
  updateBlockById,
} from '../document/mutate'
import { emptyWebsiteDocument, MAX_SLIDER_DATA_ITEMS, WEBSITE_BREAKPOINTS, WEBSITE_CANVAS_WIDTH } from '../types'
import type {
  DesignerMode,
  DesignerSelection,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDesignerKind,
  WebsiteDocumentV1,
  WebsitePreset,
} from '../types'

export function WebsiteDesignerPage({ kind }: { kind: WebsiteDesignerKind }) {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const embedParentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const liveOrigin = useWebsiteLiveOrigin(Boolean(accessToken && user?.companyId))
  const pagesState = useAppSelector((s) => s.websitePages)
  const headersState = useAppSelector((s) => s.websiteHeaders)
  const footersState = useAppSelector((s) => s.websiteFooters)
  const layoutsState = useAppSelector((s) => s.websiteLayouts)
  const themesState = useAppSelector((s) => s.websiteThemes)
  const presetsState = useAppSelector((s) => s.websitePresets)
  const datasetsState = useAppSelector((s) => s.websiteDatasets)
  const feature =
    kind === 'pages'
      ? pagesState
      : kind === 'headers'
        ? headersState
        : kind === 'footers'
          ? footersState
          : presetsState
  const [document, setDocument] = useState<WebsiteDocumentV1>(emptyWebsiteDocument())
  const [saved, setSaved] = useState(() => JSON.stringify(emptyWebsiteDocument()))
  const [mode, setMode] = useState<DesignerMode>('edit')
  const [breakpoint, setBreakpoint] = useState<WebsiteBreakpoint>('2xl')
  const [selection, setSelection] = useState<DesignerSelection>({ kind: 'container' })
  const dirty = JSON.stringify(document) !== saved
  const [containerSettingsOpen, setContainerSettingsOpen] = useState(false)
  const [blockSettings, setBlockSettings] = useState<{
    blockId: string
    /** When editing a content element inside a slider preset snapshot. */
    hostBlockId?: string
    sliderAddonId?: string
  } | null>(null)
  const [addonSettings, setAddonSettings] = useState<{
    blockId: string
    addonId: string
    /** When editing an addon inside a slider slide template. */
    sliderAddonId?: string
    templateBlockId?: string
  } | null>(null)
  const [saveAsPresetBlockId, setSaveAsPresetBlockId] = useState<string | null>(null)
  const [awaitingSaveAs, setAwaitingSaveAs] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [datasetItemsById, setDatasetItemsById] = useState<Record<string, Record<string, unknown>[]>>({})

  const defaultTheme = themesState.items.find((item) => item.isDefault) ?? themesState.items[0] ?? themesState.detail
  const name =
    kind === 'pages'
      ? pagesState.detail?.name
      : kind === 'headers'
        ? headersState.detail?.name
        : kind === 'footers'
          ? footersState.detail?.name
          : presetsState.detail?.name
  const defaultHeader = kind === 'pages' ? headersState.items.find((item) => item.isDefault) ?? null : null
  const defaultFooter = kind === 'pages' ? footersState.items.find((item) => item.isDefault) ?? null : null
  const pageLayout =
    kind === 'pages'
      ? pagesState.detail?.layoutId
        ? layoutsState.items.find((item) => item.id === pagesState.detail?.layoutId) ??
          (layoutsState.detail?.id === pagesState.detail.layoutId ? layoutsState.detail : null)
        : layoutsState.items.find((item) => item.isDefault) ?? layoutsState.items[0] ?? null
      : null
  const headerFromLayout = pageLayout?.headerId
    ? headersState.items.find((item) => item.id === pageLayout.headerId) ??
      (headersState.detail?.id === pageLayout.headerId ? headersState.detail : null)
    : null
  const footerFromLayout = pageLayout?.footerId
    ? footersState.items.find((item) => item.id === pageLayout.footerId) ??
      (footersState.detail?.id === pageLayout.footerId ? footersState.detail : null)
    : null
  const previewHeader = kind === 'pages' ? (pageLayout ? headerFromLayout : defaultHeader) : null
  const previewFooter = kind === 'pages' ? (pageLayout ? footerFromLayout : defaultFooter) : null
  const headerPreviewLayout =
    kind === 'headers'
      ? layoutsState.items.find((item) => item.headerId === id && item.isDefault) ??
        layoutsState.items.find((item) => item.headerId === id) ??
        layoutsState.items.find((item) => item.isDefault) ??
        layoutsState.items[0] ??
        null
      : null
  const footerPreviewLayout =
    kind === 'footers'
      ? layoutsState.items.find((item) => item.footerId === id && item.isDefault) ??
        layoutsState.items.find((item) => item.footerId === id) ??
        layoutsState.items.find((item) => item.isDefault) ??
        layoutsState.items[0] ??
        null
      : null
  const previewLayout =
    kind === 'pages' ? pageLayout : kind === 'headers' ? headerPreviewLayout : kind === 'footers' ? footerPreviewLayout : null
  const themeFromLayout = previewLayout?.themeId
    ? themesState.items.find((item) => item.id === previewLayout.themeId) ??
      (themesState.detail?.id === previewLayout.themeId ? themesState.detail : null)
    : null
  const theme = themeFromLayout ?? defaultTheme
  usePlatformLoading(feature.detailStatus === 'loading' && !feature.detail ? t('loadingDesigner') : null)

  useLayoutEffect(() => {
    if (!embedParentOrigin || !id) return
    openWebsiteDesigner(kind, id)
    const listPath = `/website/${kind}`
    sendPlatformNavigate(embedParentOrigin, `/design${listPath}`, { clientNavigated: true })
    navigate({ pathname: listPath, search: searchParams.toString() }, { replace: true })
  }, [embedParentOrigin, id, kind, navigate, searchParams])

  useEffect(() => {
    if (!id || !accessToken) return
    if (kind === 'pages') dispatch(websitePagesActions.fetchDetailRequested({ id, force: true }))
    if (kind === 'headers') dispatch(websiteHeadersActions.fetchDetailRequested({ id, force: true }))
    if (kind === 'footers') dispatch(websiteFootersActions.fetchDetailRequested({ id, force: true }))
    if (kind === 'presets') dispatch(websitePresetsActions.fetchDetailRequested({ id, force: true }))
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websitePagesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteLayoutsActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websitePresetsActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    if (kind === 'pages') {
      dispatch(websiteHeadersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
      dispatch(websiteFootersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    }
    if (kind === 'headers') {
      dispatch(websiteHeadersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    }
  }, [accessToken, dispatch, id, kind])

  useEffect(() => {
    if (!accessToken || kind !== 'pages') return
    const layoutId = pagesState.detail?.layoutId
    if (layoutId) dispatch(websiteLayoutsActions.fetchDetailRequested({ id: layoutId, force: true }))
  }, [accessToken, dispatch, kind, pagesState.detail?.layoutId])

  useEffect(() => {
    if (!accessToken || kind !== 'pages' || !pageLayout) return
    if (pageLayout.headerId) {
      dispatch(websiteHeadersActions.fetchDetailRequested({ id: pageLayout.headerId, force: true }))
    }
    if (pageLayout.footerId) {
      dispatch(websiteFootersActions.fetchDetailRequested({ id: pageLayout.footerId, force: true }))
    }
  }, [accessToken, dispatch, kind, pageLayout?.footerId, pageLayout?.headerId])

  useEffect(() => {
    if (!accessToken || !previewLayout?.themeId) return
    dispatch(websiteThemesActions.fetchDetailRequested({ id: previewLayout.themeId, force: true }))
  }, [accessToken, dispatch, previewLayout?.themeId])

  useEffect(() => {
    const detail = feature.detail
    if (!detail || detail.id !== id) return
    const raw = 'document' in detail ? detail.document : emptyWebsiteDocument()
    const next = normalizeSliderSlideShells(raw)
    setDocument(next)
    setSaved(JSON.stringify(next))
  }, [feature.detail, id])

  useEffect(() => {
    if (!dirty) return
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    if (!awaitingSaveAs) return
    if (presetsState.detailStatus === 'idle' && presetsState.detail) {
      setAwaitingSaveAs(false)
      setSaveAsPresetBlockId(null)
      toast({ title: t('presetSaved') })
    }
    if (presetsState.detailStatus === 'error') setAwaitingSaveAs(false)
  }, [awaitingSaveAs, presetsState.detail, presetsState.detailStatus, t, toast])

  const fontUrls = useMemo(() => {
    const urls = new Set(collectGoogleFontUrls(theme ?? null, document))
    for (const extra of [previewHeader?.document, previewFooter?.document]) {
      if (!extra) continue
      for (const url of collectGoogleFontUrls(null, extra)) urls.add(url)
    }
    return [...urls]
  }, [theme, document, previewHeader, previewFooter])

  useEffect(() => {
    if (mode !== 'visual' && mode !== 'edit') {
      setDatasetItemsById({})
      return
    }
    if (!accessToken) {
      setDatasetItemsById({})
      return
    }
    let cancelled = false
    const ids = new Set<string>([
      ...collectBoundDatasetIds(document),
      ...collectBoundDatasetIds(previewHeader?.document ?? emptyWebsiteDocument()),
      ...collectBoundDatasetIds(previewFooter?.document ?? emptyWebsiteDocument()),
    ])
    if (ids.size === 0) {
      setDatasetItemsById({})
      return
    }
    Promise.all(
      [...ids].map(async (datasetId) => {
        try {
          const result = await websiteApi.previewDataset(datasetId, {
            page: 1,
            pageSize: MAX_SLIDER_DATA_ITEMS,
          })
          return [datasetId, result.items] as const
        } catch {
          return [datasetId, [] as Record<string, unknown>[]] as const
        }
      }),
    ).then((entries) => {
      if (!cancelled) setDatasetItemsById(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [accessToken, document, mode, previewFooter?.document, previewHeader?.document])

  useEffect(() => {
    const previous = window.document.title
    window.document.title = name ? `${name} · ${t('designer')}` : t('designer')
    return () => {
      window.document.title = previous
    }
  }, [name, t])

  useEffect(() => {
    if (mode !== 'edit') setTreeOpen(false)
  }, [mode])

  useEffect(() => {
    if (!treeOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setTreeOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [treeOpen])

  if (embedParentOrigin) return null
  if (!accessToken) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/website/pages" replace />

  function save() {
    if (!id) return
    const next = snapshotDocument(document, theme ?? null)
    const body = { document: next }
    if (kind === 'pages') dispatch(websitePagesActions.saveDetailRequested({ id, body }))
    if (kind === 'headers') dispatch(websiteHeadersActions.saveDetailRequested({ id, body }))
    if (kind === 'footers') dispatch(websiteFootersActions.saveDetailRequested({ id, body }))
    if (kind === 'presets') dispatch(websitePresetsActions.saveDetailRequested({ id, body }))
    setDocument(next)
    setSaved(JSON.stringify(next))
    toast({ title: t('saved') })
  }

  function handleAddBlock() {
    const sliderTarget = resolveSliderChildTarget()
    if (sliderTarget) {
      setDocument(
        addBlockToSliderTemplate(
          document,
          sliderTarget.hostBlockId,
          sliderTarget.sliderAddonId,
          sliderTarget.templateBlockId,
        ),
      )
      return
    }
    const parentId = selection.kind === 'block' ? selection.blockId : null
    const next = addBlock(document, parentId)
    let newId: string | undefined
    if (parentId) {
      const parent = findBlock(next, parentId)
      newId = parent?.children.at(-1)?.id
    } else {
      newId = next.blocks.at(-1)?.id
    }
    setDocument(next)
    if (newId) setSelection({ kind: 'block', blockId: newId })
  }

  function resolveSliderChildTarget(): {
    hostBlockId: string
    sliderAddonId: string
    templateBlockId: string | null
  } | null {
    if (selection.kind === 'templateBlock' || selection.kind === 'templateAddon') {
      return {
        hostBlockId: selection.hostBlockId,
        sliderAddonId: selection.sliderAddonId,
        templateBlockId: selection.templateBlockId,
      }
    }
    if (selection.kind === 'addon') {
      const host = findBlock(document, selection.blockId)
      const addon = host?.addons.find((item) => item.id === selection.addonId)
      if (addon?.type === 'slider') {
        return {
          hostBlockId: selection.blockId,
          sliderAddonId: selection.addonId,
          templateBlockId: addon.props.slideTemplate?.id ?? null,
        }
      }
    }
    return null
  }

  function selectedBlockIdForAddon(): string | null {
    if (selection.kind === 'block' || selection.kind === 'addon') return selection.blockId
    return document.blocks.at(-1)?.id ?? null
  }

  function handleAddAddon(type: WebsiteAddon['type']) {
    const sliderTarget = resolveSliderChildTarget()
    if (sliderTarget) {
      const next = addAddonToSliderTemplate(
        document,
        sliderTarget.hostBlockId,
        sliderTarget.sliderAddonId,
        type,
        sliderTarget.templateBlockId,
      )
      setDocument(next)
      const ctx = findSliderHostContext(next, sliderTarget.hostBlockId, sliderTarget.sliderAddonId)
      if (ctx) {
        const targetingShell =
          !sliderTarget.templateBlockId || sliderTarget.templateBlockId === ctx.slideTemplate.id
        if (targetingShell) {
          const created = ctx.slideTemplate.children?.at(-1)
          if (created) {
            setSelection({
              kind: 'templateBlock',
              hostBlockId: sliderTarget.hostBlockId,
              sliderAddonId: sliderTarget.sliderAddonId,
              templateBlockId: created.id,
            })
          }
        }
      }
      return
    }
    const blockId = selectedBlockIdForAddon()
    if (!blockId) {
      const withBlock = addBlock(document)
      const newId = withBlock.blocks.at(-1)?.id
      if (newId) {
        setDocument(addAddon(withBlock, newId, type))
        setSelection({ kind: 'block', blockId: newId })
      }
      return
    }
    setDocument(addAddon(document, blockId, type))
  }

  function handleAddPreset(preset: WebsitePreset) {
    const sliderTarget = resolveSliderChildTarget()
    if (sliderTarget) {
      const next = addBlocksFromPresetToSliderTemplate(
        document,
        sliderTarget.hostBlockId,
        sliderTarget.sliderAddonId,
        preset.document,
        sliderTarget.templateBlockId,
        preset.name,
      )
      setDocument(next)
      const ctx = findSliderHostContext(next, sliderTarget.hostBlockId, sliderTarget.sliderAddonId)
      const parentId =
        sliderTarget.templateBlockId &&
        ctx &&
        sliderTarget.templateBlockId !== ctx.slideTemplate.id &&
        findBlockInTree(ctx.slideTemplate, sliderTarget.templateBlockId)
          ? sliderTarget.templateBlockId
          : ctx?.slideTemplate.id
      const parent = parentId && ctx ? findBlockInTree(ctx.slideTemplate, parentId) : null
      const inserted = parent?.children?.at(-1)
      if (inserted && ctx) {
        setSelection({
          kind: 'templateBlock',
          hostBlockId: sliderTarget.hostBlockId,
          sliderAddonId: sliderTarget.sliderAddonId,
          templateBlockId: inserted.id,
        })
      }
      return
    }
    const parentId = selection.kind === 'block' ? selection.blockId : selection.kind === 'addon' ? selection.blockId : null
    if (parentId) {
      setDocument(addBlocksFromPreset(document, parentId, preset.document, kind, preset.name))
      return
    }
    const next = addBlocksFromPreset(document, null, preset.document, kind, preset.name)
    setDocument(next)
    const newId = next.blocks.at(-1)?.id
    if (newId) setSelection({ kind: 'block', blockId: newId })
  }

  function handleDeleteSelection() {
    if (selection.kind === 'block') setDocument(deleteBlock(document, selection.blockId))
    if (selection.kind === 'addon') setDocument(deleteAddon(document, selection.blockId, selection.addonId))
    if (selection.kind === 'templateBlock') {
      setDocument(
        deleteTemplateBlock(
          document,
          selection.hostBlockId,
          selection.sliderAddonId,
          selection.templateBlockId,
        ),
      )
    }
    if (selection.kind === 'templateAddon') {
      setDocument(
        deleteTemplateAddon(
          document,
          selection.hostBlockId,
          selection.sliderAddonId,
          selection.templateBlockId,
          selection.templateAddonId,
        ),
      )
    }
    setSelection({ kind: 'container' })
  }

  function handleLayer(direction: 'up' | 'down') {
    if (selection.kind === 'container') return
    if (selection.kind === 'templateAddon') {
      setDocument(
        changeTemplateAddonLayer(
          document,
          selection.hostBlockId,
          selection.sliderAddonId,
          selection.templateBlockId,
          selection.templateAddonId,
          direction,
        ),
      )
      return
    }
    if (selection.kind === 'templateBlock') {
      setDocument(
        changeTemplateBlockLayer(
          document,
          selection.hostBlockId,
          selection.sliderAddonId,
          selection.templateBlockId,
          direction,
        ),
      )
      return
    }
    setDocument(
      changeLayer(
        document,
        {
          blockId: selection.blockId,
          addonId: selection.kind === 'addon' ? selection.addonId : undefined,
        },
        direction,
      ),
    )
  }

  function handleDuplicateSelection() {
    if (selection.kind === 'block') {
      const result = duplicateBlock(document, selection.blockId)
      if (!result) return
      setDocument(result.document)
      setSelection({ kind: 'block', blockId: result.id })
      return
    }
    if (selection.kind === 'addon') {
      const result = duplicateAddon(document, selection.blockId, selection.addonId)
      if (!result) return
      setDocument(result.document)
      setSelection({ kind: 'addon', blockId: selection.blockId, addonId: result.id })
      return
    }
    if (selection.kind === 'templateBlock') {
      const result = duplicateTemplateBlock(
        document,
        selection.hostBlockId,
        selection.sliderAddonId,
        selection.templateBlockId,
      )
      if (!result) return
      setDocument(result.document)
      setSelection({
        kind: 'templateBlock',
        hostBlockId: selection.hostBlockId,
        sliderAddonId: selection.sliderAddonId,
        templateBlockId: result.id,
      })
    }
  }

  function handleDuplicateBlock(blockId: string) {
    const result = duplicateBlock(document, blockId)
    if (!result) return
    setDocument(result.document)
    setSelection({ kind: 'block', blockId: result.id })
  }

  function handleDuplicateAddon(blockId: string, addonId: string) {
    const result = duplicateAddon(document, blockId, addonId)
    if (!result) return
    setDocument(result.document)
    setSelection({ kind: 'addon', blockId, addonId: result.id })
  }

  function openSaveAsPreset(blockId: string) {
    if (kind === 'presets' || !canManage) return
    setSelection({ kind: 'block', blockId })
    setSaveAsPresetBlockId(blockId)
  }

  function handleSaveAsPreset(name: string) {
    if (!saveAsPresetBlockId) return
    const block = findBlock(document, saveAsPresetBlockId)
    if (!block) return
    setAwaitingSaveAs(true)
    const groupStamp = slugifyGroupName(name)
    const stamped =
      block.groupName?.trim() || !groupStamp ? block : { ...block, groupName: groupStamp }
    dispatch(
      websitePresetsActions.saveDetailRequested({
        body: { name, document: snapshotDocument(documentFromBlock(stamped), theme ?? null) },
      }),
    )
  }

  const settingsBlock = blockSettings
    ? blockSettings.sliderAddonId && blockSettings.hostBlockId
      ? (() => {
          const ctx = findSliderHostContext(document, blockSettings.hostBlockId, blockSettings.sliderAddonId)
          return ctx ? findBlockInTree(ctx.slideTemplate, blockSettings.blockId) : null
        })()
      : findBlock(document, blockSettings.blockId)
    : null

  const blockInheritedBinding = useMemo(() => {
    if (!blockSettings?.hostBlockId || !blockSettings.sliderAddonId) return null
    const ctx = findSliderHostContext(document, blockSettings.hostBlockId, blockSettings.sliderAddonId)
    if (!ctx || ctx.slider.props.dataSource !== 'dataset' || !ctx.slider.props.datasetId) return null
    const dataset =
      datasetsState.items.find((item) => item.id === ctx.slider.props.datasetId) ?? null
    return {
      datasetId: ctx.slider.props.datasetId,
      datasetName: dataset?.name ?? ctx.slider.props.datasetId,
      source: 'slider' as const,
      itemGroup: ctx.slider.props.itemGroup ?? null,
    }
  }, [blockSettings, document, datasetsState.items])

  function openBlockSettings(blockId?: string) {
    if (selection.kind === 'templateBlock') {
      setBlockSettings({
        blockId: selection.templateBlockId,
        hostBlockId: selection.hostBlockId,
        sliderAddonId: selection.sliderAddonId,
      })
      return
    }
    const id = blockId ?? (selection.kind === 'block' || selection.kind === 'addon' ? selection.blockId : null)
    if (!id) return
    setSelection({ kind: 'block', blockId: id })
    setBlockSettings({ blockId: id })
  }

  function openTemplateBlockSettings(hostBlockId: string, sliderAddonId: string, templateBlockId: string) {
    setSelection({
      kind: 'templateBlock',
      hostBlockId,
      sliderAddonId,
      templateBlockId,
    })
    setBlockSettings({
      blockId: templateBlockId,
      hostBlockId,
      sliderAddonId,
    })
  }

  function openAddonSettings(blockId?: string, addonId?: string) {
    if (selection.kind === 'templateAddon') {
      setAddonSettings({
        blockId: selection.hostBlockId,
        addonId: selection.templateAddonId,
        sliderAddonId: selection.sliderAddonId,
        templateBlockId: selection.templateBlockId,
      })
      return
    }
    const nextBlockId = blockId ?? (selection.kind === 'addon' ? selection.blockId : null)
    const nextAddonId = addonId ?? (selection.kind === 'addon' ? selection.addonId : null)
    if (!nextBlockId || !nextAddonId) return
    setSelection({ kind: 'addon', blockId: nextBlockId, addonId: nextAddonId })
    setAddonSettings({ blockId: nextBlockId, addonId: nextAddonId })
  }

  function openTemplateAddonSettings(
    hostBlockId: string,
    sliderAddonId: string,
    templateBlockId: string,
    templateAddonId: string,
  ) {
    setSelection({
      kind: 'templateAddon',
      hostBlockId,
      sliderAddonId,
      templateBlockId,
      templateAddonId,
    })
    setAddonSettings({
      blockId: hostBlockId,
      addonId: templateAddonId,
      sliderAddonId,
      templateBlockId,
    })
  }

  const settingsAddon = addonSettings
    ? addonSettings.sliderAddonId && addonSettings.templateBlockId
      ? resolveTemplateAddon(
          document,
          addonSettings.blockId,
          addonSettings.sliderAddonId,
          addonSettings.templateBlockId,
          addonSettings.addonId,
        )
      : findBlock(document, addonSettings.blockId)?.addons.find((item) => item.id === addonSettings.addonId) ?? null
    : null

  const settingsDatasetIdOverride =
    addonSettings?.sliderAddonId != null
      ? (() => {
          const slider = findBlock(document, addonSettings.blockId)?.addons.find(
            (item) => item.id === addonSettings.sliderAddonId,
          )
          return slider?.type === 'slider' && slider.props.dataSource === 'dataset'
            ? slider.props.datasetId
            : null
        })()
      : undefined

  const settingsFieldPathPrefix =
    addonSettings?.sliderAddonId && addonSettings.templateBlockId
      ? (() => {
          const ctx = findSliderHostContext(
            document,
            addonSettings.blockId,
            addonSettings.sliderAddonId,
          )
          if (!ctx) return null
          return findEnclosingSliderItemsPath(ctx.slideTemplate, addonSettings.templateBlockId)
        })()
      : null

  const minContainerHeight = minContainerHeightForDesignerKind(kind)

  function selectFromTree(next: DesignerSelection) {
    setSelection(next)
    setTreeOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      <header className="glass-card z-50 shrink-0 border-b">
        <div className="flex h-14 w-full items-center gap-2 px-2 sm:px-6">
          {mode === 'edit' ? (
            <button
              type="button"
              className="rounded-md p-2 text-foreground outline-none ring-offset-background hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label={treeOpen ? t('closeContentTree') : t('openContentTree')}
              aria-expanded={treeOpen}
              aria-controls="website-content-tree"
              onClick={() => setTreeOpen((open) => !open)}
            >
              {treeOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          ) : null}
          <h1 className="min-w-0 shrink truncate text-sm font-semibold text-foreground md:text-base">
            {name ?? t('designer')}
          </h1>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-themed">
            <div className="flex shrink-0 items-center gap-2">
              <SegmentedSwitch
                value={mode}
                onValueChange={(value) => setMode(value as DesignerMode)}
                size="sm"
                className="shrink-0"
                aria-label={t('designerMode')}
              >
                <SegmentedSwitchItem value="visual">{t('visual')}</SegmentedSwitchItem>
                <SegmentedSwitchItem value="edit">{t('edit')}</SegmentedSwitchItem>
              </SegmentedSwitch>
              {mode === 'edit' ? (
                <Button type="button" size="sm" variant="outline" onClick={handleAddBlock} disabled={!canManage}>
                  {t('addBlock')}
                </Button>
              ) : null}
              {kind === 'pages' && pagesState.detail ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      websiteLiveUrl(liveOrigin, pagesState.detail!.companyId, pagesState.detail!.path),
                      '_blank',
                      'noopener',
                    )
                  }
                >
                  {t('preview')}
                </Button>
              ) : null}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <SegmentedSwitch
                value={breakpoint}
                onValueChange={(value) => setBreakpoint(value as WebsiteBreakpoint)}
                size="sm"
                className="shrink-0"
                aria-label={t('breakpoint')}
              >
                {WEBSITE_BREAKPOINTS.map((item) => (
                  <SegmentedSwitchItem key={item} value={item} className="px-2.5 text-xs">
                    {item}
                  </SegmentedSwitchItem>
                ))}
              </SegmentedSwitch>
              {canManage ? (
                <Button type="button" size="sm" onClick={save} disabled={feature.detailStatus === 'saving'}>
                  {feature.detailStatus === 'saving' ? t('saving') : t('save')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1">
        {mode === 'edit' && treeOpen ? (
          <button
            type="button"
            className="fixed inset-0 top-14 z-30 bg-black/50 md:hidden"
            aria-label={t('closeContentTree')}
            onClick={() => setTreeOpen(false)}
          />
        ) : null}
        {mode === 'edit' ? (
          <aside
            id="website-content-tree"
            className={cn(
              'shell-glass z-40 flex w-64 shrink-0 flex-col border-r transition-transform duration-200',
              'fixed bottom-0 left-0 top-14 md:static md:z-auto md:h-auto md:translate-x-0',
              treeOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            )}
            aria-label={t('contentTree')}
          >
            <ContentTree
              document={document}
              selection={selection}
              canManage={canManage}
              onSelect={selectFromTree}
              onReorderAddon={(blockId, from, to) => setDocument(reorderAddons(document, blockId, from, to))}
              onReorderBlock={(parentBlockId, from, to) =>
                setDocument(reorderBlocks(document, from, to, parentBlockId))
              }
              onLayer={(target, direction) => setDocument(changeLayer(document, target, direction))}
              onDeleteBlock={(blockId) => {
                setDocument(deleteBlock(document, blockId))
                selectFromTree({ kind: 'container' })
              }}
              onDeleteAddon={(blockId, addonId) => {
                setDocument(deleteAddon(document, blockId, addonId))
                selectFromTree({ kind: 'container' })
              }}
              onDuplicateBlock={handleDuplicateBlock}
              onDuplicateAddon={handleDuplicateAddon}
              onOpenContainerSettings={() => {
                setContainerSettingsOpen(true)
                setTreeOpen(false)
              }}
              onOpenBlockSettings={(blockId) => {
                openBlockSettings(blockId)
                setTreeOpen(false)
              }}
              onOpenAddonSettings={(blockId, addonId) => {
                openAddonSettings(blockId, addonId)
                setTreeOpen(false)
              }}
              onOpenTemplateBlockSettings={(hostBlockId, sliderAddonId, templateBlockId) => {
                openTemplateBlockSettings(hostBlockId, sliderAddonId, templateBlockId)
                setTreeOpen(false)
              }}
              onOpenTemplateAddonSettings={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId) => {
                openTemplateAddonSettings(hostBlockId, sliderAddonId, templateBlockId, templateAddonId)
                setTreeOpen(false)
              }}
              onLayerTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId, direction) => {
                setDocument(
                  changeTemplateBlockLayer(
                    document,
                    hostBlockId,
                    sliderAddonId,
                    templateBlockId,
                    direction,
                  ),
                )
              }}
              onDeleteTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
                setDocument(deleteTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId))
                selectFromTree({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
              }}
              onDuplicateTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
                const result = duplicateTemplateBlock(
                  document,
                  hostBlockId,
                  sliderAddonId,
                  templateBlockId,
                )
                if (!result) return
                setDocument(result.document)
                selectFromTree({
                  kind: 'templateBlock',
                  hostBlockId,
                  sliderAddonId,
                  templateBlockId: result.id,
                })
              }}
              onLayerTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId, direction) => {
                setDocument(
                  changeTemplateAddonLayer(
                    document,
                    hostBlockId,
                    sliderAddonId,
                    templateBlockId,
                    templateAddonId,
                    direction,
                  ),
                )
              }}
              onDeleteTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId) => {
                setDocument(
                  deleteTemplateAddon(document, hostBlockId, sliderAddonId, templateBlockId, templateAddonId),
                )
                selectFromTree({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
              }}
              onSaveAsPreset={(blockId) => {
                openSaveAsPreset(blockId)
                setTreeOpen(false)
              }}
              saveAsPresetDisabled={kind === 'presets'}
            />
          </aside>
        ) : null}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto scrollbar-themed">
          {feature.detailError ? (
            <Alert variant="destructive" className="m-4">
              <AlertDescription>{feature.detailError}</AlertDescription>
            </Alert>
          ) : null}
          <DesignerCanvas
            document={document}
            headerDocument={mode === 'visual' ? previewHeader?.document ?? null : null}
            footerDocument={mode === 'visual' ? previewFooter?.document ?? null : null}
            breakpoint={breakpoint}
            canvasWidth={WEBSITE_CANVAS_WIDTH[breakpoint]}
            mode={mode}
            selection={selection}
            theme={theme ?? null}
            pages={pagesState.items}
            currentPageId={kind === 'pages' ? pagesState.detail?.id ?? null : null}
            designerKind={kind}
            canManage={canManage}
            datasetItemsById={datasetItemsById}
            onSelect={setSelection}
            onChangeDocument={setDocument}
            onResizeContainer={(height) =>
              setDocument({ ...document, container: { ...document.container, height } })
            }
            onAddAddon={handleAddAddon}
            onAddPreset={handleAddPreset}
            presets={presetsState.items}
            onLayer={handleLayer}
            onDeleteSelection={handleDeleteSelection}
            onDuplicateSelection={handleDuplicateSelection}
            onOpenBlockSettings={() => openBlockSettings()}
            onSaveAsPreset={() => {
              if (selection.kind === 'block' || selection.kind === 'addon') openSaveAsPreset(selection.blockId)
            }}
            saveAsPresetDisabled={kind === 'presets'}
            onOpenAddonSettings={() => openAddonSettings()}
            onOpenTemplateBlockSettings={openTemplateBlockSettings}
            onOpenTemplateAddonSettings={openTemplateAddonSettings}
            onLayerTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId, direction) => {
              setDocument(
                changeTemplateBlockLayer(document, hostBlockId, sliderAddonId, templateBlockId, direction),
              )
            }}
            onDeleteTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
              setDocument(deleteTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId))
              setSelection({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
            }}
            onDuplicateTemplateBlock={(hostBlockId, sliderAddonId, templateBlockId) => {
              const result = duplicateTemplateBlock(document, hostBlockId, sliderAddonId, templateBlockId)
              if (!result) return
              setDocument(result.document)
              setSelection({
                kind: 'templateBlock',
                hostBlockId,
                sliderAddonId,
                templateBlockId: result.id,
              })
            }}
            onLayerTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId, direction) => {
              setDocument(
                changeTemplateAddonLayer(
                  document,
                  hostBlockId,
                  sliderAddonId,
                  templateBlockId,
                  templateAddonId,
                  direction,
                ),
              )
            }}
            onDeleteTemplateAddon={(hostBlockId, sliderAddonId, templateBlockId, templateAddonId) => {
              setDocument(
                deleteTemplateAddon(document, hostBlockId, sliderAddonId, templateBlockId, templateAddonId),
              )
              setSelection({ kind: 'addon', blockId: hostBlockId, addonId: sliderAddonId })
            }}
          />
        </main>
      </div>
      <ContentContainerSettingsDialog
        open={containerSettingsOpen}
        container={document.container}
        minHeight={minContainerHeight}
        onOpenChange={setContainerSettingsOpen}
        onSave={(next) => setDocument({ ...document, container: next })}
      />
      <ContentBlockSettingsDialog
        open={blockSettings !== null}
        block={settingsBlock}
        inheritedBinding={blockInheritedBinding}
        onOpenChange={(open) => {
          if (!open) setBlockSettings(null)
        }}
        onSave={(blockId, patch) => {
          if (blockSettings?.hostBlockId && blockSettings.sliderAddonId) {
            setDocument(
              updateTemplateBlock(
                document,
                blockSettings.hostBlockId,
                blockSettings.sliderAddonId,
                blockId,
                (item) => ({
                  ...item,
                  backgroundColor: patch.backgroundColor,
                  borderColor: patch.borderColor,
                  borderRadius: patch.borderRadius,
                  boxShadow: patch.boxShadow,
                  padding: patch.padding,
                  margin: patch.margin,
                  groupName: patch.groupName,
                  dataBinding: patch.dataBinding,
                }),
              ),
            )
            return
          }
          setDocument(
            updateBlockById(document, blockId, (item) => ({
              ...item,
              backgroundColor: patch.backgroundColor,
              borderColor: patch.borderColor,
              borderRadius: patch.borderRadius,
              boxShadow: patch.boxShadow,
              padding: patch.padding,
              margin: patch.margin,
              groupName: patch.groupName,
              dataBinding: patch.dataBinding,
            })),
          )
        }}
      />
      <AddonSettingsDialog
        open={addonSettings !== null}
        addon={settingsAddon}
        blockId={addonSettings?.blockId ?? null}
        document={document}
        breakpoint={breakpoint}
        theme={theme ?? null}
        pages={pagesState.items}
        datasetIdOverride={settingsDatasetIdOverride}
        fieldPathPrefix={settingsFieldPathPrefix}
        onOpenChange={(open) => {
          if (!open) setAddonSettings(null)
        }}
        onSave={(next) => {
          if (!addonSettings) return
          if (addonSettings.sliderAddonId && addonSettings.templateBlockId) {
            setDocument(
              updateTemplateAddon(
                document,
                addonSettings.blockId,
                addonSettings.sliderAddonId,
                addonSettings.templateBlockId,
                next,
              ),
            )
            return
          }
          setDocument(updateAddon(document, addonSettings.blockId, next))
        }}
      />
      <WebsitePresetDialog
        open={saveAsPresetBlockId !== null}
        saveAs
        isSaving={presetsState.detailStatus === 'saving'}
        error={awaitingSaveAs ? presetsState.detailError : null}
        onOpenChange={(open) => {
          if (!open && !awaitingSaveAs) setSaveAsPresetBlockId(null)
        }}
        onSubmit={handleSaveAsPreset}
      />
    </div>
  )
}
