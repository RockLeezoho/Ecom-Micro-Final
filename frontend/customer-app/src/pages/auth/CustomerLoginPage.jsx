import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthInput } from "../../components/auth/AuthInput";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { loginCustomer } from "../../services/authService";
import { saveCustomerToken } from "../../services/tokenStorage";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function validate() {
    const nextErrors = {};
    if (!formData.identifier.trim()) {
      nextErrors.identifier = "Vui lòng nhập email hoặc tên đăng nhập.";
    }
    if (!formData.password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateField(field, value) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const response = await loginCustomer(formData);
      saveCustomerToken(response.token.access_token);
      navigate("/products", { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Chào mừng bạn quay lại"
      subtitle="Đăng nhập để tiếp tục mua sắm văn phòng phẩm chất lượng cao uy tín."
      alternateText="Chưa có tài khoản?"
      alternateLink="/auth/register"
      alternateLinkText="Đăng ký"
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <AuthInput
          id="identifier"
          label="Email hoặc tên đăng nhập"
          required
          value={formData.identifier}
          onChange={(event) => updateField("identifier", event.target.value)}
          placeholder="ban@example.com"
          error={errors.identifier}
          disabled={loading}
        />
        <AuthInput
          id="password"
          label="Mật khẩu"
          required
          type="password"
          value={formData.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Nhập mật khẩu của bạn"
          error={errors.password}
          disabled={loading}
        />

        {submitError ? <p className="submit-error">{submitError}</p> : null}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthLayout>
  );
}
