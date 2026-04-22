import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// --- LUXURY V8 THEME (Inspirováno vaším posledním obrázkem) ---
const theme = {
  bg: '#08090a',          // Hluboké černé pozadí
  card: '#111318',        // Tmavé panely
  border: '#1f2229',      // Jemné ohraničení
  accent: '#f5c518',      // Taxi zlatá
  success: '#10b981',     // Zelená pro Raní
  info: '#3b82f6',        // Modrá pro Odpolední
  danger: '#ef4444',      // Červená pro Noční/Smazat
  text: '#ffffff',
  textMuted: '#6b7280',
}

function App() {
  const [ridici, setRidici] = useState([])
  const [auta, setAuta] = useState([])
  const [smeny, setSmeny] = useState([])
  const [zobrazeni, setZobrazeni] = useState('ridic')
  
  // Stavy pro formulář
  const [vyrRidice, setVyrRidice] = useState('')
  const [vyrAuto, setVyrAuto] = useState('')
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0])
  const [typ, setTyp] = useState('R')

  const [mojeJmeno, setMojeJmeno] = useState('')

  useEffect(() => { 
    nactiVse()
    injectStyles() 
  }, [])

  async function nactiVse() {
    const { data: r } = await supabase.from('ridici').select('*').order('jmeno')
    if (r) { setRidici(r); if (r.length > 0) setVyrRidice(r[0].jmeno); }
    
    const { data: a } = await supabase.from('auta').select('*')
    if (a) { setAuta(a); if (a.length > 0) setVyrAuto(a[0].id); }
    
    nactiSmeny()
  }

  async function nactiSmeny() {
    const { data } = await supabase.from('smeny').select('*, auta(spz)')
      .gte('konec', new Date().toISOString())
      .order('zacatek', { ascending: true })
    if (data) setSmeny(data)
  }

  async function ulozSmenu(e) {
    e.preventDefault()
    
    // OPRAVA ČASŮ: Vytvoříme datum v lokálním čase bez posunů
    const z = new Date(datum + 'T00:00:00');
    const k = new Date(datum + 'T00:00:00');

    if (typ === 'R') { 
      z.setHours(7,0); k.setHours(19,0); 
    } else if (typ === 'O') { 
      z.setHours(13,0); k.setDate(k.getDate() + 1); k.setHours(1,0); 
    } else if (typ === 'N') { 
      z.setHours(19,0); k.setDate(k.getDate() + 1); k.setHours(7,0); 
    }

    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vyrRidice,
      auto_id: vyrAuto,
      zacatek: z.toISOString(),
      konec: k.toISOString(),
      typ_smeny: typ === 'R' ? 'Raní' : typ === 'O' ? 'Odpolední' : 'Noční'
    }])

    if (error) alert(error.message)
    else { alert('Směna uložena!'); nactiSmeny(); }
  }

  const formatCas = (iso) => new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const formatDen = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' });
  
  const barvaTypu = (t) => {
    if (t === 'Raní') return theme.success;
    if (t === 'Odpolední') return theme.info;
    return theme.danger;
  }

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      
      {/* HEADER VE STYLU LUXURY DASHBOARD */}
      <header style={{ maxWidth: '1200px', margin: '0 auto 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.card, padding: '15px 25px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: theme.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚕</div>
          <div>
            <div style={{ fontWeight: '900', letterSpacing: '1px', fontSize: '1.2em' }}>RB TAXI</div>
            <div style={{ fontSize: '0.7em', color: theme.accent, fontWeight: 'bold' }}>V 8.0 LUXURY</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', background: '#000', padding: '5px', borderRadius: '12px' }}>
          <button onClick={() => setZobrazeni('ridic')} style={{ ...btnNav, background: zobrazeni === 'ridic' ? theme.border : 'transparent' }}>ŘIDIČ</button>
          <button onClick={() => { if (window.prompt('Heslo:') === 'taxi123') setZobrazeni('dispecer') }} style={{ ...btnNav, background: zobrazeni === 'dispecer' ? theme.border : 'transparent' }}>DISPEČINK</button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: 'auto' }}>
        {zobrazeni === 'dispecer' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            {/* FORMULÁŘ */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, color: theme.accent, fontSize: '0.9em', letterSpacing: '1px' }}>NOVÝ ZÁZNAM</h3>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div><label style={labelS}>ŘIDIČ</label>
                  <select value={vyrRidice} onChange={e => setVyrRidice(e.target.value)} style={inputS}>
                    {ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)}
                  </select>
                </div>
                <div><label style={labelS}>VOZIDLO</label>
                  <select value={vyrAuto} onChange={e => setVyrAuto(e.target.value)} style={inputS}>
                    {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
                  </select>
                </div>
                <div><label style={labelS}>DEN SMĚNY</label>
                  <input type="date" value={datum} onChange={e => setDatum(e.target.value)} style={inputS} />
                </div>
                <div><label style={labelS}>TYP SMĚNY</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {['R', 'O', 'N'].map(t => (
                      <button key={t} type="button" onClick={() => setTyp(t)} style={{ ...btnTyp, borderColor: typ === t ? theme.accent : theme.border, color: typ === t ? theme.accent : theme.textMuted }}>{t}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" style={btnSubmit}>ULOŽIT DO DATABÁZE</button>
              </form>
            </div>

            {/* TABULKA */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, fontSize: '0.9em', letterSpacing: '1px' }}>DASHBOARD & HISTORIE</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: theme.textMuted, fontSize: '0.7em', borderBottom: `1px solid ${theme.border}` }}>
                      <th style={thS}>DEN</th><th style={thS}>ŘIDIČ</th><th style={thS}>VOZIDLO</th><th style={thS}>TYP</th><th style={thS}>ČAS</th><th style={thS}>AKCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smeny.map(s => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={tdS}><div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{formatDen(s.zacatek)}</div></td>
                        <td style={tdS}>{s.jmeno_ridice}</td>
                        <td style={tdS}><span style={badgeAuto}>{s.auta?.spz}</span></td>
                        <td style={tdS}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: barvaTypu(s.typ_smeny), display: 'inline-block', marginRight: '8px' }}></div>{s.typ_smeny}</td>
                        <td style={tdS}><span style={{ fontWeight: 'bold' }}>{formatCas(s.zacatek)} - {formatCas(s.konec)}</span></td>
                        <td style={tdS}><button onClick={async () => { if (window.confirm('Smazat?')) { await supabase.from('smeny').delete().eq('id', s.id); nactiSmeny(); } }} style={{ color: theme.danger, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8em' }}>ODSTRANIT</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ŘIDIČ VIEW - ČISTÝ LUXUS */
          <div style={{ maxWidth: '500px', margin: 'auto' }}>
            <div style={{ ...cardStyle, textAlign: 'center', border: `1px solid ${theme.accent}33` }}>
              <label style={labelS}>KONTROLA PLÁNU SMĚN</label>
              <input placeholder="Napiš své jméno..." value={mojeJmeno} onChange={e => setMojeJmeno(e.target.value)} style={{ ...inputS, textAlign: 'center', fontSize: '1.2em', background: 'transparent', border: 'none', borderBottom: `2px solid ${theme.border}` }} />
            </div>
            
            {mojeSmeny.map(s => (
              <div key={s.id} style={{ ...cardStyle, borderLeft: `4px solid ${barvaTypu(s.typ_smeny)}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `${barvaTypu(s.typ_smeny)}11`, borderRadius: '0 0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: barvaTypu(s.typ_smeny) }}>
                  {s.typ_smeny === 'Raní' ? '☀️' : s.typ_smeny === 'Odpolední' ? '🌤️' : '🌙'}
                </div>
                <div style={{ fontSize: '0.8em', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>{formatDen(s.zacatek)}</div>
                <div style={{ fontSize: '2.2em', fontWeight: '900', marginBottom: '10px', letterSpacing: '-1px' }}>{formatCas(s.zacatek)} <span style={{ fontSize: '0.4em', color: theme.textMuted, verticalAlign: 'middle' }}>DO</span> {formatCas(s.konec)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ ...badgeAuto, fontSize: '1em', padding: '5px 12px' }}>{s.auta?.spz}</span>
                  <span style={{ color: barvaTypu(s.typ_smeny), fontWeight: 'bold', fontSize: '0.9em' }}>{s.typ_smeny.toUpperCase()} SMĚNA</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// --- CSS POMOCNÍCI ---
const cardStyle = { background: theme.card, padding: '25px', borderRadius: '20px', border: `1px solid ${theme.border}`, marginBottom: '15px' };
const inputS = { width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: '#000', color: '#fff', fontSize: '1em', marginTop: '5px' };
const labelS = { fontSize: '0.65em', color: theme.textMuted, fontWeight: '900', letterSpacing: '1.5px' };
const btnNav = { border: 'none', padding: '8px 20px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };
const btnTyp = { flex: 1, padding: '10px', background: 'none', border: '2px solid', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnSubmit = { width: '100%', padding: '15px', background: theme.accent, border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' };
const thS = { padding: '15px', fontWeight: '900' };
const tdS = { padding: '15px' };
const badgeAuto = { background: '#fff', color: '#000', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', fontFamily: 'monospace' };

function injectStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    input:focus, select:focus { outline: none; border-color: ${theme.accent} !important; }
    tr:hover { background: #ffffff03; }
    body { margin: 0; background: ${theme.bg}; }
  `;
  document.head.appendChild(style);
}

export default App