const STAFF_KEY = "stationery_staff_access_token";
const ADMIN_KEY = "stationery_admin_access_token";

export function saveStaffToken(token) {
  localStorage.setItem(STAFF_KEY, token);
}

export function saveAdminToken(token) {
  localStorage.setItem(ADMIN_KEY, token);
}
