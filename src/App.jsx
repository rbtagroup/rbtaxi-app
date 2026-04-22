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
    // 1. Načtení aut
    const { data: autaData } = await supabase.from('auta').select('*')
    if (autaData) {
      setAuta(autaData)
      if (autaData.length > 0) setVybraneAutoId(autaData[0].id)
    }

    // 2. Načtení řidičů
    const { data: ridiciData } = await supabase.from('ridici').select('*').order('jmeno')
    if (ridiciData) {
      setRidici(ridiciData)
      if (ridiciData.length > 0) setVybraneJmenoRidice(ridiciData[0].jmeno)
    }

    // 3. Načtení směn (pouze budoucí nebo probíhající)
    nactiSmeny()
  }

  async function nactiSmeny() {
    const ted = new Date().toISOString()
    const { data, error } = await supabase
      .from('smeny')
      .select('*, auta(spz, typ_vozu)')
      .gte('konec', ted) // Schová staré směny
      .order('zacatek', { ascending: true })

    if (error) console.error('Chyba načítání směn:', error)
    else setSmeny(data)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    if (!vybraneJmenoRidice) return alert('Vyberte prosím řidiče ze seznamu!')

    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmenoRidice, 
      auto_id: vybraneAutoId, 
      zacatek: zacatekSmeny, 
      konec: konecSmeny, 
      typ_smeny: 'Denní' // pro zjednodušení teď dáváme fixní
    }])
    
    if (error) {
      alert('Chyba: ' + error.message)
    } else {
      alert('Směna uložena!')
      setZacatekSmeny(''); setKonecSmeny('');
      nactiSmeny()
    }
  }

  async function smazSmenu(id) {
    if (window.confirm('Opravdu smazat?')) {
      const { error } = await supabase.from('smeny').delete().eq('id', id)
      if (error) alert('Chyba: ' + error.message)
      else nactiSmeny()
    }
  }

  function prihlaseniDispecera() {
    const heslo = window.prompt('Heslo:')
    if (heslo === 'taxi123') setZobrazeni('dispecer')
    else if (heslo !== null) alert('Špatné heslo!')
  }

  const mojeNaplanovaneSmeny = smeny.filter(smena => 
    smena.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2
  )

  const isRidic = zobrazeni === 'ridic';

  return (
    <div style={{ backgroundColor: isRidic ? theme.bgDriver : theme.bgDispatcher, minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isRidic ? theme.bgDriverCard : theme.bgDispatcherCard, padding: '10px 20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.2em', color: isRidic ? '#fff' : '#333' }}>RB taxi <span style={{ color: theme.primary }}>Hodonín</span></h1>
        <div>
          <button onClick={() => setZobrazeni('ridic')} style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', border: 'none', marginRight: '5px', backgroundColor: isRidic ? theme.primary : '#eee' }}>Řidič</button>
          <button onClick={prihlaseniDispecera} style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', border: 'none', backgroundColor: !isRidic ? theme.primary : '#eee' }}>Dispečink</button>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        {isRidic ? (
          <div style={{ maxWidth: '400px', margin: 'auto' }}>
            <div style={{ backgroundColor: theme.bgDriverCard, padding: '20px', borderRadius: '15px', color: '#fff' }}>
              <label style={{ fontSize: '0.8em', color: '#aaa' }}>Tvoje jméno (vyberte ze seznamu nahoře):</label>
              <input type="text" value={mojeJmeno} onChange={(e) => setMojeJmeno(e.target.value)} placeholder="Zadej jméno..." style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: 'none', background: '#333', color: '#fff' }} />
            </div>
            <h2 style={{ color: theme.primary }}>Tvoje budoucí směny</h2>
            {mojeNaplanovaneSmeny.length === 0 ? <p style={{color: '#888'}}>Žádné nadcházející směny.</p> : 
              mojeNaplanovaneSmeny.map(smena => (
                <div key={smena.id} style={{ backgroundColor: theme.bgDriverCard, padding: '15px', borderRadius: '15px', marginBottom: '10px', borderLeft: `5px solid ${theme.primary}`, color: '#fff' }}>
                  <div style={{ fontWeight: 'bold' }}>{smena.auta?.spz}</div>
                  <div style={{ fontSize: '0.9em', color: '#aaa' }}>Od: {new Date(smena.zacatek).toLocaleString('cs-CZ')}</div>
                  <div style={{ fontSize: '0.9em', color: '#aaa' }}>Do: {new Date(smena.konec).toLocaleString('cs-CZ')}</div>
                </div>
              ))
            }
          </div>
        ) : (
          <div style={{ maxWidth: '1000px', margin: 'auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
              <h3>➕ Naplánovat směnu</h3>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{flex: '1 1 150px'}}>
                  <label style={{fontSize: '0.8em'}}>Řidič:</label>
                  <select value={vybraneJmenoRidice} onChange={(e) => setVybraneJmenoRidice(e.target.value)} style={inputStyle}>
                    {ridici.length === 0 ? <option>Načítám řidiče...</option> : 
                     ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)
                    }
                  </select>
                </div>
                <div style={{flex: '1 1 150px'}}>
                  <label style={{fontSize: '0.8em'}}>Auto:</label>
                  <select value={vybraneAutoId} onChange={(e) => setVybraneAutoId(e.target.value)} style={inputStyle}>
                    {auta.map(auto => <option key={auto.id} value={auto.id}>{auto.spz}</option>)}
                  </select>
                </div>
                <div style={{flex: '1 1 150px'}}><label style={{fontSize: '0.8em'}}>Od:</label><input required type="datetime-local" value={zacatekSmeny} onChange={(e) => setZacatekSmeny(e.target.value)} style={inputStyle} /></div>
                <div style={{flex: '1 1 150px'}}><label style={{fontSize: '0.8em'}}>Do:</label><input required type="datetime-local" value={konecSmeny} onChange={(e) => setKonecSmeny(e.target.value)} style={inputStyle} /></div>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: theme.primary, fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end' }}>Uložit</button>
              </form>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px' }}>
              <h3>Aktivní rozpis (budoucí)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Řidič</th><th style={{ padding: '10px' }}>Auto</th><th style={{ padding: '10px' }}>Od</th><th style={{ padding: '10px' }}>Do</th><th style={{ padding: '10px' }}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.length === 0 ? <tr><td colSpan="5" style={{padding: '20px', textAlign: 'center', color: '#999'}}>Žádné aktivní směny. Naplánujte novou s datem v budoucnu.</td></tr> : 
                    smeny.map(smena => (
                      <tr key={smena.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{smena.jmeno_ridice}</td>
                        <td style={{ padding: '10px' }}>{smena.auta?.spz}</td>
                        <td style={{ padding: '10px' }}>{new Date(smena.zacatek).toLocaleString('cs-CZ')}</td>
                        <td style={{ padding: '10px' }}>{new Date(smena.konec).toLocaleString('cs-CZ')}</td>
                        <td style={{ padding: '10px' }}><button onClick={() => smazSmenu(smena.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Smazat</button></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }

export default App