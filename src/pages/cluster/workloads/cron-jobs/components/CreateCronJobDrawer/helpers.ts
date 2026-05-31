import { stringify } from 'yaml';
import {
  buildCreateJobManifest,
  getInitialCreateJobValues,
  getJobStepFields,
  NAME_PATTERN,
  WORKLOAD_FORM_TYPE,
} from '../../../jobs/components/CreateJobDrawer/helpers';
import type { CreateCronJobFormValues } from './types';

const CRON_JOB_API_VERSION = 'batch/v1';
const CRON_JOB_KIND = 'CronJob';
const CRON_JOB_RESOURCE_TYPE: API.ClusterResourceCreateType = 'CronJob';

const cronScheduleOptions = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每 5 分钟', value: '*/5 * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天', value: '0 0 * * *' },
  { label: '每周', value: '0 0 * * 0' },
];

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const normalizeName = (value?: string) => value?.trim() || '';

const getInitialCreateCronJobValues = (
  namespace?: string,
): CreateCronJobFormValues => ({
  ...getInitialCreateJobValues(namespace),
  concurrencyPolicy: 'Forbid',
  failedJobsHistoryLimit: undefined,
  schedule: undefined,
  startingDeadlineSeconds: undefined,
  successfulJobsHistoryLimit: undefined,
  timeZone: undefined,
});

const setNumberIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value: number | undefined,
  min: number,
) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    return;
  }

  target[key] = value;
};

const buildCreateCronJobManifest = (
  values: CreateCronJobFormValues,
): Record<string, unknown> => {
  const jobManifest = buildCreateJobManifest(values);
  const jobMetadata = getRecordValue(jobManifest.metadata) || {};
  const jobSpec = getRecordValue(jobManifest.spec) || {};
  const spec: Record<string, unknown> = {
    schedule: normalizeName(values.schedule),
    concurrencyPolicy: values.concurrencyPolicy || 'Forbid',
    jobTemplate: {
      spec: jobSpec,
    },
  };

  setNumberIfDefined(
    spec,
    'startingDeadlineSeconds',
    values.startingDeadlineSeconds,
    0,
  );
  setNumberIfDefined(
    spec,
    'successfulJobsHistoryLimit',
    values.successfulJobsHistoryLimit,
    0,
  );
  setNumberIfDefined(
    spec,
    'failedJobsHistoryLimit',
    values.failedJobsHistoryLimit,
    0,
  );
  if (normalizeName(values.timeZone)) {
    spec.timeZone = normalizeName(values.timeZone);
  }

  return {
    apiVersion: CRON_JOB_API_VERSION,
    kind: CRON_JOB_KIND,
    metadata: {
      ...jobMetadata,
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
    },
    spec,
  };
};

const buildCreateCronJobYaml = (values: CreateCronJobFormValues) =>
  stringify(buildCreateCronJobManifest(values), { indent: 2 });

const getCronJobStepFields = (
  step: number,
): (keyof CreateCronJobFormValues)[] => {
  if (step === 0) {
    return [
      'name',
      'namespace',
      'schedule',
      'startingDeadlineSeconds',
      'successfulJobsHistoryLimit',
      'failedJobsHistoryLimit',
      'concurrencyPolicy',
      'timeZone',
    ];
  }

  return getJobStepFields(step) as (keyof CreateCronJobFormValues)[];
};

export {
  buildCreateCronJobManifest,
  buildCreateCronJobYaml,
  CRON_JOB_API_VERSION,
  CRON_JOB_KIND,
  CRON_JOB_RESOURCE_TYPE,
  cronScheduleOptions,
  getCronJobStepFields,
  getInitialCreateCronJobValues,
  NAME_PATTERN,
  WORKLOAD_FORM_TYPE,
};
