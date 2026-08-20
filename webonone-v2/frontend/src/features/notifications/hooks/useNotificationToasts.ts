import { useEffect } from 'react'
import { useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { notificationsActions } from '../store/notificationsSlice'

/** Surfaces a toast when a new notification arrives (driven by poll epic). */
export function useNotificationToasts() {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const pendingToastTitle = useAppSelector((s) => s.notifications.pendingToastTitle)

  useEffect(() => {
    if (!pendingToastTitle) return
    toast({
      title: pendingToastTitle,
      variant: 'default',
    })
    dispatch(notificationsActions.clearPendingToast())
  }, [pendingToastTitle, toast, dispatch])
}
