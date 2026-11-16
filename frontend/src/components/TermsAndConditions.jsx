import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTermsForJob } from '../data/termsConditions.js';
import { getTermsUi } from '../data/termsConditions.i18n.js';

export default function TermsAndConditions({
  jobType,
  driverType,
  accepted = false,
  onAcceptedChange,
  readOnly = false,
  lang = 'en',
}) {
  const [open, setOpen] = useState(false);
  const terms = getTermsForJob(jobType, driverType, lang);
  const ui = getTermsUi(lang);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!terms) return null;

  const acceptTerms = () => {
    onAcceptedChange?.(true);
    setOpen(false);
  };

  return (
    <>
      <div className={`terms-conditions-card${accepted ? ' is-accepted' : ''}`}>
        <div className="terms-conditions-head">
          <span className="terms-conditions-icon" aria-hidden="true">
            <i className="bi bi-file-earmark-text"></i>
          </span>
          <div className="terms-conditions-heading">
            <h3>{ui.heading}</h3>
          </div>
          <div className="terms-conditions-actions">
            <span className="terms-conditions-type">{terms.label}</span>
            <a
              href="#terms-and-conditions"
              className="terms-conditions-view"
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
            >
              <i className="bi bi-eye"></i> {ui.view}
            </a>
          </div>
        </div>

        {readOnly ? (
          <div className={`terms-conditions-readonly${accepted ? ' accepted' : ''}`}>
            <i className={`bi ${accepted ? 'bi-check-circle-fill' : 'bi-info-circle-fill'}`}></i>
            <span>
              {accepted
                ? ui.acceptedFor.replace('{label}', terms.label)
                : ui.notRecorded}
            </span>
          </div>
        ) : (
          <label className={`terms-conditions-check${accepted ? ' checked' : ''}`}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={accepted}
              onChange={(event) => onAcceptedChange?.(event.target.checked)}
            />
            <span>{ui.readAgree}</span>
          </label>
        )}
      </div>

      {open && createPortal(
        <div
          className="terms-modal-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="terms-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="terms-modal-head">
              <div>
                <span className="terms-modal-eyebrow">SNPNBC Consultant and Manpower Services</span>
                <h2 id="terms-modal-title">{terms.title}</h2>
              </div>
              <button
                type="button"
                className="terms-modal-close"
                onClick={() => setOpen(false)}
                aria-label={ui.closeAria}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="terms-modal-body">
              <div className="terms-modal-intro">
                <i className="bi bi-info-circle-fill"></i>
                <p>{terms.intro}</p>
              </div>

              {terms.declaration && (
                <div className="terms-modal-declaration">
                  <strong>{ui.declaration}</strong>
                  <p>{terms.declaration}</p>
                </div>
              )}

              {terms.sections.map((section) => (
                <section key={section.heading} className="terms-modal-section">
                  <h3>{section.heading}</h3>
                  <ol>
                    {section.points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>

            <div className="terms-modal-foot">
              <span className="terms-modal-foot-note">
                {accepted ? (
                  <>
                    <i className="bi bi-check-circle-fill"></i> {ui.accepted}
                  </>
                ) : (
                  ui.readAll
                )}
              </span>
              <div className="terms-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                  {ui.close}
                </button>
                {!readOnly && !accepted && (
                  <button type="button" className="btn btn-primary" onClick={acceptTerms}>
                    <i className="bi bi-check2-circle"></i> {ui.agree}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
