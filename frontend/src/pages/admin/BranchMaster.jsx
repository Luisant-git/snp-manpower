import { useCallback, useEffect, useRef, useState } from 'react';
import { branchApi } from '../../api/branchApi.js';

export default function BranchMaster() {
  const [branches, setBranches] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const requestId = useRef(0);
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

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoadError('');
    setLoading(true);
    try {
      const result = await branchApi.listForManagement({
        search,
        status: statusFilter,
        page,
        pageSize,
      });
      if (currentRequestId !== requestId.current) return;
      setBranches(result.items);
      setTotalResults(result.total);
      if (page > result.totalPages) setPage(result.totalPages);
    } catch (error) {
      if (currentRequestId === requestId.current) setLoadError(error.message);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [search, statusFilter, page, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
    setPageSize(10);
  };

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
      if (page !== 1) setPage(1);
      else await refresh();
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
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize));
  const firstVisible = totalResults === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalResults);
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
        <h1 className="admin-page-title">Branch Master</h1>
        <button className="btn add-user-btn" onClick={openAdd}>
          <i className="bi bi-plus-lg"></i> Add Branch
        </button>
      </div>

      <div className="registry-filter-toolbar branch-filter-toolbar">
        <label className="registry-filter-field">
          <span>Search branch</span>
          <input
            className="auth-input"
            type="text"
            value={search}
            placeholder="Enter branch name"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="registry-filter-field">
          <span>Filter by status</span>
          <select
            className="auth-input"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="registry-filter-field">
          <span>Rows per page</span>
          <select
            className="auth-input"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
        <button
          type="button"
          className="registry-filter-reset"
          onClick={resetFilters}
          aria-label="Reset all filters"
          title="Reset all filters"
        >
          <i className="bi bi-arrow-counterclockwise"></i>
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
            {loading ? (
              <tr><td colSpan="4" className="branch-master-empty">Loading branches…</td></tr>
            ) : loadError ? (
              <tr><td colSpan="4" className="branch-master-empty">Branches could not be loaded.</td></tr>
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan="4" className="branch-master-empty">
                  No branches match the selected search and status.
                </td>
              </tr>
            ) : branches.map((branch, index) => (
              <tr key={branch.id}>
                <td><span className="sno-chip">#{(page - 1) * pageSize + index + 1}</span></td>
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
                    <i className="bi bi-pencil-square"></i>
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
          </tbody>
        </table>
      </div>

      <nav className="registry-pagination user-pagination" aria-label="Branch pagination">
        <span className="registry-pagination-count">
          Showing {firstVisible}–{lastVisible} of {totalResults} branches
        </span>
        <div className="registry-pagination-controls user-pagination-controls">
          <button
            type="button"
            className="registry-page-button"
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            disabled={page === 1 || loading}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="registry-page-indicator">Page {page} of {pageCount}</span>
          <button
            type="button"
            className="registry-page-button"
            onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
            disabled={page === pageCount || loading}
            aria-label="Next page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </nav>

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
