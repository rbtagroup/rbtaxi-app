import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const theme = {
  bg: '#050608',
  card: '#0f1115',
  accent: '#00f2ff', // Neon tyrkysová
  accentDim: 'rgba(0, 242, 255, 0.1)',
  text: '#ffffff',
  textMuted: '#626d7a',
  border: '#1f242b',
  danger: '#ff3333'
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
    let z = new Date(datumSmeny + 'T00:00:00');
    let k = new Date(datumSmeny + 'T00:00:00');

    if (typSmeny === 'R') { z.setHours(7,0); k.setHours(19,0); }
    else if (typSmeny === 'O') { z.setHours(13,0); k.setDate(k.getDate()+1); k.setHours(1,0); }
    else if (typSmeny === 'N') { z.setHours(19,0); k.setDate(k.getDate()+1); k.setHours(7,0); }

    const { error } = await supabase.from('smeny').insert([{
      jmeno_ridice: vybraneJmeno, auto_id: vybraneAuto, 
      zacatek: z.toISOString(), konec: k.toISOString(),
      typ_smeny: typSmeny === 'R' ? 'Raní' : typSmeny === 'O' ? 'Odpolední' : 'Noční'
    }])
    if (error) alert(error.message)
    else { alert('Uloženo!'); nactiSmeny(); }
  }

  const formatClock = (iso) => {
    const d = new Date(iso);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  const getDen = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { weekday: 'long' }).toUpperCase();

  const mojeSmeny = smeny.filter(s => s.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2)

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'Inter, sans-serif', padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ maxWidth: '1000px', margin: '0 auto 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.5em', fontWeight: '900', letterSpacing: '-1px' }}>
          RB TAXI <span style={{ color: theme.accent }}>HODONÍN</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setZobrazeni('ridic')} style={{ ...btnTab, color: zobrazeni === 'ridic' ? theme.accent : theme.textMuted }}>ŘIDIČ</button>
          <button onClick={() => { if (window.prompt('Heslo:') === 'taxi123') setZobrazeni('dispecer') }} style={{ ...btnTab, color: zobrazeni === 'dispecer' ? theme.accent : theme.textMuted }}>DISPEČINK</button>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: 'auto' }}>
        {zobrazeni === 'dispecer' ? (
          /* DISPEČINK VIEW */
          <div>
            <div style={panelStyle}>
              <h3 style={{ marginTop: 0, color: theme.accent }}>NOVÁ SMĚNA</h3>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><label style={labelS}>ŘIDIČ</label>
                  <select value={vybraneJmeno} onChange={e => setVybraneJmeno(e.target.value)} style={inputS}>
                    {ridici.map(r => <option key={r.id} value={r.jmeno}>{r.jmeno}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}><label style={labelS}>VOZIDLO</label>
                  <select value={vybraneAuto} onChange={e => setVybraneAuto(e.target.value)} style={inputS}>
                    {auta.map(a => <option key={a.id} value={a.id}>{a.spz}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}><label style={labelS}>DATUM</label>
                  <input type="date" value={datumSmeny} onChange={e => setDatumSmeny(e.target.value)} style={inputS} />
                </div>
                <div style={{ flex: 1 }}><label style={labelS}>TYP</label>
                  <select value={typSmeny} onChange={e => setTypSmeny(e.target.value)} style={inputS}>
                    <option value="R">RANÍ (07-19)</option>
                    <option value="O">ODPOLEDNÍ (13-01)</option>
                    <option value="N">NOČNÍ (19-07)</option>
                  </select>
                </div>
                <button type="submit" style={btnPrimary}>ULOŽIT SMĚNU</button>
              </form>
            </div>

            <div style={panelStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: theme.textMuted, fontSize: '0.7em', letterSpacing: '1px' }}>
                    <th style={thS}>DEN / DATUM</th><th style={thS}>ŘIDIČ</th><th style={thS}>VOZIDLO</th><th style={thS}>SMĚNA</th><th style={thS}>ČAS</th><th style={thS}>AKCE</th>
                  </tr>
                </thead>
                <tbody>
                  {smeny.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={tdS}><span style={{ color: theme.accent, fontWeight: 'bold' }}>{getDen(s.zacatek)}</span><br />{new Date(s.zacatek).toLocaleDateString('cs-CZ')}</td>
                      <td style={tdS}>{s.jmeno_ridice}</td>
                      <td style={tdS}><span style={badgeS}>{s.auta?.spz}</span></td>
                      <td style={tdS}>{s.typ_smeny}</td>
                      <td style={tdS}><span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{formatClock(s.zacatek)} – {formatClock(s.konec)}</span></td>
                      <td style={tdS}><button onClick={async () => { if (window.confirm('Smazat?')) { await supabase.from('smeny').delete().eq('id', s.id); nactiSmeny(); } }} style={{ color: theme.danger, background: 'none', border: 'none', cursor: 'pointer' }}>SMAZAT</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ŘIDIČ VIEW */
          <div style={{ maxWidth: '450px', margin: 'auto' }}>
            <div style={{ ...panelStyle, textAlign: 'center', marginBottom: '30px' }}>
              <label style={{ ...labelS, marginBottom: '10px' }}>KDO DNES SEDÁ ZA VOLANT?</label>
              <input placeholder="ZADEJ SVÉ JMÉNO..." value={mojeJmeno} onChange={e => setMojeJmeno(e.target.value)} style={{ ...inputS, textAlign: 'center', fontSize: '1.2em', border: `1px solid ${theme.accent}` }} />
            </div>

            {mojeSmeny.map(s => (
              <div key={s.id} style={driverCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <div style={{ color: theme.accent, fontSize: '0.8em', fontWeight: 'bold' }}>{getDen(s.zacatek)}</div>
                    <div style={{ fontSize: '1.4em', fontWeight: '900' }}>{new Date(s.zacatek).toLocaleDateString('cs-CZ')}</div>
                  </div>
                  <div style={badgeType}>{s.typ_smeny.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '2.5em', fontWeight: '900', color: theme.accent, lineHeight: 1 }}>
                    {formatClock(s.zacatek)} <span style={{ fontSize: '0.4em', color: theme.textMuted }}>DO</span> {formatClock(s.konec)}
                  </div>
                  <div style={badgeCar}>{s.auta?.spz}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// --- STYLES ---
const panelStyle = { background: theme.card, padding: '25px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '20px' };
const driverCard = { background: theme.card, padding: '25px', borderRadius: '20px', border: `1px solid ${theme.border}`, marginBottom: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const inputS = { width: '100%', padding: '15px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: '#000', color: '#fff', boxSizing: 'border-box' };
const labelS = { fontSize: '0.7em', color: theme.textMuted, display: 'block', marginBottom: '5px', fontWeight: '900', letterSpacing: '1px' };
const btnTab = { background: 'none', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '0.9em', letterSpacing: '1px' };
const btnPrimary = { background: theme.accent, color: '#000', border: 'none', padding: '15px 30px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' };
const thS = { padding: '15px' };
const tdS = { padding: '15px' };
const badgeS = { background: theme.text, color: '#000', padding: '4px 8px', borderRadius: '6px', fontWeight: '900', fontSize: '0.9em' };
const badgeCar = { background: '#fff', color: '#000', padding: '10px 15px', borderRadius: '10px', fontWeight: '900', fontSize: '1.2em' };
const badgeType = { border: `1px solid ${theme.accent}`, color: theme.accent, padding: '4px 10px', borderRadius: '8px', fontSize: '0.8em', fontWeight: 'bold' };

export default App