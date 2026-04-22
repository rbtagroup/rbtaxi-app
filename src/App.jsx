import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const theme = {
  bgApp: '#101214',
  bgPanel: '#1c1f24',
  primary: '#00e6cc',
  textMain: '#ffffff',
  textMuted: '#8b95a1',
  danger: '#ff4d4d',
  border: '#2a2e35',
  shiftR: '#f39c12', // Oranžová pro raní
  shiftO: '#00e6cc', // Tyrkysová pro odpolední
  shiftN: '#9b59b6', // Fialová pro noční
}

function App() {
  const [auta, setAuta] = useState([])
  const [ridici, setRidici] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')
  const [vybraneJmeno, setVybraneJmeno] = useState('')
  const [vybraneAuto, setVybraneAuto] = useState('')
  const [datumSmeny, setDatumSmeny] = useState(new Date().toISOString().split('T')[0])
  const [typSmeny, setTypSmeny] = useState('R')
  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => { nactiData() }, [])

  async function nactiData() {
    const { data: a } = await supabase.from('auta').select('*')
    if (a) { setAuta(a); if (a.length > 0) setVybraneAuto(a[0].id); }
    const { data: r } = await supabase.from('ridici').select('*').order('jmeno')
    if (r && r.length > 0) {
      setRidici(r)
      setVybraneJmeno(r[0].jmeno || r[0].Jmeno || "Neznámý")
    }
    nactiSmeny()
  }

  async function nactiSmeny() {
    const { data: s } = await supabase.from('smeny').select('*, auta(spz)').gte('konec', new Date().toISOString()).order('zacatek')
    if (s) setSmeny(s)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    
    // Logika výpočtu časů dle vašeho zadání
    let zacatek = new Date(datumSmeny);
    let konec = new Date(datumSmeny);

    if (typSmeny === 'R') {
      zacatek.setHours(7, 0, 0);
      konec.setHours(19, 0, 0);
    } else if (typSmeny === 'O') {
      zacatek.setHours(13, 0, 0);
      konec.setDate(konec.getDate() + 1); // Přesah do dalšího dne
      konec.setHours(1, 0, 0);
    } else if (typSmeny === 'N') {
      zacatek.setHours(19, 0, 0);
      konec.setDate(konec.getDate() + 1); // Přesah do dalšího dne
      konec.setHours(7, 0, 0);
    }

    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmeno, 
      auto_id: vybraneAuto, 
      zacatek: zacatek.toISOString(), 
      konec: konec.toISOString(), 
      typ_smeny: typSmeny === 'R' ? 'Raní' : typSmeny === 'O' ? 'Odpolední' : 'Noční'
    }])
    
    if (error) alert(error.message)
    else { alert('Směna uložena!'); nactiSmeny(); }
  }

  const getDenVTydnu = (dateStr) => {
    const dny = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
    return dny[new Date(dateStr).getDay()];
  }

  const getBarvaSmeny = (typ) => {
    if (typ === 'Raní') return theme.shiftR;
    if (typ === 'Odpolední') return theme.shiftO;
    return theme.shiftN;
  }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: theme.bgApp, minHeight:'100vh', padding:'15px', fontFamily:'sans-serif', color: theme.textMain }}>
      <header style={{ display:'flex', justifyContent:'space-between', maxWidth:'1000px', margin:'0 auto 20px auto', padding:'15px', background: theme.bgPanel, borderRadius:'15px', border: `1px solid ${theme.border}` }}>
        <h2 style={{margin:0}}>RB taxi <span style={{color:theme.primary}}>Hodonín</span></h2>
        <div style={{background:'#000', padding:'3px', borderRadius:'10px'}}>
          <button onClick={()=>setZobrazeni('ridic')} style={{padding:'8px 15px', border:'none', borderRadius:'8px', cursor:'pointer', background: zobrazeni==='ridic'?theme.primary:'transparent', color: zobrazeni==='ridic'?'#000':theme.textMuted}}>Řidič</button>
          <button onClick={()=>{if(window.prompt('Heslo:')==='taxi123') setZobrazeni('dispecer')}} style={{padding:'8px 15px', border:'none', borderRadius:'8px', cursor:'pointer', background: zobrazeni==='dispecer'?theme.primary:'transparent', color: zobrazeni==='dispecer'?'#000':theme.textMuted}}>Dispečink</button>
        </div>
      </header>

      <main style={{ maxWidth:'1000px', margin:'auto' }}>
        {zobrazeni === 'dispecer' ? (
          <div style={{ background: theme.bgPanel, padding:'25px', borderRadius:'20px', border: `1px solid ${theme.border}` }}>
            <h3 style={{marginTop:0, color:theme.primary}}>➕ Nová směna</h3>
            <form onSubmit={ulozSmenu} style={{display:'flex', gap:'15px', flexWrap:'wrap', alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={labelS}>Řidič</label>
                <select value={vybraneJmeno} onChange={e=>setVybraneJmeno(e.target.value)} style={inputS}>
                  {ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={labelS}>Auto</label>
                <select value={vybraneAuto} onChange={e=>setVybraneAuto(e.target.value)} style={inputS}>
                  {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={labelS}>Den směny</label>
                <input type="date" value={datumSmeny} onChange={e=>setDatumSmeny(e.target.value)} style={inputS} />
              </div>
              <div style={{flex:1}}>
                <label style={labelS}>Typ (R/O/N)</label>
                <select value={typSmeny} onChange={e=>setTypSmeny(e.target.value)} style={inputS}>
                  <option value="R">Raní (7-19)</option>
                  <option value="O">Odpolední (13-01)</option>
                  <option value="N">Noční (19-07)</option>
                </select>
              </div>
              <button type="submit" style={{background:theme.primary, border:'none', padding:'12px 25px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>Uložit</button>
            </form>

            <table style={{width:'100%', marginTop:'30px', borderCollapse:'collapse'}}>
              <thead><tr style={{textAlign:'left', color:theme.textMuted, fontSize:'0.8em', textTransform:'uppercase'}}><th style={{padding:'10px'}}>Den / Datum</th><th>Řidič</th><th>Auto</th><th>Typ</th><th>Čas</th><th>Akce</th></tr></thead>
              <tbody>
                {smeny.map(s => (
                  <tr key={s.id} style={{borderBottom:`1px solid ${theme.border}`}}>
                    <td style={{padding:'15px'}}><strong>{getDenVTydnu(s.zacatek)}</strong> <br/> <small style={{color:theme.textMuted}}>{new Date(s.zacatek).toLocaleDateString('cs-CZ')}</small></td>
                    <td>{s.jmeno_ridice}</td>
                    <td><span style={{background:'#fff', color:'#000', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', fontSize:'0.9em'}}>{s.auta?.spz}</span></td>
                    <td><span style={{color: getBarvaSmeny(s.typ_smeny), fontWeight:'bold'}}>{s.typ_smeny}</span></td>
                    <td>{new Date(s.zacatek).getHours()}:00 - {new Date(s.konec).getHours()}:00</td>
                    <td><button onClick={async ()=>{if(window.confirm('Smazat?')){await supabase.from('smeny').delete().eq('id', s.id); nactiSmeny();}}} style={{color:theme.danger, background:'none', border:'none', cursor:'pointer'}}>Smazat</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ maxWidth:'450px', margin:'auto' }}>
            <div style={{ background: theme.bgPanel, padding:'20px', borderRadius:'15px', border:`1px solid ${theme.border}`, marginBottom:'20px' }}>
              <input placeholder="Zadej své jméno..." value={mojeJmeno} onChange={e=>setMojeJmeno(e.target.value)} style={{...inputS, background:'#121417'}} />
            </div>
            {mojeSmeny.map(s => (
              <div key={s.id} style={{ background: theme.bgPanel, padding:'20px', borderRadius:'15px', marginBottom:'15px', borderLeft:`6px solid ${getBarvaSmeny(s.typ_smeny)}`, position:'relative' }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontSize:'1.2em', fontWeight:'bold'}}>{getDenVTydnu(s.zacatek)}</div>
                    <div style={{color:theme.textMuted, fontSize:'0.9em'}}>{new Date(s.zacatek).toLocaleDateString('cs-CZ')}</div>
                  </div>
                  <div style={{background: getBarvaSmeny(s.typ_smeny), color:'#000', padding:'4px 10px', borderRadius:'8px', fontWeight:'bold', fontSize:'0.8em'}}>{s.typ_smeny}</div>
                </div>
                <div style={{marginTop:'15px', display:'flex', gap:'20px', alignItems:'center'}}>
                   <div style={{fontSize:'1.5em', fontWeight:'bold', color:theme.primary}}>{new Date(s.zacatek).getHours()}:00 - {new Date(s.konec).getHours()}:00</div>
                   <div style={{background:'#fff', color:'#000', padding:'3px 10px', borderRadius:'6px', fontWeight:'bold'}}>{s.auta?.spz}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const inputS = { width:'100%', padding:'12px', borderRadius:'10px', border:`1px solid ${theme.border}`, background:'#1c1f24', color:'#fff', boxSizing:'border-box' };
const labelS = { fontSize:'0.8em', color:theme.textMuted, display:'block', marginBottom:'5px', fontWeight:'bold' };

export default App