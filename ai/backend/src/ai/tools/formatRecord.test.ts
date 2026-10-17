import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatRecordLines, recordsFromUnknown, withRecordOpen } from './formatRecord.js'

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

  it('unwraps a single form record so the designer path can open', () => {
    const records = recordsFromUnknown({
      status: 'executed',
      data: { form: { id: 'formId12345678', name: 'Patient intake' } },
    })
    assert.equal(records.length, 1)
    assert.equal(records[0]?.id, 'formId12345678')
    const [record] = withRecordOpen(records, {
      service: 'design',
      viewPath: '/forms/{id}/edit',
    })
    assert.deepEqual(record?.__open, {
      service: 'design',
      path: '/forms/formId12345678/edit',
    })
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

describe('withRecordOpen', () => {
  it('interpolates Data library service paths', () => {
    const [record] = withRecordOpen(
      [{ id: 'XBhm6jUMTSWw1Xydmmmi-', name: 'General Consultation' }],
      { service: 'data', viewPath: '/services/{id}' },
    )
    assert.deepEqual(record?.__open, {
      service: 'data',
      path: '/services/XBhm6jUMTSWw1Xydmmmi-',
    })
  })

  it('uses entityKind from the record when kind is in tool args', () => {
    const [record] = withRecordOpen(
      [{ id: 'abc12345', entityKind: 'services', name: 'General Consultation' }],
      { service: 'webonone', viewPath: '/data/{kind}/{id}' },
      { kind: 'products' },
    )
    assert.deepEqual(record?.__open, {
      service: 'webonone',
      path: '/data/services/abc12345',
    })
  })

  it('omits open when id is missing', () => {
    const [record] = withRecordOpen([{ name: 'General Consultation' }], {
      service: 'data',
      viewPath: '/services/{id}',
    })
    assert.equal(record?.__open, undefined)
  })
})
