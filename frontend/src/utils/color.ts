/** Cor: sempre armazenada em SRM; EBC só na exibição/entrada. */
export type ColorUnit = 'srm' | 'ebc'

export const EBC_PER_SRM = 1.97
export const COLOR_LABEL: Record<ColorUnit, string> = { srm: 'SRM', ebc: 'EBC' }

export const toDisplayColor = (srm: number, unit: ColorUnit) => (unit === 'ebc' ? srm * EBC_PER_SRM : srm)
/** Converte o valor digitado para SRM (2 casas, para ida e volta sem drift visível). */
export const toSrm = (value: number, unit: ColorUnit) =>
  unit === 'ebc' ? Math.round((value / EBC_PER_SRM) * 100) / 100 : value

/** Formata uma cor em SRM na unidade escolhida: EBC inteiro (como no BJCP); SRM com 1 casa se fracionário. */
export function formatColor(srm: number, unit: ColorUnit): string {
  const v = toDisplayColor(srm, unit)
  if (unit === 'ebc') return String(Math.round(v))
  return Number.isInteger(Math.round(v * 10) / 10) ? String(Math.round(v)) : v.toFixed(1)
}

// --- Preferência global (localStorage), observável por useSyncExternalStore ---

const STORAGE_KEY = 'brew-copilot:color-unit'
const listeners = new Set<() => void>()

function read(): ColorUnit {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ebc' ? 'ebc' : 'srm'
  } catch {
    return 'srm'
  }
}

let current: ColorUnit = read()

export const colorUnitStore = {
  get: () => current,
  set(unit: ColorUnit) {
    current = unit
    try {
      localStorage.setItem(STORAGE_KEY, unit)
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
