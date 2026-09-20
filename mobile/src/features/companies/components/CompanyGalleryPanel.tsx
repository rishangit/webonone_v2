import { View } from 'react-native'

import { EditableSectionCard, ImagePreview, Muted } from '@webonone/mobile-ui'

import type { CompanyDetail } from '@/features/companies/services/companyApi'



export type CompanyGallerySection = 'logo' | 'gallery'



export function CompanyGalleryPanel({

  detail,

  canEdit,

  onEditSection,

}: {

  detail: CompanyDetail

  canEdit?: boolean

  onEditSection?: (section: CompanyGallerySection) => void

}) {

  const images = detail.galleryImages ?? []



  return (

    <View className="gap-6">

      <EditableSectionCard

        title="Company logo"

        description="Logo shown on lists and the public profile"

        canEdit={canEdit}

        onEdit={onEditSection ? () => onEditSection('logo') : undefined}

      >

        <ImagePreview

          src={detail.logoUrl}

          alt={detail.name}

          className="h-24 w-24 self-center rounded-md"

        />

      </EditableSectionCard>



      <EditableSectionCard

        title="Gallery"

        description="Images shown on the company public profile"

        canEdit={canEdit}

        onEdit={onEditSection ? () => onEditSection('gallery') : undefined}

      >

        {images.length === 0 ? (

          <Muted>No gallery images yet.</Muted>

        ) : (

          <View className="flex-row flex-wrap gap-3">

            {images.map((image) => (

              <ImagePreview

                key={image.mediaId}

                src={image.url}

                alt="Gallery image"

                className="h-24 w-24 rounded-lg"

              />

            ))}

          </View>

        )}

      </EditableSectionCard>

    </View>

  )

}

