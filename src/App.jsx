import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// --- RB TAXI PROFESIONAL THEME (Čistý, technický, kompaktní) ---
const theme = {
  bgApp: '#080a0d',       // Hluboká černá s modrým nádechem
  bgCard: '#111419',      // Temná šedá pro karty
  border: '#21262e',      // Ostré, jemné ohraničení
  accent: '#f5c518',      // Taxi zlatá
  success: '#0ae6a8',     // Tyrkysovo-zelená pro Raní
  info: '#2589ff',        // Čistě modrá pro Odpolední
  danger: '#ff4d4d',      // Červená pro Noční/Smazat
  text: '#ffffff',
  textMuted: '#6b768a',
  // Technické písmo pro data a časy
  fontMono: '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
}

function App() {
  const [auta, setAuta] = useState([])
  const [ridici, setRidici] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')
  const [vyrRidice, setVyrRidice] = useState('')
  const [vyrAuto, setVyrAuto] = useState('')
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [typ, setTyp] = useState('R')
  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => { 
    nactiVse()
    injectGlobalStyles() 
  }, [])

  async function nactiVse() {
    const { data: autaData } = await supabase.from('auta').select('*')
    if (autaData) { setAuta(autaData); if (autaData.length > 0) setVyrAuto(autaData[0].id); }
    const { data: ridiciData } = await supabase.from('ridici').select('*').order('jmeno')
    if (ridiciData) { setRidici(ridiciData); if (ridiciData.length > 0) setVyrRidice(ridiciData[0].jmeno); }
    nactiSmeny()
  }

  async function nactiSmeny() {
    const { data } = await supabase.from('smeny').select('*, auta(spz)').gte('konec', new Date().toISOString()).order('zacatek', { ascending: true })
    if (data) setSmeny(data)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    
    // --- NEPRŮSTŘELNÝ FIX ČASŮ V LOKÁLNÍM PÁSMU ---
    // Vytvoříme datum a čas jako řetězec, který JavaScriptu vnutí lokální čas
    let startLocal = `${datum} 07:00:00`; // Výchozí R
    let konecLocal = `${datum} 19:00:00`; // Výchozí R

    if (typ === 'O') {
      startLocal = `${datum} 13:00:00`;
      // Výpočet konce dalšího dne pro odpolední/noční
      let dKonec = new Date(datum + 'T13:00:00'); dKonec.setDate(dKonec.getDate() + 1);
      const datumKonec = dKonec.toISOString().split('T')[0];
      konecLocal = `${datumKonec} 01:00:00`;
    } else if (typ === 'N') {
      startLocal = `${datum} 19:00:00`;
      let dKonec = new Date(datum + 'T19:00:00'); dKonec.setDate(dKonec.getDate() + 1);
      const datumKonec = dKonec.toISOString().split('T')[0];
      konecLocal = `${datumKonec} 07:00:00`;
    }

    // Převedeme lokální řetězce na ISO pro Supabase
    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vyrRidice, auto_id: vyrAuto,
      zacatek: new Date(startLocal).toISOString(), konec: new Date(konecLocal).toISOString(),
      typ_smeny: typ === 'R' ? 'Raní' : typ === 'O' ? 'Odpolední' : 'Noční'
    }])

    if (error) alert(error.message)
    else { alert('Uloženo!'); nactiSmeny(); }
  }

  // --- FORMÁTOVÁNÍ (Technický styl) ---
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const formatDay = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'long' });
  const formatDateTime = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });

  const shiftColor = (typ) => {
    if (typ === 'Raní') return theme.success;
    if (typ === 'Odpolední') return theme.info;
    return theme.danger;
  }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  const isRidic = zobrazeni === 'ridic';

  return (
    <div style={{ backgroundColor: theme.bgApp, minHeight: '100vh', padding: '10px', color: theme.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* PROFESSIONAL COMPACT HEADER */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto 15px auto', background:theme.bgCard, padding:'12px 20px', borderRadius:'12px', border:`1px solid ${theme.border}` }}>
        <h1 style={{ margin:0, fontSize:'1.1em', fontWeight:'900', letterSpacing:'-0.5px' }}>
          RB TAXI <span style={{color:theme.accent}}>HODONÍN</span> <small style={{fontSize:'0.7em', color:theme.textMuted}}>V8.1 PRO</small>
        </h1>
        <div style={{ display:'flex', gap:'5px', background:'#000', padding:'3px', borderRadius:'10px' }}>
          <button onClick={()=>setZobrazeni('ridic')} style={{ ...btnNav, ...(isRidic ? btnNavActive : {}) }}>ŘIDIČ</button>
          <button onClick={()=>{ if(window.prompt('Zadejte dispečerské heslo:')==='taxi123') setZobrazeni('dispecer') }} style={{ ...btnNav, ...(!isRidic ? btnNavActive : {}) }}>DISPEČINK</button>
        </div>
      </header>

      <main>
        {isRidic ? (
          
          /* ==============================================
             --- ŘIDIČ VIEW (Kompaktní, Profesionální) ---
             ============================================== */
          <div style={{ maxWidth: '450px', margin: 'auto' }}>
            
            {/* Vstupní políčko */}
            <div style={{ background:theme.bgCard, padding:'15px', borderRadius:'15px', border:`1px solid ${theme.border}`, marginBottom:'15px', textAlign:'center' }}>
              <label style={labelPro}>Identifikace řidiče</label>
              <input 
                type="text" 
                value={mojeJmeno} 
                onChange={e=>setMojeJmeno(e.target.value)} 
                placeholder="Zadejte své jméno (např. Lukáš)" 
                style={{ ...inputS, textAlign:'center', fontSize:'1.1em', marginTop:'10px', textTransform:'capitalize' }}
              />
            </div>

            <h2 style={{ fontSize:'1em', textTransform:'uppercase', color:theme.textMuted, paddingLeft:'10px', marginBottom:'10px', letterSpacing:'1px' }}>Tvoje nadcházející směny</h2>

            {mojeJmeno.length <= 2 && <div style={proEmptyState}>Vyhledej své jméno nahoře.</div>}
            {mojeJmeno.length > 2 && mojeSmeny.length === 0 && <div style={proEmptyState}>Aktuálně pro tebe nemáme směny.</div>}
            
            {mojeSmeny.map((s, index) => (
              <div key={s.id} style={{ 
                background: theme.bgCard, 
                padding: '12px 15px', 
                borderRadius: '12px', 
                marginBottom: '8px', 
                border: `1px solid ${theme.border}`,
                borderLeft: index === 0 ? `4px solid ${shiftColor(s.typ_smeny)}` : `1px solid ${theme.border}`,
                position:'relative'
              }}>
                {index === 0 && <div style={badgeClosestPro}>NEJBLIŽŠÍ</div>}
                
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'5px'}}>
                   <div>
                       <div style={{ fontSize:'0.8em', textTransform:'uppercase', color:theme.textMuted, fontWeight:'bold', textTransform:'capitalize' }}>{formatDay(s.zacatek)}</div>
                       <div style={{ fontSize:'1.1em', fontWeight:'bold', fontFamily:theme.fontMono }}>{formatDateTime(s.zacatek)}</div>
                   </div>
                   <div style={{ color: shiftColor(s.typ_smeny), fontWeight:'900', fontSize:'0.8em', textTransform:'uppercase', letterSpacing:'1px' }}>{s.typ_smeny}</div>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                   <div style={{ fontSize:'1.8em', fontWeight:'900', letterSpacing:'-1px', fontFamily:theme.fontMono, lineHeight:1 }}>
                    {formatTime(s.zacatek)} <span style={{fontSize:'0.5em', color:theme.textMuted}}>–</span> {formatTime(s.konec)}
                   </div>
                   <div style={{ ...badgeAuto, fontSize:'1.1em', padding:'4px 10px', marginBottom:'-2px' }}>{s.auta?.spz}</div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          
          /* ==================================================
             --- DISPEČINK VIEW (Kompaktní, Dashboard Styl) ---
             ================================================== */
          <div style={{ maxWidth:'1200px', margin:'auto' }}>
            <div style={{ background:theme.bgCard, padding:'20px', borderRadius:'15px', border:`1px solid ${theme.border}`, marginBottom:'15px'}}>
              <h3 style={{marginTop:0, fontSize:'1em', color:theme.accent}}>➕ Naplánovat novou směnu</h3>
              <form onSubmit={ulozSmenu} style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={formGroupPro}><label style={labelPro}>Řidič</label><select value={vyrRidice} onChange={e=>setVyrRidice(e.target.value)} style={inputS}>{ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)}</select></div>
                <div style={formGroupPro}><label style={labelPro}>Vůz</label><select value={vyrAuto} onChange={e=>setVyrAuto(e.target.value)} style={inputS}>{auta.map(a => <option key={a.id} value={a.id}>{a.spz} ({a.typ_vozu})</option>)}</select></div>
                <div style={formGroupPro}><label style={labelPro}>Datum</label><input required type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={inputS} /></div>
                <div style={formGroupPro}><label style={labelPro}>Typ (R/O/N)</label><select value={typ} onChange={e=>setTyp(e.target.value)} style={inputS}><option value="R">Raní (7-19)</option><option value="O">Odpolední (13-01)</option><option value="N">Noční (19-07)</option></select></div>
                <button type="submit" style={btnSubmitPro}>Uložit do cloudu</button>
              </form>
            </div>

            <div style={{ background:theme.bgCard, padding:'20px', borderRadius:'15px', border:`1px solid ${theme.border}`}}>
              <h3 style={{marginTop:0, fontSize:'1em', textTransform:'uppercase', color:theme.textMuted}}>🗓️ Aktivní rozpis směn (staré skryty)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign:'left', color:theme.textMuted, fontSize:'0.7em', textTransform:'uppercase', letterSpacing:'1px', borderBottom:`2px solid ${theme.border}` }}>
                    <th style={tableH}>Den / Datum</th><th style={tableH}>Řidič</th><th style={tableH}>Auto</th><th style={tableH}>Typ</th><th style={tableH}>Čas směny</th><th style={tableH}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.map(s => (
                    <tr key={s.id} style={{ borderBottom:`1px solid ${theme.border}` }} className="table-row-pro">
                      <td style={tableD}><div style={{textTransform:'capitalize', fontWeight:'bold'}}>{formatDay(s.zacatek)}</div> <div style={{fontFamily:theme.fontMono, fontSize:'0.85em', color:theme.textMuted}}>{new Date(s.zacatek).toLocaleDateString('cs-CZ')}</div></td>
                      <td style={tableD}>{s.jmeno_ridice}</td>
                      <td style={tableD}><span style={badgeAuto}>{s.auta?.spz}</span></td>
                      <td style={tableD}><span style={{ color: shiftColor(s.typ_smeny), fontWeight:'bold' }}>{s.typ_smeny}</span></td>
                      <td style={{...tableD, fontFamily:theme.fontMono, fontSize:'1.1em', fontWeight:'bold'}}>{formatTime(s.zacatek)} <span style={{fontWeight:'normal', color:theme.textMuted}}>–</span> {formatTime(s.konec)}</td>
                      <td style={tableD}><button onClick={async () => { if (window.confirm('Opravdu smazat?')) { await supabase.from('smeny').delete().eq('id', s.id); nactiSmeny(); } }} style={btnDeletePro}>Smazat</button></td>
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

// --- CSS-IN-JS PRO VELMI KOMPAKTNÍ VIZUÁL ---

const labelPro = { fontSize:'0.7em', color:theme.textMuted, fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px', display:'block' };

const inputS = { width:'100%', padding:'10px 12px', borderRadius:'10px', border:`1px solid ${theme.border}`, background:'#000', color:'#fff', fontSize:'0.9em', marginTop:'5px', boxSizing:'border-box', fontFamily:'inherit' };

const formGroupPro = { display:'flex', flexDirection:'column', flex:'1 1 180px' };

const btnNav = { border:'none', padding:'6px 16px', borderRadius:'8px', color:'#fff', fontWeight:'bold', cursor:'pointer', background:'transparent', fontSize:'0.85em' };
const btnNavActive = { background: theme.border };

const proEmptyState = { textAlign:'center', padding:'30px', color:theme.textMuted, border:`1px solid ${theme.border}`, borderRadius:'12px', fontSize:'0.9em' };

const badgeClosestPro = { position:'absolute', top:0, right:'15px', background:theme.success, color:'#000', fontSize:'0.65em', fontWeight:'900', padding:'2px 8px', borderBottomLeftRadius:'6px', borderBottomRightRadius:'6px', letterSpacing:'0.5px'};

const badgeAuto = { background: '#fff', color: '#000', padding: '2px 8px', borderRadius: '6px', fontWeight: '900', fontFamily: theme.fontMono, fontSize: '0.9em' };

const btnSubmitPro = { background: theme.primary, color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '900', fontSize: '0.9em', cursor: 'pointer', flex:'0 0 auto', alignSelf:'flex-end', height:'42px', marginTop:'10px' };

const tableH = { padding: '12px 15px' };
const tableD = { padding: '10px 15px', fontSize:'0.95em' };

const btnDeletePro = { background: 'none', border: `1px solid ${theme.danger}`, color: theme.danger, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em' };

// Globální CSS pro moderní scrollbary a hover efekty
function injectGlobalStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${theme.bgApp}; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; borderRadius: 3px; }
    input:focus, select:focus { outline: none; border-color: ${theme.accent} !important; box-shadow: 0 0 5px ${theme.accent}33 !important; }
    .table-row-pro:hover { background: #ffffff03; }
    body { margin: 0; }
  `;
  document.head.appendChild(style);
}

export default App