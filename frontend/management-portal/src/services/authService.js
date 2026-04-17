const API_BASE_URL = import.meta.env.VITE_IDENTITY_API_BASE_URL ?? "http://localhost:8001/api/v1/auth";

async function login(identifier, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ identifier, password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload?.message ?? "Đăng nhập thất bại. Vui lòng thử lại.");
  }

  return payload.data;
}

export async function loginStaff(identifier, password) {
  const data = await login(identifier, password);
  if (data.user.role !== "STAFF") {
    throw new Error("Tài khoản này không có quyền truy cập Cổng Nhân viên.");
  }
  return data;
}

export async function loginAdmin(identifier, password) {
  const data = await login(identifier, password);
  if (data.user.role !== "ADMIN") {
    throw new Error("Tài khoản này không có quyền truy cập Cổng Quản lý dành cho Quản trị viên.");
  }
  return data;
}
