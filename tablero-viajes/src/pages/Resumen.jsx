import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format, parseISO, addDays } from 'date-fns'

export default function Resumen({ perfil }) {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroSede, setFiltroSede] = useState('')
  const [filtroDestino, setFiltroDestino] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroDia, setFiltroDia] = useState('')

  const hoy = new Date().toISOString().split('T')[0]
  const manana = addDays(new Date(), 1).toISOString().split('T')[0]

  useEffect(() => {
    fetchViajes()
    const channel = supabase
      .channel('resumen-viajes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, fetchViajes)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchViajes() {
    const { data } = await supabase
      .from('viajes')
      .select('*')
      .order('fecha_salida', { ascending: true })
    setViajes(data || [])
    setLoading(false)
  }

  async function marcarLlego(viaje) {
    const { error } = await supabase
      .from('viajes')
      .update({ estado: 'Llegó' })
      .eq('id', viaje.id)
    if (error) {
      alert('Error al actualizar: ' + error.message)
      return
    }
    fetchViajes()
  }

  const filtrados = viajes.filter(v => {
    if (filtroSede && v.sede_origen !== filtroSede) return false
    if (filtroDestino && v.destino !== filtroDestino) return false
    if (filtroEstado && v.estado !== filtroEstado) return false
    if (filtroFecha && v.fecha_salida !== filtroFecha) return false
    if (filtroDia === 'hoy' && v.fecha_salida !== hoy) return false
    if (filtroDia === 'manana' && v.fecha_salida !== manana) return false
    return true
  })

  const stats = {
    programados: viajes.filter(v => v.estado === 'Programado' && v.fecha_salida >= hoy).length,
    enRuta: viajes.filter(v => v.estado === 'Salió').length,
    llegaHoy: viajes.filter(v => v.estado === 'Llegó' && v.fecha_salida_real === hoy).length,
  }

  const puedeMarcarLlego = (v) => {
    if (perfil.sede === 'admin') return v.estado === 'Salió'
    return v.estado === 'Salió' && v.destino === perfil.sede
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Resumen General</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Todos los viajes de todas las sedes en tiempo real
          </p>
        </div>
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
          <div className="value">{stats.llegaHoy}</div>
        </div>
      </div>

      <div className="filters">
        <button className={`filter-btn ${filtroDia === 'hoy' ? 'active' : ''}`}
          onClick={() => { setFiltroDia(filtroDia === 'hoy' ? '' : 'hoy'); setFiltroFecha('') }}>
          Hoy
        </button>
        <button className={`filter-btn ${filtroDia === 'manana' ? 'active' : ''}`}
          onClick={() => { setFiltroDia(filtroDia === 'manana' ? '' : 'manana'); setFiltroFecha('') }}>
          Mañana
        </button>
        <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)}>
          <option value="">Todas las sedes</option>
          {['Chile','Mendoza','Buenos Aires','Uruguay'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroDestino} onChange={e => setFiltroDestino(e.target.value)}>
          <option value="">Todas las zonas</option>
          {['Chile','Mendoza','Buenos Aires','Uruguay'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Programado</option>
          <option>Salió</option>
          <option>Incidente</option>
          <option>Cancelado</option>
          <option>Llegó</option>
        </select>
        <input
          type="date"
          value={filtroFecha}
          onChange={e => { setFiltroFecha(e.target.value); setFiltroDia('') }}
          style={{ fontSize: '12px' }}
        />
        {(filtroSede || filtroDestino || filtroEstado || filtroFecha || filtroDia) && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setFiltroSede(''); setFiltroDestino(''); setFiltroEstado('');
            setFiltroFecha(''); setFiltroDia('')
          }}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
        Mostrando {filtrados.length} de {viajes.length} viajes
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sede origen</th>
                <th>Interno</th>
                <th>Semi</th>
                <th>Zona de Influencia</th>
                <th>F. Salida Programada</th>
                <th>F. Salida Real</th>
                <th>Fiscal/Aduana</th>
                <th>IMO</th>
                <th>Importador</th>
                <th>Estado</th>
                <th>Obs.</th>
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
                    <div style={{ fontSize: '32px' }}>🔍</div>
                    <p>No hay viajes que coincidan con los filtros</p>
                  </div>
                </td></tr>
              )}
              {filtrados.map(v => {
                const alertaHoy = v.estado === 'Programado' && v.fecha_salida === hoy
                return (
                  <tr key={v.id} className={alertaHoy ? 'alerta-hoy' : ''}>
                    <td><span className={`sede-badge sede-${v.sede_origen}`}>{v.sede_origen}</span></td>
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
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.fiscal_aduana || '—'}</td>
                    <td className={v.imo ? 'imo-si' : 'imo-no'}>{v.imo ? 'SÍ' : 'No'}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{v.importador || '—'}</td>
                    <td>
                      <span className={`badge badge-${v.estado?.toLowerCase().replace('ó','o').replace('é','e')}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.observacion || '—'}
                    </td>
                    <td>
                      {puedeMarcarLlego(v) && (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#cfe2ff', color: '#084298', border: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => marcarLlego(v)}
                        >
                          ✓ Llegó
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
