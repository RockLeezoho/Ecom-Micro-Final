import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PortalInput } from "../../components/auth/PortalInput";
import { PortalLayout } from "../../components/auth/PortalLayout";
import { loginAdmin } from "../../services/authService";
import { saveAdminToken } from "../../services/tokenStorage";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function validate() {
    const next = {};
    if (!formData.identifier.trim()) {
      next.identifier = "Vui lòng nhập email hoặc tên đăng nhập.";
    }
    if (!formData.password) {
      next.password = "Vui lòng nhập mật khẩu.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const result = await loginAdmin(formData.identifier, formData.password);
      saveAdminToken(result.token.access_token);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalLayout
      mode="admin"
      title="Đăng nhập Quản trị viên"
      subtitle="Truy cập khu vực điều hành hệ thống và báo cáo tổng hợp."
    >
      <form onSubmit={handleSubmit} className="portal-form">
        <PortalInput
          id="admin-identifier"
          label="Email hoặc tên đăng nhập Quản trị viên"
          required
          value={formData.identifier}
          onChange={(event) => setFormData((current) => ({ ...current, identifier: event.target.value }))}
          placeholder="admin@stationery.com"
          error={errors.identifier}
          disabled={loading}
        />
        <PortalInput
          id="admin-password"
          label="Mật khẩu"
          required
          type="password"
          value={formData.password}
          onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          placeholder="Nhập mật khẩu"
          error={errors.password}
          disabled={loading}
        />

        {submitError ? <p className="submit-error">{submitError}</p> : null}

        <button className="portal-submit admin" type="submit" disabled={loading}>
          {loading ? "Đang xác thực đăng nhập..." : "Đăng nhập Quản trị viên"}
        </button>
      </form>
    </PortalLayout>
  );
}
