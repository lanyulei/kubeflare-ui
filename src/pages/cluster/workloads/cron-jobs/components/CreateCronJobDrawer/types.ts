import type { CreateJobFormValues } from '../../../jobs/components/CreateJobDrawer/types';

type CronJobConcurrencyPolicy = 'Allow' | 'Forbid' | 'Replace';

type CreateCronJobFormValues = CreateJobFormValues & {
  concurrencyPolicy?: CronJobConcurrencyPolicy;
  failedJobsHistoryLimit?: number;
  schedule?: string;
  startingDeadlineSeconds?: number;
  successfulJobsHistoryLimit?: number;
};

export type { CreateCronJobFormValues, CronJobConcurrencyPolicy };
