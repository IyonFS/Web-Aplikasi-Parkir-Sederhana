import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { NotifProvider } from "../context/NotifContext";
import { ThemeProvider } from "../context/ThemeContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import Layout from "../components/Layout";
import { LandingPage } from "../modules/public";
import { LoginPage, RegisterPage } from "../modules/auth";
import { DashboardPage, AnalyticsPage } from "../modules/dashboard";
import { SlotsPage, ReservationsPage } from "../modules/parking";
import { ProfilePage } from "../modules/profile";
import {
  UserManagementPage,
  ParkingAreasPage,
  ActivityLogsPage,
  ParkingTariffsPage,
  VehiclesPage,
} from "../modules/admin";

function PageTransition({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}

function FullscreenLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--accent)",
          }}
        />
        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
          Memuat Hygiopark...
        </span>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function LandingRoute() {
  return <LandingPage />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/app/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotifProvider>
            <OnboardingProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingRoute />} />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <PageTransition>
                          <LoginPage />
                        </PageTransition>
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <PageTransition>
                          <RegisterPage />
                        </PageTransition>
                      </PublicRoute>
                    }
                  />

                  <Route
                    path="/app"
                    element={
                      <PrivateRoute>
                        <Layout />
                      </PrivateRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="/app/dashboard" replace />}
                    />
                    <Route
                      path="dashboard"
                      element={
                        <PageTransition>
                          <DashboardPage />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="areas"
                      element={
                        <AdminRoute>
                          <PageTransition>
                            <ParkingAreasPage />
                          </PageTransition>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="tariffs"
                      element={
                        <AdminRoute>
                          <PageTransition>
                            <ParkingTariffsPage />
                          </PageTransition>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="vehicles"
                      element={
                        <AdminRoute>
                          <PageTransition>
                            <VehiclesPage />
                          </PageTransition>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="slots"
                      element={
                        <PageTransition>
                          <SlotsPage />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="reservations"
                      element={
                        <PageTransition>
                          <ReservationsPage />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="analytics"
                      element={
                        <PageTransition>
                          <AnalyticsPage />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="profile"
                      element={
                        <PageTransition>
                          <ProfilePage />
                        </PageTransition>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <AdminRoute>
                          <PageTransition>
                            <UserManagementPage />
                          </PageTransition>
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="activity-logs"
                      element={
                        <AdminRoute>
                          <PageTransition>
                            <ActivityLogsPage />
                          </PageTransition>
                        </AdminRoute>
                      }
                    />
                  </Route>

                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/dashboard" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/areas"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/areas" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/tariffs"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/tariffs" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/vehicles"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/vehicles" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/slots"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/slots" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/reservations"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/reservations" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/analytics" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/profile" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/users" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/activity-logs"
                    element={
                      <PrivateRoute>
                        <Navigate to="/app/activity-logs" replace />
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </OnboardingProvider>
          </NotifProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


