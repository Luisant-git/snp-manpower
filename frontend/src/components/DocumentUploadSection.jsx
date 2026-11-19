import { useState } from 'react';
import SearchableSelect from './SearchableSelect.jsx';

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentUploadSection({
  docs = [],
  docType = '',
  docTypes = [],
  onDocTypeChange,
  fileInputRef,
  onFilesChange,
  onBrowse,
  onRemove,
  onDownload,
  readOnly = false,
  heading,
  subtitle,
  documentTypeLabel,
  hint,
  selectLabel,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDropzoneClick = () => {
    if (!readOnly) onBrowse?.();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (readOnly) return;

    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    if (!droppedFiles.length) return;
    onFilesChange?.({ target: { files: droppedFiles, value: '' } });
  };

  return (
    <section className={`doc-section${docs.length ? ' is-complete' : ''}`}>
      <header className="doc-section-header">
        <div className="doc-section-title-wrap">
          <span className="doc-section-icon" aria-hidden="true">
            <i className="bi bi-cloud-arrow-up"></i>
          </span>
          <div className="doc-section-heading-text">
            <h3>{heading}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <span className={`doc-status${docs.length ? ' is-done' : ''}`}>
          <i className={`bi ${docs.length ? 'bi-check-circle-fill' : 'bi-hourglass-split'}`}></i>
          {docs.length
            ? `${docs.length} ${docs.length === 1 ? 'file' : 'files'} uploaded`
            : 'Awaiting upload'}
        </span>
      </header>

      <div className="doc-section-body">
        <div className="doc-field">
          <label className="doc-field-label">
            {documentTypeLabel} <span className="text-danger">*</span>
          </label>
          {readOnly ? (
            <div className="doc-type-readonly">
              <i className="bi bi-card-list" aria-hidden="true"></i>
              {docType || selectLabel}
            </div>
          ) : (
            <SearchableSelect
              name="identityDocType"
              value={docType}
              onChange={onDocTypeChange}
              options={docTypes}
              placeholder={selectLabel}
              className="doc-type-search"
            />
          )}
        </div>

        {!readOnly && (
          <div className="doc-field doc-upload-field">
            <input
              type="file"
              ref={fileInputRef}
              className="doc-file-input"
              accept="image/*,.pdf"
              multiple
              tabIndex={-1}
              onChange={onFilesChange}
            />
            <div
              className={`doc-dropzone${isDragging ? ' is-dragging' : ''}${!docType ? ' is-idle' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Upload documents"
              onClick={handleDropzoneClick}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleDropzoneClick();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              <div className="doc-dropzone-inner">
                <span className="doc-dropzone-icon" aria-hidden="true">
                  <i className="bi bi-cloud-arrow-up-fill"></i>
                </span>
                <p className="doc-dropzone-title">Drag &amp; drop your files here</p>
                <div className="doc-dropzone-chips" aria-hidden="true">
                  <span>JPG, PNG, PDF</span>
                  <span>Max 5 MB</span>
                  <span>Multiple files</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="doc-list-heading">
          <span>Uploaded files</span>
          <span className="doc-list-count">{docs.length}</span>
        </div>

        {docs.length ? (
          <div className="doc-card-grid">
            {docs.map((doc, index) => {
              const isPdf = doc.name?.toLowerCase().endsWith('.pdf') || doc.mimeType === 'application/pdf';
              return (
                <div className="file-card" key={`${doc.url}-${index}`}>
                  <span className={`file-card-icon${isPdf ? ' is-pdf' : ''}`} aria-hidden="true">
                    <i className={`bi ${isPdf ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image'}`}></i>
                  </span>
                  <div className="file-card-body">
                    <span className="file-card-name" title={doc.name || ''}>
                      {doc.name || `Document_${index + 1}`}
                    </span>
                    <div className="file-card-meta">
                      <span className="file-card-type">{doc.type}</span>
                      {doc.size ? <span className="file-card-size">{formatFileSize(doc.size)}</span> : null}
                      <span className="file-card-status">
                        <i className="bi bi-check-circle-fill"></i> Uploaded
                      </span>
                    </div>
                  </div>
                  <div className="file-card-actions">
                    <a
                      className="file-action is-view"
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      title="View document"
                      aria-label={`View ${doc.type}`}
                    >
                      <i className="bi bi-eye"></i>
                    </a>
                    {readOnly ? (
                      <a
                        className="file-action is-download"
                        href={doc.url}
                        download={doc.name || doc.type}
                        target="_blank"
                        rel="noreferrer"
                        title="Download document"
                        aria-label={`Download ${doc.type}`}
                      >
                        <i className="bi bi-download"></i>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="file-action is-download"
                        title="Download document"
                        aria-label={`Download ${doc.type}`}
                        onClick={() => onDownload?.(doc.url, doc.name || doc.type)}
                      >
                        <i className="bi bi-download"></i>
                      </button>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        className="file-action is-remove"
                        title="Remove document"
                        aria-label={`Remove ${doc.type}`}
                        onClick={() => onRemove?.(index)}
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="doc-empty">
            <i className="bi bi-inbox" aria-hidden="true"></i>
            <span>{hint || 'No documents uploaded yet.'}</span>
          </div>
        )}
      </div>
    </section>
  );
}
