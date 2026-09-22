import { useSyncExternalStore } from 'react'
import { type ColorUnit, colorUnitStore } from '../utils/color'

/** Unidade de cor escolhida (SRM/EBC), igual em todo o app. */
export function useColorUnit(): [ColorUnit, (unit: ColorUnit) => void] {
  const unit = useSyncExternalStore(colorUnitStore.subscribe, colorUnitStore.get)
  return [unit, colorUnitStore.set]
}
