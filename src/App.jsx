import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [auta, setAuta] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')

  const [jmenoRidice, setJmenoRidice] = useState('')
  const [vybraneAutoId, setVybraneAutoId] = useState('')
  const [zacatekSmeny, setZacatekSmeny] = useState('')
  const [konecSmeny, setKonecSmeny] = useState('')
  const [typSmeny, setTypSmeny] = useState('Denní')

  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => {
    nactiAuta()
    nactiSmeny()
  }, [])

  async function nactiAuta() {
    const { data } = await supabase.from('auta').select('*')
    if (data) {
      setAuta(data)
      if (data.length > 0) setVybraneAutoId(data[0].id)
    }
  }

  async function nactiSmeny() {
    const { data, error } = await supabase.from('smeny').select('*, auta(spz, typ_vozu)').order('zacatek', { ascending: true })
    if (error) console.error('Chyba:', error)
    else setSmeny(data)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: jmenoRidice, auto_id: vybraneAutoId, zacatek: zacatekSmeny, konec: konecSmeny, typ_smeny: typSmeny
    }])
    if (error) {
      alert('Chyba: ' + error.message)
    } else {
      alert('Směna uložena!')
      setJmenoRidice(''); setZacatekSmeny(''); setKonecSmeny('');
      nactiSmeny()
    }
  }

  async function smazSmenu(id) {
    if (window.confirm('Opravdu chcete tuto směnu nenávratně smazat?')) {
      const { error } = await supabase.from('smeny').delete().eq('id', id)
      if (error) alert('Chyba při mazání: ' + error.message)
      else nactiSmeny()
    }
  }

  function prihlaseniDispecera() {
    const heslo = window.prompt('Zadejte heslo pro přístup do Dispečinku:')
    if (heslo === 'taxi123') {
      setZobrazeni('dispecer')
    } else if (heslo !== null) {
      alert('Nesprávné heslo!')
    }
  }

  const mojeNaplanovaneSmeny = smeny.filter(smena => 
    smena.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2
  )

  return (
    <div style={{ backgroundColor: zobrazeni === 'ridic' ? '#121212' : '#f5f5f5', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: zobrazeni === 'ridic' ? '#1e1e1e' : '#fff', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, color: zobrazeni === 'ridic' ? '#fff' : '#333', fontSize: '1.2em' }}>RB taxi Hodonín</h1>
        <div>
          <button onClick={() => setZobrazeni('ridic')} style={btnStyle}>Řidič</button>
          <button onClick={prihlaseniDispecera} style={btnStyle}>Dispečink</button>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        {zobrazeni === 'ridic' ? (
          <div style={{ maxWidth: '400px', margin: 'auto', color: 'white' }}>
            <input type="text" value={mojeJmeno} onChange={(e) => setMojeJmeno(e.target.value)} placeholder="Zadej své jméno..." style={inputStyle} />
            <h2 style={{ color: '#f39c12' }}>Tvoje směny</h2>
            {mojeNaplanovaneSmeny.map((smena) => (
              <div key={smena.id} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: '5px solid #f39c12' }}>
                <strong>{smena.typ_smeny}</strong> | {smena.auta?.spz}<br/>
                <small>{new Date(smena.zacatek).toLocaleString('cs-CZ')}</small>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: '900px', margin: 'auto' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3>Nová směna</h3>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input required placeholder="Jméno" value={jmenoRidice} onChange={(e) => setJmenoRidice(e.target.value)} style={inputStyle} />
                <select value={vybraneAutoId} onChange={(e) => setVybraneAutoId(e.target.value)} style={inputStyle}>
                  {auta.map(auto => <option key={auto.id} value={auto.id}>{auto.spz}</option>)}
                </select>
                <input required type="datetime-local" value={zacatekSmeny} onChange={(e) => setZacatekSmeny(e.target.value)} style={inputStyle} />
                <input required type="datetime-local" value={konecSmeny} onChange={(e) => setKonecSmeny(e.target.value)} style={inputStyle} />
                <button type="submit" style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '10px', borderRadius: '5px' }}>Uložit</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={thStyle}>Řidič</th><th style={thStyle}>Auto</th><th style={thStyle}>Od</th><th style={thStyle}>Do</th><th style={thStyle}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.map(smena => (
                    <tr key={smena.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{smena.jmeno_ridice}</td>
                      <td style={tdStyle}>{smena.auta?.spz}</td>
                      <td style={tdStyle}>{new Date(smena.zacatek).toLocaleString('cs-CZ')}</td>
                      <td style={tdStyle}>{new Date(smena.konec).toLocaleString('cs-CZ')}</td>
                      <td style={tdStyle}>
                        <button onClick={() => smazSmenu(smena.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px', borderRadius: '3px' }}>Smazat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const btnStyle = { padding: '8px 12px', marginLeft: '5px', cursor: 'pointer' }
const inputStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }
const thStyle = { textAlign: 'left', padding: '10px' }
const tdStyle = { padding: '10px' }

export default App