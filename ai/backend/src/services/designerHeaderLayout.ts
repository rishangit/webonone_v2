import type { ToolDefinition } from '../ai/tools/registry.js'
import { canvasSectionBriefs } from './designerTaskPlan.js'

const CANVAS_BLOCK = /\[designer-canvas\][\s\S]*?\[\/designer-canvas\]/g
const CANVAS_TOOLS = ['apply_design_library_canvas', 'apply_design_canvas'] as const

export function visibleDesignerRequest(content: string): string {
  return content.replace(CANVAS_BLOCK, ' ').replace(/\s+/g, ' ').trim()
}

export function designerCanvasKind(content: string): string | null {
  const canvas = content.match(/\[designer-canvas\][\s\S]*?\[\/designer-canvas\]/)
  const kind = canvas?.[0].match(/^kind:\s*(\S+)/m)
  return kind?.[1] ?? null
}

const DESIGNER_KINDS = new Set(['pages', 'headers', 'footers', 'presets'])

function isOpenDesigner(content: string): boolean {
  const kind = designerCanvasKind(content)
  return kind != null && DESIGNER_KINDS.has(kind)
}

/** Logo and company name on the left, page menu on the right, equal columns. */
export function headerRowCanvasArguments(content: string): { name: string; operations: Record<string, unknown>[] } | null {
  if (!isOpenDesigner(content)) return null
  const text = visibleDesignerRequest(content).toLowerCase()
  if (!/\bheader\b/.test(text)) return null
  const split = /\b(two|2)\b/.test(text) || /\b(equal|eual)\b/.test(text) || /\brow\b/.test(text)
  const left = /\blogo\b/.test(text) && /\bname\b/.test(text)
  const right = /\bmenu\b/.test(text)
  if (!split || !left || !right) return null
  return {
    name: 'Design Website Header',
    operations: [
      { op: 'add_block', name: 'Header' },
      { op: 'add_block', group: true, name: 'Company', align: 'start' },
      { op: 'add_addon', type: 'image', name: 'Company logo' },
      { op: 'add_addon', type: 'text', name: 'Company name', text: 'Company name', role: 'heading' },
      { op: 'add_block', group: true, name: 'Page menu', align: 'end' },
      { op: 'add_addon', type: 'menu', name: 'Page menu', items: ['Home', 'About', 'Contact'] },
    ],
  }
}

/** One full-width banner image on the open page. */
export function heroImageCanvasArguments(content: string): { name: string; operations: Record<string, unknown>[] } | null {
  if (!isOpenDesigner(content)) return null
  if (canvasSectionBriefs(content).length >= 2) return null
  const text = visibleDesignerRequest(content).toLowerCase()
  const image = /\b(image|photo|picture|banner|hero)\b/.test(text)
  const large = /\b(hero|banner|large)\b/.test(text) || /full[\s-]?width/.test(text)
  if (!image || !large) return null
  return {
    name: 'Add hero image section',
    operations: [
      { op: 'add_block', name: 'Hero image' },
      { op: 'add_addon', type: 'image', name: 'Hero image', span: 'full' },
    ],
  }
}

export function designerTurnTools(tools: ToolDefinition[], userMessage: string): ToolDefinition[] {
  if (!userMessage.includes('[designer-canvas]')) return tools
  const canvas = tools.filter((tool) => (CANVAS_TOOLS as readonly string[]).includes(tool.name))
  return canvas.length > 0 ? canvas : tools
}

export function pickCanvasTool(tools: ToolDefinition[], role: string): ToolDefinition | undefined {
  const library = tools.find((tool) => tool.name === 'apply_design_library_canvas')
  const company = tools.find((tool) => tool.name === 'apply_design_canvas')
  if (role === 'super_admin') return library ?? company
  return company ?? library
}
