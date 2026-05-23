import { stringify } from 'yaml';
import {
  buildCreateWorkloadManifest,
  getInitialCreateWorkloadValues,
  getWorkloadStepFields,
} from '../../../workloads/components/CreateWorkloadDrawer/helpers';
import type { CreateJobFormValues } from './types';

const JOB_API_VERSION = 'batch/v1';
const JOB_KIND = 'Job';
const JOB_RESOURCE_TYPE: API.ClusterResourceCreateType = 'Job';
const WORKLOAD_FORM_TYPE: API.ClusterWorkloadType = 'Deployment';
const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getInitialCreateJobValues = (
  namespace?: string,
): CreateJobFormValues => ({
  ...getInitialCreateWorkloadValues(WORKLOAD_FORM_TYPE, namespace),
  activeDeadlineSeconds: undefined,
  backoffLimit: undefined,
  completions: undefined,
  parallelism: undefined,
  restartPolicy: 'Never',
});

const normalizeName = (value?: string) => value?.trim() || '';

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

const buildCreateJobManifest = (
  values: CreateJobFormValues,
): Record<string, unknown> => {
  const workloadManifest = buildCreateWorkloadManifest(
    WORKLOAD_FORM_TYPE,
    values,
  );
  const workloadMetadata = getRecordValue(workloadManifest.metadata) || {};
  const workloadSpec = getRecordValue(workloadManifest.spec) || {};
  const template = structuredClone(getRecordValue(workloadSpec.template) || {});
  const podSpec = getRecordValue(template.spec) || {};
  const spec: Record<string, unknown> = {
    template: {
      ...template,
      spec: {
        ...podSpec,
        restartPolicy: values.restartPolicy || 'Never',
      },
    },
  };

  setNumberIfDefined(spec, 'backoffLimit', values.backoffLimit, 0);
  setNumberIfDefined(spec, 'completions', values.completions, 1);
  setNumberIfDefined(spec, 'parallelism', values.parallelism, 1);
  setNumberIfDefined(
    spec,
    'activeDeadlineSeconds',
    values.activeDeadlineSeconds,
    1,
  );

  return {
    apiVersion: JOB_API_VERSION,
    kind: JOB_KIND,
    metadata: {
      ...workloadMetadata,
      name: normalizeName(values.name),
      namespace: normalizeName(values.namespace),
    },
    spec,
  };
};

const buildCreateJobYaml = (values: CreateJobFormValues) =>
  stringify(buildCreateJobManifest(values), { indent: 2 });

const getJobStepFields = (step: number): (keyof CreateJobFormValues)[] => {
  if (step === 0) {
    return ['name', 'namespace'];
  }
  if (step === 1) {
    return [
      'backoffLimit',
      'completions',
      'parallelism',
      'activeDeadlineSeconds',
    ];
  }
  if (step === 2) {
    return ['restartPolicy', 'containers'];
  }
  if (step === 3) {
    return getWorkloadStepFields(
      2,
      WORKLOAD_FORM_TYPE,
    ) as (keyof CreateJobFormValues)[];
  }

  return getWorkloadStepFields(
    3,
    WORKLOAD_FORM_TYPE,
  ) as (keyof CreateJobFormValues)[];
};

export {
  buildCreateJobManifest,
  buildCreateJobYaml,
  getInitialCreateJobValues,
  getJobStepFields,
  JOB_API_VERSION,
  JOB_KIND,
  JOB_RESOURCE_TYPE,
  NAME_PATTERN,
  WORKLOAD_FORM_TYPE,
};
