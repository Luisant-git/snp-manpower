import { useEffect, useState } from 'react';
import { branchApi } from '../../api/branchApi.js';

export default function BranchMaster() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const refresh = async () => {
    setLoadError('');
    try {
      setBranches(await branchApi.listAll());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);
  const openAdd = () => {
    setBranchName('');
    setFormError('');
    setMessage('');
    setModal({ mode: 'add' });
  };
  const openEdit = (branch) => {
    setBranchName(branch.name);
    setFormError('');
    setMessage('');
    setModal({ mode: 'edit', branch });
  };
  const save = async () => {
    const name = branchName.trim();
    if (!name) {
      setFormError('Enter a branch name.');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await branchApi.create({ name });
        setMessage(`Branch "${name}" added.`);
      } else {
        await branchApi.update(modal.branch.id, { name });
        setMessage(`Branch "${name}" updated.`);
      }
      await refresh();
      setModal(null);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBranch = async (branch) => {
    try {
      await branchApi.update(branch.id, { isActive: !branch.isActive });
      await refresh();
      setMessage(`Branch "${branch.name}" ${branch.isActive ? 'deactivated' : 'activated'}.`);
    } catch (error) {
      setLoadError(error.message);
    }
  };
  const activeCount = branches.filter((branch) => branch.isActive).length;
  const isAdd = modal?.mode === 'add';

  return (
    <div className="admin-panel">
      {message && (
        <div className="branch-master-message" role="status">
          <i className="bi bi-check-circle-fill"></i>
          <span>{message}</span>
        </div>
      )}
      {loadError && <div className="track-result track-error" role="alert">{loadError}</div>}

      <div className="users-toolbar">
        <div>
          <h4 style={{ fontWeight: 800 }}>Branch Master</h4>
          <small style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
            Manage branches used in registration · {activeCount} active of {branches.length}
          </small>
        </div>
        <button className="btn add-user-btn" onClick={openAdd}>
          <i className="bi bi-plus-lg"></i> Add Branch
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table branch-master-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Branch / Office</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch, index) => (
              <tr key={branch.id}>
                <td><span className="sno-chip">#{index + 1}</span></td>
                <td><strong>{branch.name}</strong></td>
                <td>
                  <span className={`badge-role ${branch.isActive ? 'active' : 'inactive'}`}>
                    {branch.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="icon-btn primary"
                    title="Edit branch"
                    aria-label={`Edit ${branch.name}`}
                    onClick={() => openEdit(branch)}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>{' '}
                  <button
                    className={`branch-status-button${branch.isActive ? ' deactivate' : ' activate'}`}
                    onClick={() => toggleBranch(branch)}
                  >
                    {branch.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {loading ? (
              <tr><td colSpan="4" className="branch-master-empty">Loading branches…</td></tr>
            ) : branches.length === 0 && (
              <tr>
                <td colSpan="4" className="branch-master-empty">
                  No branches yet. Add a branch to make it available in registration.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="add-user-icon">
                <i className={`bi ${isAdd ? 'bi-building-add' : 'bi-pencil-square'}`}></i>
              </div>
              <div>
                <h4>{isAdd ? 'Add Branch' : 'Edit Branch'}</h4>
                <small>Active branches appear in the registration form.</small>
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
              <div className="field-block full">
                <label className="input-label" htmlFor="branchName">Branch / Office Name</label>
                <input
                  id="branchName"
                  className="auth-input"
                  autoFocus
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') save();
                  }}
                  placeholder="Enter branch name"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn add-user-btn modal-submit" onClick={save} disabled={saving}>
                <i className={`bi ${isAdd ? 'bi-plus-lg' : 'bi-check-lg'}`}></i>
                {saving ? 'Saving...' : isAdd ? 'Add Branch' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
