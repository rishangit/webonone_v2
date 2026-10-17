import { copyPresetDocument } from '../catalog/websiteLibrary.js'
import type { WebsiteAddon, WebsiteBlock, WebsiteDocumentV1 } from '../schemas/websiteDocument.schema.js'

function detachBlock(block: WebsiteBlock): WebsiteBlock {
  return {
    ...block,
    dataBinding: block.dataBinding ? { ...block.dataBinding, datasetId: null } : block.dataBinding,
    addons: block.addons.map(detachAddon),
    children: block.children.map(detachBlock),
  }
}

function detachAddon(addon: WebsiteAddon): WebsiteAddon {
  if (addon.type === 'button') {
    return { ...addon, props: { ...addon.props, linkPageId: null } }
  }
  if (addon.type === 'menu') {
    return {
      ...addon,
      props: {
        ...addon.props,
        items: addon.props.items.map((item) => ({
          ...item,
          linkPageId: null,
          children: item.children.map((child) => ({ ...child, linkPageId: null })),
        })),
      },
    }
  }
  if (addon.type === 'slider') {
    const dataSource = addon.props.dataSource === 'dataset' ? 'manual' : addon.props.dataSource
    return {
      ...addon,
      props: {
        ...addon.props,
        dataSource,
        datasetId: null,
        sourcePresetId: null,
        slideTemplate: addon.props.slideTemplate ? detachBlock(addon.props.slideTemplate) : null,
      },
    }
  }
  return addon
}

/** New block ids, with company-only dataset and page links cleared. */
export function detachCompanyDocumentRefs(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  const copied = copyPresetDocument(document)
  return {
    ...copied,
    blocks: copied.blocks.map(detachBlock),
  }
}
