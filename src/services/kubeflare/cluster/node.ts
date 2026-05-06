// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

/** 获取集群节点列表 GET /api/v1/cluster/node */
export async function getClusterNodeList(
  params?: API.ClusterNodeListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ClusterNodeListData>>(
    '/api/v1/cluster/node',
    {
      method: 'GET',
      params: { ...params },
      ...(options || {}),
    },
  )
}
