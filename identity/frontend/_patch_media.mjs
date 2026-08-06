import fs from 'fs'

const file = 'd:/PROJECTS/2026/identity/frontend/src/features/profile/components/ProfileMediaSelectorModal.tsx'
let s = fs.readFileSync(file, 'utf8')

if (!s.includes("useTranslation")) {
  s = s.replace(
    "import { useCallback, useEffect, useRef, useState } from 'react'\nimport { useSearchParams } from 'react-router-dom'\n",
    "import { useCallback, useEffect, useRef, useState } from 'react'\nimport { useSearchParams } from 'react-router-dom'\nimport { useTranslation } from 'react-i18next'\n",
  )
}

if (!s.includes("const { t } = useTranslation('profile')")) {
  s = s.replace(
    '}: ProfileMediaSelectorModalProps) {\n  const [searchParams] = useSearchParams()\n',
    "}: ProfileMediaSelectorModalProps) {\n  const { t } = useTranslation('profile')\n  const [searchParams] = useSearchParams()\n",
  )
}

s = s.replace("title: 'Select profile photo',", "title: t('selectProfilePhoto'),")
s = s.replace('title="Select profile photo"', "title={t('selectProfilePhoto')}")
s = s.replace('Waiting for authentication…', "{t('waitingForAuthentication')}")
s = s.replace('            Close\n', "            {t('close')}\n")
s = s.replace('title="Crop Image"', "title={t('cropImage')}")
s = s.replace(
  'description="Drag to reposition. Use zoom and aspect ratio controls to adjust the crop area."',
  "description={t('cropImageDescription')}",
)
s = s.replace('              Cancel\n', "              {t('cancel')}\n")
s = s.replace('              Crop & Upload\n', "              {t('cropAndUpload')}\n")

// Fix useEffect deps to include t for host dialog title
s = s.replace(
  '  }, [hostParentOrigin, isOpen, openKey, profileFolderPath, scope])',
  '  }, [hostParentOrigin, isOpen, openKey, profileFolderPath, scope, t])',
)

fs.writeFileSync(file, s)
console.log('media modal', {
  useTranslation: s.includes("useTranslation('profile')"),
  hardSelect: s.includes('Select profile photo'),
  hardCrop: s.includes('Crop Image'),
})
