import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router";
import { PageLoader } from "../components/ui/PageLoader";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { RouteAccessibility } from "../components/a11y/RouteAccessibility";
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
const UpdatePasswordPage = lazy(() => import("../pages/auth/UpdatePasswordPage"));
const MyCoursesPage = lazy(() => import("../pages/MyCoursesPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const StudentLayout = lazy(() => import("../layouts/StudentLayout"));
const LearningPage = lazy(() => import("../pages/LearningPage"));
const CertificateDetailPage = lazy(() => import("../pages/CertificateDetailPage"));
const CertificateVerificationPage = lazy(() => import("../pages/CertificateVerificationPage"));
const InstructorPage = lazy(() => import("../pages/InstructorPage"));
const ManagementLayout = lazy(() => import("../layouts/ManagementLayout"));
const InstructorDashboardPage = lazy(() => import("../pages/InstructorDashboardPage"));
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));
const AuthoringPage = lazy(() => import("../pages/AuthoringPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

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
      <RouteAccessibility />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.courses} element={<CoursesPage />} />
          <Route path={`${ROUTES.courses}/:courseId`} element={<CourseDetailPage />} />
          <Route path={`${ROUTES.instructors}/:instructorId`} element={<InstructorPage />} />
          <Route path={ROUTES.about} element={<Nosotros />} />
          <Route path={ROUTES.contact} element={<Contacto />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.updatePassword} element={<UpdatePasswordPage />} />
          <Route path={`${ROUTES.verifyCertificate}/:credentialCode?`} element={<CertificateVerificationPage />} />
          <Route element={<ProtectedRoute roles={["student"]}><StudentLayout /></ProtectedRoute>}>
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
            <Route path={ROUTES.myCourses} element={<MyCoursesPage />} />
            <Route path={ROUTES.certificates} element={<CertificatesPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
          </Route>
          <Route path={`${ROUTES.learning}/:courseId/:lessonId?`} element={<ProtectedRoute roles={["student"]}><LearningPage /></ProtectedRoute>} />
          <Route path={`${ROUTES.certificates}/:certificateId`} element={<ProtectedRoute roles={["student"]}><CertificateDetailPage /></ProtectedRoute>} />
          <Route element={<ProtectedRoute roles={["admin", "instructor"]}><ManagementLayout /></ProtectedRoute>}>
            <Route path={ROUTES.instructorPanel} element={<ProtectedRoute roles={["instructor"]}><InstructorDashboardPage /></ProtectedRoute>} />
            <Route path={ROUTES.admin} element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path={`${ROUTES.authoring}/:courseId`} element={<AuthoringPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
