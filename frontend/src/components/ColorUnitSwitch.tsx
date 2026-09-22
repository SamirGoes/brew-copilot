import { useColorUnit } from '../hooks/useColorUnit'
import { COLOR_LABEL, type ColorUnit } from '../utils/color'

/**
 * Botão compacto que alterna SRM/EBC; usado junto de uma faixa de cor (ex.: no estilo BJCP).
 * Muda a unidade no app todo. Para um campo editável, veja `ColorInput` (o próprio rótulo da
 * unidade dentro do campo já é o botão, para nunca desalinhar campos vizinhos).
 */
export default function ColorUnitSwitch() {
  const [unit, setUnit] = useColorUnit()
  const other: ColorUnit = unit === 'srm' ? 'ebc' : 'srm'
  return (
    <button
      type="button"
      className="color-unit-compact"
      onClick={() => setUnit(other)}
      aria-label={`Cor em ${COLOR_LABEL[unit]}; trocar para ${COLOR_LABEL[other]}`}
      title={`Trocar para ${COLOR_LABEL[other]}`}
    >
      {COLOR_LABEL[unit]}
    </button>
  )
}
