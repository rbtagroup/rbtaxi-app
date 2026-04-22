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
    // 1. Načtení aut
    const { data: a } = await supabase.from('auta').select('*')
    if (a) { setAuta(a); if (a.length > 0) setVybraneAuto(a[0].id); }
    
    // 2. Načtení řidičů - zkusíme vypsat vše, co přijde
    const { data: r } = await supabase.from('ridici').select('*')
    console.log("Data řidičů z DB:", r); // Toto uvidíme v konzoli prohlížeče
    
    if (r && r.length > 0) {
      setRidici(r)
      // Nastavíme jako první vybrané jméno to, co najdeme v prvním řádku
      setVybraneJmeno(r[0].jmeno || r[0].Jmeno || "Neznámý");
    }

    nactiSmeny()
  }

  async function nactiSmeny() {
    const ted = new Date().toISOString()
    const { data: s } = await supabase.from('smeny').select('*, auta(spz)').gte('konec', ted).order('zacatek')
    if (s) setSmeny(s)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    if (!vybraneJmeno) return alert("Vyberte prosím řidiče!");
    
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmeno, 
      auto_id: vybraneAuto, 
      zacatek: zacatek, 
      konec: konec, 
      typ_smeny: 'Denní'
    }])
    if (error) alert(error.message)
    else { alert('Směna uložena!'); nactiSmeny(); }
  }

  function login() { if (window.prompt('Zadejte dispečerské heslo:') === 'taxi123') setZobrazeni('dispecer') }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: zobrazeni==='ridic'?theme.bgD:'#f0f2f5', minHeight:'100vh', padding:'15px', fontFamily:'sans-serif' }}>
      <header style={{ display:'flex', justifyContent:'space-between', padding:'15px', background: zobrazeni==='ridic'?theme.bgC:'#fff', borderRadius:'15px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', alignItems:'center' }}>
        <h2 style={{margin:0, color:zobrazeni==='ridic'?'#fff':'#333', fontSize:'1.2em'}}>RB taxi <span style={{color:theme.primary}}>Hodonín</span></h2>
        <div>
          <button onClick={()=>setZobrazeni('ridic')} style={{padding:'8px 15px', borderRadius:'8px', border:'none', cursor:'pointer', marginRight:'5px', background:zobrazeni==='ridic'?theme.primary:'#eee'}}>Řidič</button>
          <button onClick={login} style={{padding:'8px 15px', borderRadius:'8px', border:'none', cursor:'pointer', background:zobrazeni==='dispecer'?theme.primary:'#eee'}}>Dispečink</button>
        </div>
      </header>

      {zobrazeni === 'dispecer' ? (
        <div style={{ maxWidth:'900px', margin:'20px auto' }}>
          <div style={{ background:'#fff', padding:'25px', borderRadius:'20px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)', marginBottom:'20px' }}>
            <h3 style={{marginTop:0}}>➕ Naplánovat směnu</h3>
            <form onSubmit={ulozSmenu} style={{display:'flex', gap:'15px', flexWrap:'wrap', alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={{fontSize:'0.8em', display:'block', marginBottom:'5px'}}>Řidič:</label>
                <select value={vybraneJmeno} onChange={e=>setVybraneJmeno(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}}>
                  {ridici.map(r => (
                    <option key={r.id} value={r.jmeno || r.Jmeno}>
                      {r.jmeno || r.Jmeno || `Řidič č. ${r.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:'0.8em', display:'block', marginBottom:'5px'}}>Auto:</label>
                <select value={vybraneAuto} onChange={e=>setVybraneAuto(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}}>
                  {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.8em', display:'block', marginBottom:'5px'}}>Od:</label>
                <input required type="datetime-local" value={zacatek} onChange={e=>setZacatek(e.target.value)} style={{padding:'11px', borderRadius:'10px', border:'1px solid #ddd'}} />
              </div>
              <div>
                <label style={{fontSize:'0.8em', display:'block', marginBottom:'5px'}}>Do:</label>
                <input required type="datetime-local" value={konec} onChange={e=>setKonec(e.target.value)} style={{padding:'11px', borderRadius:'10px', border:'1px solid #ddd'}} />
              </div>
              <button type="submit" style={{background:theme.primary, border:'none', padding:'12px 25px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', color:'#000'}}>Uložit</button>
            </form>
          </div>

          <div style={{ background:'#fff', padding:'25px', borderRadius:'20px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{marginTop:0}}>🗓️ Aktivní rozpis</h3>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee'}}><th style={{padding:'10px'}}>Řidič</th><th style={{padding:'10px'}}>Auto</th><th style={{padding:'10px'}}>Od</th><th style={{padding:'10px'}}>Do</th></tr></thead>
              <tbody>
                {smeny.length === 0 ? <tr><td colSpan="4" style={{padding:'20px', textAlign:'center', color:'#999'}}>Žádné budoucí směny nejsou naplánovány.</td></tr> : 
                  smeny.map(s => (
                    <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}><strong>{s.jmeno_ridice}</strong></td>
                      <td>{s.auta?.spz}</td>
                      <td>{new Date(s.zacatek).toLocaleString('cs-CZ', {day:'numeric', month:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                      <td>{new Date(s.konec).toLocaleString('cs-CZ', {hour:'2-digit', minute:'2-digit'})}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth:'450px', margin:'40px auto', textAlign:'center' }}>
          <div style={{ background:theme.bgC, padding:'30px', borderRadius:'25px', boxShadow:'0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{color:theme.primary, marginTop:0}}>Kdo dnes jede? 🚖</h3>
            <input 
              placeholder="Napiš své jméno..." 
              value={mojeJmeno} 
              onChange={e=>setMojeJmeno(e.target.value)} 
              style={{width:'100%', padding:'15px', borderRadius:'12px', border:'none', background:'#2c2c2c', color:'#fff', fontSize:'1.1em', boxSizing:'border-box', marginBottom:'20px'}} 
            />
            <div style={{textAlign:'left'}}>
              {mojeJmeno.length > 2 && mojeSmeny.map(s => (
                <div key={s.id} style={{background:'#2c2c2c', padding:'15px', borderRadius:'15px', marginBottom:'10px', borderLeft:'5px solid '+theme.primary}}>
                  <div style={{fontWeight:'bold', fontSize:'1.1em'}}>{s.auta?.spz}</div>
                  <div style={{fontSize:'0.9em', color:'#aaa'}}>{new Date(s.zacatek).toLocaleString('cs-CZ')} - {new Date(s.konec).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              ))}
              {mojeJmeno.length > 2 && mojeSmeny.length === 0 && <div style={{color:'#666', textAlign:'center'}}>Žádná směna nenalezena.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App