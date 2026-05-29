import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import MiSede from './MiSede'
import Resumen from './Resumen'
import Admin from './Admin'

const SEDE_FLAGS = {
  Chile: '🇨🇱',
  Mendoza: '🇦🇷',
  'Buenos Aires': '🇦🇷',
  Uruguay: '🇺🇾',
  admin: '⚙️',
}

export default function Dashboard({ session, perfil }) {
  const isAdmin = perfil.sede === 'admin'
  const [tab, setTab] = useState(isAdmin ? 'resumen' : 'sede')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  // Cerrar el menú si se hace click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

        {/* Menú de usuario */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: menuOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{SEDE_FLAGS[perfil.sede] || '👤'}</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
              {perfil.nombre}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>
              {menuOpen ? '▲' : '▼'}
            </span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              background: '#fff',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              minWidth: '200px',
              overflow: 'hidden',
              zIndex: 100,
            }}>
              {/* Info del usuario */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  {perfil.nombre}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {SEDE_FLAGS[perfil.sede]} {perfil.sede === 'admin' ? 'Administrador' : `Sede ${perfil.sede}`}
                </div>
              </div>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#dc2626',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>

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
