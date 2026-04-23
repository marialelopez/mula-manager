import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Mulas from './pages/Mulas'
import Conductores from './pages/Conductores'
import Viajes from './pages/Viajes'
import Gastos from './pages/Gastos'
import Combustible from './pages/Combustible'
import Peajes from './pages/Peajes'
import Adelantos from './pages/Adelantos'
import Liquidacion from './pages/Liquidacion'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mulas" element={<Mulas />} />
        <Route path="/conductores" element={<Conductores />} />
        <Route path="/viajes" element={<Viajes />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/combustible" element={<Combustible />} />
        <Route path="/peajes" element={<Peajes />} />
        <Route path="/adelantos" element={<Adelantos />} />
        <Route path="/liquidacion" element={<Liquidacion />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Routes>
    </Layout>
  )
}