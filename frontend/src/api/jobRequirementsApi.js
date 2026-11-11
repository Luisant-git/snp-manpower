const JOB_REQUIREMENTS_URL = 'https://api.makecallsnp.com/api/job-requirements/admin/all';

export const jobRequirementsApi = {
  async list({ page = 1, limit = 50, signal } = {}) {
    const url = new URL(JOB_REQUIREMENTS_URL);
    url.search = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    }).toString();

    let response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        signal,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new Error('Unable to connect to the hiring jobs API.', { cause: error });
    }

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof result === 'object' && result !== null
        ? result.message
        : result;
      throw new Error(message || `Hiring jobs request failed (${response.status}).`);
    }
    if (
      !result ||
      result.success !== true ||
      !Array.isArray(result.jobs) ||
      !Number.isInteger(result.total) ||
      result.total < 0
    ) {
      throw new Error('The hiring jobs API returned an unexpected response.');
    }

    return { jobs: result.jobs, total: result.total };
  },
};
