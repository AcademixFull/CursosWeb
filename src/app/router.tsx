import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router";
import { PageLoader } from "../components/ui/PageLoader";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { ROUTES } from "../config/routes";

const HomePage = lazy(() => import("../pages/HomePage"));
const CoursesPage = lazy(() => import("../pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("../pages/CourseDetailPage"));
const Nosotros = lazy(() => import("../nosotros"));
const Contacto = lazy(() => import("../contacto"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const MyCoursesPage = lazy(() => import("../pages/MyCoursesPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const StudentLayout = lazy(() => import("../layouts/StudentLayout"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <PageLoader label="Cargando Academix" />
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
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
            <Route path={ROUTES.myCourses} element={<MyCoursesPage />} />
            <Route path={ROUTES.certificates} element={<CertificatesPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
