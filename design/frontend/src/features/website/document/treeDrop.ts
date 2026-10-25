/** Where a navigation-tree drag will land relative to the row under the pointer. */
export type TreeDropPlacement = 'before' | 'after' | 'inside'

export type TreeDrag =
  | { kind: 'block'; blockId: string; parentBlockId: string | null; index: number }
  | { kind: 'addon'; blockId: string; addonId: string; index: number }

export type TreeDropHint = { treeId: string; placement: TreeDropPlacement }

export type TreeMove =
  | { kind: 'addon'; fromBlockId: string; addonId: string; toBlockId: string; toIndex: number }
  | { kind: 'block'; blockId: string; toParentId: string | null; toIndex: number }

/** Top and bottom bands of a block row reorder siblings. The middle nests inside the block. */
const BLOCK_REORDER_EDGE = 0.28

export function placementFromPointer(ratio: number, nestable: boolean): TreeDropPlacement {
  const clamped = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0.5
  if (!nestable) return clamped < 0.5 ? 'before' : 'after'
  if (clamped < BLOCK_REORDER_EDGE) return 'before'
  if (clamped > 1 - BLOCK_REORDER_EDGE) return 'after'
  return 'inside'
}

/**
 * Index in the destination sibling list after a before/after drop.
 * Same-list moves account for the source row being removed first.
 */
export function siblingInsertIndex(
  fromIndex: number,
  targetIndex: number,
  placement: 'before' | 'after',
  sameList: boolean,
): number {
  let index = placement === 'before' ? targetIndex : targetIndex + 1
  if (sameList && fromIndex >= 0 && fromIndex < index) index -= 1
  return Math.max(0, index)
}

export function hintForBlockRow(args: {
  drag: TreeDrag
  zone: TreeDropPlacement
  blockId: string
  parentBlockId: string | null
  blockIndex: number
  parentIsInsideDrag: boolean
  blockIsInsideDrag: boolean
}): TreeDropHint | null {
  if (args.drag.kind === 'addon') {
    return { treeId: `block:${args.blockId}`, placement: 'inside' }
  }
  if (args.zone === 'inside') {
    if (args.drag.blockId === args.blockId || args.blockIsInsideDrag) return null
    return { treeId: `block:${args.blockId}`, placement: 'inside' }
  }
  if (args.parentIsInsideDrag) return null
  const placement = args.zone === 'after' ? 'after' : 'before'
  if (
    args.drag.parentBlockId === args.parentBlockId &&
    siblingInsertIndex(args.drag.index, args.blockIndex, placement, true) === args.drag.index
  ) {
    return null
  }
  return { treeId: `block:${args.blockId}`, placement }
}

export function hintForAddonRow(args: {
  drag: TreeDrag
  zone: TreeDropPlacement
  addonId: string
  addonIndex: number
  hostBlockId: string
  hostIsInsideDrag: boolean
}): TreeDropHint | null {
  if (args.drag.kind === 'block') {
    if (args.drag.blockId === args.hostBlockId || args.hostIsInsideDrag) return null
    return { treeId: `block:${args.hostBlockId}`, placement: 'inside' }
  }
  const placement = args.zone === 'after' ? 'after' : 'before'
  if (
    args.drag.blockId === args.hostBlockId &&
    siblingInsertIndex(args.drag.index, args.addonIndex, placement, true) === args.drag.index
  ) {
    return null
  }
  return { treeId: `addon:${args.addonId}`, placement }
}

export function blockDropMove(args: {
  drag: TreeDrag
  zone: TreeDropPlacement
  blockId: string
  parentBlockId: string | null
  blockIndex: number
  childCount: number
  addonCount: number
  parentIsInsideDrag: boolean
  blockIsInsideDrag: boolean
}): TreeMove | null {
  const hint = hintForBlockRow(args)
  if (!hint) return null
  if (args.drag.kind === 'addon') {
    return {
      kind: 'addon',
      fromBlockId: args.drag.blockId,
      addonId: args.drag.addonId,
      toBlockId: args.blockId,
      toIndex: args.addonCount,
    }
  }
  if (hint.placement === 'inside') {
    return {
      kind: 'block',
      blockId: args.drag.blockId,
      toParentId: args.blockId,
      toIndex: args.childCount,
    }
  }
  const sameList = args.drag.parentBlockId === args.parentBlockId
  return {
    kind: 'block',
    blockId: args.drag.blockId,
    toParentId: args.parentBlockId,
    toIndex: siblingInsertIndex(
      sameList ? args.drag.index : -1,
      args.blockIndex,
      hint.placement === 'after' ? 'after' : 'before',
      sameList,
    ),
  }
}

export function addonDropMove(args: {
  drag: TreeDrag
  zone: TreeDropPlacement
  addonId: string
  addonIndex: number
  hostBlockId: string
  hostIsInsideDrag: boolean
}): TreeMove | null {
  const hint = hintForAddonRow(args)
  if (!hint) return null
  if (args.drag.kind === 'block') {
    return {
      kind: 'block',
      blockId: args.drag.blockId,
      toParentId: args.hostBlockId,
      toIndex: Number.MAX_SAFE_INTEGER,
    }
  }
  const sameList = args.drag.blockId === args.hostBlockId
  return {
    kind: 'addon',
    fromBlockId: args.drag.blockId,
    addonId: args.drag.addonId,
    toBlockId: args.hostBlockId,
    toIndex: siblingInsertIndex(
      sameList ? args.drag.index : -1,
      args.addonIndex,
      hint.placement === 'after' ? 'after' : 'before',
      sameList,
    ),
  }
}
