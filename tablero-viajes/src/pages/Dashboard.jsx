import { useState } from 'react'
import { supabase } from '../supabaseClient'
import MiSede from './MiSede'
import Resumen from './Resumen'
import Admin from './Admin'

const SEDE_COLORS = {
  Chile: { bg: '#EEEDFE', color: '#3C3489' },
  Mendoza: { bg: '#FEF3E2', color: '#7A4500' },
  'Buenos Aires': { bg: '#E2F4EC', color: '#0A5C3E' },
  Uruguay: { bg: '#FDEEE8', color: '#7A2A10' },
  admin: { bg: '#f1f5f9', color: '#475569' },
}

export default function Dashboard({ session, perfil }) {
  const [tab, setTab] = useState('sede')
  const sedeColor = SEDE_COLORS[perfil.sede] || SEDE_COLORS.admin
  const isAdmin = perfil.sede === 'admin'

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: '#1a1f2e',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            🚛 Tablero de Viajes
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {!isAdmin && (
              <NavTab label="Mi Sede" active={tab === 'sede'} onClick={() => setTab('sede')} />
            )}
            <NavTab label="Resumen" active={tab === 'resumen'} onClick={() => setTab('resumen')} />
            {isAdmin && (
              <NavTab label="Admin" active={tab === 'admin'} onClick={() => setTab('admin')} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: sedeColor.bg,
            color: sedeColor.color,
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {isAdmin ? '⚙️ Admin' : perfil.sede}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>{perfil.nombre}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {tab === 'sede' && !isAdmin && <MiSede perfil={perfil} />}
        {tab === 'resumen' && <Resumen perfil={perfil} />}
        {tab === 'admin' && isAdmin && <Admin />}
      </main>
    </div>
  )
}

function NavTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
        color: active ? '#fff' : '#94a3b8',
        border: 'none',
        padding: '6px 16px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
