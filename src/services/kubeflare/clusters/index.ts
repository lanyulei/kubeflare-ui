// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 获取集群列表 GET /kapis/cluster.kubeflare.com/v1/clusters */
export async function listClusterKubeflareComV1Cluster(
  params?: API.ListClusterKubeflareComV1ClusterParams,
  options?: { [key: string]: any },
) {
  return request<API.ClusterList>('/kapis/cluster.kubeflare.com/v1/clusters', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  })
}
