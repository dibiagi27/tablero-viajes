import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ViajeModal from '../components/ViajeModal'
import { format, parseISO } from 'date-fns'

export default function Admin() {
  const [tab, setTab] = useState('viajes')
  const [viajes, setViajes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [modalViaje, setModalViaje] = useState(false)
  const [modalUsuario, setModalUsuario] = useState(false)
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: '', password: '', nombre: '', sede: 'Chile' })
  const [msgUsuario, setMsgUsuario] = useState('')
  const [filtroSede, setFiltroSede] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchViajes()
    fetchUsuarios()
    const channel = supabase
      .channel('admin-viajes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, fetchViajes)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchViajes() {
    const { data } = await supabase.from('viajes').select('*').order('fecha_salida', { ascending: true })
    setViajes(data || [])
    setLoading(false)
  }

  async function fetchUsuarios() {
    const { data } = await supabase.from('perfiles').select('*').order('sede')
    setUsuarios(data || [])
  }

  async function cambiarEstado(viaje, estado) {
    await supabase.from('viajes').update({ estado }).eq('id', viaje.id)
    fetchViajes()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este viaje?')) return
    await supabase.from('viajes').delete().eq('id', id)
    fetchViajes()
  }

  async function crearUsuario(e) {
    e.preventDefault()
    setMsgUsuario('')
    const { data, error } = await supabase.auth.admin?.createUser({
      email: nuevoUsuario.email,
      password: nuevoUsuario.password,
      email_confirm: true,
    })

    if (error) {
      setMsgUsuario('Error: ' + error.message)
      return
    }

    if (data?.user) {
      await supabase.from('perfiles').insert({
        id: data.user.id,
        sede: nuevoUsuario.sede,
        nombre: nuevoUsuario.nombre,
      })
      setMsgUsuario('✅ Usuario creado correctamente')
      setNuevoUsuario({ email: '', password: '', nombre: '', sede: 'Chile' })
      fetchUsuarios()
    }
  }

  const filtrados = viajes.filter(v => {
    if (filtroSede && v.sede_origen !== filtroSede) return false
    if (filtroEstado && v.estado !== filtroEstado) return false
    return true
  })

  const perfil = { sede: 'admin' }

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ Panel de administración</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['viajes', 'usuarios'].map(t => (
          <button key={t} className={`filter-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'viajes' ? '📋 Todos los viajes' : '👥 Usuarios'}
          </button>
        ))}
      </div>

      {tab === 'viajes' && (
        <>
          <div className="filters">
            <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
              <option value="">Todas las sedes</option>
              {['Chile','Mendoza','Buenos Aires','Uruguay'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option>Programado</option><option>Salió</option><option>Llegó</option>
            </select>
            {(filtroSede || filtroEstado) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFiltroSede(''); setFiltroEstado('') }}>
                ✕ Limpiar
              </button>
            )}
          </div>

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sede</th><th>Interno</th><th>Semi</th><th>Destino</th>
                    <th>Fecha Salida</th><th>Fiscal/Aduana</th><th>IMO</th>
                    <th>Importador</th><th>Estado</th><th>Obs.</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(v => {
                    const alertaHoy = v.estado === 'Programado' && v.fecha_salida === hoy
                    return (
                      <tr key={v.id} className={alertaHoy ? 'alerta-hoy' : ''}>
                        <td><span className={`sede-badge sede-${v.sede_origen}`}>{v.sede_origen}</span></td>
                        <td style={{ fontWeight: '600' }}>
                          {alertaHoy && <span className="alerta-dot" />}
                          {v.interno}
                        </td>
                        <td style={{ color: '#64748b' }}>{v.semi || '—'}</td>
                        <td><strong>{v.destino || '—'}</strong></td>
                        <td>{v.fecha_salida ? format(parseISO(v.fecha_salida), 'dd/MM/yyyy') : '—'}</td>
                        <td style={{ color: '#64748b', fontSize: '12px' }}>{v.fiscal_aduana || '—'}</td>
                        <td className={v.imo ? 'imo-si' : 'imo-no'}>{v.imo ? 'SÍ' : 'No'}</td>
                        <td style={{ color: '#64748b', fontSize: '12px' }}>{v.importador || '—'}</td>
                        <td>
                          <select
                            value={v.estado}
                            onChange={e => cambiarEstado(v, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          >
                            <option>Programado</option>
                            <option>Salió</option>
                            <option>Llegó</option>
                          </select>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.observacion || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditando(v); setModalViaje(true) }}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => eliminar(v.id)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filtrados.length === 0 && (
                    <tr><td colSpan="11">
                      <div className="empty-state"><p>No hay viajes</p></div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'usuarios' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Lista de usuarios */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Usuarios activos</h3>
            {usuarios.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{u.nombre}</div>
                </div>
                <span className={`sede-badge sede-${u.sede}`}>{u.sede}</span>
              </div>
            ))}
            {usuarios.length === 0 && <p style={{ color: '#64748b', fontSize: '13px' }}>No hay usuarios</p>}
          </div>

          {/* Crear usuario */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Crear nuevo usuario</h3>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
              ⚠️ Para crear usuarios necesitás hacerlo desde el panel de Supabase → Authentication → Users → Invite user, y luego asignar la sede en la tabla "perfiles".
            </p>
            <div className="form-group">
              <label>Nombre del operador</label>
              <input value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} placeholder="Ej: Juan Pérez" />
            </div>
            <div className="form-group">
              <label>Sede</label>
              <select value={nuevoUsuario.sede} onChange={e => setNuevoUsuario({...nuevoUsuario, sede: e.target.value})}>
                {['Chile','Mendoza','Buenos Aires','Uruguay','admin'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {msgUsuario && (
              <div style={{ background: '#d1e7dd', color: '#0a3622', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
                {msgUsuario}
              </div>
            )}
          </div>
        </div>
      )}

      {modalViaje && (
        <ViajeModal
          perfil={perfil}
          viaje={editando}
          onClose={() => { setModalViaje(false); setEditando(null) }}
          onSave={() => { fetchViajes(); setModalViaje(false); setEditando(null) }}
          isAdmin={true}
        />
      )}
    </div>
  )
}
