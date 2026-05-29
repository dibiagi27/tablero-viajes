import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const SEDES = ['Chile', 'Mendoza', 'Buenos Aires', 'Uruguay']
const ADUANAS = [
  'Aduana Chile',
  'Puerto Seco (Mza)',
  'PTM',
  'Aduana Buenos Aires',
  'Aduana Uruguay',
  'Sin aduana',
]

export default function ViajeModal({ perfil, viaje, onClose, onSave, isAdmin }) {
  const [form, setForm] = useState({
    interno: '',
    semi: '',
    destino: '',
    fecha_salida: '',
    fecha_salida_real: '',
    fiscal_aduana: '',
    imo: false,
    importador: '',
    estado: 'Programado',
    observacion: '',
    sede_origen: perfil.sede === 'admin' ? 'Chile' : perfil.sede,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (viaje) {
      setForm({
        interno: viaje.interno || '',
        semi: viaje.semi || '',
        destino: viaje.destino || '',
        fecha_salida: viaje.fecha_salida || '',
        fecha_salida_real: viaje.fecha_salida_real || '',
        fiscal_aduana: viaje.fiscal_aduana || '',
        imo: viaje.imo || false,
        importador: viaje.importador || '',
        estado: viaje.estado || 'Programado',
        observacion: viaje.observacion || '',
        sede_origen: viaje.sede_origen || perfil.sede,
      })
    }
  }, [viaje])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  function handleEstadoChange(nuevoEstado) {
    set('estado', nuevoEstado)
    if (nuevoEstado === 'Salió' && !form.fecha_salida_real) {
      set('fecha_salida_real', new Date().toISOString().split('T')[0])
    }
  }

  async function handleSave() {
    if (!form.interno.trim()) { setError('El N° Interno es obligatorio'); return }
    setLoading(true)
    setError('')

    const payload = {
      interno: form.interno.trim(),
      semi: form.semi.trim() || null,
      destino: form.destino || null,
      fecha_salida: form.fecha_salida || null,
      fecha_salida_real: form.fecha_salida_real || null,
      fiscal_aduana: form.fiscal_aduana || null,
      imo: form.imo,
      importador: form.importador.trim() || null,
      estado: form.estado,
      observacion: form.observacion.trim() || null,
      sede_origen: form.sede_origen,
    }

    let err
    if (viaje) {
      const { error } = await supabase.from('viajes').update(payload).eq('id', viaje.id)
      err = error
    } else {
      const { error } = await supabase.from('viajes').insert({
        ...payload,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      err = error
    }

    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    onSave()
  }

  const destinos = SEDES.filter(s => s !== form.sede_origen)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{viaje ? 'Editar viaje' : 'Nuevo viaje'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isAdmin && (
            <div className="form-group">
              <label>Sede origen</label>
              <select value={form.sede_origen} onChange={e => set('sede_origen', e.target.value)}>
                {SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>N° Interno *</label>
              <input value={form.interno} onChange={e => set('interno', e.target.value)} placeholder="Ej: 041" />
            </div>
            <div className="form-group">
              <label>N° de Semi</label>
              <input value={form.semi} onChange={e => set('semi', e.target.value)} placeholder="Ej: S-100" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Zona de Influencia</label>
              <select value={form.destino} onChange={e => set('destino', e.target.value)}>
                <option value="">Seleccionar...</option>
                {destinos.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha Salida Programada</label>
              <input type="date" value={form.fecha_salida} onChange={e => set('fecha_salida', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fiscal / Aduana</label>
              <select value={form.fiscal_aduana} onChange={e => set('fiscal_aduana', e.target.value)}>
                <option value="">Seleccionar...</option>
                {ADUANAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Importador</label>
              <input value={form.importador} onChange={e => set('importador', e.target.value)} placeholder="Nombre del importador" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>IMO (carga peligrosa)</label>
              <select value={form.imo ? 'si' : 'no'} onChange={e => set('imo', e.target.value === 'si')}>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>
            {viaje && (
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => handleEstadoChange(e.target.value)}>
                  <option>Programado</option>
                  <option>Cancelado</option>
                </select>
              </div>
            )}
          </div>

          {form.estado === 'Salió' && (
            <div className="form-group">
              <label>Fecha Salida Real</label>
              <input
                type="date"
                value={form.fecha_salida_real}
                onChange={e => set('fecha_salida_real', e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Observación</label>
            <textarea
              value={form.observacion}
              onChange={e => set('observacion', e.target.value)}
              placeholder="Cualquier información adicional..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : viaje ? 'Guardar cambios' : 'Crear viaje'}
          </button>
        </div>
      </div>
    </div>
  )
}
