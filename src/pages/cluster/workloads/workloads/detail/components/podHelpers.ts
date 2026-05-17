export const getLabelSelector = (selector?: Record<string, string>) =>
  Object.entries(selector || {})
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

export const matchWorkloadPod = (
  pod: API.ClusterNodePodItem,
  workload?: API.ClusterWorkloadItem,
) => {
  if (!workload?.name) {
    return true;
  }

  if (workload.type === 'Deployment') {
    const deploymentPodPattern = new RegExp(`^${workload.name}-.+-.+$`);
    return deploymentPodPattern.test(pod.name);
  }

  return pod.name === workload.name || pod.name.startsWith(`${workload.name}-`);
};
