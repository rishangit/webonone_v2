import assert from 'node:assert/strict'
import test from 'node:test'
import { rewriteWebsiteDocumentMedia } from './rewriteWebsiteDocumentMedia.js'

test('rewriteWebsiteDocumentMedia rewrites local image addon URLs', () => {
  const document = rewriteWebsiteDocumentMedia({
    version: 1,
    container: { height: 640 },
    blocks: [
      {
        id: 'block-1',
        zIndex: 0,
        layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 200 } },
        addons: [
          {
            id: 'addon-1',
            type: 'image',
            zIndex: 0,
            layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 200 } },
            props: {
              mediaByBreakpoint: {
                '2xl': {
                  fileId: 'abc123',
                  url: 'http://127.0.0.1:4013/api/v1/files/abc123/hero.png',
                  fileName: 'hero.png',
                },
              },
              fit: 'cover',
              heightMode: 'auto',
            },
          },
        ],
      },
    ],
  })

  const media = document.blocks[0]?.addons[0]?.props
  const resolved =
    media && 'mediaByBreakpoint' in media ? media.mediaByBreakpoint['2xl']?.url : undefined
  assert.match(resolved ?? '', /\/files\/abc123\/hero\.png$/)
})

test('rewriteWebsiteDocumentMedia builds URL when only fileId is stored', () => {
  const document = rewriteWebsiteDocumentMedia({
    version: 1,
    container: { height: 640 },
    blocks: [
      {
        id: 'block-1',
        zIndex: 0,
        layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 200 } },
        addons: [
          {
            id: 'addon-1',
            type: 'image',
            zIndex: 0,
            layout: { '2xl': { col: 1, colSpan: 12, top: 0, height: 200 } },
            props: {
              mediaByBreakpoint: {
                '2xl': {
                  fileId: 'abc123',
                  url: '',
                  fileName: 'hero.png',
                },
              },
              fit: 'cover',
              heightMode: 'auto',
            },
          },
        ],
      },
    ],
  })

  const media = document.blocks[0]?.addons[0]?.props
  const resolved =
    media && 'mediaByBreakpoint' in media ? media.mediaByBreakpoint['2xl']?.url : undefined
  assert.match(resolved ?? '', /\/files\/abc123\/hero\.png$/)
})
