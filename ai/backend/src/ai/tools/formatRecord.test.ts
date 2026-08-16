import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatRecordLines, recordsFromUnknown } from './formatRecord.js'

describe('formatRecordLines', () => {
  it('renders key:value lines without JSON quotes', () => {
    const text = formatRecordLines({
      name: 'PatientCare',
      description: 'Care and treatment for patients.',
      status: 'pending',
      color: '#4F46E5',
    })
    assert.equal(
      text,
      'name:PatientCare\ndescription:Care and treatment for patients.\nstatus:pending\ncolor:#4F46E5',
    )
  })
})

describe('recordsFromUnknown', () => {
  it('unwraps executed list payloads', () => {
    const records = recordsFromUnknown({
      status: 'executed',
      data: {
        items: [
          { name: 'PatientCare', description: 'Care and treatment for patients.' },
          { name: 'EmergencyMedicine', description: 'Emergency medical care and services.' },
        ],
      },
    })
    assert.equal(records.length, 2)
    assert.equal(records[0]?.name, 'PatientCare')
  })

  it('skips pending confirmation payloads', () => {
    assert.deepEqual(
      recordsFromUnknown({
        status: 'pending_confirmation',
        arguments: { name: 'PatientCare' },
      }),
      [],
    )
  })
})
