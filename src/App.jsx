import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// --- LUXURY THEME COLORS (inspirováno obrázkem) ---
const theme = {
  bgApp: '#101214',       // Velmi hluboká černá (základ)
  bgPanel: '#1c1f24',    // Temně šedá pro karty/panely
  primary: '#00e6cc',     // Elektrizující tyrkysová (akcent)
  primaryHover: '#00bfa5',
  textMain: '#ffffff',    // Čistě bílá pro hlavní údaje
  textMuted: '#8b95a1',   // Tlumená šedá pro popisky a méně důležité texty
  danger: '#ff4d4d',      // Červená pro smazání
  border: '#2a2e35',      // Velmi jemná šedá pro ohraničení
}

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

  useEffect(() => { 
    nactiData()
    // Přidáme globální CSS pro focus efekty a moderní scrollbary
    injectGlobalCSS()
  }, [])

  async function nactiData() {
    const { data: a } = await supabase.from('auta').select('*')
    if (a) { setAuta(a); if (a.length > 0) setVybraneAuto(a[0].id); }
    
    const { data: r } = await supabase.from('ridici').select('*').order('jmeno')
    if (r && r.length > 0) {
      setRidici(r)
      const prvniJmeno = r[0].jmeno || r[0].Jmeno || r[0].jméno || r[0].Jméno || "Neznámý";
      setVybraneJmeno(prvniJmeno)
    }
    nactiSmeny()
  }

  async function nactiSmeny() {
    const { data: s } = await supabase.from('smeny').select('*, auta(spz, typ_vozu)').gte('konec', new Date().toISOString()).order('zacatek')
    if (s) setSmeny(s)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmeno, auto_id: vybraneAuto, zacatek: zacatek, konec: konec, typ_smeny: 'Denní'
    }])
    if (error) alert(error.message)
    else { setZacatek(''); setKonec(''); nactiSmeny(); }
  }

  async function smazSmenu(id) {
    if (window.confirm('Opravdu chcete tuto směnu smazat z rozpisu?')) {
      const { error } = await supabase.from('smeny').delete().eq('id', id)
      if (error) alert(error.message)
      else nactiSmeny()
    }
  }

  function login() { if (window.prompt('Zadejte dispečerské heslo:') === 'taxi123') setZobrazeni('dispecer') }

  // Pomocná funkce pro formátování data
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'})
  }
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('cs-CZ', {day:'numeric', month:'numeric'})
  }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  const isRidic = zobrazeni === 'ridic';

  return (
    <div style={{ backgroundColor: theme.bgApp, minHeight:'100vh', padding:'10px 10px 40px 10px', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: theme.textMain, boxSizing:'border-box' }}>
      
      {/* --- LUXURY HEADER --- */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto 20px auto', padding:'15px 25px', background: theme.bgPanel, borderRadius:'16px', boxShadow:'0 4px 15px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}` }}>
        <h1 style={{margin:0, fontSize:'1.4em', fontWeight:'800', letterSpacing:'-0.5px'}}>
          RB taxi <span style={{color:theme.primary, fontWeight:'700'}}>Hodonín</span>
        </h1>
        <div style={{ display:'flex', gap:'8px', background:'#000', padding:'4px', borderRadius:'12px'}}>
          <button onClick={()=>setZobrazeni('ridic')} style={{...navBtnStyle, ...(isRidic ? navBtnActiveStyle : {})}}>Řidič</button>
          <button onClick={login} style={{...navBtnStyle, ...(!isRidic ? navBtnActiveStyle : {})}}>Dispečink</button>
        </div>
      </header>

      <main>
        {isRidic ? (
          
          /* =========================================
             --- DRIVER VIEW (Luxury Dark Cards) ---
             ========================================= */
          <div style={{ maxWidth:'480px', margin:'auto' }}>
            <div style={{ background: theme.bgPanel, padding:'25px', borderRadius:'20px', boxShadow:'0 8px 30px rgba(0,0,0,0.3)', border: `1px solid ${theme.border}`, marginBottom:'25px' }}>
              <label style={{ fontSize:'0.85em', color: theme.textMuted, fontWeight:'600', display:'block', marginBottom:'8px' }}>👤 TVOJE JMÉNO (vyberte ze seznamu nahoře)</label>
              <input 
                type="text" 
                value={mojeJmeno} 
                onChange={(e) => setMojeJmeno(e.target.value)} 
                placeholder="Např. Karel Novák" 
                style={luxuryInputStyle}
              />
            </div>

            <h2 style={{ fontSize:'1.3em', marginBottom:'15px', paddingLeft:'5px', fontWeight:'700' }}>Moje nadcházející směny</h2>

            {mojeSmeny.length === 0 ? (
               <div style={{textAlign:'center', padding:'40px', color: theme.textMuted, background: theme.bgPanel, borderRadius:'20px', border:`1px solid ${theme.border}`}}>
                 {mojeJmeno.length > 2 ? 'Aktuálně nemáš naplánovanou žádnou směnu.' : 'Zadej své jméno nahoru pro zobrazení jízd.'}
               </div>
            ) : mojeSmeny.map((s, index) => (
              <div key={s.id} style={{ 
                background: theme.bgPanel, 
                padding: '20px', 
                borderRadius: '20px', 
                marginBottom: '15px', 
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderLeft: index === 0 ? `6px solid ${theme.primary}` : `1px solid ${theme.border}`,
                position: 'relative'
              }}>
                {index === 0 && <div style={closestBadgeStyle}>NEJBLIŽŠÍ</div>}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                    <div>
                        <div style={{color: theme.textMuted, fontSize:'0.85em', textTransform:'uppercase', fontWeight:'700', letterSpacing:'0.5px'}}>Směna</div>
                        <div style={{fontSize:'1.1em', fontWeight:'800'}}>{formatDate(s.zacatek)}</div>
                    </div>
                    <span style={{fontSize:'2em'}}>⏰</span>
                </div>
                
                <div style={{ display:'flex', gap:'15px', alignItems:'center', backgroundColor:'#121417', padding:'12px', borderRadius:'12px', marginBottom:'12px'}}>
                    <div style={{textAlign:'center', flex:1}}>
                        <div style={{fontSize:'0.8em', color:theme.textMuted}}>OD</div>
                        <div style={{fontSize:'1.2em', fontWeight:'800', color:theme.primary}}>{formatTime(s.zacatek)}</div>
                    </div>
                    <div style={{width:'1px', height:'30px', backgroundColor:theme.border}}></div>
                    <div style={{textAlign:'center', flex:1}}>
                        <div style={{fontSize:'0.8em', color:theme.textMuted}}>DO</div>
                        <div style={{fontSize:'1.2em', fontWeight:'800'}}>{formatTime(s.konec)}</div>
                    </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{fontSize:'1.2em'}}>🚖</span>
                    <span style={carBadgeStyle}>{s.auta?.spz}</span>
                    <span style={{color: theme.textMuted, fontSize:'0.9em'}}>{s.auta?.typ_vozu}</span>
                </div>
              </div>
            ))}
          </div>

        ) : (
          
          /* =========================================
             --- DISPATCHER VIEW (Premium Dashboard) ---
             ========================================= */
          <div style={{ maxWidth:'1100px', margin:'auto' }}>
            
            {/* NEW SHIFT FORM */}
            <div style={dispecerCardStyle}>
              <h2 style={{marginTop:0, fontSize:'1.4em', fontWeight:'800', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{color: theme.primary}}>➕</span> Naplánovat novou směnu
              </h2>
              <form onSubmit={ulozSmenu} style={{ display:'flex', gap:'15px', flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={formGroupStyle}>
                  <label style={luxuryLabelStyle}>👤 Řidič</label>
                  <select value={vybraneJmeno} onChange={e=>setVybraneJmeno(e.target.value)} style={luxuryInputStyle}>
                    {ridici.map(r => {
                      const j = r.jmeno || r.Jmeno || r.jméno || r.Jméno || `ID ${r.id}`;
                      return <option key={r.id} value={j}>{j}</option>
                    })}
                  </select>
                </div>
                <div style={formGroupStyle}>
                  <label style={luxuryLabelStyle}>🚖 Vůz</label>
                  <select value={vybraneAuto} onChange={e=>setVybraneAuto(e.target.value)} style={luxuryInputStyle}>
                    {auta.map(a => <option key={a.id} value={a.id}>{a.spz} ({a.typ_vozu})</option>)}
                  </select>
                </div>
                <div style={formGroupStyle}><label style={luxuryLabelStyle}>⏰ Od</label><input required type="datetime-local" value={zacatek} onChange={e=>setZacatek(e.target.value)} style={luxuryInputStyle} /></div>
                <div style={formGroupStyle}><label style={luxuryLabelStyle}>🏁 Do</label><input required type="datetime-local" value={konec} onChange={e=>setKonec(e.target.value)} style={luxuryInputStyle} /></div>
                <button type="submit" style={luxuryBtnPrimaryStyle}>Uložit do cloudu</button>
              </form>
            </div>

            {/* SCHEDULE TABLE */}
            <div style={dispecerCardStyle}>
              <h2 style={{marginTop:0, fontSize:'1.4em', fontWeight:'800', marginBottom:'20px'}}>🗓️ Aktivní rozpis (seřazeno dle času)</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign:'left', borderBottom: `2px solid ${theme.border}` }}>
                    <th style={luxuryThStyle}>Řidič</th>
                    <th style={luxuryThStyle}>Vůz (SPZ)</th>
                    <th style={luxuryThStyle}>Datum</th>
                    <th style={luxuryThStyle}>Od</th>
                    <th style={luxuryThStyle}>Do</th>
                    <th style={luxuryThStyle}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.length === 0 ? (
                    <tr><td colSpan="6" style={{padding:'30px', textAlign:'center', color: theme.textMuted}}>Zatím nejsou naplánovány žádné budoucí směny.</td></tr>
                  ) : smeny.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${theme.border}`, transition:'background-color 0.2s' }} className="table-row-hover">
                      <td style={luxuryTdStyle}><strong>{s.jmeno_ridice}</strong></td>
                      <td style={luxuryTdStyle}><span style={carBadgeStyle}>{s.auta?.spz}</span> <small style={{color:theme.textMuted}}>{s.auta?.typ_vozu}</small></td>
                      <td style={luxuryTdStyle}>{formatDate(s.zacatek)}</td>
                      <td style={{...luxuryTdStyle, color:theme.primary, fontWeight:'700'}}>{formatTime(s.zacatek)}</td>
                      <td style={luxuryTdStyle}>{formatTime(s.konec)}</td>
                      <td style={luxuryTdStyle}>
                        <button onClick={() => smazSmenu(s.id)} style={luxuryBtnDeleteStyle}>Smazat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign:'center', marginTop:'40px', color: theme.textMuted, fontSize:'0.8em'}}>
        &copy; 2024 RB taxi Hodonín. Luxury Premium Dispatcher UI v1.0.
      </footer>
    </div>
  )
}

// --- LUXURY STYLES (Inline CSS & Logic) ---

const navBtnStyle = {
  padding: '8px 20px',
  cursor: 'pointer',
  borderRadius: '10px',
  border: 'none',
  fontWeight: '600',
  fontSize: '0.9em',
  background: 'transparent',
  color: theme.textMuted,
  transition: 'all 0.2s ease',
}

const navBtnActiveStyle = {
  background: theme.primary,
  color: '#000',
  boxShadow: `0 0 10px ${theme.primary}44`,
}

const luxuryInputStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  background: '#121417',
  color: theme.textMain,
  fontSize: '1em',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
}

const closestBadgeStyle = {
  position: 'absolute',
  top: '0', right: '20px',
  backgroundColor: theme.primary,
  color: '#000',
  padding: '4px 10px',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
  fontSize: '0.75em',
  fontWeight: '800',
  letterSpacing: '0.5px',
}

const carBadgeStyle = {
  background: '#fff',
  color: '#000',
  padding: '3px 8px',
  borderRadius: '6px',
  fontWeight: '700',
  fontSize: '0.9em',
  marginRight: '5px',
  fontFamily: 'monospace',
}

const dispecerCardStyle = {
  background: theme.bgPanel, 
  padding: '30px', 
  borderRadius: '20px', 
  marginBottom: '25px', 
  boxShadow: '0 8px 30px rgba(0,0,0,0.15)', 
  border: `1px solid ${theme.border}`,
}

const formGroupStyle = { display:'flex', flexDirection:'column', gap:'6px', flex:'1 1 200px' }
const luxuryLabelStyle = { fontSize:'0.85em', color: theme.textMuted, fontWeight:'700', paddingLeft:'3px' }

const luxuryBtnPrimaryStyle = {
  background: theme.primary,
  color: '#000',
  border: 'none',
  padding: '12px 30px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '1em',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: `0 4px 15px ${theme.primary}33`,
  height: '48px',
  alignSelf: 'flex-end',
}

const luxuryThStyle = { padding:'15px', color: theme.textMuted, fontSize:'0.8em', textTransform:'uppercase', fontWeight:'700', letterSpacing:'1px' }
const luxuryTdStyle = { padding:'15px', fontSize:'1em' }

const luxuryBtnDeleteStyle = {
  color: theme.danger, 
  border: `1px solid ${theme.danger}`, 
  background: 'transparent', 
  padding: '6px 15px', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontSize: '0.85em', 
  fontWeight: '600',
  transition: 'all 0.2s ease',
}

// Funkce pro vstříknutí globálních CSS (pro hover efekty a focus)
function injectGlobalCSS() {
  const style = document.createElement('style');
  style.innerHTML = `
    input:focus, select:focus {
      outline: none;
      border-color: ${theme.primary} !important;
      box-shadow: 0 0 10px ${theme.primary}55 !important;
    }
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .table-row-hover:hover {
      background-color: #2a2e3533 !important;
    }
    /* Moderní scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: ${theme.bgApp}; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; borderRadius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textMuted}; }
  `;
  document.head.appendChild(style);
}

export default App