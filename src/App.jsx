import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Společná barevná paleta pro celou aplikaci
const theme = {
  primary: '#f39c12', // Zlatavě oranžová (RB Taxi)
  primaryHover: '#e68a00',
  danger: '#e74c3c',
  dangerHover: '#c0392b',
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
      alert('Směna byla úspěšně uložena do cloudu!')
      setJmenoRidice(''); setZacatekSmeny(''); setKonecSmeny('');
      nactiSmeny()
    }
  }

  async function smazSmenu(id) {
    if (window.confirm('Opravdu chcete tuto směnu nenávratně smazat z databáze?')) {
      const { error } = await supabase.from('smeny').delete().eq('id', id)
      if (error) alert('Chyba při mazání: ' + error.message)
      else nactiSmeny()
    }
  }

  function prihlaseniDispecera() {
    const heslo = window.prompt('Zadejte heslo pro přístup do Dispečinku:')
    if (heslo === 'taxi123') {
      setZobrazeni('dispecer')
    } else if (heslo !== null) {
      alert('Nesprávné heslo! Přístup odepřen.')
    }
  }

  // Funkce pro hezký formát data
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }

  const mojeNaplanovaneSmeny = smeny.filter(smena => 
    smena.jmeno_ridice.toLowerCase().includes(mojeJmeno.toLowerCase()) && mojeJmeno.length > 2
  )

  const isRidic = zobrazeni === 'ridic';

  return (
    <div style={{ 
      backgroundColor: isRidic ? theme.bgDriver : theme.bgDispatcher, 
      minHeight: '100vh', 
      padding: '10px 10px 30px 10px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: isRidic ? theme.textDriver : theme.textDispatcher,
      transition: 'background-color 0.3s ease',
      boxSizing: 'border-box'
    }}>
      
      {/* --- SPOLEČNÉ ZÁHLAVÍ --- */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: isRidic ? theme.bgDriverCard : theme.bgDispatcherCard, 
        padding: '12px 20px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        position: 'sticky',
        top: '10px',
        zIndex: 100
      }}>
        <h1 style={{ margin: 0, fontSize: '1.4em', fontWeight: '800', letterSpacing: '-0.5px' }}>
          RB taxi <span style={{ color: theme.primary }}>Hodonín</span>
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setZobrazeni('ridic')} style={{...navBtnStyle, ...(isRidic ? navBtnActiveStyle : {})}}>Řidič</button>
          <button onClick={prihlaseniDispecera} style={{...navBtnStyle, ...(!isRidic ? navBtnActiveStyle : {})}}>Dispečink</button>
        </div>
      </header>

      <main>
        {isRidic ? (
          
          /* =========================================
             --- POHLED ŘIDIČE (Dark, Mobile First) ---
             ========================================= */
          <div style={{ maxWidth: '480px', margin: 'auto' }}>
            
            {/* Hledací políčko */}
            <div style={{ 
              backgroundColor: theme.bgDriverCard, 
              padding: '20px', 
              borderRadius: '20px', 
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <label style={{ display: 'block', marginBottom: '8px', color: theme.textDriverMuted, fontSize: '0.9em', fontWeight: '600' }}>Kdo jsi? (Zadej alespoň 3 písmena)</label>
              <div style={{position: 'relative'}}>
                <span style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2em'}}>👤</span>
                <input 
                  type="text" 
                  value={mojeJmeno} 
                  onChange={(e) => setMojeJmeno(e.target.value)} 
                  placeholder="Např. Karel Novák" 
                  style={{ ...inputStyle, backgroundColor: '#2c2c2c', color: 'white', borderColor: '#3a3a3a', paddingLeft: '40px' }}
                />
              </div>
            </div>

            <h2 style={{ fontSize: '1.3em', marginBottom: '15px', paddingLeft: '5px', fontWeight: '700' }}>Tvoje naplánované směny</h2>

            {mojeJmeno.length <= 2 ? (
              <div style={ridicEmptyStateStyle}>
                <span style={{fontSize: '3em', display: 'block', marginBottom: '10px'}}>👋</span>
                Napiš své jméno nahoru,<br/>abychom ti mohli ukázat tvůj rozpis.
              </div>
            ) : mojeNaplanovaneSmeny.length === 0 ? (
              <div style={ridicEmptyStateStyle}>
                <span style={{fontSize: '3em', display: 'block', marginBottom: '10px'}}>📭</span>
                Aktuálně pro tebe<br/>nemáme naplánované žádné směny.
              </div>
            ) : (
              mojeNaplanovaneSmeny.map((smena, index) => (
                /* Karta směny */
                <div key={smena.id} style={{ 
                  backgroundColor: theme.bgDriverCard, 
                  padding: '20px', 
                  borderRadius: '20px', 
                  marginBottom: '15px', 
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  borderLeft: index === 0 ? `6px solid ${theme.primary}` : '6px solid #444',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {index === 0 && <div style={closestBadgeStyle}>NEJBLIŽŠÍ SMĚNA</div>}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2em', fontWeight: '800' }}>{smena.typ_smeny} směna</h3>
                      <div style={{color: theme.textDriverMuted, fontSize: '0.9em'}}>{new Date(smena.zacatek).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    </div>
                    <span style={ridicShiftIconStyle}>{smena.typ_smeny === 'Denní' ? '☀️' : '🌙'}</span>
                  </div>

                  <div style={{ marginBottom: '15px', backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{textAlign: 'center', borderRight: '1px solid #444', paddingRight: '15px'}}>
                        <div style={{fontSize: '0.8em', color: theme.textDriverMuted}}>OD</div>
                        <div style={{fontSize: '1.2em', fontWeight: '700', color: theme.primary}}>{new Date(smena.zacatek).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '0.8em', color: theme.textDriverMuted}}>DO</div>
                        <div style={{fontSize: '1.2em', fontWeight: '700'}}>{new Date(smena.konec).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: theme.primary, color: '#000', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700' }}>
                    <span style={{fontSize: '1.3em'}}>🚖</span>
                    <div>
                      <div style={{ fontSize: '1.1em' }}>{smena.auta?.spz || 'Neznámé auto'}</div>
                      <div style={{ fontSize: '0.8em', opacity: 0.8, fontWeight: 'normal' }}>{smena.auta?.typ_vozu || ''}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        ) : (
          
          /* =========================================
             --- POHLED DISPEČERA (Light, Desktop) ---
             ========================================= */
          <div style={{ maxWidth: '1100px', margin: 'auto' }}>
            
            {/* FORMULÁŘ */}
            <div style={dispecerCardStyle}>
              <h2 style={{ ...cardTitleStyle, color: theme.primary }}>➕ Naplánovat novou směnu</h2>
              <form onSubmit={ulozSmenu} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={formGroupStyle}><label style={labelStyle}>👤 Jméno řidiče</label><input required placeholder="Karel Novák" value={jmenoRidice} onChange={(e) => setJmenoRidice(e.target.value)} type="text" style={inputStyle} /></div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>🚖 Auto (SPZ)</label>
                  <select value={vybraneAutoId} onChange={(e) => setVybraneAutoId(e.target.value)} style={{...inputStyle, appearance: 'none', background: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>") no-repeat', backgroundPosition: 'right 8px top 50%'}}>
                    {auta.map(auto => <option key={auto.id} value={auto.id}>{auto.spz} - {auto.typ_vozu}</option>)}
                  </select>
                </div>
                <div style={formGroupStyle}><label style={labelStyle}>⏰ Začátek směny</label><input required value={zacatekSmeny} onChange={(e) => setZacatekSmeny(e.target.value)} type="datetime-local" style={inputStyle} /></div>
                <div style={formGroupStyle}><label style={labelStyle}>🏁 Konec směny</label><input required value={konecSmeny} onChange={(e) => setKonecSmeny(e.target.value)} type="datetime-local" style={inputStyle} /></div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>☀️ Typ</label>
                  <select value={typSmeny} onChange={(e) => setTypSmeny(e.target.value)} style={{...inputStyle, appearance: 'none', background: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>") no-repeat', backgroundPosition: 'right 8px top 50%'}}>
                    <option value="Denní">Denní ☀️</option><option value="Noční">Noční 🌙</option>
                  </select>
                </div>
                <button type="submit" style={btnPrimaryStyle}>Uložit do cloudu</button>
              </form>
            </div>

            {/* TABULKA */}
            <div style={dispecerCardStyle}>
              <h2 style={cardTitleStyle}>🗓️ Aktuální rozpis směn (seřazeno dle času)</h2>
              {smeny.length === 0 ? (
                 <div style={{textAlign: 'center', padding: '30px', color: theme.textDispatcherMuted, fontSize: '1.1em'}}>
                   Zatím nejsou naplánovány žádné směny. Použijte formulář nahoře.
                 </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Řidič</th>
                        <th style={thStyle}>Vůz (SPZ)</th>
                        <th style={thStyle}>Začátek</th>
                        <th style={thStyle}>Konec</th>
                        <th style={thStyle}>Typ</th>
                        <th style={thStyle}>Akce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smeny.map(smena => (
                        <tr key={smena.id} style={trStyle}>
                          <td style={tdStyle}><strong>{smena.jmeno_ridice}</strong></td>
                          <td style={tdStyle}>
                            <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
                              <span style={{fontSize: '1.2em'}}>🚖</span>
                              <div>
                                <div style={{fontWeight: 'bold'}}>{smena.auta?.spz}</div>
                                <div style={{fontSize: '0.8em', color: theme.textDispatcherMuted}}>{smena.auta?.typ_vozu}</div>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}>{formatDateTime(smena.zacatek)}</td>
                          <td style={tdStyle}>{formatDateTime(smena.konec)}</td>
                          <td style={tdStyle}>
                            <span style={{ 
                              ...badgeStyle, 
                              backgroundColor: smena.typ_smeny === 'Denní' ? '#ffeaa7' : '#74b9ff', 
                              color: smena.typ_smeny === 'Denní' ? '#d35400' : '#0984e3'
                            }}>
                              {smena.typ_smeny === 'Denní' ? '☀️' : '🌙'} {smena.typ_smeny}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button onClick={() => smazSmenu(smena.id)} style={btnDeleteStyle}>Smazat</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign: 'center', marginTop: '30px', color: isRidic ? theme.textDriverMuted : theme.textDispatcherMuted, fontSize: '0.8em'}}>
        &copy; 2024 RB taxi Hodonín - Interní systém směn. <br/>Data jsou bezpečně uložena v Supabase Cloudu.
      </footer>
    </div>
  )
}

// --- STYLY (CSS-in-JS) ---

const navBtnStyle = {
  padding: '8px 16px',
  cursor: 'pointer',
  borderRadius: '10px',
  border: '2px solid transparent',
  fontWeight: '700',
  fontSize: '0.9em',
  backgroundColor: 'transparent',
  color: theme.textDriverMuted,
  transition: 'all 0.2s ease',
}

const navBtnActiveStyle = {
  backgroundColor: theme.primary,
  color: '#000',
  boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)',
}

const ridicEmptyStateStyle = {
  textAlign: 'center', 
  padding: '40px 20px', 
  color: theme.textDriverMuted, 
  backgroundColor: theme.bgDriverCard, 
  borderRadius: '20px', 
  lineHeight: '1.5',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}

const ridicShiftIconStyle = {
  fontSize: '2em',
  backgroundColor: '#2c2c2c',
  width: '50px', height: '50px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '15px',
}

const closestBadgeStyle = {
  position: 'absolute',
  top: '0', right: '20px',
  backgroundColor: theme.primary,
  color: '#000',
  padding: '4px 12px',
  borderBottomLeftRadius: '10px',
  borderBottomRightRadius: '10px',
  fontSize: '0.75em',
  fontWeight: '800',
  letterSpacing: '0.5px'
}

const dispecerCardStyle = {
  backgroundColor: theme.bgDispatcherCard, 
  padding: '25px', 
  borderRadius: '20px', 
  marginBottom: '20px', 
  boxShadow: '0 5px 20px rgba(0,0,0,0.05)'
}

const cardTitleStyle = {
  margin: '0 0 20px 0',
  fontSize: '1.4em',
  fontWeight: '800',
  letterSpacing: '-0.3px'
}

const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 180px' }

const labelStyle = { fontSize: '0.85em', color: theme.textDispatcherMuted, fontWeight: '700', paddingLeft: '3px' }

const inputStyle = {
  padding: '12px',
  borderRadius: '12px',
  border: `2px solid ${theme.border}`,
  fontSize: '1em',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  fontFamily: 'inherit'
}

const btnPrimaryStyle = {
  backgroundColor: theme.primary,
  color: '#000',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: '800',
  fontSize: '1em',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 10px rgba(243, 156, 18, 0.3)',
  flex: '0 0 auto',
  alignSelf: 'flex-end',
  height: '48px'
}

const btnDeleteStyle = {
  backgroundColor: 'transparent',
  color: theme.danger,
  border: `2px solid ${theme.danger}`,
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.85em',
  fontWeight: '700',
  transition: 'all 0.2s ease'
}

const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '-8px' }

const thStyle = { textAlign: 'left', padding: '12px 15px', color: theme.textDispatcherMuted, fontSize: '0.85em', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }

const trStyle = { backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }

const tdStyle = { padding: '15px', borderTop: `1px solid ${theme.bgDispatcher}`, borderBottom: `1px solid ${theme.bgDispatcher}` }

const badgeStyle = { padding: '5px 10px', borderRadius: '8px', fontSize: '0.85em', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }

export default App