import { Navigate, Route, Routes } from "react-router-dom";

import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { StaffLoginPage } from "../pages/staff/StaffLoginPage";

export function PortalRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="*" element={<Navigate to="/staff/login" replace />} />
    </Routes>
  );
}
