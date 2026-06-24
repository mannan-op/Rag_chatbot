import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Restoring your session" fullScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
