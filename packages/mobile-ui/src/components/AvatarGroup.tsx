import { useState } from 'react'

import { Modal, Pressable, ScrollView, Text, View } from 'react-native'

import { Avatar } from './Avatar'

import { avatarSizeClass, avatarTextClass, type AvatarSize } from './avatarVariants'

import { cn } from '../lib/cn'

import { Body } from './Typography'



export type AvatarGroupUser = {

  src?: string | null

  fallback: string

  alt: string

  name?: string

}



function AvatarOverflowBadge({

  count,

  size,

  className,

  style,

}: {

  count: number

  size: AvatarSize

  className?: string

  style?: { marginLeft?: number; zIndex?: number }

}) {

  return (

    <View

      className={cn(

        'items-center justify-center rounded-full border border-primary bg-primary/10',

        avatarSizeClass[size],

        className,

      )}

      style={style}

      accessibilityLabel={`${count} more users`}

    >

      <Text className={cn('font-medium text-primary', avatarTextClass[size])}>+{count}</Text>

    </View>

  )

}



export function AvatarGroup({

  users,

  max = 4,

  size = 'md',

  className,

}: {

  users: AvatarGroupUser[]

  max?: number

  size?: AvatarSize

  className?: string

}) {

  const [open, setOpen] = useState(false)



  if (users.length === 0) {

    return null

  }



  const overflowCount = users.length > max ? users.length - (max - 1) : 0

  const visibleUsers = overflowCount > 0 ? users.slice(0, max - 1) : users.slice(0, max)



  return (

    <>

      <Pressable

        accessibilityRole="button"

        accessibilityLabel="Show all users"

        onPress={() => setOpen(true)}

        className={cn('flex-row items-center', className)}

      >

        {visibleUsers.map((user, index) => (

          <Avatar

            key={user.alt}

            size={size}

            src={user.src}

            alt={user.alt}

            fallback={user.fallback}

            className={cn('border-2 border-background', index > 0 && '-ml-2.5')}

            style={{ zIndex: index }}

          />

        ))}

        {overflowCount > 0 ? (

          <AvatarOverflowBadge

            count={overflowCount}

            size={size}

            className="border-2 border-background"

            style={{ marginLeft: -10, zIndex: visibleUsers.length }}

          />

        ) : null}

      </Pressable>



      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>

        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>

          <Pressable

            className="max-h-[70%] rounded-t-lg bg-surface p-4"

            onPress={(event) => event.stopPropagation()}

          >

            <Body className="mb-3 font-semibold">Users</Body>

            <ScrollView>

              {users.map((user) => (

                <View key={user.alt} className="flex-row items-center gap-2 rounded-lg px-2 py-2">

                  <Avatar size="sm" src={user.src} alt={user.alt} fallback={user.fallback} />

                  <Body className="min-w-0 flex-1 text-sm">{user.name ?? user.alt}</Body>

                </View>

              ))}

            </ScrollView>

          </Pressable>

        </Pressable>

      </Modal>

    </>

  )

}


