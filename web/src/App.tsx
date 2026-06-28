import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import AdminHome from "@/screens/AdminHome";
import MemberHome from "@/screens/MemberHome";
import ProfilePlaceholder from "@/screens/ProfilePlaceholder";
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

      <Route element={<RequireMember />}>
        <Route path="/" element={<MemberHome />} />
        <Route path="/profile" element={<ProfilePlaceholder />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminHome />} />
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
