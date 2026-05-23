import type { CreateWorkloadFormValues } from '../../../workloads/components/CreateWorkloadDrawer/types';

type JobRestartPolicy = 'Never' | 'OnFailure';

type CreateJobFormValues = CreateWorkloadFormValues & {
  activeDeadlineSeconds?: number;
  backoffLimit?: number;
  completions?: number;
  parallelism?: number;
  restartPolicy?: JobRestartPolicy;
};

export type { CreateJobFormValues, JobRestartPolicy };
