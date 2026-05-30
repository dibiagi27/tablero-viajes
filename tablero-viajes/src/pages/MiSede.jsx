import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ViajeModal from '../components/ViajeModal'
import { format, parseISO } from 'date-fns'

export default function MiSede({ perfil }) {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalIncidente, setModalIncidente] = useState(false)
  const [viajeIncidente, setViajeIncidente] = useState(null)
  const [detalleIncidente, setDetalleIncidente] = useState('')
  const [modalCancelacion, setModalCancelacion] = useState(false)
  const [viajeCancelacion, setViajeCancelacion] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

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
    const update = { estado: nuevoEstado }
    if (nuevoEstado === 'Salió' && !viaje.fecha_salida_real) {
      update.fecha_salida_real = new Date().toISOString().split('T')[0]
    }
    await supabase.from('viajes').update(update).eq('id', viaje.id)
    fetchViajes()
  }

  async function confirmarIncidente() {
    if (!detalleIncidente.trim()) {
      alert('Por favor describí el incidente')
      return
    }
    const ahora = new Date()
    const fechaHora = `${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    const obsAnterior = viajeIncidente.observacion ? viajeIncidente.observacion + ' | ' : ''
    const nuevaObs = `${obsAnterior}INCIDENTE ${fechaHora}: ${detalleIncidente.trim()}`
    await supabase.from('viajes').update({
      estado: 'Incidente',
      observacion: nuevaObs
    }).eq('id', viajeIncidente.id)
    setModalIncidente(false)
    setViajeIncidente(null)
    setDetalleIncidente('')
    fetchViajes()
  }

  async function confirmarCancelacion() {
    if (!motivoCancelacion.trim()) {
      alert('Por favor indicá el motivo de la cancelación')
      return
    }
    const ahora = new Date()
    const fechaHora = `${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
    const obsAnterior = viajeCancelacion.observacion ? viajeCancelacion.observacion + ' | ' : ''
    const nuevaObs = `${obsAnterior}CANCELADO ${fechaHora}: ${motivoCancelacion.trim()}`
    await supabase.from('viajes').update({
      estado: 'Cancelado',
      observacion: nuevaObs
    }).eq('id', viajeCancelacion.id)
    setModalCancelacion(false)
    setViajeCancelacion(null)
    setMotivoCancelacion('')
    fetchViajes()
  }

  function abrirIncidente(viaje) {
    setViajeIncidente(viaje)
    setDetalleIncidente('')
    setModalIncidente(true)
  }

  function abrirCancelacion(viaje) {
    setViajeCancelacion(viaje)
    setMotivoCancelacion('')
    setModalCancelacion(true)
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
    programados: viajes.filter(v => v.estado === 'Programado' && v.fecha_salida >= hoy).length,
    enRuta: viajes.filter(v => v.estado === 'Salió').length,
    llegaronHoy: viajes.filter(v => v.estado === 'Llegó' && v.fecha_llegada === hoy).length,
  }

  function renderAcciones(v) {
    if (v.estado === 'Programado') {
      return (
        <>
          <button className="btn btn-sm" style={{ background: '#d1e7dd', color: '#0a3622', border: 'none' }}
            onClick={() => cambiarEstado(v, 'Salió')}>
            ✓ Salió
          </button>
          <button className="btn btn-sm" style={{ background: '#f8d7da', color: '#842029', border: 'none' }}
            onClick={() => abrirCancelacion(v)}>
            ✕ Cancelar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicion(v)}>
            Editar
          </button>
        </>
      )
    }
    if (v.estado === 'Salió') {
      return (
        <button className="btn btn-sm" style={{ background: '#fff3cd', color: '#856404', border: 'none' }}
          onClick={() => abrirIncidente(v)}>
          ⚠ Incidente
        </button>
      )
    }
    return null
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

      <div className="stat-cards">
        <div className="stat-card programado">
          <div className="label">Programados</div>
          <div className="value">{stats.programados}</div>
        </div>
        <div className="stat-card salio">
          <div className="label">En ruta</div>
          <div className="value">{stats.enRuta}</div>
        </div>
        <div className="stat-card llego">
          <div className="label">Llegaron hoy</div>
          <div className="value">{stats.llegaronHoy}</div>
        </div>
      </div>

      <div className="filters">
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>FILTRAR:</span>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          <option>Programado</option>
          <option>Salió</option>
          <option>Incidente</option>
          <option>Cancelado</option>
          <option>Llegó</option>
        </select>
      </div>

       <div className="card" style={{ maxHeight: '480px', overflow: 'hidden' }}>
        <div className="table-wrap" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Interno</th>
                <th>Semi</th>
                <th>Zona de Influencia</th>
                <th>F. Salida Programada</th>
                <th>F. Salida Real</th>
                <th>F. Llegada</th>
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
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Cargando...</td></tr>
              )}
              {!loading && filtrados.length === 0 && (
                <tr><td colSpan="12">
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
                    <td style={{ color: v.fecha_salida_real ? '#0a3622' : '#64748b', fontWeight: v.fecha_salida_real ? '600' : '400' }}>
                      {v.fecha_salida_real ? format(parseISO(v.fecha_salida_real), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ color: v.fecha_llegada ? '#084298' : '#64748b', fontWeight: v.fecha_llegada ? '600' : '400' }}>
                      {v.fecha_llegada ? format(parseISO(v.fecha_llegada), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.fiscal_aduana || '—'}</td>
                    <td className={v.imo ? 'imo-si' : 'imo-no'}>{v.imo ? 'SÍ' : 'No'}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.importador || '—'}</td>
                    <td><span className={`badge badge-${v.estado?.toLowerCase().replace('ó','o').replace('é','e')}`}>{v.estado}</span></td>
                    <td style={{ color: '#64748b', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.observacion || ''}>{v.observacion || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {renderAcciones(v)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalIncidente && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalIncidente(false)}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>⚠ Registrar incidente</h3>
              <button className="close-btn" onClick={() => setModalIncidente(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Interno <strong>{viajeIncidente?.interno}</strong> — describí qué pasó:
              </p>
              <div className="form-group">
                <label>Detalle del incidente</label>
                <textarea
                  value={detalleIncidente}
                  onChange={e => setDetalleIncidente(e.target.value)}
                  placeholder="Ej: Camión con desperfecto mecánico en ruta 40, km 230..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalIncidente(false)}>Volver</button>
              <button className="btn btn-primary" onClick={confirmarIncidente}>
                Confirmar incidente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCancelacion && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalCancelacion(false)}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>✕ Cancelar viaje</h3>
              <button className="close-btn" onClick={() => setModalCancelacion(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Interno <strong>{viajeCancelacion?.interno}</strong> — indicá el motivo:
              </p>
              <div className="form-group">
                <label>Motivo de cancelación</label>
                <textarea
                  value={motivoCancelacion}
                  onChange={e => setMotivoCancelacion(e.target.value)}
                  placeholder="Ej: Camión sin disponibilidad, reprogramado para la semana próxima..."
                  rows={4}
                  style={{ resize: 'vertical' }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalCancelacion(false)}>Volver</button>
              <button className="btn btn-danger" onClick={confirmarCancelacion}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}

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
