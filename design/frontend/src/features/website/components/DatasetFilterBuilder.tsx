import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { DatasetFieldDef, DatasetFilterRule, DatasetFilterOperator } from '../schemas/websiteDatasetSchemas'

const OPERATOR_LABELS: Record<DatasetFilterOperator, string> = {
  eq: 'Equals',
  neq: 'Not equal',
  gt: 'Greater than',
  gte: 'Greater or equal',
  lt: 'Less than',
  lte: 'Less or equal',
  between: 'Between',
  contains: 'Contains',
  in: 'In list',
}

function ruleValueAsString(rule: DatasetFilterRule): string {
  if (Array.isArray(rule.value)) {
    if (rule.operator === 'between') return ''
    return (rule.value as string[]).join(', ')
  }
  return rule.value == null ? '' : String(rule.value)
}

function betweenParts(rule: DatasetFilterRule): [string, string] {
  if (Array.isArray(rule.value) && rule.value.length === 2 && typeof rule.value[0] === 'number') {
    return [String(rule.value[0]), String(rule.value[1])]
  }
  return ['', '']
}

export function DatasetFilterBuilder({
  fields,
  rules,
  onChange,
}: {
  fields: DatasetFieldDef[]
  rules: DatasetFilterRule[]
  onChange: (rules: DatasetFilterRule[]) => void
}) {
  const { t } = useTranslation('website')

  function updateRule(index: number, patch: Partial<DatasetFilterRule>) {
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)))
  }

  function addRule() {
    const field = fields[0]
    if (!field) return
    onChange([
      ...rules,
      { field: field.field, operator: field.operators[0] ?? 'eq', value: field.valueType === 'number' ? 0 : '' },
    ])
  }

  function removeRule(index: number) {
    onChange(rules.filter((_, i) => i !== index))
  }

  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('datasetNoFields')}</p>
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('datasetNoRules')}</p>
      ) : null}
      {rules.map((rule, index) => {
        const fieldDef = fields.find((f) => f.field === rule.field) ?? fields[0]
        const operators = fieldDef?.operators ?? ['eq']
        const [minVal, maxVal] = betweenParts(rule)
        return (
          <div
            key={`${rule.field}-${index}`}
            className="grid grid-cols-1 gap-2 rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto]"
          >
            <FormField label={t('datasetField')} htmlFor={`dataset-field-${index}`}>
              <Select
                value={rule.field}
                onValueChange={(value) => {
                  const next = fields.find((f) => f.field === value) ?? fields[0]
                  updateRule(index, {
                    field: value,
                    operator: next.operators[0] ?? 'eq',
                    value: next.valueType === 'number' ? 0 : '',
                  })
                }}
              >
                <SelectTrigger id={`dataset-field-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.field} value={f.field}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t('datasetOperator')} htmlFor={`dataset-op-${index}`}>
              <Select
                value={rule.operator}
                onValueChange={(value) =>
                  updateRule(index, {
                    operator: value as DatasetFilterOperator,
                    value:
                      value === 'between'
                        ? [0, 0]
                        : value === 'in'
                          ? []
                          : fieldDef?.valueType === 'number'
                            ? 0
                            : '',
                  })
                }
              >
                <SelectTrigger id={`dataset-op-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {OPERATOR_LABELS[op] ?? op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="min-w-0">
              {rule.operator === 'between' ? (
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={t('datasetMin')} htmlFor={`dataset-min-${index}`}>
                    <Input
                      id={`dataset-min-${index}`}
                      type="number"
                      value={minVal}
                      onChange={(e) => {
                        const min = Number(e.target.value)
                        const max = Number(maxVal || 0)
                        updateRule(index, { value: [min, max] })
                      }}
                    />
                  </FormField>
                  <FormField label={t('datasetMax')} htmlFor={`dataset-max-${index}`}>
                    <Input
                      id={`dataset-max-${index}`}
                      type="number"
                      value={maxVal}
                      onChange={(e) => {
                        const max = Number(e.target.value)
                        const min = Number(minVal || 0)
                        updateRule(index, { value: [min, max] })
                      }}
                    />
                  </FormField>
                </div>
              ) : fieldDef?.valueType === 'enum' && fieldDef.enumValues ? (
                <FormField label={t('datasetValue')} htmlFor={`dataset-value-${index}`}>
                  <Select
                    value={String(rule.value ?? '')}
                    onValueChange={(value) => updateRule(index, { value })}
                  >
                    <SelectTrigger id={`dataset-value-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldDef.enumValues.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              ) : (
                <FormField
                  label={rule.operator === 'in' ? t('datasetValueList') : t('datasetValue')}
                  htmlFor={`dataset-value-${index}`}
                >
                  <Input
                    id={`dataset-value-${index}`}
                    type={fieldDef?.valueType === 'number' && rule.operator !== 'in' ? 'number' : 'text'}
                    value={ruleValueAsString(rule)}
                    placeholder={rule.operator === 'in' ? t('datasetValueListHint') : undefined}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (rule.operator === 'in') {
                        updateRule(index, {
                          value: raw
                            .split(',')
                            .map((part) => part.trim())
                            .filter(Boolean),
                        })
                        return
                      }
                      if (fieldDef?.valueType === 'number') {
                        updateRule(index, { value: raw === '' ? 0 : Number(raw) })
                        return
                      }
                      updateRule(index, { value: raw })
                    }}
                  />
                </FormField>
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-3"
                aria-label={t('datasetRemoveRule')}
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
      <Button type="button" variant="outline" className="h-10" onClick={addRule}>
        <Plus className="mr-2 h-4 w-4" />
        {t('datasetAddRule')}
      </Button>
    </div>
  )
}
