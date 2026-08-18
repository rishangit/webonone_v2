import { ListAddButton } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'

type ThemeEditorListHeaderProps = {
  title: string
  addLabel: string
  onAdd: () => void
}

export function ThemeEditorListHeader({ title, addLabel, onAdd }: ThemeEditorListHeaderProps) {
  const { t: tc } = useTranslation('common')
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="font-medium">{title}</p>
      <ListAddButton compactLabel={tc('add')} compactOnMobile={false} onClick={onAdd}>
        {addLabel}
      </ListAddButton>
    </div>
  )
}
