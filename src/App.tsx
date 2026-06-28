import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TrainingProvider } from "@/contexts/TrainingContext";
import { useAuth } from "@/hooks/useAuth";
import MemberHome from "@/screens/MemberHome";
import Profile from "@/screens/Profile";
import AdminLayout from "@/screens/admin/AdminLayout";
import Korisnici from "@/screens/admin/Korisnici";
import Pregled from "@/screens/admin/Pregled";
import Statistika from "@/screens/admin/Statistika";
import TrainingForm from "@/screens/admin/TrainingForm";
import Treninzi from "@/screens/admin/Treninzi";
import ForgotPasswordScreen from "@/screens/auth/ForgotPasswordScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";

function PublicOnly() {
  const { session, profile } = useAuth();

  if (session && profile) {
    return (
      <Navigate to={profile.role === "admin" ? "/admin" : "/"} replace />
    );
  }

  return <Outlet />;
}

function RequireMember() {
  const { session, profile } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;

  return <Outlet />;
}

function RequireAdmin() {
  const { session, profile } = useAuth();

  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}

function RequireAuthenticated() {
  const { session } = useAuth();

  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function AppProviders() {
  const { session, profile } = useAuth();

  return (
    <ToastProvider>
      <TrainingProvider profile={profile} session={session}>
        <Outlet />
      </TrainingProvider>
    </ToastProvider>
  );
}

function AppRoutes() {
  const { loading, session, profile } = useAuth();

  if (loading || (session && !profile)) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-paper">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-burgundy"
          role="status"
          aria-label="Učitavanje"
        />
      </main>
    );
  }

  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      </Route>

      <Route element={<RequireAuthenticated />}>
        <Route element={<AppProviders />}>
          <Route element={<RequireMember />}>
            <Route path="/" element={<MemberHome />} />
          </Route>
          <Route path="/profile" element={<Profile />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Pregled />} />
              <Route path="users" element={<Korisnici />} />
              <Route path="sessions" element={<Treninzi />} />
              <Route path="stats" element={<Statistika />} />
            </Route>
            <Route path="/admin/training/:id" element={<TrainingForm />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
