import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const theme = {
  primary: '#f39c12',
  bgDriver: '#121212',
  bgDriverCard: '#1e1e1e',
  bgDispatcher: '#f0f2f5',
  bgDispatcherCard: '#ffffff',
  textDriver: '#ffffff',
  textDriverMuted: '#aaaaaa',
  textDispatcher: '#2c3e50',
  textDispatcherMuted: '#7f8c8d',
  border: '#dcdde1',
}

function App() {
  const [auta, setAuta] = useState([])
  const [ridici, setRidici] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')
  const [vybraneJmenoRidice, setVybraneJmenoRidice] = useState('')
  const [vybraneAutoId, setVybraneAutoId] = useState('')
  const [zacatekSmeny, setZacatekSmeny] = useState('')
  const [konecSmeny, setKonecSmeny] = useState('')
  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => {
    nactiVse()
  }, [])

  async function nactiVse() {
    console.log("Startuji načítání dat...");
    
    // Načtení aut
    const { data: autaData, error: autaErr } = await supabase.from('auta').select('*')
    if (autaErr) console.error("Chyba aut:", autaErr)
    if (autaData) {
      setAuta(autaData)
      if (autaData.length > 0) setVybraneAutoId(autaData[0].id)
    }

    // Načtení řidičů
    const { data: ridiciData, error: ridiciErr } = await supabase.from('ridici').select('*')
    if (ridiciErr) {
        console.error("CHYBA RIDICI:", ridiciErr)
        alert("Nepodařilo se načíst řidiče: " + ridiciErr.message)
    }
    if (ridiciData) {
      console.log("Načtení řidiči z DB:", ridiciData)
      setRidici(ridiciData)
      if (ridiciData.length > 0) setVybraneJmenoRidice(ridiciData[0].jmeno)
    }

    nactiSmeny()
  }

  async function nactiSmeny() {
    const ted = new Date().toISOString()
    const { data, error } = await supabase
      .from('smeny')
      .select('*, auta(spz, typ_vozu)')
      .gte('konec', ted)
      .order('zacatek', { ascending: true })
    if (error) console.error('Chyba směn:', error)
    else setSmeny(data)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmenoRidice, auto_id: vybraneAutoId, zacatek: zacatekSmeny, konec: konecSmeny, typ_smeny: 'Denní'
    }])
    if (error) alert('Chyba: ' + error.message)
    else { alert('Uloženo!'); setZacatekSmeny(''); setKonecSmeny(''); nactiSmeny(); }
  }

  function prihlaseniDispecera() {
    const heslo = window.prompt('Heslo:')
    if (heslo === 'taxi123') setZobrazeni('dispecer')
  }

  const isRidic = zobrazeni === 'ridic';
  const mojeNaplanovaneSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: isRidic ? theme.bgDriver : theme.bgDispatcher, minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isRidic ? theme.bgDriverCard : theme.bgDispatcherCard, padding: '10px 20px', borderRadius: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2em' }}>RB taxi <span style={{ color: theme.primary }}>Hodonín</span></h1>
        <div>
          <button onClick={() => setZobrazeni('ridic')} style={{ padding: '8px', cursor: 'pointer' }}>Řidič</button>
          <button onClick={prihlaseniDispecera} style={{ padding: '8px', cursor: 'pointer' }}>Dispečink</button>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        {!isRidic && (
          <div style={{ maxWidth: '1000px', margin: 'auto', backgroundColor: '#fff', padding: '20px', borderRadius: '15px' }}>
            <h3>➕ Nová směna</h3>
            <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={vybraneJmenoRidice} onChange={(e) => setVybraneJmenoRidice(e.target.value)} style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}>
                {ridici.length === 0 ? <option>Načítám řidiče ({ridici.length})...</option> : 
                 ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)
                }
              </select>
              <select value={vybraneAutoId} onChange={(e) => setVybraneAutoId(e.target.value)} style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}>
                {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
              </select>
              <input required type="datetime-local" value={zacatekSmeny} onChange={(e) => setZacatekSmeny(e.target.value)} />
              <input required type="datetime-local" value={konecSmeny} onChange={(e) => setKonecSmeny(e.target.value)} />
              <button type="submit" style={{ background: theme.primary, border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>Uložit</button>
            </form>
            <table style={{ width: '100%', marginTop: '20px' }}>
                <thead><tr><th>Řidič</th><th>Auto</th><th>Od</th><th>Do</th></tr></thead>
                <tbody>{smeny.map(s => <tr key={s.id}><td>{s.jmeno_ridice}</td><td>{s.auta?.spz}</td><td>{new Date(s.zacatek).toLocaleString()}</td><td>{new Date(s.konec).toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {isRidic && (
            <div style={{ maxWidth: '400px', margin: 'auto', color: 'white' }}>
                <input placeholder="Tvoje jméno..." value={mojeJmeno} onChange={e => setMojeJmeno(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '8px'}} />
                {mojeNaplanovaneSmeny.map(s => <div key={s.id} style={{background: '#333', padding: '10px', marginTop: '10px', borderRadius: '10px'}}>{s.auta?.spz} | {new Date(s.zacatek).toLocaleString()}</div>)}
            </div>
        )}
      </main>
    </div>
  )
}

export default App