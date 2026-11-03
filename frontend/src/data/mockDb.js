/* ============================================================
   Mock database (localStorage) — swap these functions for real
   API calls when the backend is ready. Same signatures will work.
   ============================================================ */

const USERS_KEY = 'snp_users';
const APPS_KEY = 'snp_applications';
const SESSION_KEY = 'snp_session';

/* ---------- Users ---------- */
function getUsers() {
  let users = JSON.parse(localStorage.getItem(USERS_KEY) || 'null');
  if (!users || users.length === 0) {
    // Seed with the default admin exactly like the original site's demo credentials
    const seeded = [
      {
        id: 'u1',
        name: 'System Administrator',
        mobile: '9876543210',
        password: 'Admin@SNP2026',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  // Migrate legacy 'staff' role to 'employee' (renamed roles)
  if (users.some((u) => u.role === 'staff')) {
    users = users.map((u) => (u.role === 'staff' ? { ...u, role: 'employee' } : u));
    saveUsers(users);
  }
  // Safety net: always keep at least one System Administrator account
  if (!users.some((u) => u.role === 'admin')) {
    users.unshift({
      id: `u${Date.now()}`,
      name: 'System Administrator',
      mobile: '9876543210',
      password: 'Admin@SNP2026',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
  return users;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function verifyLogin(username, password, role = null) {
  const user = getUsers().find(
    (u) =>
      u.active &&
      (u.mobile === username.trim() || u.name.toLowerCase() === username.trim().toLowerCase()) &&
      u.password === password &&
      (!role || u.role === role) // restrict login by role, e.g. 'admin' for password login
  );
  if (!user) return null;
  const { password: _pw, ...safe } = user;
  return safe; // { id, name, mobile, role, active }
}

export function addUser({ name, mobile, password, role, status }) {
  const users = getUsers();
  if (users.some((u) => u.mobile === mobile)) {
    throw new Error('This mobile number is already registered');
  }
  const user = {
    id: `u${Date.now()}`,
    name,
    mobile,
    password,
    role: role || 'employee',
    active: status !== 'inactive', // defaults to active
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id, fields) {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...fields } : u));
  saveUsers(users);
  return users.find((u) => u.id === id);
}

export function setUserActive(id, active) {
  const users = getUsers().map((u) => (u.id === id ? { ...u, active } : u));
  saveUsers(users);
}

export function deleteUser(id) {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

export function listStaff() {
  return getUsers();
}

/* ---------- Session ---------- */
export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- Applications ---------- */
export function getApplications() {
  return JSON.parse(localStorage.getItem(APPS_KEY) || '[]');
}

export function addApplication(app) {
  const apps = getApplications();
  apps.push(app);
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

export function updateApplicationStatus(ref, status) {
  const apps = getApplications().map((a) => (a.ref === ref ? { ...a, status } : a));
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

const PAYMENT_PRESETS = {
  Paid: { paid: '₹2,400', pending: '₹0' },
  Partial: { paid: '₹1,200', pending: '₹1,200' },
  Pending: { paid: '₹0', pending: '₹2,400' },
};

export function updateApplicationPayment(ref, payment) {
  const pair = PAYMENT_PRESETS[payment] || PAYMENT_PRESETS.Pending;
  const apps = getApplications().map((a) =>
    a.ref === ref ? { ...a, payment, feesPaid: pair.paid, feesPending: pair.pending } : a
  );
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

/* Update Fees modal — custom amounts from admin */
export function updateApplicationFees(ref, { payment, paidAmount, pendingAmount }) {
  const money = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
  const apps = getApplications().map((a) =>
    a.ref === ref
      ? { ...a, payment, feesPaid: money(paidAmount), feesPending: money(pendingAmount) }
      : a
  );
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

/* Seed the registry with entries (used the first time demo rows are edited) */
export function seedApplications(list) {
  localStorage.setItem(APPS_KEY, JSON.stringify(list));
}

export function deleteApplication(ref) {
  const apps = getApplications().filter((a) => a.ref !== ref);
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}
