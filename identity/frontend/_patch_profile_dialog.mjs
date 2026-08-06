import fs from 'fs'

const file = 'd:/PROJECTS/2026/identity/frontend/src/features/profile/components/ProfileFormDialog.tsx'
let s = fs.readFileSync(file, 'utf8')

if (!s.includes('useTranslation')) {
  s = s.replace(
    "import { useCallback, useEffect, useRef, useState } from 'react'\nimport { useSearchParams } from 'react-router-dom'\n",
    "import { useCallback, useEffect, useRef, useState } from 'react'\nimport { useSearchParams } from 'react-router-dom'\nimport { useTranslation } from 'react-i18next'\nimport { normalizeLocale } from '@webonone/i18n'\n",
  )
  s = s.replace(
    "import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'\n",
    "import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'\nimport { changeAppLocale } from '@/features/shell/utils/changeAppLocale'\n",
  )
}

s = s.replace(
  /const STEP_TITLES = \['Account', 'Address', 'Contact', 'Name', 'Summary'\] as const\r?\n\r?\nconst STEP_DESCRIPTIONS = \[\r?\n  'Update your profile photo.',\r?\n  'Postal \/ street address.',\r?\n  'How others can reach you.',\r?\n  'Legal and display names.',\r?\n  'Review your changes before saving.',\r?\n\] as const\r?\n\r?\n/,
  '',
)

if (!s.includes('STEP_TITLE_KEYS')) {
  s = s.replace(
    "const PROFILE_EDIT_EMBED_PATH = '/embed/dialogs/profile/edit'\n",
    `const PROFILE_EDIT_EMBED_PATH = '/embed/dialogs/profile/edit'

const STEP_TITLE_KEYS = ['stepAccount', 'stepAddress', 'stepContact', 'stepName', 'stepSummary'] as const
const STEP_DESCRIPTION_KEYS = [
  'stepAccountDescription',
  'stepAddressDescription',
  'stepContactDescription',
  'stepNameDescription',
  'stepSummaryDescription',
] as const
`,
  )
}

s = s.replace(
  '}: ProfileFormDialogProps) {\n  const dispatch = useAppDispatch()\n',
  "}: ProfileFormDialogProps) {\n  const { t } = useTranslation(['profile', 'common'])\n  const dispatch = useAppDispatch()\n",
)

s = s.replace("  const title = 'Edit profile'\n  const finalSubmitLabel = 'Save changes'\n\n", '')

s = s.replace(
  `  const primaryLabelForStep = (current: ProfileWizardStep, saving: boolean) => {
    if (saving) return 'Saving…'
    if (current < PROFILE_WIZARD_TOTAL_STEPS) return 'Next'
    return finalSubmitLabel
  }
`,
  `  const stepTitles = STEP_TITLE_KEYS.map((key) => t(key))
  const stepDescriptions = STEP_DESCRIPTION_KEYS.map((key) => t(key))
  const title = t('editProfile')
  const finalSubmitLabel = t('saveChanges')

  const primaryLabelForStep = (current: ProfileWizardStep, saving: boolean) => {
    if (saving) return t('saving')
    if (current < PROFILE_WIZARD_TOTAL_STEPS) return t('next')
    return finalSubmitLabel
  }
`,
)

s = s.replace('description: STEP_DESCRIPTIONS[embedStep - 1],', 'description: stepDescriptions[embedStep - 1],')
s = s.replace(
  "secondaryLabel: embedStep > 1 ? 'Previous' : undefined,",
  "secondaryLabel: embedStep > 1 ? t('previous') : undefined,",
)

s = s.replace(
  `  useEffect(() => {
    if (!submittedRef.current || isProfileSaving) return
    submittedRef.current = false
    if (!profileError) {
      onSaved()
      if (chrome === 'dialog') {
        onOpenChange(false)
      }
    }
  }, [chrome, isProfileSaving, onOpenChange, onSaved, profileError])
`,
  `  useEffect(() => {
    if (!submittedRef.current || isProfileSaving) return
    submittedRef.current = false
    if (!profileError) {
      const nextLocale = values?.locale
      if (nextLocale) {
        void changeAppLocale(normalizeLocale(nextLocale))
      }
      onSaved()
      if (chrome === 'dialog') {
        onOpenChange(false)
      }
    }
  }, [chrome, isProfileSaving, onOpenChange, onSaved, profileError, values?.locale])
`,
)

s = s.replace(
  "description: STEP_DESCRIPTIONS[step - 1],\n        secondaryLabel: step > 1 ? 'Previous' : null,",
  "description: stepDescriptions[step - 1],\n        secondaryLabel: step > 1 ? t('previous') : null,",
)

s = s.replace('Loading profile…', "{t('loadingProfile')}")
s = s.replace('        Cancel\n', "        {t('cancel')}\n")
s = s.replace('          Previous\n', "          {t('previous')}\n")
s = s.replace('          Next\n', "          {t('next')}\n")
s = s.replace(
  "{isProfileSaving ? 'Saving…' : finalSubmitLabel}",
  "{isProfileSaving ? t('saving') : finalSubmitLabel}",
)
s = s.replace(
  'Step {step} of {PROFILE_WIZARD_TOTAL_STEPS} — {STEP_TITLES[stepIndex]}',
  "{t('stepOf', { current: step, total: PROFILE_WIZARD_TOTAL_STEPS, title: stepTitles[stepIndex] })}",
)
s = s.replace('description={STEP_DESCRIPTIONS[stepIndex]}', 'description={stepDescriptions[stepIndex]}')

fs.writeFileSync(file, s)
console.log('ok', {
  changeAppLocale: s.includes('changeAppLocale'),
  STEP_TITLE_KEYS: s.includes('STEP_TITLE_KEYS'),
  noSTEP_TITLES: !s.includes('STEP_TITLES'),
  noHardCancel: !s.includes('        Cancel\n'),
})
