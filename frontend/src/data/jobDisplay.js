export function formatJobDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
}

export function formatJobSalary(min, max) {
  const formatAmount = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
  if (min == null && max == null) return 'Not specified';
  if (min == null) return `Up to ${formatAmount(max)}`;
  if (max == null) return `From ${formatAmount(min)}`;
  return `${formatAmount(min)} – ${formatAmount(max)}`;
}

export function formatJobExperience(min, max) {
  if (min == null && max == null) return 'Not specified';
  if (min == null) return `Up to ${max} years`;
  if (max == null) return `From ${min} years`;
  if (min === max) return `${min} years`;
  return `${min}–${max} years`;
}

export function formatJobWorkMode(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['yes', 'true', 'remote', 'work from home', 'wfh'].includes(normalized)) {
    return 'Work from home';
  }
  if (['no', 'false', 'onsite', 'on-site', 'office', 'in-office'].includes(normalized)) {
    return 'On-site';
  }
  return String(value ?? '').trim();
}

export function jobSearchText(job) {
  return [
    job.title,
    job.company,
    job.city,
    ...(Array.isArray(job.localities) ? job.localities : []),
    job.description,
    job.jobType,
    job.category,
    job.role,
    job.contactName,
    job.customer?.name,
  ].filter(Boolean).join(' ').toLowerCase();
}
