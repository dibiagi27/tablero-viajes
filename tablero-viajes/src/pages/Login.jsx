import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Usuario o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="https://raw.githubusercontent.com/dibiagi27/tablero-viajes/main/tablero-viajes/grupo_dibiagi.png" alt="Dibiagi" style={{ width: '270px', marginBottom: '20px' }} />
          <p style={{ color: '#64748b', fontSize: '15px' }}>Ingresá con tu usuario</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div style={{
              background: '#fee2e2', color: '#dc2626',
              padding: '10px 14px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '16px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
       <p style={{
  textAlign: 'right',
  marginTop: '20px',
  fontSize: '13px',
  color: '#94a3b8',
  margin: '20px -34px -40px 0',
}}>
  Desarrollado por Ing. Lautaro Castell
</p>
      </div>
    </div>
  )
}
