import dayjs from 'dayjs';
import type { TaintEffect } from '@/components/TaintEditor';

export const getNodeIp = (record?: API.ClusterNodeItem) =>
  record?.ip || record?.internal_ip || record?.external_ip || '-';

export const getNodeVersion = (record?: API.ClusterNodeItem) =>
  record?.version || record?.kubelet_version || '-';

export const getNodeRoles = (roles?: string[] | string) => {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (roles) {
    return roles
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
  }
  return [];
};

export const getNodeRoleLabel = (role: string) => {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === 'control-plane' || normalizedRole === 'master') {
    return '控制平面节点';
  }
  if (normalizedRole === 'worker') {
    return '工作节点';
  }
  return role;
};

export const getNodeStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return '运行中';
  }
  if (normalizedStatus === 'notready') {
    return '异常';
  }
  if (normalizedStatus === 'unknown') {
    return '未知';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return '已禁止调度';
  }
  return status || '-';
};

export const getNodeStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'ready') {
    return 'success';
  }
  if (normalizedStatus === 'notready' || normalizedStatus === 'unknown') {
    return 'error';
  }
  if (normalizedStatus === 'schedulingdisabled') {
    return 'warning';
  }
  return 'default';
};

export const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

export const getTaintEffect = (effect?: string): TaintEffect => {
  if (
    effect === 'NoSchedule' ||
    effect === 'PreferNoSchedule' ||
    effect === 'NoExecute'
  ) {
    return effect;
  }

  return 'NoSchedule';
};

export const decodeNodeName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};
