import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { dataApi } from '@/shared/services/dataApi'
import type { Attribute, CatalogItem, Tag } from '@/shared/types/data.types'

type CatalogKind = 'products' | 'services' | 'spaces'

const API = {
  products: {
    get: dataApi.getProduct,
    create: dataApi.createProduct,
    update: dataApi.updateProduct,
    label: 'Product',
  },
  services: {
    get: dataApi.getService,
    create: dataApi.createService,
    update: dataApi.updateService,
    label: 'Service',
  },
  spaces: {
    get: dataApi.getSpace,
    create: dataApi.createSpace,
    update: dataApi.updateSpace,
    label: 'Space',
  },
} as const

type AttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

export function CatalogEditorPage({ kind }: { kind: CatalogKind }) {
  const api = API[kind]
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const role = useAppSelector((s) => s.auth.user?.role)
  const accessToken = useAppSelector((s) => s.auth.accessToken)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'verified' | 'pending'>('pending')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      dataApi.listTags({ pageSize: 100 }),
      dataApi.listAttributes({ pageSize: 100 }),
    ]).then(([tagRes, attrRes]) => {
      setTags(tagRes.items)
      setAttributes(attrRes.items)
    })
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    setLoading(true)
    api
      .get(id)
      .then((item: CatalogItem) => {
        setName(item.name)
        setDescription(item.description ?? '')
        setStatus(item.status)
        setTagIds(item.tags.map((t) => t.id))
        setAttributeRows(
          item.attributes.map((a) => ({
            attributeId: a.attributeId,
            valueText: a.valueText ?? '',
            valueNumber: a.valueNumber != null ? String(a.valueNumber) : '',
          })),
        )
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [api, id, isNew])

  if (!accessToken) return <Navigate to="/login" replace />
  if (role !== 'super_admin') return <Navigate to={`/${kind}`} replace />

  function toggleTag(tagId: string) {
    setTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  function addAttributeRow() {
    setAttributeRows((prev) => [...prev, { attributeId: '', valueText: '', valueNumber: '' }])
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        tag_ids: tagIds,
        attributes: attributeRows
          .filter((row) => row.attributeId)
          .map((row) => {
            const attr = attributes.find((a) => a.id === row.attributeId)
            if (attr?.valueType === 'number') {
              return { attribute_id: row.attributeId, value_number: Number(row.valueNumber) }
            }
            return { attribute_id: row.attributeId, value_text: row.valueText }
          }),
      }
      if (isNew) await api.create(body)
      else await api.update(id!, body)
      navigate(`/${kind}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FeaturePage
      title={isNew ? `Create ${api.label.toLowerCase()}` : `Edit ${api.label.toLowerCase()}`}
      actions={
        <Button variant="outline" asChild>
          <Link to={`/${kind}`}>Back to list</Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <form className="mx-auto max-w-2xl space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <FormField label="Name" htmlFor="catalog-name" required>
            <Input id="catalog-name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Description" htmlFor="catalog-description">
            <Textarea id="catalog-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <FormField label="Status" htmlFor="catalog-status" required>
            <Select value={status} onValueChange={(v) => setStatus(v as 'verified' | 'pending')}>
              <SelectTrigger id="catalog-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Tags" htmlFor="catalog-tags">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  size="sm"
                  variant={tagIds.includes(tag.id) ? 'default' : 'outline'}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </FormField>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Attributes</p>
              <Button type="button" size="sm" variant="outline" onClick={addAttributeRow}>
                Add attribute
              </Button>
            </div>
            {attributeRows.map((row, index) => {
              const attr = attributes.find((a) => a.id === row.attributeId)
              return (
                <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  <Select
                    value={row.attributeId}
                    onValueChange={(v) =>
                      setAttributeRows((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, attributeId: v } : r)),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {attributes.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {attr?.valueType === 'number' ? (
                    <Input
                      type="number"
                      placeholder="Value"
                      value={row.valueNumber}
                      onChange={(e) =>
                        setAttributeRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, valueNumber: e.target.value } : r)),
                        )
                      }
                    />
                  ) : (
                    <Input
                      placeholder="Value"
                      value={row.valueText}
                      onChange={(e) =>
                        setAttributeRows((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, valueText: e.target.value } : r)),
                        )
                      }
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAttributeRows((rows) => rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? `Create ${api.label.toLowerCase()}` : 'Save changes'}
          </Button>
        </form>
      )}
    </FeaturePage>
  )
}
