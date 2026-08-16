import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rewriteMediaFileUrl, rewriteOptionalMediaFileUrl } from './rewriteMediaFileUrl.js'

describe('rewriteMediaFileUrl', () => {
  it('moves local Media file URLs from port 4003 to 4013', () => {
    assert.equal(
      rewriteMediaFileUrl(
        'http://localhost:4003/api/v1/files/qNMu4-ahwQh-l0XfjWQGq/gettyimages-597933040-612x612.jpg',
      ),
      'http://127.0.0.1:4013/api/v1/files/qNMu4-ahwQh-l0XfjWQGq/gettyimages-597933040-612x612.jpg',
    )
  })

  it('leaves current Media URLs and non-file URLs unchanged', () => {
    const current = 'http://127.0.0.1:4013/api/v1/files/abc/hero.png'
    assert.equal(rewriteMediaFileUrl(current), current)
    assert.equal(rewriteMediaFileUrl('https://lh3.googleusercontent.com/a/photo'), 'https://lh3.googleusercontent.com/a/photo')
    assert.equal(rewriteOptionalMediaFileUrl(null), null)
  })
})
