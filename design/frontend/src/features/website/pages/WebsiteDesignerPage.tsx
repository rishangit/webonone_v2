import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { websiteFootersActions, websiteHeadersActions, websitePagesActions, websiteThemesActions } from '../store'
import { ContentTree } from '../components/ContentTree'
import { DesignerCanvas } from '../components/DesignerCanvas'
import { ContentContainerSettingsDialog } from '../components/ContentContainerSettingsDialog'
import { ContentBlockSettingsDialog } from '../components/ContentBlockSettingsDialog'
import { AddonSettingsDialog } from '../components/AddonSettingsDialog'
import { websiteLiveUrl } from '../components/WebsiteHubTabs'
import {
  addAddon,
  addBlock,
  changeLayer,
  collectGoogleFontUrls,
  deleteAddon,
  deleteBlock,
  reorderAddons,
  reorderBlocks,
  snapshotDocument,
  updateAddon,
} from '../document/mutate'
import { emptyWebsiteDocument, WEBSITE_BREAKPOINTS, WEBSITE_CANVAS_WIDTH } from '../types'
import type {
  DesignerMode,
  DesignerSelection,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDesignerKind,
  WebsiteDocumentV1,
} from '../types'

export function WebsiteDesignerPage({ kind }: { kind: WebsiteDesignerKind }) {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const canManage = user?.role === 'super_admin' || user?.role === 'company_admin'
  const pagesState = useAppSelector((s) => s.websitePages)
  const headersState = useAppSelector((s) => s.websiteHeaders)
  const footersState = useAppSelector((s) => s.websiteFooters)
  const themesState = useAppSelector((s) => s.websiteThemes)
  const feature = kind === 'pages' ? pagesState : kind === 'headers' ? headersState : footersState
  const [document, setDocument] = useState<WebsiteDocumentV1>(emptyWebsiteDocument())
  const [saved, setSaved] = useState(() => JSON.stringify(emptyWebsiteDocument()))
  const [mode, setMode] = useState<DesignerMode>('edit')
  const [breakpoint, setBreakpoint] = useState<WebsiteBreakpoint>('2xl')
  const [selection, setSelection] = useState<DesignerSelection>({ kind: 'container' })
  const dirty = JSON.stringify(document) !== saved
  const [containerSettingsOpen, setContainerSettingsOpen] = useState(false)
  const [blockSettingsId, setBlockSettingsId] = useState<string | null>(null)
  const [addonSettings, setAddonSettings] = useState<{ blockId: string; addonId: string } | null>(null)

  const theme = themesState.items.find((item) => item.isDefault) ?? themesState.items[0] ?? themesState.detail
  const name =
    kind === 'pages'
      ? pagesState.detail?.name
      : kind === 'headers'
        ? headersState.detail?.name
        : footersState.detail?.name
  const defaultHeader = kind === 'pages' ? headersState.items.find((item) => item.isDefault) ?? null : null
  const defaultFooter = kind === 'pages' ? footersState.items.find((item) => item.isDefault) ?? null : null

  usePlatformLoading(feature.detailStatus === 'loading' && !feature.detail ? t('loadingDesigner') : null)

  useEffect(() => {
    if (!id || !accessToken) return
    if (kind === 'pages') dispatch(websitePagesActions.fetchDetailRequested({ id, force: true }))
    if (kind === 'headers') dispatch(websiteHeadersActions.fetchDetailRequested({ id, force: true }))
    if (kind === 'footers') dispatch(websiteFootersActions.fetchDetailRequested({ id, force: true }))
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websitePagesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    if (kind === 'pages') {
      dispatch(websiteHeadersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
      dispatch(websiteFootersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    }
  }, [accessToken, dispatch, id, kind])

  useEffect(() => {
    const detail = feature.detail
    if (!detail || detail.id !== id) return
    const next = 'document' in detail ? detail.document : emptyWebsiteDocument()
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

  const fontUrls = useMemo(() => {
    const urls = new Set(collectGoogleFontUrls(theme ?? null, document))
    for (const extra of [defaultHeader?.document, defaultFooter?.document]) {
      if (!extra) continue
      for (const url of collectGoogleFontUrls(null, extra)) urls.add(url)
    }
    return [...urls]
  }, [theme, document, defaultHeader, defaultFooter])

  useEffect(() => {
    const previous = window.document.title
    window.document.title = name ? `${name} · ${t('designer')}` : t('designer')
    return () => {
      window.document.title = previous
    }
  }, [name, t])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!id) return <Navigate to="/website/pages" replace />

  function save() {
    if (!id) return
    const next = snapshotDocument(document, theme ?? null)
    const body = { document: next }
    if (kind === 'pages') dispatch(websitePagesActions.saveDetailRequested({ id, body }))
    if (kind === 'headers') dispatch(websiteHeadersActions.saveDetailRequested({ id, body }))
    if (kind === 'footers') dispatch(websiteFootersActions.saveDetailRequested({ id, body }))
    setDocument(next)
    setSaved(JSON.stringify(next))
    toast({ title: t('saved') })
  }

  function selectedBlockId() {
    if (selection.kind === 'block' || selection.kind === 'addon') return selection.blockId
    return document.blocks.at(-1)?.id
  }

  function handleAddAddon(type: WebsiteAddon['type']) {
    const blockId = selectedBlockId()
    if (!blockId) {
      const withBlock = addBlock(document)
      const newId = withBlock.blocks.at(-1)?.id
      if (newId) setDocument(addAddon(withBlock, newId, type))
      return
    }
    setDocument(addAddon(document, blockId, type))
  }

  function handleDeleteSelection() {
    if (selection.kind === 'block') setDocument(deleteBlock(document, selection.blockId))
    if (selection.kind === 'addon') setDocument(deleteAddon(document, selection.blockId, selection.addonId))
    setSelection({ kind: 'container' })
  }

  function handleLayer(direction: 'up' | 'down') {
    if (selection.kind === 'container') return
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

  const settingsBlock = blockSettingsId
    ? document.blocks.find((item) => item.id === blockSettingsId) ?? null
    : null

  function openBlockSettings(blockId?: string) {
    const id = blockId ?? (selection.kind === 'block' || selection.kind === 'addon' ? selection.blockId : null)
    if (!id) return
    setSelection({ kind: 'block', blockId: id })
    setBlockSettingsId(id)
  }

  function openAddonSettings(blockId?: string, addonId?: string) {
    const nextBlockId = blockId ?? (selection.kind === 'addon' ? selection.blockId : null)
    const nextAddonId = addonId ?? (selection.kind === 'addon' ? selection.addonId : null)
    if (!nextBlockId || !nextAddonId) return
    setSelection({ kind: 'addon', blockId: nextBlockId, addonId: nextAddonId })
    setAddonSettings({ blockId: nextBlockId, addonId: nextAddonId })
  }

  const settingsAddon = addonSettings
    ? document.blocks.find((item) => item.id === addonSettings.blockId)?.addons.find((item) => item.id === addonSettings.addonId) ??
      null
    : null

  return (
    <FeaturePage
      className="h-full min-h-0"
      header={
        <header className="space-y-3">
          <h1 className="truncate text-2xl font-semibold text-foreground">{name ?? t('designer')}</h1>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <Button type="button" variant={mode === 'visual' ? 'default' : 'outline'} onClick={() => setMode('visual')}>
                {t('visual')}
              </Button>
              <Button type="button" variant={mode === 'edit' ? 'default' : 'outline'} onClick={() => setMode('edit')}>
                {t('edit')}
              </Button>
              {mode === 'edit' ? (
                <Button type="button" variant="outline" onClick={() => setDocument(addBlock(document))} disabled={!canManage}>
                  {t('addBlock')}
                </Button>
              ) : null}
              {kind === 'pages' && pagesState.detail ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(websiteLiveUrl(pagesState.detail!.companyId, pagesState.detail!.path), '_blank', 'noopener')
                  }
                >
                  {t('preview')}
                </Button>
              ) : null}
            </div>
            <Tabs value={breakpoint} onValueChange={(value) => setBreakpoint(value as WebsiteBreakpoint)}>
              <TabsList className="w-auto min-w-0 px-0" aria-label={t('breakpoint')}>
                {WEBSITE_BREAKPOINTS.map((item) => (
                  <TabsTrigger key={item} value={item} className="px-3">
                    {item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center justify-end">
              {canManage ? (
                <Button type="button" onClick={save} disabled={feature.detailStatus === 'saving'}>
                  {feature.detailStatus === 'saving' ? t('saving') : t('save')}
                </Button>
              ) : null}
            </div>
          </div>
        </header>
      }
    >
      {fontUrls.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {feature.detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{feature.detailError}</AlertDescription>
        </Alert>
      ) : null}
      <div className={mode === 'edit' ? 'grid min-h-0 min-w-0 flex-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]' : 'min-h-0 min-w-0 flex-1'}>
        {mode === 'edit' ? (
          <aside className="min-h-0 min-w-0 overflow-auto">
            <ContentTree
              document={document}
              selection={selection}
              canManage={canManage}
              onSelect={setSelection}
              onReorderAddon={(blockId, from, to) => setDocument(reorderAddons(document, blockId, from, to))}
              onReorderBlock={(from, to) => setDocument(reorderBlocks(document, from, to))}
              onLayer={(target, direction) => setDocument(changeLayer(document, target, direction))}
              onDeleteBlock={(blockId) => {
                setDocument(deleteBlock(document, blockId))
                setSelection({ kind: 'container' })
              }}
              onDeleteAddon={(blockId, addonId) => {
                setDocument(deleteAddon(document, blockId, addonId))
                setSelection({ kind: 'container' })
              }}
              onOpenContainerSettings={() => setContainerSettingsOpen(true)}
              onOpenBlockSettings={(blockId) => openBlockSettings(blockId)}
              onOpenAddonSettings={(blockId, addonId) => openAddonSettings(blockId, addonId)}
            />
          </aside>
        ) : null}
        <section className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
          <DesignerCanvas
            document={document}
            headerDocument={mode === 'visual' ? defaultHeader?.document ?? null : null}
            footerDocument={mode === 'visual' ? defaultFooter?.document ?? null : null}
            breakpoint={breakpoint}
            canvasWidth={WEBSITE_CANVAS_WIDTH[breakpoint]}
            mode={mode}
            selection={selection}
            theme={theme ?? null}
            pages={pagesState.items}
            canManage={canManage}
            onSelect={setSelection}
            onChangeDocument={setDocument}
            onResizeContainer={(height) =>
              setDocument({ ...document, container: { ...document.container, height } })
            }
            onAddAddon={handleAddAddon}
            onLayer={handleLayer}
            onDeleteSelection={handleDeleteSelection}
            onOpenBlockSettings={() => openBlockSettings()}
            onOpenAddonSettings={() => openAddonSettings()}
          />
        </section>
      </div>
      <ContentContainerSettingsDialog
        open={containerSettingsOpen}
        container={document.container}
        onOpenChange={setContainerSettingsOpen}
        onSave={(next) => setDocument({ ...document, container: next })}
      />
      <ContentBlockSettingsDialog
        open={blockSettingsId !== null}
        block={settingsBlock}
        onOpenChange={(open) => {
          if (!open) setBlockSettingsId(null)
        }}
        onSave={(blockId, backgroundColor) =>
          setDocument({
            ...document,
            blocks: document.blocks.map((item) => (item.id === blockId ? { ...item, backgroundColor } : item)),
          })
        }
      />
      <AddonSettingsDialog
        open={addonSettings !== null}
        addon={settingsAddon}
        breakpoint={breakpoint}
        theme={theme ?? null}
        pages={pagesState.items}
        onOpenChange={(open) => {
          if (!open) setAddonSettings(null)
        }}
        onSave={(next) => {
          if (!addonSettings) return
          setDocument(updateAddon(document, addonSettings.blockId, next))
        }}
      />
    </FeaturePage>
  )
}
