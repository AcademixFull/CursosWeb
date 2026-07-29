import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router";

const HomePage = lazy(() => import("../pages/HomePage"));
const Portfolio = lazy(() => import("../layouts/portafolio"));
const Nosotros = lazy(() => import("../nosotros"));
const Contacto = lazy(() => import("../contacto"));
const Dashboard = lazy(() => import("../pages/Dashboard"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div>Cargando...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cursos" element={<Portfolio />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}