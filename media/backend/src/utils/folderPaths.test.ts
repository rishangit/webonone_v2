import assert from 'node:assert/strict'
import test from 'node:test'
import {
  folderDropRejection,
  joinFolder,
  rebaseFolderPath,
} from './folderPaths.js'

test('rebaseFolderPath moves a folder and its children', () => {
  assert.equal(rebaseFolderPath('/web/photos', '/web/photos', '/archive/photos'), '/archive/photos')
  assert.equal(
    rebaseFolderPath('/web/photos/2024', '/web/photos', '/archive/photos'),
    '/archive/photos/2024',
  )
  assert.equal(rebaseFolderPath('/web/other', '/web/photos', '/archive/photos'), '/web/other')
})

test('folderDropRejection blocks dropping a folder into itself or its parent', () => {
  assert.equal(folderDropRejection('/web/photos', '/web/photos'), 'A folder cannot be moved into itself')
  assert.equal(
    folderDropRejection('/web/photos', '/web/photos/2024'),
    'A folder cannot be moved into its own subfolder',
  )
  assert.equal(folderDropRejection('/web/photos', '/web'), 'Already in this folder')
  assert.equal(folderDropRejection('/web/photos', '/archive'), null)
  assert.equal(joinFolder('/archive', 'photos'), '/archive/photos')
  assert.equal(joinFolder('/', 'photos'), '/photos')
})
