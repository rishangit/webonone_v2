export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'



export const avatarSizeClass: Record<AvatarSize, string> = {

  xs: 'h-6 w-6',

  sm: 'h-8 w-8',

  md: 'h-10 w-10',

  lg: 'h-12 w-12',

  xl: 'h-16 w-16',

}



export const avatarTextClass: Record<AvatarSize, string> = {

  xs: 'text-[10px]',

  sm: 'text-xs',

  md: 'text-sm',

  lg: 'text-base',

  xl: 'text-lg',

}


