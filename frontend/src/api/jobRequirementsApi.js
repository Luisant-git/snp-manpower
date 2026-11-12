import { apiRequest } from './client.js';

const JOB_REQUIREMENTS_PATH = '/hiring-jobs';

export const jobRequirementsApi = {
  list({ page = 1, limit = 50, fromDate, toDate, signal } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    return apiRequest(`${JOB_REQUIREMENTS_PATH}?${params.toString()}`, { signal });
  },

  async listAll({ signal } = {}) {
    const pageSize = 100;
    const firstPage = await this.list({ page: 1, limit: pageSize, signal });
    const jobs = [...(firstPage.jobs || [])];
    const pageCount = Math.ceil((Number(firstPage.total) || jobs.length) / pageSize);

    for (let page = 2; page <= pageCount; page += 1) {
      const result = await this.list({ page, limit: pageSize, signal });
      if (result.jobs?.length) jobs.push(...result.jobs);
      else break;
    }

    const uniqueJobs = new Map(
      jobs.filter((job) => job?.id != null).map((job) => [String(job.id), job]),
    );
    return {
      jobs: [...uniqueJobs.values()],
      total: Number(firstPage.total) || jobs.length,
    };
  },
};
