import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { BoundDatasetSelect } from '../../components/BoundDatasetSelect'
import { ParentPropertySelect } from '../../components/ParentPropertySelect'
import { childGroupNames } from '../../document/dataBinding'
import { websiteDatasetsActions } from '../../store'
import type { WebsiteAddon } from '../../types'
import type { AddonPropsFieldsProps } from '../types'

type ListWebsiteAddon = Extract<WebsiteAddon, { type: 'list' }>

export function ListDataBindingFields(props: AddonPropsFieldsProps) {
  if (props.addon.type !== 'list') return null
  return <ListDataBindingFieldsInner {...props} listAddon={props.addon} />
}

function ListDataBindingFieldsInner({
  listAddon,
  onChange,
  inheritedFromParent = false,
  parentDataset = null,
}: Omit<AddonPropsFieldsProps, 'addon'> & { listAddon: ListWebsiteAddon }) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const datasetsState = useAppSelector((s) => s.websiteDatasets)

  const itemGroups = useMemo(
    () => (listAddon.props.itemTemplate ? childGroupNames(listAddon.props.itemTemplate) : []),
    [listAddon.props.itemTemplate],
  )

  const activeDatasets = useMemo(
    () => datasetsState.items.filter((item) => item.status === 'active'),
    [datasetsState.items],
  )

  useEffect(() => {
    dispatch(websiteDatasetsActions.loadListRequested({ page: 1, pageSize: 100, force: false }))
  }, [dispatch])

  useEffect(() => {
    if (!inheritedFromParent) return
    if (listAddon.props.dataSource === 'dataset' || !listAddon.props.dataSource) {
      updateProps({ dataSource: 'parent', datasetId: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot coerce when opening under parent
  }, [inheritedFromParent])

  function updateProps(partial: Partial<typeof listAddon.props>) {
    onChange({
      ...listAddon,
      props: { ...listAddon.props, ...partial },
    })
  }

  const itemGroupValue = listAddon.props.itemGroup ?? ''

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {inheritedFromParent ? t('dataBindingListInheritedHelp') : t('dataBindingListHelp')}
      </p>

      <FormField label={t('listDataSource')} htmlFor="list-data-source">
        <Select
          value={
            inheritedFromParent && listAddon.props.dataSource === 'dataset'
              ? 'parent'
              : listAddon.props.dataSource
          }
          onValueChange={(value) =>
            updateProps({
              dataSource: value as 'dataset' | 'manual' | 'parent',
              ...(value === 'parent' ? { datasetId: null } : {}),
              ...(value !== 'parent' ? { itemsPath: null } : {}),
            })
          }
        >
          <SelectTrigger id="list-data-source">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inheritedFromParent ? (
              <SelectItem value="parent">{t('sliderDataSourceParent')}</SelectItem>
            ) : null}
            <SelectItem value="manual">{t('sliderDataSourceManual')}</SelectItem>
            {!inheritedFromParent ? (
              <SelectItem value="dataset">{t('sliderDataSourceDataset')}</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </FormField>

      {listAddon.props.dataSource === 'parent' ||
      (inheritedFromParent && listAddon.props.dataSource !== 'manual') ? (
        <ParentPropertySelect
          id="list-items-path"
          dataset={parentDataset}
          value={listAddon.props.itemsPath ?? ''}
          onChange={(itemsPath) =>
            updateProps({
              dataSource: 'parent',
              itemsPath: itemsPath || null,
              datasetId: null,
            })
          }
          complexOnly
          hint={t('parentPropertyHint')}
        />
      ) : null}

      {listAddon.props.dataSource === 'dataset' && !inheritedFromParent ? (
        <BoundDatasetSelect
          id="list-dataset"
          value={listAddon.props.datasetId}
          datasets={activeDatasets}
          onChange={(datasetId) => updateProps({ datasetId })}
          hint={t('listDatasetHint')}
        />
      ) : null}

      <FormField label={t('itemGroup')} htmlFor="list-item-group">
        {itemGroups.length > 0 ? (
          <Select
            value={itemGroupValue || '__none__'}
            onValueChange={(value) =>
              updateProps({ itemGroup: value === '__none__' ? null : value })
            }
          >
            <SelectTrigger id="list-item-group">
              <SelectValue placeholder={t('itemGroupPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
              {itemGroups.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="list-item-group"
            value={itemGroupValue}
            onChange={(event) => updateProps({ itemGroup: event.target.value || null })}
            placeholder={t('itemGroupPlaceholder')}
          />
        )}
      </FormField>
      <p className="text-xs text-muted-foreground">{t('listItemGroupHint')}</p>
    </div>
  )
}
