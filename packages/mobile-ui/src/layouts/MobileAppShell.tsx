import { useMemo, useState, type ReactNode } from 'react'

import { Pressable, View } from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import {

  AppDrawer,

  type DrawerSession,

  type MobileNavItem,

} from '../components/AppDrawer'

import { AppHeader, type AppHeaderLabels, type AppHeaderLocale, type AppHeaderUser } from '../components/AppHeader'
import {
  SHELL_SIDE_PANEL_WIDTH_CLASS,
  SHELL_HEADER_SPACER_CLASS,
  SHELL_OVERLAY_LAYER_STYLE,
} from './shellPanelLayout'



const HEADER_LAYER_STYLE = { zIndex: 50, elevation: 50 }

export function MobileAppShell({

  nav,

  activePath,

  onNavigate,

  user,

  onProfilePress,

  onLogout,

  locale,

  onLocaleChange,

  session,

  children,

  title,

  headerLabels,

  headerActions,

  shellOverlay,

}: {

  nav: MobileNavItem[]

  activePath: string

  onNavigate: (to: string) => void

  user?: AppHeaderUser | null

  onProfilePress?: () => void

  onLogout?: () => void

  locale?: AppHeaderLocale

  onLocaleChange?: (locale: AppHeaderLocale) => void

  session?: DrawerSession | null

  children: React.ReactNode

  title?: string

  headerLabels?: AppHeaderLabels

  headerActions?: ReactNode

  /** Shell overlay below the header (assistant, notifications, etc.) — like web `#shell-slide-host`. */
  shellOverlay?: ReactNode

}) {

  const [drawerOpen, setDrawerOpen] = useState(false)

  const initialGroup = useMemo(() => {

    const match = nav.find(

      (item) =>

        item.type === 'group' &&

        item.children.some((child) => activePath === child.to || activePath.startsWith(`${child.to}/`)),

    )

    return match?.type === 'group' ? match.label : null

  }, [activePath, nav])

  const [expandedGroup, setExpandedGroup] = useState<string | null>(initialGroup)



  function handleToggleGroup(label: string) {

    setExpandedGroup((prev) => (prev === label ? null : label))

  }



  function handleNavigate(to: string) {

    setDrawerOpen(false)

    onNavigate(to)

  }



  function closeDrawer() {

    setDrawerOpen(false)

  }



  return (

    <View className="flex-1 bg-background">

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>

        <View className="min-h-0 flex-1 gap-2 p-2">

          <View className={SHELL_HEADER_SPACER_CLASS} />

          <View className="min-h-0 flex-1">{children}</View>

        </View>

      </SafeAreaView>



      {drawerOpen ? (

        <View className="absolute inset-0" style={SHELL_OVERLAY_LAYER_STYLE}>

          <Pressable

            className="absolute inset-0 bg-black/50"

            onPress={closeDrawer}

            accessibilityLabel="Close navigation"

          />

          <SafeAreaView className="absolute inset-0" edges={['top', 'bottom']} style={{ pointerEvents: 'box-none' }}>

            <View className="min-h-0 flex-1 gap-2 p-2" style={{ pointerEvents: 'box-none' }}>

              <View className={SHELL_HEADER_SPACER_CLASS} style={{ pointerEvents: 'none' }} />

              <View className="min-h-0 flex-1 flex-row" style={{ pointerEvents: 'box-none' }}>

                <View
                  className={`${SHELL_SIDE_PANEL_WIDTH_CLASS} overflow-hidden rounded-shell border border-shell-border bg-shell`}
                >

                  <AppDrawer

                    nav={nav}

                    activePath={activePath}

                    expandedGroup={expandedGroup}

                    onToggleGroup={handleToggleGroup}

                    onNavigate={handleNavigate}

                    session={session}

                  />

                </View>

                <Pressable className="flex-1" onPress={closeDrawer} accessibilityLabel="Close navigation" />

              </View>

            </View>

          </SafeAreaView>

        </View>

      ) : null}

      {shellOverlay}

      <SafeAreaView

        className="absolute left-0 right-0 top-0"

        edges={['top']}

        style={HEADER_LAYER_STYLE}

        pointerEvents="box-none"

      >

        <View className="p-2" pointerEvents="auto">

          <AppHeader

            title={title}

            user={user}

            locale={locale}

            onLocaleChange={onLocaleChange}

            onMenuPress={() => setDrawerOpen((open) => !open)}

            onProfilePress={onProfilePress}

            onLogout={onLogout}

            menuOpen={drawerOpen}

            labels={headerLabels}

            headerActions={headerActions}

          />

        </View>

      </SafeAreaView>

    </View>

  )

}


