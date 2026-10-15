import type {
  CompanyCatalogAttribute,
  CompanyCatalogVariant,
} from '../services/companyCatalogApi'

export function multiValueCompanyCatalogAttributes(
  attributes: CompanyCatalogAttribute[],
): CompanyCatalogAttribute[] {
  return attributes.filter((attribute) => attribute.values.length >= 2)
}

export function initialSelectedLibraryValueIds(
  variant: CompanyCatalogVariant,
): Record<string, string> {
  const selected: Record<string, string> = {}
  for (const pick of variant.values) {
    if (pick.libraryValueId) {
      selected[pick.attributeId] = pick.libraryValueId
    }
  }
  return selected
}

export function resolveCompanyVariantLibraryValueIds(
  attributes: CompanyCatalogAttribute[],
  selectedByAttributeId: Record<string, string>,
): string[] {
  const ids: string[] = []
  for (const attribute of attributes) {
    if (attribute.values.length === 0) continue
    if (attribute.values.length === 1) {
      const libraryId = attribute.values[0]?.libraryValueId
      if (libraryId) ids.push(libraryId)
      continue
    }
    const libraryId = selectedByAttributeId[attribute.attributeId]
    if (libraryId) ids.push(libraryId)
  }
  return ids
}

function combinationKey(libraryValueIds: string[]): string {
  return [...libraryValueIds].sort().join('|')
}

export function isDuplicateCompanyVariantCombination(
  attributes: CompanyCatalogAttribute[],
  selectedByAttributeId: Record<string, string>,
  existingVariants: CompanyCatalogVariant[],
  excludeVariantId: string,
): boolean {
  const nextKey = combinationKey(
    resolveCompanyVariantLibraryValueIds(attributes, selectedByAttributeId),
  )
  return existingVariants.some((variant) => {
    if (variant.id === excludeVariantId) return false
    const key = combinationKey(variant.values.map((value) => value.libraryValueId))
    return key === nextKey
  })
}

export function validateCompanyVariantAttributeSelection(
  attributes: CompanyCatalogAttribute[],
  selectedByAttributeId: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const attribute of multiValueCompanyCatalogAttributes(attributes)) {
    if (!selectedByAttributeId[attribute.attributeId]) {
      errors[`selected.${attribute.attributeId}`] = 'required'
    }
  }
  return errors
}
