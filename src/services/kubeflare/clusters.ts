// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 获取集群列表 GET /api/v1/cluster */
export async function getClusterList(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ClusterListData>>('/api/v1/cluster', {
    method: 'GET',
    ...(options || {}),
  })
}

/** 获取集群详情 GET /api/v1/cluster/:clusterID */
export async function getClusterDetail(
  clusterID: string | number,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ClusterItem>>(
    `/api/v1/cluster/${clusterID}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

/** 创建集群 POST /api/v1/cluster */
export async function createCluster(
  body: API.CreateClusterParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ClusterItem>>('/api/v1/cluster', {
    method: 'POST',
    data: body,
    ...(options || {}),
  })
}

/** 更新集群 PUT /api/v1/cluster/:clusterID */
export async function updateCluster(
  clusterID: string | number,
  body: API.UpdateClusterParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ClusterItem>>(
    `/api/v1/cluster/${clusterID}`,
    {
      method: 'PUT',
      data: body,
      ...(options || {}),
    },
  )
}

/** 删除集群 DELETE /api/v1/cluster/:clusterID */
export async function deleteCluster(
  clusterID: string | number,
  options?: { [key: string]: any },
) {
  return request<void>(`/api/v1/cluster/${clusterID}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

/** 导入 kubeconfig POST /api/v1/cluster/import */
export async function importKubeconfig(
  body: API.ImportKubeconfigParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ImportKubeconfigData>>(
    '/api/v1/cluster/import',
    {
      method: 'POST',
      data: body,
      ...(options || {}),
    },
  )
}
