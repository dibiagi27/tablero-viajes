import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const SEDE_COLORS = {
  Chile: '#534AB7',
  Mendoza: '#E8A020',
  'Buenos Aires': '#1D9E75',
  Uruguay: '#D85A30',
}

const PERIODO_OPTIONS = [
  { label: 'Esta semana', value: 7 },
  { label: 'Este mes', value: 30 },
  { label: 'Últimos 3 meses', value: 90 },
]

export default function Metricas() {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(30)

  useEffect(() => {
    fetchViajes()
  }, [periodo])

  async function fetchViajes() {
    setLoading(true)
    const desde = new Date()
    desde.setDate(desde.getDate() - periodo)
    const { data } = await supabase
      .from('viajes')
      .select('*')
      .gte('created_at', desde.toISOString())
    setViajes(data || [])
    setLoading(false)
  }

  // 1. Tasa de cumplimiento
  const programados = viajes.filter(v => v.estado !== 'Cancelado' && v.estado !== 'Incidente')
  const salieronEnFecha = viajes.filter(v =>
    v.fecha_salida && v.fecha_salida_real && v.fecha_salida_real <= v.fecha_salida
  )
  const tasaCumplimiento = programados.length > 0
    ? Math.round((salieronEnFecha.length / programados.length) * 100)
    : 0
  const donutData = [
    { name: 'En fecha', value: tasaCumplimiento },
    { name: 'Con demora', value: 100 - tasaCumplimiento },
  ]

  // 2. Volumen por sede por semana
  const volumenSede = ['Chile', 'Mendoza', 'Buenos Aires', 'Uruguay'].map(sede => ({
    sede,
    viajes: viajes.filter(v => v.sede_origen === sede).length,
  }))

  // 3. Incidentes y cancelaciones por sede
  const incidentesSede = ['Chile', 'Mendoza', 'Buenos Aires', 'Uruguay'].map(sede => ({
    sede: sede === 'Buenos Aires' ? 'Bs As' : sede,
    Incidentes: viajes.filter(v => v.sede_origen === sede && v.estado === 'Incidente').length,
    Cancelados: viajes.filter(v => v.sede_origen === sede && v.estado === 'Cancelado').length,
  }))

  // 4. Viajes por zona de influencia
  const zonas = {}
  viajes.forEach(v => {
    if (v.destino) zonas[v.destino] = (zonas[v.destino] || 0) + 1
  })
  const zonaData = Object.entries(zonas)
    .map(([zona, total]) => ({ zona, total }))
    .sort((a, b) => b.total - a.total)

  // 5. Tiempo promedio en ruta por sede
  const tiempoRuta = ['Chile', 'Mendoza', 'Buenos Aires', 'Uruguay'].map(sede => {
    const llegados = viajes.filter(v =>
      v.sede_origen === sede && v.fecha_salida_real && v.fecha_llegada
    )
    if (llegados.length === 0) return { sede: sede === 'Buenos Aires' ? 'Bs As' : sede, dias: 0 }
    const promedio = llegados.reduce((acc, v) => {
      const salida = new Date(v.fecha_salida_real)
      const llegada = new Date(v.fecha_llegada)
      return acc + (llegada - salida) / (1000 * 60 * 60 * 24)
    }, 0) / llegados.length
    return { sede: sede === 'Buenos Aires' ? 'Bs As' : sede, dias: Math.round(promedio * 10) / 10 }
  })

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Cargando métricas...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📊 Métricas</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Análisis operativo de todas las sedes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {PERIODO_OPTIONS.map(op => (
            <button
              key={op.value}
              className={`filter-btn ${periodo === op.value ? 'active' : ''}`}
              onClick={() => setPeriodo(op.value)}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Números grandes */}
      <div className="stat-cards" style={{ marginBottom: '24px' }}>
        <div className="stat-card programado">
          <div className="label">Total viajes</div>
          <div className="value">{viajes.length}</div>
        </div>
        <div className="stat-card salio">
          <div className="label">Cumplimiento</div>
          <div className="value">{tasaCumplimiento}%</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #E24B4A' }}>
          <div className="label">Incidentes</div>
          <div className="value" style={{ color: '#dc2626' }}>
            {viajes.filter(v => v.estado === 'Incidente').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Cancelados</div>
          <div className="value" style={{ color: '#64748b' }}>
            {viajes.filter(v => v.estado === 'Cancelado').length}
          </div>
        </div>
      </div>

      {/* Fila 1: Dona + Volumen por sede */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Tasa de cumplimiento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                <Cell fill="#1D9E75" />
                <Cell fill="#f1f5f9" />
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: '700', color: '#1D9E75', marginTop: '-8px' }}>
            {tasaCumplimiento}%
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>salidas en fecha</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Volumen de viajes por sede</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumenSede}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="sede" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="viajes" radius={[4, 4, 0, 0]}>
                {volumenSede.map((entry, i) => (
                  <Cell key={i} fill={SEDE_COLORS[entry.sede] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fila 2: Incidentes + Tiempo en ruta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Incidentes y cancelaciones por sede</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentesSede}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="sede" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Incidentes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cancelados" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Tiempo promedio en ruta (días)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tiempoRuta} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="sede" type="category" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="dias" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fila 3: Zonas de influencia */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Viajes por zona de influencia</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={zonaData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="zona" type="category" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Bar dataKey="total" fill="#7C3AED" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
