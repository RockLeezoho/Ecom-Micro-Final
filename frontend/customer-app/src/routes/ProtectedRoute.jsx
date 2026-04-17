import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getCustomerToken } from "../services/tokenStorage";

export function ProtectedRoute() {
  const location = useLocation();
  const token = getCustomerToken();

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
