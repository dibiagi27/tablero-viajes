import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ViajeModal from '../components/ViajeModal'
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function MiSede({ perfil }) {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    fetchViajes()

    const channel = supabase
      .channel('viajes-sede')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, fetchViajes)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchViajes() {
    const { data } = await supabase
      .from('viajes')
      .select('*')
      .eq('sede_origen', perfil.sede)
      .order('fecha_salida', { ascending: true })
    setViajes(data || [])
    setLoading(false)
  }

  async function cambiarEstado(viaje, nuevoEstado) {
    await supabase
      .from('viajes')
      .update({ estado: nuevoEstado })
      .eq('id', viaje.id)
    fetchViajes()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este viaje?')) return
    await supabase.from('viajes').delete().eq('id', id)
    fetchViajes()
  }

  function abrirEdicion(viaje) {
    setEditando(viaje)
    setModal(true)
  }

  function cerrarModal() {
    setModal(false)
    setEditando(null)
  }

  const filtrados = viajes.filter(v => !filtroEstado || v.estado === filtroEstado)
  const hoy = new Date().toISOString().split('T')[0]

  const stats = {
    programados: viajes.filter(v => v.estado === 'Programado').length,
    salieron: viajes.filter(v => v.estado === 'Salió').length,
    llegaron: viajes.filter(v => v.estado === 'Llegó').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Viajes desde {perfil.sede}</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Gestioná los viajes que salen de tu sede
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + Nuevo viaje
        </button>
      </div>

      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card programado">
          <div className="label">Programados</div>
          <div className="value">{stats.programados}</div>
        </div>
        <div className="stat-card salio">
          <div className="label">Salieron</div>
          <div className="value">{stats.salieron}</div>
        </div>
        <div className="stat-card llego">
          <div className="label">Llegaron</div>
          <div className="value">{stats.llegaron}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>FILTRAR:</span>
        {['', 'Programado', 'Salió', 'Llegó'].map(e => (
          <button
            key={e}
            className={`filter-btn ${filtroEstado === e ? 'active' : ''}`}
            onClick={() => setFiltroEstado(e)}
          >
            {e || 'Todos'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Interno</th>
                <th>Semi</th>
                <th>Destino</th>
                <th>Fecha Salida</th>
                <th>Fiscal/Aduana</th>
                <th>IMO</th>
                <th>Importador</th>
                <th>Estado</th>
                <th>Observación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Cargando...</td></tr>
              )}
              {!loading && filtrados.length === 0 && (
                <tr><td colSpan="10">
                  <div className="empty-state">
                    <div style={{ fontSize: '32px' }}>📋</div>
                    <p>No hay viajes cargados</p>
                  </div>
                </td></tr>
              )}
              {filtrados.map(v => {
                const alertaHoy = v.estado === 'Programado' && v.fecha_salida === hoy
                return (
                  <tr key={v.id} className={alertaHoy ? 'alerta-hoy' : ''}>
                    <td style={{ fontWeight: '600' }}>
                      {alertaHoy && <span className="alerta-dot" title="¡Sale hoy!" />}
                      {v.interno}
                    </td>
                    <td style={{ color: '#64748b' }}>{v.semi || '—'}</td>
                    <td><strong>{v.destino || '—'}</strong></td>
                    <td>{v.fecha_salida ? format(parseISO(v.fecha_salida), 'dd/MM/yyyy') : '—'}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.fiscal_aduana || '—'}</td>
                    <td className={v.imo ? 'imo-si' : 'imo-no'}>{v.imo ? 'SÍ' : 'No'}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.importador || '—'}</td>
                    <td><span className={`badge badge-${v.estado?.toLowerCase().replace('ó','o').replace('é','e')}`}>{v.estado}</span></td>
                    <td style={{ color: '#64748b', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.observacion || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {v.estado === 'Programado' && (
                          <button className="btn btn-sm" style={{ background: '#d1e7dd', color: '#0a3622', border: 'none' }}
                            onClick={() => cambiarEstado(v, 'Salió')}>
                            ✓ Salió
                          </button>
                        )}
                        {v.estado !== 'Llegó' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicion(v)}>Editar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ViajeModal
          perfil={perfil}
          viaje={editando}
          onClose={cerrarModal}
          onSave={() => { fetchViajes(); cerrarModal() }}
        />
      )}
    </div>
  )
}
