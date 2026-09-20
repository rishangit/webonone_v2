import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Linking, Platform, StyleSheet, View } from 'react-native'

import type {

  WebViewErrorEvent,

  WebViewHttpErrorEvent,

  WebViewMessageEvent,

} from 'react-native-webview/lib/WebViewTypes'

import { Body, Button, Card, FeatureScreen, Muted, Spinner } from '@webonone/mobile-ui'

import { secureStorage } from '@/shared/services/secureStorage'

import { useSession } from '@/features/auth/SessionContext'

import type { PeerDestination } from './peerDestinations'



type WebViewComponent = typeof import('react-native-webview').WebView



export type PeerWebViewChrome = 'default' | 'embedded'



const PLATFORM_READY_TYPE = 'webonone:platform:ready'



let CachedWebView: WebViewComponent | null | undefined



function getWebView(): WebViewComponent | null {

  if (CachedWebView !== undefined) return CachedWebView

  try {

    // Optional native module — web / Expo Go may not have it linked.

    // eslint-disable-next-line @typescript-eslint/no-require-imports

    CachedWebView = require('react-native-webview').WebView as WebViewComponent

  } catch {

    CachedWebView = null

  }

  return CachedWebView

}



function decodeJwtClaims(token: string): { sub?: string; email?: string } {

  try {

    const segment = token.split('.')[1]

    if (!segment) return {}



    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')

    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

    const decodeBase64 =

      typeof globalThis.atob === 'function' ? globalThis.atob.bind(globalThis) : null

    if (!decodeBase64) return {}



    const json = decodeBase64(padded)

    const claims = JSON.parse(json) as { sub?: string; email?: string }

    return { sub: claims.sub, email: claims.email }

  } catch {

    return {}

  }

}



function buildEmbedSessionUser(

  user: { id: string; email: string } | null | undefined,

  token: string | null,

): { id: string; email: string } {

  if (user?.id && user.email) {

    return { id: user.id, email: user.email }

  }



  const claims = token ? decodeJwtClaims(token) : {}

  return {

    id: claims.sub ?? 'embedded-user',

    email: claims.email ?? user?.email ?? 'user@embedded',

  }

}



function BrowserFallback({ title, url }: { title: string; url: string }) {

  return (

    <FeatureScreen title={title} description="Opens the matching web page for this account.">

      <Card className="gap-3">

        <Muted>

          This area still lives on the web. Native screens will replace it later; until then you can

          open it in the browser.

        </Muted>

        <Button onPress={() => void Linking.openURL(url)}>Open in browser</Button>

      </Card>

    </FeatureScreen>

  )

}



function buildSessionInjectScript({

  token,

  storageKey,

  sessionJson,

}: {

  token: string

  storageKey: string

  sessionJson: string

}): string {

  return `

    (function () {

      var token = ${JSON.stringify(token)};

      var key = ${JSON.stringify(storageKey)};

      try { localStorage.setItem(key, ${JSON.stringify(sessionJson)}); } catch (e) {}

      function sendInit() {

        if (!token) return;

        var target =

          (typeof window !== 'undefined' && window.location && window.location.origin)

            ? window.location.origin

            : '*';

        window.postMessage({ type: 'webonone:platform:init', accessToken: token }, target);

      }

      window.addEventListener('message', function (event) {

        var data = event.data;

        if (typeof data === 'string') {

          try { data = JSON.parse(data); } catch (err) { return; }

        }

        if (data && data.type === ${JSON.stringify(PLATFORM_READY_TYPE)}) sendInit();

      });

      sendInit();

      var attempts = 0;

      var retryTimer = setInterval(function () {

        sendInit();

        attempts += 1;

        if (attempts >= 40) clearInterval(retryTimer);

      }, 250);

    })();

    true;

  `

}



function WebViewErrorState({

  title,

  message,

  embedded,

  onRetry,

  onOpenBrowser,

}: {

  title: string

  message: string

  embedded: boolean

  onRetry: () => void

  onOpenBrowser: () => void

}) {

  const content = (

    <Card className="gap-3">

      <Body className="text-destructive">{message}</Body>

      <Muted>Check your network connection and that the service is reachable.</Muted>

      <Button onPress={onRetry}>Retry</Button>

      <Button variant="outline" onPress={onOpenBrowser}>Open in browser</Button>

    </Card>

  )



  if (embedded) {

    return <View className="flex-1 bg-background" style={styles.embeddedRoot}>{content}</View>

  }



  return (

    <FeatureScreen title={title} scroll={false}>

      {content}

    </FeatureScreen>

  )

}



export function PeerWebViewScreen({

  destination,

  chrome = 'default',

}: {

  destination: PeerDestination

  chrome?: PeerWebViewChrome

}) {

  const { user } = useSession()

  const [token, setToken] = useState<string | null | undefined>(undefined)

  const [loadError, setLoadError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  const webViewRef = useRef<InstanceType<WebViewComponent> | null>(null)

  const WebView = getWebView()

  const embedded = chrome === 'embedded'



  useEffect(() => {

    void secureStorage.getAccessToken().then((value) => setToken(value))

  }, [])



  const uri = useMemo(() => {
    if (destination.kind !== 'webview') return destination.url
    // Standalone Identity route — auth comes from injected identity_auth storage.
    // Platform embed (?embed=platform) leaves ProfilePage blank on mobile WebView
    // when parentOrigin is not on Identity's allowlist or INIT origin mismatches.
    return `${destination.origin.replace(/\/$/, '')}${destination.path}`
  }, [destination])



  const injectScript = useMemo(() => {

    if (destination.kind !== 'webview' || token === undefined || token === null) {

      return ''

    }



    const sessionJson = JSON.stringify({

      accessToken: token,

      user: buildEmbedSessionUser(user, token),

    })



    return buildSessionInjectScript({

      token,

      storageKey: destination.storageKey,

      sessionJson,

    })

  }, [destination, token, user])



  const runSessionInject = useCallback(() => {

    if (!injectScript) return

    webViewRef.current?.injectJavaScript(injectScript)

  }, [injectScript])



  const handleWebViewMessage = useCallback(

    (event: WebViewMessageEvent) => {

      try {

        const data = JSON.parse(event.nativeEvent.data) as { type?: string }

        if (data?.type === PLATFORM_READY_TYPE) {

          runSessionInject()

        }

      } catch {

        // Ignore non-JSON messages from the page.

      }

    },

    [runSessionInject],

  )



  const handleRetry = useCallback(() => {

    setLoadError(null)

    setReloadKey((key) => key + 1)

  }, [])



  const handleWebViewError = useCallback((event: WebViewErrorEvent) => {

    setLoadError(event.nativeEvent.description || 'Could not load this page.')

  }, [])



  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {

    const status = event.nativeEvent.statusCode

    setLoadError(`Could not load this page (HTTP ${status}).`)

  }, [])



  if (destination.kind === 'browser' || Platform.OS === 'web' || !WebView) {

    return <BrowserFallback title={destination.title} url={uri} />

  }



  if (token === undefined) {

    return (

      <View className="flex-1 bg-background" style={[styles.embeddedRoot, !embedded && styles.centered]}>

        <Spinner label="Loading…" />

      </View>

    )

  }



  if (!token) {

    const message = 'Your session expired. Sign in again from the app menu.'

    return (

      <View className="flex-1 bg-background" style={[styles.embeddedRoot, !embedded && styles.centered, styles.padded]}>

        <Card className="gap-3">

          <Body className="text-destructive">{message}</Body>

        </Card>

      </View>

    )

  }



  if (loadError) {

    return (

      <WebViewErrorState

        title={destination.title}

        message={loadError}

        embedded={embedded}

        onRetry={handleRetry}

        onOpenBrowser={() => void Linking.openURL(uri)}

      />

    )

  }



  const webView = (

    <WebView

      ref={webViewRef}

      key={reloadKey}

      source={{ uri }}

      style={styles.webView}

      originWhitelist={['*']}

      domStorageEnabled

      sharedCookiesEnabled

      startInLoadingState

      renderLoading={() => <Spinner label="Loading…" />}

      injectedJavaScriptBeforeContentLoaded={injectScript}

      injectedJavaScript={injectScript}

      onLoadEnd={runSessionInject}

      onMessage={handleWebViewMessage}

      onError={handleWebViewError}

      onHttpError={handleHttpError}

    />

  )



  if (embedded) {

    return <View className="flex-1 bg-background" style={styles.embeddedRoot}>{webView}</View>

  }



  return (

    <FeatureScreen title={destination.title} scroll={false}>

      <View className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">

        {webView}

      </View>

      <View className="px-4 pb-4">

        <Button variant="outline" onPress={() => void Linking.openURL(uri)}>

          Open in browser

        </Button>

      </View>

    </FeatureScreen>

  )

}



const styles = StyleSheet.create({

  embeddedRoot: {

    flex: 1,

  },

  centered: {

    alignItems: 'center',

    justifyContent: 'center',

  },

  padded: {

    padding: 16,

  },

  webView: {

    flex: 1,

    width: '100%',

    backgroundColor: 'transparent',

  },

})


