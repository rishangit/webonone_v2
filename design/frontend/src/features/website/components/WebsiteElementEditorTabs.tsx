import { useTranslation } from 'react-i18next'
import {
  EditableSectionCard,
  FormField,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  tabsPageClassName,
  tabsPageContentClassName,
} from '@webonone/ui-kit'
import type {
  ElementVisualStyle,
  WebsiteElementCustomization,
  WebsiteElementKind,
} from '../utils/websiteElementCustomization'
import {
  defaultElementHtml,
  defaultElementStyles,
  effectiveElementHtml,
  effectiveElementStyles,
} from '../utils/websiteElementCustomization'

export const WEBSITE_ELEMENT_EDITOR_TABS = ['preview', 'general', 'html', 'styles', 'scripts'] as const
export type WebsiteElementEditorTab = (typeof WEBSITE_ELEMENT_EDITOR_TABS)[number]
export type WebsiteElementEditorLayout = 'dialog' | 'detail'
export type WebsiteElementEditorMode = 'view' | 'edit'

export function parseElementEditorTab(value: string | null | undefined): WebsiteElementEditorTab | undefined {
  if (!value) return undefined
  return WEBSITE_ELEMENT_EDITOR_TABS.find((tab) => tab === value)
}

type WebsiteElementEditorTabsProps = {
  tab: WebsiteElementEditorTab
  onTabChange: (tab: WebsiteElementEditorTab) => void
  kind: WebsiteElementKind
  customization: WebsiteElementCustomization
  onCustomizationChange: (next: WebsiteElementCustomization) => void
  scopeId: string
  defaultHtml: string
  visual?: ElementVisualStyle
  preview: React.ReactNode
  general: React.ReactNode
  generalView?: React.ReactNode
  layout?: WebsiteElementEditorLayout
  mode?: WebsiteElementEditorMode
  onEdit?: (tab: WebsiteElementEditorTab) => void
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-foreground">
      {value.trim() ? value : '—'}
    </pre>
  )
}

function SectionCard({
  title,
  description,
  canEdit,
  onEdit,
  children,
}: {
  title: string
  description?: string
  canEdit: boolean
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <EditableSectionCard title={title} description={description} canEdit={canEdit} onEdit={onEdit}>
      {children}
    </EditableSectionCard>
  )
}

export function WebsiteElementEditorTabs({
  tab,
  onTabChange,
  kind,
  customization,
  onCustomizationChange,
  scopeId,
  defaultHtml,
  visual,
  preview,
  general,
  generalView,
  layout = 'dialog',
  mode = 'edit',
  onEdit,
}: WebsiteElementEditorTabsProps) {
  const { t } = useTranslation('website')
  const isDetail = layout === 'detail'
  const isView = mode === 'view'
  const canEditSection = isDetail && isView && Boolean(onEdit)
  const htmlPlaceholder = elementHtmlPlaceholder(kind, t)
  const scopedDefaultHtml = defaultHtml || defaultElementHtml(kind, scopeId)
  const scopedDefaultStyles = defaultElementStyles(scopeId)
  const currentHtml = effectiveElementHtml(customization, scopedDefaultHtml, visual)
  const currentStyles = effectiveElementStyles(customization, scopedDefaultStyles, scopeId)

  const previewCanvas = (
    <div className="flex min-h-[140px] items-center justify-center rounded-md border border-[hsl(var(--glass-border))] bg-background p-6">
      {preview}
    </div>
  )

  const previewCard = (
    <SectionCard
      title={t('preview')}
      description={isDetail ? t('elementLivePreviewHint') : t('elementPreviewHint')}
      canEdit={canEditSection}
      onEdit={onEdit ? () => onEdit('preview') : undefined}
    >
      {previewCanvas}
    </SectionCard>
  )

  const generalBody = isView ? (generalView ?? general) : general

  const htmlEditor = (
    <Textarea
      id="element-html"
      aria-label={t('elementTabHtml')}
      className="min-h-[220px] font-mono text-sm"
      value={currentHtml}
      onChange={(event) => onCustomizationChange({ ...customization, html: event.target.value })}
      placeholder={htmlPlaceholder}
      readOnly={isView}
    />
  )

  const htmlBody = isView ? (
    <CodeBlock value={currentHtml} />
  ) : isDetail ? (
    <>
      <p className="text-xs text-muted-foreground">{htmlPlaceholder}</p>
      {htmlEditor}
    </>
  ) : (
    <>
      <p className="text-xs text-muted-foreground">{t('elementHtmlCurrentHint')}</p>
      <p className="text-xs text-muted-foreground">{htmlPlaceholder}</p>
      <FormField label={t('elementTabHtml')} htmlFor="element-html">
        {htmlEditor}
      </FormField>
    </>
  )

  const stylesEditorValue = isView
    ? currentStyles
    : customization.styles.trim()
      ? customization.styles
      : scopedDefaultStyles

  const stylesEditor = (
    <Textarea
      id="element-styles"
      aria-label={t('elementTabStyles')}
      className="min-h-[220px] font-mono text-sm"
      value={stylesEditorValue}
      onChange={(event) => onCustomizationChange({ ...customization, styles: event.target.value })}
      placeholder={scopedDefaultStyles}
      readOnly={isView}
    />
  )

  const stylesBody = isView ? (
    <CodeBlock value={currentStyles} />
  ) : isDetail ? (
    stylesEditor
  ) : (
    <>
      <p className="text-xs text-muted-foreground">{t('elementStylesHint')}</p>
      <FormField label={t('elementTabStyles')} htmlFor="element-styles">
        {stylesEditor}
      </FormField>
    </>
  )

  const scriptsEditor = (
    <Textarea
      id="element-scripts"
      aria-label={t('elementTabScripts')}
      className="min-h-[160px] font-mono text-sm"
      value={customization.scripts}
      onChange={(event) => onCustomizationChange({ ...customization, scripts: event.target.value })}
      placeholder={t('elementScriptsHint')}
      readOnly={isView}
    />
  )

  const scriptsBody = isView ? (
    <CodeBlock value={customization.scripts} />
  ) : isDetail ? (
    scriptsEditor
  ) : (
    <>
      <p className="text-xs text-muted-foreground">{t('elementScriptsHint')}</p>
      <FormField label={t('elementTabScripts')} htmlFor="element-scripts">
        {scriptsEditor}
      </FormField>
    </>
  )

  const tabList = (
    <TabsList aria-label={t('elementEditorTabsLabel')}>
      <TabsTrigger value="preview">{t('preview')}</TabsTrigger>
      <TabsTrigger value="general">{t('basicSettings')}</TabsTrigger>
      <TabsTrigger value="html">{t('elementTabHtml')}</TabsTrigger>
      <TabsTrigger value="styles">{t('elementTabStyles')}</TabsTrigger>
      <TabsTrigger value="scripts">{t('elementTabScripts')}</TabsTrigger>
    </TabsList>
  )

  const tabWithPreview = (content: React.ReactNode) => (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">{content}</div>
      <div className="flex flex-col gap-6 lg:col-span-1">{previewCard}</div>
    </div>
  )

  if (!isDetail) {
    return (
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as WebsiteElementEditorTab)}
        className={tabsPageClassName}
      >
        {tabList}
        <TabsContent value="preview" className={tabsPageContentClassName}>
          <p className="mb-2 text-xs text-muted-foreground">{t('elementPreviewHint')}</p>
          {previewCanvas}
        </TabsContent>
        <TabsContent value="general" className={tabsPageContentClassName}>
          {tabWithPreview(generalBody)}
        </TabsContent>
        <TabsContent value="html" className={tabsPageContentClassName}>
          {tabWithPreview(
            <WebsiteElementCodeSection
              section="html"
              kind={kind}
              customization={customization}
              onCustomizationChange={onCustomizationChange}
              scopeId={scopeId}
              defaultHtml={defaultHtml}
              visual={visual}
            />,
          )}
        </TabsContent>
        <TabsContent value="styles" className={tabsPageContentClassName}>
          {tabWithPreview(
            <WebsiteElementCodeSection
              section="styles"
              kind={kind}
              customization={customization}
              onCustomizationChange={onCustomizationChange}
              scopeId={scopeId}
              defaultHtml={defaultHtml}
              visual={visual}
            />,
          )}
        </TabsContent>
        <TabsContent value="scripts" className={tabsPageContentClassName}>
          {tabWithPreview(
            <WebsiteElementCodeSection
              section="scripts"
              kind={kind}
              customization={customization}
              onCustomizationChange={onCustomizationChange}
              scopeId={scopeId}
              defaultHtml={defaultHtml}
              visual={visual}
            />,
          )}
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as WebsiteElementEditorTab)}
      className={tabsPageClassName}
    >
      {tabList}
      <TabsContent value="preview" className={tabsPageContentClassName}>
        {previewCard}
      </TabsContent>
      <TabsContent value="general" className={tabsPageContentClassName}>
        {tabWithPreview(
          <SectionCard
            title={t('basicSettings')}
            description={t('elementGeneralCardDescription')}
            canEdit={canEditSection}
            onEdit={onEdit ? () => onEdit('general') : undefined}
          >
            {generalBody}
          </SectionCard>,
        )}
      </TabsContent>
      <TabsContent value="html" className={tabsPageContentClassName}>
        {tabWithPreview(
          <SectionCard
            title={t('elementTabHtml')}
            description={t('elementHtmlCurrentHint')}
            canEdit={canEditSection}
            onEdit={onEdit ? () => onEdit('html') : undefined}
          >
            {htmlBody}
          </SectionCard>,
        )}
      </TabsContent>
      <TabsContent value="styles" className={tabsPageContentClassName}>
        {tabWithPreview(
          <SectionCard
            title={t('elementTabStyles')}
            description={t('elementStylesHint')}
            canEdit={canEditSection}
            onEdit={onEdit ? () => onEdit('styles') : undefined}
          >
            {stylesBody}
          </SectionCard>,
        )}
      </TabsContent>
      <TabsContent value="scripts" className={tabsPageContentClassName}>
        {tabWithPreview(
          <SectionCard
            title={t('elementTabScripts')}
            description={t('elementScriptsHint')}
            canEdit={canEditSection}
            onEdit={onEdit ? () => onEdit('scripts') : undefined}
          >
            {scriptsBody}
          </SectionCard>,
        )}
      </TabsContent>
    </Tabs>
  )
}

export type WebsiteElementCodeSectionName = 'html' | 'styles' | 'scripts'

function elementHtmlPlaceholder(kind: WebsiteElementKind, t: (key: string) => string): string {
  if (kind === 'button') return t('elementHtmlPlaceholderButton')
  if (kind === 'block') return t('elementHtmlPlaceholderBlock')
  return t('elementHtmlPlaceholderText')
}

/** HTML, styles, or script editor shared by button, text, and block settings. */
export function WebsiteElementCodeSection({
  section,
  kind,
  customization,
  onCustomizationChange,
  scopeId,
  defaultHtml,
  visual,
  readOnly = false,
}: {
  section: WebsiteElementCodeSectionName
  kind: WebsiteElementKind
  customization: WebsiteElementCustomization
  onCustomizationChange: (next: WebsiteElementCustomization) => void
  scopeId: string
  defaultHtml: string
  visual?: ElementVisualStyle
  readOnly?: boolean
}) {
  const { t } = useTranslation('website')
  const htmlPlaceholder = elementHtmlPlaceholder(kind, t)
  const scopedDefaultHtml = defaultHtml || defaultElementHtml(kind, scopeId)
  const scopedDefaultStyles = defaultElementStyles(scopeId)
  const currentHtml = effectiveElementHtml(customization, scopedDefaultHtml, visual)
  const htmlHint = kind === 'block' ? t('elementHtmlBlockHint') : t('elementHtmlCurrentHint')

  if (section === 'html') {
    return (
      <>
        <p className="text-xs text-muted-foreground">{htmlHint}</p>
        <p className="text-xs text-muted-foreground">{htmlPlaceholder}</p>
        <FormField label={t('elementTabHtml')} htmlFor={`element-html-${scopeId}`}>
          <Textarea
            id={`element-html-${scopeId}`}
            aria-label={t('elementTabHtml')}
            className="min-h-[220px] font-mono text-sm"
            value={currentHtml}
            onChange={(event) => onCustomizationChange({ ...customization, html: event.target.value })}
            placeholder={htmlPlaceholder}
            readOnly={readOnly}
          />
        </FormField>
      </>
    )
  }

  if (section === 'styles') {
    const stylesEditorValue = customization.styles.trim() ? customization.styles : scopedDefaultStyles
    return (
      <>
        <p className="text-xs text-muted-foreground">{t('elementStylesHint')}</p>
        <FormField label={t('elementTabStyles')} htmlFor={`element-styles-${scopeId}`}>
          <Textarea
            id={`element-styles-${scopeId}`}
            aria-label={t('elementTabStyles')}
            className="min-h-[220px] font-mono text-sm"
            value={stylesEditorValue}
            onChange={(event) => onCustomizationChange({ ...customization, styles: event.target.value })}
            placeholder={scopedDefaultStyles}
            readOnly={readOnly}
          />
        </FormField>
      </>
    )
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">{t('elementScriptsHint')}</p>
      <FormField label={t('elementTabScripts')} htmlFor={`element-scripts-${scopeId}`}>
        <Textarea
          id={`element-scripts-${scopeId}`}
          aria-label={t('elementTabScripts')}
          className="min-h-[160px] font-mono text-sm"
          value={customization.scripts}
          onChange={(event) => onCustomizationChange({ ...customization, scripts: event.target.value })}
          placeholder={t('elementScriptsHint')}
          readOnly={readOnly}
        />
      </FormField>
    </>
  )
}
