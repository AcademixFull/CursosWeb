import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router";
import { ROUTES } from "../config/routes";

const HomePage = lazy(() => import("../pages/HomePage"));
const CoursesPage = lazy(() => import("../pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("../pages/CourseDetailPage"));
const Nosotros = lazy(() => import("../nosotros"));
const Contacto = lazy(() => import("../contacto"));
const Dashboard = lazy(() => import("../pages/Dashboard"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      Cargando Academix...
    </div>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.courses} element={<CoursesPage />} />
          <Route path={`${ROUTES.courses}/:courseId`} element={<CourseDetailPage />} />
          <Route path={ROUTES.about} element={<Nosotros />} />
          <Route path={ROUTES.contact} element={<Contacto />} />
          <Route path={ROUTES.dashboard} element={<Dashboard />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
