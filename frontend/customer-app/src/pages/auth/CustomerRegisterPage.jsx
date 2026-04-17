import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthInput } from "../../components/auth/AuthInput";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { registerCustomer } from "../../services/authService";

function toAddressPayload(value) {
  if (!value.trim()) {
    return [];
  }

  return [
    {
      line1: value.trim(),
      line2: "",
      city: "N/A",
      state: "",
      postal_code: "000000",
      country: "VN",
      is_primary: true
    }
  ];
}

export function CustomerRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    addressLine1: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  function validate() {
    const nextErrors = {};
    if (!formData.username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập.";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Định dạng email không hợp lệ.";
    }
    if (!formData.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    }
    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }
    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }
    if (!/^\+?[1-9]\d{7,14}$/.test(formData.phone)) {
      nextErrors.phone = "Số điện thoại không hợp lệ, ví dụ +84901234567.";
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
    setSubmitSuccess("");

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await registerCustomer({
        ...formData,
        addresses: toAddressPayload(formData.addressLine1)
      });
      setSubmitSuccess("Đăng ký thành công. Đang chuyển sang trang đăng nhập...");
      setTimeout(() => navigate("/auth/login", { replace: true }), 900);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Đăng Ký"
      subtitle="Tạo tài khoản mới để trải nghiệm mua sắm văn phòng phẩm tiện lợi và nhanh chóng."
      alternateText="Đã có tài khoản?"
      alternateLink="/auth/login"
      alternateLinkText="Đăng nhập"
    >
      <form onSubmit={handleSubmit} className="auth-form two-columns">
        <AuthInput
          id="username"
          label="Tên đăng nhập"
          required
          value={formData.username}
          onChange={(event) => updateField("username", event.target.value)}
          placeholder="paperlover"
          error={errors.username}
          disabled={loading}
        />
        <AuthInput
          id="email"
          label="Email"
          required
          type="email"
          value={formData.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="ban@example.com"
          error={errors.email}
          disabled={loading}
        />
        <AuthInput
          id="password"
          label="Mật khẩu"
          required
          type="password"
          value={formData.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password}
          disabled={loading}
        />
        <AuthInput
          id="confirmPassword"
          label="Xác nhận mật khẩu"
          required
          type="password"
          value={formData.confirmPassword}
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          placeholder="Nhập lại mật khẩu"
          error={errors.confirmPassword}
          disabled={loading}
        />
        <AuthInput
          id="fullName"
          label="Họ và tên"
          required
          value={formData.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Nguyễn Văn A"
          error={errors.fullName}
          disabled={loading}
        />
        <AuthInput
          id="phone"
          label="Số điện thoại"
          value={formData.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+84901234567"
          error={errors.phone}
          disabled={loading}
        />
        <div className="span-2">
          <AuthInput
            id="address"
            label="Địa chỉ chính"
            value={formData.addressLine1}
            onChange={(event) => updateField("addressLine1", event.target.value)}
            placeholder="123 Đường Chính"
            disabled={loading}
          />
        </div>

        {submitError ? <p className="submit-error span-2">{submitError}</p> : null}
        {submitSuccess ? <p className="submit-success span-2">{submitSuccess}</p> : null}

        <button type="submit" className="submit-btn span-2" disabled={loading}>
          {loading ? "Đang xử lý đăng ký..." : "Đăng ký tài khoản"}
        </button>
      </form>
    </AuthLayout>
  );
}
