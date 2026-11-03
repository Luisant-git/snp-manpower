import { useEffect, useState } from 'react';
import {
  listStaff,
  addUser,
  updateUser,
  setUserActive,
  deleteUser,
} from '../../data/mockDb.js';

/* Avatar initials for the users table */
function initials(name) {
  const parts = (name || 'U').trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

/* 03 Nov 2026 style date */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function UserManagement() {
  const [users, setUsers] = useState(listStaff());
  const [msg, setMsg] = useState('');

  /* Modal state — 'add' | 'edit' */
  const [modal, setModal] = useState(null); // { mode: 'add' } | { mode: 'edit', user }
  const [form, setForm] = useState({ name: '', mobile: '', password: '1234', role: 'employee', status: 'active' });
  const [formError, setFormError] = useState('');

  /* Close modal with Escape key */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const refresh = () => setUsers(listStaff());

  /* ---------- Actions ---------- */
  const openAdd = () => {
    setMsg('');
    setFormError('');
    setForm({ name: '', mobile: '', password: '1234', role: 'employee', status: 'active' });
    setModal({ mode: 'add' });
  };

  const openEdit = (u) => {
    setMsg('');
    setFormError('');
    setForm({
      name: u.name,
      mobile: u.mobile,
      password: u.password,
      role: u.role,
      status: u.active ? 'active' : 'inactive',
    });
    setModal({ mode: 'edit', user: u });
  };

  const save = () => {
    setFormError('');
    if (!form.name.trim() || form.mobile.length !== 10 || form.password.length < 4) {
      setFormError('Fill name, a 10-digit mobile and a password (min 4 chars).');
      return;
    }
    try {
      if (modal.mode === 'add') {
        addUser(form);
        setMsg(`User "${form.name}" created — they can now log in and fill candidate forms.`);
      } else {
        updateUser(modal.user.id, {
          name: form.name.trim(),
          mobile: form.mobile,
          password: form.password,
          role: form.role,
          active: form.status !== 'inactive',
        });
        setMsg(`User "${form.name}" updated successfully.`);
      }
      refresh();
      setModal(null);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const removeUser = (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    deleteUser(u.id);
    refresh();
    setMsg(`User "${u.name}" deleted.`);
  };

  const toggleStatus = (id, active) => {
    setUserActive(id, active);
    refresh();
  };

  const employees = users.filter((u) => u.role === 'employee');
  const isAdd = modal?.mode === 'add';

  return (
    <div className="admin-panel">
      {msg && (
        <div
          className={`track-result${msg.includes('deleted') || msg.includes('created') ? '' : ' track-error'}`}
          style={{ marginBottom: 14 }}
        >
          <i
            className={
              msg.includes('deleted') || msg.includes('created')
                ? 'bi bi-check-circle-fill'
                : 'bi bi-exclamation-triangle-fill'
            }
          ></i>
          <div>{msg}</div>
        </div>
      )}

      <div className="users-toolbar">
        <div>
          <h4 style={{ fontWeight: 800 }}>User Accounts</h4>
          <small style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
            {employees.length} employee(s) · {users.length - employees.length} administrator(s)
          </small>
        </div>
        <button className="btn add-user-btn" onClick={openAdd}>
          <i className="bi bi-person-plus-fill"></i> Add User
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Name</th>
              <th>Mobile (Login)</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered On</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>
                <td>
                  <span className="sno-chip">#{i + 1}</span>
                </td>
                <td>
                  <span className="user-avatar">{initials(u.name)}</span>
                  {u.name}
                </td>
                <td className="mono-cell">+91 {u.mobile}</td>
                <td>
                  <span className={`badge-role ${u.role === 'admin' ? 'admin' : 'employee'}`}>
                    {u.role === 'admin' ? 'System Administrator' : 'Employee'}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge-role ${u.active ? 'active' : 'inactive'}`}
                    style={{ cursor: 'pointer' }}
                    title="Click to toggle"
                    onClick={() => toggleStatus(u.id, !u.active)}
                  >
                    {u.active ? '● Active' : '○ Inactive'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <i className="bi bi-calendar3" style={{ color: '#94a3b8', marginRight: 6 }}></i>
                  {fmtDate(u.createdAt)}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="icon-btn primary" title="Edit user" onClick={() => openEdit(u)}>
                    <i className="bi bi-pencil"></i>
                  </button>{' '}
                  <button className="icon-btn danger" title="Delete user" onClick={() => removeUser(u)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============ USER MODAL (Add / Edit) ============ */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="add-user-icon">
                <i className={`bi ${isAdd ? 'bi-person-plus-fill' : 'bi-pencil-square'}`}></i>
              </div>
              <div>
                <h4>{isAdd ? 'Add New User' : `Edit User — ${modal.user.name}`}</h4>
                <small>
                  {isAdd
                    ? 'Create an account — they can log in and fill candidate forms.'
                    : 'Update account details and save changes.'}
                </small>
              </div>
              <button className="modal-close" onClick={() => setModal(null)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="track-result track-error" style={{ marginBottom: 14 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{formError}</div>
                </div>
              )}

              <div className="form-grid">
                <div className="field-block full">
                  <label className="input-label">Full Name</label>
                  <input
                    className="auth-input"
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="field-block">
                  <label className="input-label">Mobile (Login ID)</label>
                  <input
                    className="auth-input"
                    value={form.mobile}
                    maxLength={10}
                    onChange={(e) =>
                      setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                    }
                    placeholder="98XXXXXXXX"
                  />
                </div>

                <div className="field-block">
                  <label className="input-label">Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>

                <div className="field-block">
                  <label className="input-label">Role</label>
                  <div className="field-icon">
                    <i className="bi bi-shield-check"></i>
                    <select
                      className="auth-input"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="field-block full">
                  <label className="input-label">Account Status</label>
                  <div className="field-icon">
                    <i className="bi bi-activity"></i>
                    <select
                      className="auth-input"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn add-user-btn modal-submit" onClick={save}>
                <i className={`bi ${isAdd ? 'bi-person-plus-fill' : 'bi-check-lg'}`}></i>{' '}
                {isAdd ? 'Add User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
