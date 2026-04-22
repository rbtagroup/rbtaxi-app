import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const theme = { primary: '#f39c12', bgD: '#121212', bgC: '#1e1e1e', text: '#fff' }

function App() {
  const [auta, setAuta] = useState([])
  const [ridici, setRidici] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')
  const [vybraneJmeno, setVybraneJmeno] = useState('')
  const [vybraneAuto, setVybraneAuto] = useState('')
  const [zacatek, setZacatek] = useState('')
  const [konec, setKonec] = useState('')
  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => { nactiData() }, [])

  async function nactiData() {
    const { data: a } = await supabase.from('auta').select('*')
    if (a) { setAuta(a); if (a.length > 0) setVybraneAuto(a[0].id); }
    
    const { data: r } = await supabase.from('ridici').select('*')
    if (r && r.length > 0) {
      setRidici(r)
      const prvniJmeno = r[0].jmeno || r[0].Jmeno || r[0].jméno || r[0].Jméno || "Neznámý";
      setVybraneJmeno(prvniJmeno)
    }
    nactiSmeny()
  }

  async function nactiSmeny() {
    const { data: s } = await supabase.from('smeny').select('*, auta(spz)').gte('konec', new Date().toISOString()).order('zacatek')
    if (s) setSmeny(s)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmeno, auto_id: vybraneAuto, zacatek: zacatek, konec: konec, typ_smeny: 'Denní'
    }])
    if (error) alert(error.message)
    else { alert('Uloženo!'); setZacatek(''); setKonec(''); nactiSmeny(); }
  }

  // --- TATO FUNKCE SE VRÁTILA ---
  async function smazSmenu(id) {
    if (window.confirm('Opravdu chcete tuto směnu smazat?')) {
      const { error } = await supabase.from('smeny').delete().eq('id', id)
      if (error) alert(error.message)
      else nactiSmeny()
    }
  }

  function login() { if (window.prompt('Heslo:') === 'taxi123') setZobrazeni('dispecer') }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: zobrazeni==='ridic'?theme.bgD:'#f0f2f5', minHeight:'100vh', padding:'15px', fontFamily:'sans-serif' }}>
      <header style={{ display:'flex', justifyContent:'space-between', padding:'10px', background: zobrazeni==='ridic'?theme.bgC:'#fff', borderRadius:'10px', alignItems:'center' }}>
        <h2 style={{margin:0, color:zobrazeni==='ridic'?'#fff':'#333'}}>RB taxi Hodonín</h2>
        <div>
          <button onClick={()=>setZobrazeni('ridic')} style={{padding:'8px', cursor:'pointer', marginRight:'5px'}}>Řidič</button>
          <button onClick={login} style={{padding:'8px', cursor:'pointer'}}>Dispečink</button>
        </div>
      </header>

      {zobrazeni === 'dispecer' ? (
        <div style={{ maxWidth:'900px', margin:'20px auto', background:'#fff', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>Nová směna</h3>
          <form onSubmit={ulozSmenu} style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
            <select value={vybraneJmeno} onChange={e=>setVybraneJmeno(e.target.value)} style={{padding:'10px', borderRadius:'8px'}}>
              {ridici.map(r => {
                const j = r.jmeno || r.Jmeno || r.jméno || r.Jméno || `ID ${r.id}`;
                return <option key={r.id} value={j}>{j}</option>
              })}
            </select>
            <select value={vybraneAuto} onChange={e=>setVybraneAuto(e.target.value)} style={{padding:'10px', borderRadius:'8px'}}>
              {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
            </select>
            <input required type="datetime-local" value={zacatek} onChange={e=>setZacatek(e.target.value)} />
            <input required type="datetime-local" value={konec} onChange={e=>setKonec(e.target.value)} />
            <button type="submit" style={{background:theme.primary, border:'none', padding:'10px 20px', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>Uložit</button>
          </form>

          <table style={{width:'100%', marginTop:'20px', borderCollapse:'collapse'}}>
            <thead>
                <tr style={{textAlign:'left', borderBottom:'2px solid #eee'}}>
                    <th style={{padding:'10px'}}>Řidič</th>
                    <th>Auto</th>
                    <th>Od</th>
                    <th>Do</th>
                    <th>Akce</th> {/* --- VRÁCENO --- */}
                </tr>
            </thead>
            <tbody>
              {smeny.map(s => (
                <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:'10px'}}><strong>{s.jmeno_ridice}</strong></td>
                  <td>{s.auta?.spz}</td>
                  <td>{new Date(s.zacatek).toLocaleString('cs-CZ')}</td>
                  <td>{new Date(s.konec).toLocaleString('cs-CZ')}</td>
                  <td style={{padding:'10px'}}>
                    {/* --- TLAČÍKO JE ZPĚT --- */}
                    <button onClick={() => smazSmenu(s.id)} style={{color:'red', border:'1px solid red', background:'none', padding:'4px 8px', borderRadius:'5px', cursor:'pointer', fontSize:'0.8em'}}>Smazat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ maxWidth:'400px', margin:'20px auto', color:'#fff' }}>
          <input placeholder="Tvoje jméno..." value={mojeJmeno} onChange={e=>setMojeJmeno(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', background:'#333', color:'#fff', border:'none'}} />
          <h3 style={{color:theme.primary}}>Tvoje jízdy:</h3>
          {mojeSmeny.map(s => (
            <div key={s.id} style={{background:theme.bgC, padding:'15px', borderRadius:'10px', marginBottom:'10px', borderLeft:'4px solid '+theme.primary}}>
              <strong>{s.auta?.spz}</strong><br/>
              <small>{new Date(s.zacatek).toLocaleString('cs-CZ')} - {new Date(s.konec).toLocaleTimeString('cs-CZ')}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App