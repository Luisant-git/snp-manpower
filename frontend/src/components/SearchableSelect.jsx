import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
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

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const label = typeof opt === 'string' ? opt : opt.label || opt.value;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearch('');
  };

  const currentLabel = () => {
    if (!value) return '';
    const match = options.find((opt) => (typeof opt === 'string' ? opt === value : opt.value === value));
    if (match) return typeof match === 'string' ? match : match.label;
    return value;
  };

  return (
    <div className={`searchable-select-wrap ${className}`} ref={wrapperRef}>
      {/* Trigger Box */}
      <div
        className="searchable-trigger"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className={`searchable-val ${!value ? 'text-muted' : ''}`}>
          {currentLabel() || placeholder}
        </span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} searchable-arrow`}></i>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="searchable-dropdown-panel no-print">
          {/* Search Input Box */}
          <div className="searchable-input-box">
            <i className="bi bi-search searchable-search-icon"></i>
            <input
              type="text"
              ref={searchInputRef}
              className="searchable-search-field"
              placeholder={`Search ${placeholder}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                  e.preventDefault();
                  const first = filteredOptions[0];
                  handleSelect(typeof first === 'string' ? first : first.value);
                }
              }}
            />
            {search && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          {/* Scrollable Options List */}
          <div className="searchable-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label || opt.value;
                const isSelected = val === value;
                return (
                  <div
                    key={i}
                    className={`searchable-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(val)}
                  >
                    <span>{label}</span>
                    {isSelected && <i className="bi bi-check2 text-primary fw-bold"></i>}
                  </div>
                );
              })
            ) : (
              <div className="searchable-no-options">
                <div className="text-muted small mb-1">No matching options</div>
                {search && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-0 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleSelect(search.toUpperCase())}
                  >
                    Use "{search}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

