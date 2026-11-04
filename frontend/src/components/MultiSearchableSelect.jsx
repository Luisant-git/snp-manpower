import { useState, useRef, useEffect } from 'react';

export default function MultiSearchableSelect({
  name,
  value, // string (comma separated) or array
  onChange,
  options = [],
  placeholder = 'Search and select multiple...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize selected items into an array of trimmed uppercase strings
  const selectedList = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (opt) => {
    let updated;
    if (selectedList.includes(opt)) {
      updated = selectedList.filter((item) => item !== opt);
    } else {
      updated = [...selectedList, opt];
    }
    onChange({ target: { name, value: updated.join(', ') } });
  };

  const removeOption = (e, opt) => {
    e.stopPropagation();
    const updated = selectedList.filter((item) => item !== opt);
    onChange({ target: { name, value: updated.join(', ') } });
  };

  const addCustomOption = () => {
    const trimmed = search.trim().toUpperCase();
    if (trimmed && !selectedList.includes(trimmed)) {
      const updated = [...selectedList, trimmed];
      onChange({ target: { name, value: updated.join(', ') } });
      setSearch('');
    }
  };

  return (
    <div className={`multi-searchable-wrap ${className}`} ref={wrapperRef}>
      {/* Trigger Box with Badges */}
      <div
        className="multi-searchable-trigger"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <div className="multi-chips-container">
          {selectedList.length > 0 ? (
            selectedList.map((item, idx) => (
              <span key={idx} className="multi-chip-badge">
                <span>{item}</span>
                <button
                  type="button"
                  className="multi-chip-remove"
                  onClick={(e) => removeOption(e, item)}
                  title={`Remove ${item}`}
                >
                  <i className="bi bi-x"></i>
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted" style={{ textTransform: 'none', fontWeight: 600, fontSize: '0.84rem' }}>
              {placeholder}
            </span>
          )}
        </div>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} searchable-arrow`}></i>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="searchable-dropdown-panel no-print">
          {/* Search Box */}
          <div className="searchable-input-box">
            <i className="bi bi-search searchable-search-icon"></i>
            <input
              type="text"
              ref={searchInputRef}
              className="searchable-search-field"
              placeholder="Search or type custom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    toggleOption(filteredOptions[0]);
                  } else if (search.trim()) {
                    addCustomOption();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
            />
            {search && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearch('')}
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          {/* Scrollable Checkbox List */}
          <div className="searchable-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => {
                const isSelected = selectedList.includes(opt);
                return (
                  <div
                    key={i}
                    className={`searchable-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleOption(opt)}
                  >
                    <span>{opt}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ cursor: 'pointer', accentColor: '#1e3a8a', width: '16px', height: '16px' }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="searchable-no-options">
                <div className="text-muted small mb-2">No matching options</div>
                {search.trim() && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-1 px-3"
                    style={{ fontSize: '0.75rem', fontWeight: 700 }}
                    onClick={addCustomOption}
                  >
                    + Add "{search.trim().toUpperCase()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer with Count and Clear Button */}
          {selectedList.length > 0 && (
            <div className="p-2 border-top bg-light d-flex justify-content-between align-items-center">
              <span className="small text-muted fw-bold">{selectedList.length} selected</span>
              <button
                type="button"
                className="btn btn-link btn-sm text-danger text-decoration-none p-0 fw-bold"
                style={{ fontSize: '0.75rem' }}
                onClick={() => onChange({ target: { name, value: '' } })}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

