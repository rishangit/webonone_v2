import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ZodError } from 'zod'
import type { FormDefinition } from '../schemas/formSchemas.ts'
import { HttpError } from './httpError.ts'
import { appendFormField, normalizeCreateFormBody, patchFormField } from './formDefinition.ts'

const intake: FormDefinition = {
  version: 1,
  fields: [
    { id: 'namefield1', type: 'text', label: 'Name', required: false, placeholder: 'Full name' },
    { id: 'phonefield', type: 'text', label: 'Phone', required: false },
  ],
}

describe('normalizeCreateFormBody', () => {
  it('maps label-only fields onto a definition and assigns ids', () => {
    const body = normalizeCreateFormBody({
      name: 'Patient intake',
      slug: 'patient-intake',
      fields: [
        { type: 'text', label: 'Name', placeholder: 'Full name' },
        {
          type: 'select',
          label: 'Reason',
          required: true,
          options: ['Visit', { label: 'Follow-up' }],
        },
        { type: 'media', label: 'Documents', allowMultiple: true },
        { type: 'checkbox', label: 'Consent', allowMultiple: true },
      ],
    }) as { definition: FormDefinition; fields?: unknown }

    assert.equal(body.fields, undefined)
    assert.equal(body.definition.version, 1)
    assert.equal(body.definition.fields.length, 4)
    const name = body.definition.fields[0]
    assert.equal(name?.label, 'Name')
    assert.ok(name && name.id.length >= 8)
    const reason = body.definition.fields[1]
    assert.equal(reason?.required, true)
    assert.equal(reason?.options?.[0]?.label, 'Visit')
    assert.equal(reason?.options?.[1]?.label, 'Follow-up')
    assert.ok(reason?.options?.[0]?.id)
    assert.equal(body.definition.fields[2]?.allowMultiple, true)
    assert.equal(body.definition.fields[3]?.allowMultiple, undefined)
  })

  it('keeps designer field and option ids', () => {
    const body = normalizeCreateFormBody({
      name: 'Intake',
      slug: 'intake',
      definition: {
        version: 1,
        fields: [
          {
            id: 'field-keep',
            type: 'radio',
            label: 'Yes or no',
            options: [{ id: 'opt-keep', label: 'Yes' }],
          },
        ],
      },
    }) as { definition: FormDefinition }

    assert.equal(body.definition.fields[0]?.id, 'field-keep')
    assert.equal(body.definition.fields[0]?.options?.[0]?.id, 'opt-keep')
  })
})

describe('appendFormField', () => {
  it('appends one control and leaves existing controls unchanged', () => {
    const next = appendFormField(intake, {
      type: 'select',
      label: 'Reason',
      required: true,
      options: ['Visit', 'Follow-up'],
    })
    assert.equal(next.fields.length, 3)
    assert.deepEqual(next.fields[0], intake.fields[0])
    assert.deepEqual(next.fields[1], intake.fields[1])
    assert.equal(next.fields[2]?.label, 'Reason')
    assert.equal(next.fields[2]?.options?.length, 2)
  })

  it('rejects a dropdown without options', () => {
    assert.throws(
      () => appendFormField(intake, { type: 'select', label: 'Reason' }),
      ZodError,
    )
  })
})

describe('patchFormField', () => {
  it('updates one control and leaves the others unchanged', () => {
    const next = patchFormField(intake, 'phonefield', { required: true, placeholder: 'Mobile' })
    assert.deepEqual(next.fields[0], intake.fields[0])
    assert.equal(next.fields[1]?.required, true)
    assert.equal(next.fields[1]?.placeholder, 'Mobile')
    assert.equal(next.fields[1]?.label, 'Phone')
  })

  it('replaces options when they are sent', () => {
    const withReason = appendFormField(intake, {
      id: 'reasonfld',
      type: 'radio',
      label: 'Reason',
      options: [{ id: 'opt-old', label: 'Visit' }],
    })
    const next = patchFormField(withReason, 'reasonfld', { options: ['New', 'Other'] })
    assert.deepEqual(next.fields[0], intake.fields[0])
    assert.deepEqual(
      next.fields[2]?.options?.map((option) => option.label),
      ['New', 'Other'],
    )
    assert.notEqual(next.fields[2]?.options?.[0]?.id, 'opt-old')
  })

  it('ignores allowMultiple on a non-media control', () => {
    const next = patchFormField(intake, 'phonefield', { allowMultiple: true, required: true })
    assert.equal(next.fields[1]?.allowMultiple, undefined)
    assert.equal(next.fields[1]?.required, true)
  })

  it('throws when the control id is missing', () => {
    assert.throws(
      () => patchFormField(intake, 'missingfld', { required: true }),
      (error: unknown) => error instanceof HttpError && error.code === 'FORM_FIELD_NOT_FOUND',
    )
  })
})
