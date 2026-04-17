const API_BASE_URL = import.meta.env.VITE_IDENTITY_API_BASE_URL ?? "http://localhost:8001/api/v1/auth";

async function request(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.";
    throw new Error(message);
  }

  return payload.data;
}

export async function registerCustomer(formData) {
  return request("/register", {
    username: formData.username,
    email: formData.email,
    password: formData.password,
    full_name: formData.fullName,
    phone: formData.phone,
    addresses: formData.addresses
  });
}

export async function loginCustomer(formData) {
  return request("/login", {
    identifier: formData.identifier,
    password: formData.password
  });
}
