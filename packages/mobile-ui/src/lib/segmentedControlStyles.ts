import { cn } from './cn'
import {
  CONTROL_HEIGHT_CLASS,
  CONTROL_HEIGHT_SM_CLASS,
  controlLabelClassName,
} from './controlStyles'

/**
 * Segmented switch chrome — same heights as {@link CONTROL_HEIGHT_CLASS} / sm controls.
 * Transparent track + gradient selected segment (matches web ui-kit `SegmentedSwitch`).
 */

export const segmentedSwitchTrackClassName = cn(
  'flex-row items-stretch overflow-hidden rounded-control border bg-transparent p-1',
)

export const segmentedSwitchItemClassName = cn(
  'relative h-full min-h-0 min-w-0 flex-1 flex-row items-center justify-center overflow-hidden rounded-control',
  'gap-2',
)

export const segmentedSwitchItemLabelClassName = controlLabelClassName

export const segmentedSwitchHeights = {
  default: CONTROL_HEIGHT_CLASS,
  sm: CONTROL_HEIGHT_SM_CLASS,
} as const

export const segmentedSwitchItemPadding = {
  default: 'px-5',
  sm: 'px-4',
} as const
