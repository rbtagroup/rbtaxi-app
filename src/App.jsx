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

  // NOVÁ FUNKCE PRO ZABEZPEČENÍ
  function prihlaseniDispecera() {
    const heslo = window.prompt('Zadejte heslo pro přístup do Dispečinku:')
    if (heslo === 'taxi123') {  // Zde si můžete heslo změnit na jakékoliv jiné
      setZobrazeni('dispecer')
    } else if (heslo !== null) {
      alert('Nesprávné heslo! Přístup odepřen.')
    }
  }

  const mojeNaplanovaneSmeny = smeny.filter(smena => 
    smena.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2
  )

  return (
    <div style={{ backgroundColor: zobrazeni === 'ridic' ? '#121212' : '#f5f5f5', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif', transition: 'background 0.3s' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: zobrazeni === 'ridic' ? '#1e1e1e' : '#fff', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, color: zobrazeni === 'ridic' ? '#fff' : '#333', fontSize: '1.5em' }}>RB taxi <span style={{ color: '#f39c12' }}>Hodonín</span></h1>
        <div>
          <button onClick={() => setZobrazeni('ridic')} style={{...btnStyle, backgroundColor: zobrazeni === 'ridic' ? '#f39c12' : '#fff', color: zobrazeni === 'ridic' ? '#fff' : '#333'}}>Řidič</button>
          {/* ZMĚNĚNÉ TLAČÍTKO DISPEČINKU */}
          <button onClick={prihlaseniDispecera} style={{...btnStyle, backgroundColor: zobrazeni === 'dispecer' ? '#f39c12' : '#fff', color: zobrazeni === 'dispecer' ? '#fff' : '#333'}}>Dispečink</button>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        {zobrazeni === 'ridic' ? (
          
          <div style={{ maxWidth: '400px', margin: 'auto', color: 'white' }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9em' }}>Zadej své jméno (pro zobrazení směn):</label>
              <input type="text" value={mojeJmeno} onChange={(e) => setMojeJmeno(e.target.value)} placeholder="Např. Karel Novák" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: 'white', boxSizing: 'border-box' }} />
            </div>

            <h2 style={{ color: '#f39c12', marginBottom: '15px' }}>Tvoje příští směny</h2>

            {mojeJmeno.length <= 2 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>Napiš své jméno nahoru, abychom ti mohli ukázat tvůj rozpis.</p>
            ) : mojeNaplanovaneSmeny.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>Aktuálně nemáš naplánované žádné směny.</p>
            ) : (
              mojeNaplanovaneSmeny.map((smena, index) => (
                <div key={smena.id} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '15px', marginBottom: '15px', borderLeft: index === 0 ? '5px solid #2ecc71' : '5px solid #555' }}>
                  {index === 0 && <div style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.9em' }}>NEJBLIŽŠÍ SMĚNA</div>}
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>{smena.typ_smeny} směna</h3>
                  <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>⏰</span>
                    <div>
                      <div style={{ fontSize: '0.9em', color: '#aaa' }}>Začátek: {new Date(smena.zacatek).toLocaleString('cs-CZ')}</div>
                      <div style={{ fontSize: '0.9em', color: '#aaa' }}>Konec: {new Date(smena.konec).toLocaleString('cs-CZ')}</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🚖</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{smena.auta?.spz || 'Neznámé auto'}</div>
                      <div style={{ fontSize: '0.8em', color: '#aaa' }}>{smena.auta?.typ_vozu || ''}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        ) : (
          <div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2>➕ Naplánovat novou směnu</h2>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div><label style={labelStyle}>Jméno řidiče</label><input required value={jmenoRidice} onChange={(e) => setJmenoRidice(e.target.value)} type="text" style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>Auto</label>
                  <select value={vybraneAutoId} onChange={(e) => setVybraneAutoId(e.target.value)} style={inputStyle}>
                    {auta.map(auto => <option key={auto.id} value={auto.id}>{auto.typ_vozu} ({auto.spz})</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Začátek</label><input required value={zacatekSmeny} onChange={(e) => setZacatekSmeny(e.target.value)} type="datetime-local" style={inputStyle} /></div>
                <div><label style={labelStyle}>Konec</label><input required value={konecSmeny} onChange={(e) => setKonecSmeny(e.target.value)} type="datetime-local" style={inputStyle} /></div>
                <div><label style={labelStyle}>Typ</label><select value={typSmeny} onChange={(e) => setTypSmeny(e.target.value)} style={inputStyle}><option value="Denní">Denní</option><option value="Noční">Noční</option></select></div>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '10px 20px', fontWeight: 'bold' }}>Uložit směnu</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h2>Aktuální rozpis směn</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Řidič</th><th style={{ textAlign: 'left', padding: '10px' }}>Auto (SPZ)</th><th style={{ textAlign: 'left', padding: '10px' }}>Začátek</th><th style={{ textAlign: 'left', padding: '10px' }}>Konec</th><th style={{ textAlign: 'left', padding: '10px' }}>Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.map(smena => (
                    <tr key={smena.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}><strong>{smena.jmeno_ridice}</strong></td><td style={{ padding: '10px' }}>{smena.auta?.spz}</td><td style={{ padding: '10px' }}>{new Date(smena.zacatek).toLocaleString('cs-CZ')}</td><td style={{ padding: '10px' }}>{new Date(smena.konec).toLocaleString('cs-CZ')}</td>
                      <td style={{ padding: '10px' }}><span style={{ backgroundColor: smena.typ_smeny === 'Denní' ? '#ffeaa7' : '#74b9ff', padding: '3px 8px', borderRadius: '12px', fontSize: '0.9em' }}>{smena.typ_smeny}</span></td>
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

const btnStyle = { padding: '8px 15px', marginLeft: '10px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc', fontWeight: 'bold' }
const inputStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#555', fontWeight: 'bold' }

export default App