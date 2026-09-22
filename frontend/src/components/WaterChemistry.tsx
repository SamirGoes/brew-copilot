import { useEffect, useState } from 'react'
import { calculate, errorMessage } from '../api/client'
import { num } from '../hooks/useCalculation'
import type { WaterProfile, WaterProfileRow } from '../types'
import { fmt } from '../utils/format'
import { NumberField } from './Field'
import WaterSaltsCalc from './WaterSaltsCalc'

export default function WaterChemistry() {
  const [profile, setProfile] = useState<WaterProfile>('malty')
  const [mash, setMash] = useState('13')
  const [sparge, setSparge] = useState('17')
  const [table, setTable] = useState<WaterProfileRow[]>([])
  const [tableError, setTableError] = useState<string | null>(null)

  useEffect(() => {
    calculate.waterProfiles().then(setTable).catch((e) => setTableError(errorMessage(e)))
  }, [])

  return (
    <div className="stack">
      <section className="card">
        <h2>Química da água</h2>
        <div className="grid grid-2">
          <NumberField label="Água de mostura" unit="L" value={mash} onChange={setMash} />
          <NumberField label="Água de lavagem" unit="L" value={sparge} onChange={setSparge} placeholder="opcional" />
        </div>
        <WaterSaltsCalc profile={profile} onProfileChange={setProfile} mashVolumeL={num(mash)} spargeVolumeL={num(sparge)} />
      </section>

      <section className="card">
        <h2>Referência (por 10 L)</h2>
        {tableError && <p className="alert alert-bad">{tableError}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Perfil</th>
              <th>CaSO₄</th>
              <th>MgSO₄</th>
              <th>CaCl₂</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr key={row.profile} className={row.profile === profile ? 'row-active' : ''}>
                <td>{row.label}</td>
                <td>{fmt(row.caso4_g)} g</td>
                <td>{fmt(row.mgso4_g)} g</td>
                <td>{fmt(row.cacl_g)} g</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Ácido ascórbico: 5 gotas por 10 L.</p>
      </section>
    </div>
  )
}
