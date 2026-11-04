const fs = require('fs');
const path = require('path');

const regPath = path.join(__dirname, '..', 'src', 'pages', 'Register.jsx');
let content = fs.readFileSync(regPath, 'utf8');

const target = `                {/* 17. Types of Jobs & Designation * */}
                <tr>
                  <FormLabelCell k="designation" enSecondary="Designation *" required />
                  <td className="field-input-cell">
                    <div className="d-flex flex-column gap-2">
                      <div className="radio-options-row">
                        <label className="radio-option-item">
                          <input
                            type="radio"
                            name="jobType"
                            value="TAXI"
                            checked={form.jobType === 'TAXI'}
                            onChange={() => {
                              setForm((f) => ({
                                ...f,
                                jobType: 'TAXI',
                                designation: 'TAXI',
                                hasLicense: 'YES',
                              }));
                            }}
                          />
                          <span>{ts('taxi')}</span>
                        </label>
                        <label className="radio-option-item">
                          <input
                            type="radio"
                            name="jobType"
                            value="DRIVER"
                            checked={form.jobType === 'DRIVER'}
                            onChange={() => {
                              setForm((f) => ({
                                ...f,
                                jobType: 'DRIVER',
                                designation: 'DRIVER',
                                hasLicense: 'YES',
                              }));
                            }}
                          />
                          <span>{ts('driver')}</span>
                        </label>
                        <label className="radio-option-item">
                          <input
                            type="radio"
                            name="jobType"
                            value="OTHERS"
                            checked={form.jobType === 'OTHERS'}
                            onChange={() => {
                              setForm((f) => ({
                                ...f,
                                jobType: 'OTHERS',
                                designation:
                                  f.designation === 'TAXI' || f.designation === 'DRIVER'
                                    ? ''
                                    : f.designation,
                              }));
                            }}
                          />
                          <span>{ts('others')}</span>
                        </label>
                      </div>

                      {/* If Others is chosen, show custom designation text input */}
                      {form.jobType === 'OTHERS' && (
                        <div className="mt-1">
                          <input
                            name="designation"
                            required
                            autoFocus
                            value={form.designation}
                            onChange={set}
                            placeholder={ts('specifyDesignationPlaceholder')}
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#0f172a',
                              border: '1.5px solid #0284c7',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              backgroundColor: '#f0f9ff',
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>`;

const replacement = `                {/* 17. Types of Jobs * (Placed BEFORE Designation) */}
                <tr>
                  <FormLabelCell k="jobType" enSecondary="Types of Jobs *" required />
                  <td className="field-input-cell">
                    <div className="radio-options-row">
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="TAXI"
                          checked={form.jobType === 'TAXI'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'TAXI',
                              designation: 'TAXI',
                              hasLicense: 'YES',
                            }));
                          }}
                        />
                        <span>{ts('taxi')}</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="DRIVER"
                          checked={form.jobType === 'DRIVER'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'DRIVER',
                              designation: 'DRIVER',
                              hasLicense: 'YES',
                            }));
                          }}
                        />
                        <span>{ts('driver')}</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="OTHERS"
                          checked={form.jobType === 'OTHERS'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'OTHERS',
                              designation:
                                f.designation === 'TAXI' || f.designation === 'DRIVER'
                                  ? ''
                                  : f.designation,
                            }));
                          }}
                        />
                        <span>{ts('others')}</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 18. Designation * (Shown right after Types of Jobs; if Others chosen, candidate types designation) */}
                <tr>
                  <FormLabelCell k="designation" enSecondary="Designation *" required />
                  <td className="field-input-cell">
                    {form.jobType === 'OTHERS' ? (
                      <input
                        name="designation"
                        required
                        autoFocus
                        value={form.designation}
                        onChange={set}
                        placeholder={ts('specifyDesignationPlaceholder')}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#0f172a',
                          border: '1.5px solid #0284c7',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          backgroundColor: '#f0f9ff',
                          width: '100%',
                        }}
                      />
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <input
                          name="designation"
                          readOnly
                          value={form.designation}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: '#0f172a',
                            padding: '4px 6px',
                            width: 'auto',
                          }}
                        />
                        <span
                          className="badge bg-light text-secondary border px-2 py-1"
                          style={{ fontSize: '0.74rem', fontWeight: 600 }}
                        >
                          (Selected from Types of Jobs: {form.jobType})
                        </span>
                      </div>
                    )}
                  </td>
                </tr>`;

const norm = (s) => s.replace(/\r\n/g, '\n');
const normContent = norm(content);
const normTarget = norm(target);

if (normContent.includes(normTarget)) {
  content = normContent.replace(normTarget, norm(replacement));
  fs.writeFileSync(regPath, content, 'utf8');
  console.log('Successfully updated Register.jsx with Types of Jobs before Designation');
} else {
  console.log('Target block not matched in Register.jsx');
}
