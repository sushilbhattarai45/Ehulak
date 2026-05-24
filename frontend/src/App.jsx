import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EmailDetails from "./pages/EmailDetails.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import DLQ from "./pages/DLQ.jsx";
import Analytics from "./pages/Analytics.jsx";
import ApiKeys from "./pages/ApiKeys.jsx";
import Logs from "./pages/Logs.jsx";
import Docs from "./pages/Docs.jsx";
import Auth from "./pages/Auth.jsx";
import Landing from "./pages/Landing.jsx";

// Context providers
import { ThemeProvider } from "./hooks/useTheme.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "./components/ui/sonner";
// Route guard for protected routes
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" replace />;
}

// Redirect to dashboard if already logged in
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/emails/:id" element={<EmailDetails />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/dlq" element={<DLQ />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/docs" element={<Docs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
