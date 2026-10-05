/**
 * Human label for a create tool, derived from name tokens (generic — no tool-name switch).
 * create_data_product → Product; create_data_tag → Tag; create_catalog_item → Item
 */
const GENERIC_PREFIX_TOKENS = new Set([
  'data',
  'catalog',
  'company',
  'my',
  'public',
  'library',
  'platform',
])

function singularize(token: string): string {
  if (token.endsWith('ies') && token.length > 4) {
    return `${token.slice(0, -3)}y`
  }
  if (token.endsWith('ses') && token.length > 4) {
    return token.slice(0, -2)
  }
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) {
    return token.slice(0, -1)
  }
  return token
}

function titleCase(token: string): string {
  if (!token) {
    return 'Item'
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

export function displayKindFromToolName(toolName: string): string {
  if (!toolName.startsWith('create_') && !toolName.startsWith('update_')) {
    return 'Item'
  }
  const tokens = toolName
    .replace(/^(?:create|update)_/, '')
    .split('_')
    .map((part) => part.toLowerCase())
    .filter((part) => part.length > 0 && !GENERIC_PREFIX_TOKENS.has(part))
  const raw = tokens[tokens.length - 1] ?? 'item'
  return titleCase(singularize(raw))
}
