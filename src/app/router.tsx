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
const EmailConfirmedPage = lazy(() => import("../pages/auth/EmailConfirmedPage"));
const InstructorApplicationPage = lazy(() => import("../pages/InstructorApplicationPage"));
const MyCoursesPage = lazy(() => import("../pages/MyCoursesPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const LearningPage = lazy(() => import("../pages/LearningPage"));
const CertificateDetailPage = lazy(() => import("../pages/CertificateDetailPage"));
const CertificateVerificationPage = lazy(() => import("../pages/CertificateVerificationPage"));
const InstructorPage = lazy(() => import("../pages/InstructorPage"));
const AuthenticatedLayout = lazy(() => import("../layouts/AuthenticatedLayout"));
const InstructorDashboardPage = lazy(() => import("../pages/InstructorDashboardPage"));
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage"));
const ModerationDashboardPage = lazy(() => import("../pages/ModerationDashboardPage"));
const AuthoringPage = lazy(() => import("../pages/AuthoringPage"));
const OrganizationPage = lazy(() => import("../pages/OrganizationPage"));
const PricingPage = lazy(() => import("../pages/PricingPage"));
const FaqPage = lazy(() => import("../pages/FaqPage"));
const CartPage = lazy(() => import("../pages/CartPage"));
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
          <Route path={ROUTES.pricing} element={<PricingPage />} />
          <Route path={ROUTES.faq} element={<FaqPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.updatePassword} element={<UpdatePasswordPage />} />
          <Route path={ROUTES.emailConfirmed} element={<EmailConfirmedPage />} />
          <Route path={`${ROUTES.verifyCertificate}/:credentialCode?`} element={<CertificateVerificationPage />} />
          <Route element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><AuthenticatedLayout /></ProtectedRoute>}>
            <Route path={ROUTES.organization} element={<OrganizationPage />} />
            <Route path={ROUTES.cart} element={<CartPage />} />
            <Route path={ROUTES.profile} element={<ProtectedRoute roles={["student"]}><ProfilePage /></ProtectedRoute>} />
            <Route path={ROUTES.managementProfile} element={<ProtectedRoute roles={["admin", "instructor", "moderator"]}><ProfilePage /></ProtectedRoute>} />
            <Route path={ROUTES.dashboard} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><Dashboard /></ProtectedRoute>} />
            <Route path={ROUTES.myCourses} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><MyCoursesPage /></ProtectedRoute>} />
            <Route path={ROUTES.certificates} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><CertificatesPage /></ProtectedRoute>} />
            <Route path={ROUTES.instructorApplication} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><InstructorApplicationPage /></ProtectedRoute>} />
            <Route path={ROUTES.instructorPanel} element={<ProtectedRoute roles={["student", "instructor"]}><InstructorDashboardPage /></ProtectedRoute>} />
            <Route path={ROUTES.admin} element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path={ROUTES.moderation} element={<ProtectedRoute roles={["moderator", "admin"]}><ModerationDashboardPage /></ProtectedRoute>} />
            <Route path={`${ROUTES.authoring}/:courseId`} element={<ProtectedRoute roles={["student", "admin", "instructor"]}><AuthoringPage /></ProtectedRoute>} />
          </Route>
          <Route path={`${ROUTES.learning}/:courseId/:lessonId?`} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><LearningPage /></ProtectedRoute>} />
          <Route path={`${ROUTES.certificates}/:certificateId`} element={<ProtectedRoute roles={["student", "instructor", "moderator", "admin"]}><CertificateDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
