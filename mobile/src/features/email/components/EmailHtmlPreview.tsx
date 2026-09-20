import { useMemo } from 'react'
import { View } from 'react-native'
import { Body, Muted } from '@webonone/mobile-ui'

type WebViewComponent = typeof import('react-native-webview').WebView

let cachedWebView: WebViewComponent | null | undefined

function getWebView(): WebViewComponent | null {
  if (cachedWebView !== undefined) return cachedWebView
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedWebView = require('react-native-webview').WebView as WebViewComponent
  } catch {
    cachedWebView = null
  }
  return cachedWebView
}

function wrapPreviewHtml(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;}</style></head><body>${html}</body></html>`
}

export function EmailHtmlPreview({
  html,
  title,
  fallbackText,
}: {
  html: string
  title: string
  fallbackText?: string
}) {
  const WebView = getWebView()
  const source = useMemo(() => ({ html: wrapPreviewHtml(html) }), [html])

  if (!WebView) {
    return (
      <View className="min-h-[200px] rounded-lg border border-border bg-muted/20 p-3">
        <Muted>{fallbackText ?? 'HTML preview is not available on this device.'}</Muted>
        {fallbackText ? null : <Body className="mt-2 font-mono text-xs">{html}</Body>}
      </View>
    )
  }

  return (
    <View className="h-[360px] overflow-hidden rounded-lg border border-border bg-background">
      <WebView
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled
        originWhitelist={['*']}
        accessibilityLabel={title}
      />
    </View>
  )
}
