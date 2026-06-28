// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max'

const pathParam = (value: string) => encodeURIComponent(value)

const toListParams = (params?: API.GitOpsListParams) => {
  const { current, pageSize, ...restParams } = params || {}
  return {
    ...restParams,
    limit: pageSize,
    offset: current && pageSize && current > 1 ? (current - 1) * pageSize : 0,
  }
}

export async function getGitOpsDashboard(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.GitOpsDashboardStats>>(
    '/api/v1/gitops/dashboard',
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

export async function getGitOpsProviderList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsProvider>>>(
    '/api/v1/gitops/provider',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function createGitOpsProvider(
  body: API.CreateGitOpsProviderParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsProvider>>(
    '/api/v1/gitops/provider',
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function updateGitOpsProvider(
  providerID: string,
  body: API.UpdateGitOpsProviderParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsProvider>>(
    `/api/v1/gitops/provider/${pathParam(providerID)}`,
    {
      data: body,
      method: 'PUT',
      ...(options || {}),
    },
  )
}

export async function deleteGitOpsProvider(
  providerID: string,
  options?: { [key: string]: any },
) {
  return request<void>(`/api/v1/gitops/provider/${pathParam(providerID)}`, {
    method: 'DELETE',
    ...(options || {}),
  })
}

export async function testGitOpsProvider(
  providerID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsProviderTestResult>>(
    `/api/v1/gitops/provider/${pathParam(providerID)}/test`,
    {
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function getGitOpsRepositoryList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsRepository>>>(
    '/api/v1/gitops/repository',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function createGitOpsRepository(
  body: API.CreateGitOpsRepositoryParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRepository>>(
    '/api/v1/gitops/repository',
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function updateGitOpsRepository(
  repositoryID: string,
  body: API.UpdateGitOpsRepositoryParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRepository>>(
    `/api/v1/gitops/repository/${pathParam(repositoryID)}`,
    {
      data: body,
      method: 'PUT',
      ...(options || {}),
    },
  )
}

export async function deleteGitOpsRepository(
  repositoryID: string,
  options?: { [key: string]: any },
) {
  return request<void>(
    `/api/v1/gitops/repository/${pathParam(repositoryID)}`,
    {
      method: 'DELETE',
      ...(options || {}),
    },
  )
}

export async function getGitOpsApplicationList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsApplication>>>(
    '/api/v1/gitops/application',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function getGitOpsApplicationDetail(
  applicationID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsApplication>>(
    `/api/v1/gitops/application/${pathParam(applicationID)}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

export async function createGitOpsApplication(
  body: API.CreateGitOpsApplicationParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsApplication>>(
    '/api/v1/gitops/application',
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function updateGitOpsApplication(
  applicationID: string,
  body: API.UpdateGitOpsApplicationParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsApplication>>(
    `/api/v1/gitops/application/${pathParam(applicationID)}`,
    {
      data: body,
      method: 'PUT',
      ...(options || {}),
    },
  )
}

export async function deleteGitOpsApplication(
  applicationID: string,
  options?: { [key: string]: any },
) {
  return request<void>(
    `/api/v1/gitops/application/${pathParam(applicationID)}`,
    {
      method: 'DELETE',
      ...(options || {}),
    },
  )
}

export async function getGitOpsEnvironmentList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsEnvironment>>>(
    '/api/v1/gitops/environment',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function createGitOpsEnvironment(
  body: API.CreateGitOpsEnvironmentParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsEnvironment>>(
    '/api/v1/gitops/environment',
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function updateGitOpsEnvironment(
  environmentID: string,
  body: API.UpdateGitOpsEnvironmentParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsEnvironment>>(
    `/api/v1/gitops/environment/${pathParam(environmentID)}`,
    {
      data: body,
      method: 'PUT',
      ...(options || {}),
    },
  )
}

export async function deleteGitOpsEnvironment(
  environmentID: string,
  options?: { [key: string]: any },
) {
  return request<void>(
    `/api/v1/gitops/environment/${pathParam(environmentID)}`,
    {
      method: 'DELETE',
      ...(options || {}),
    },
  )
}

export async function getGitOpsReleaseList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsRelease>>>(
    '/api/v1/gitops/release',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function getGitOpsReleaseDetail(
  releaseID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    `/api/v1/gitops/release/${pathParam(releaseID)}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  )
}

export async function createGitOpsRelease(
  body: API.CreateGitOpsReleaseParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    '/api/v1/gitops/release',
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function submitGitOpsRelease(
  releaseID: string,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    `/api/v1/gitops/release/${pathParam(releaseID)}/submit`,
    {
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function approveGitOpsRelease(
  releaseID: string,
  body: API.GitOpsReleaseActionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    `/api/v1/gitops/release/${pathParam(releaseID)}/approve`,
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function rejectGitOpsRelease(
  releaseID: string,
  body: API.GitOpsReleaseActionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    `/api/v1/gitops/release/${pathParam(releaseID)}/reject`,
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function rollbackGitOpsRelease(
  releaseID: string,
  body: API.GitOpsRollbackReleaseParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsRelease>>(
    `/api/v1/gitops/release/${pathParam(releaseID)}/rollback`,
    {
      data: body,
      method: 'POST',
      ...(options || {}),
    },
  )
}

export async function getGitOpsSyncList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsSyncRecord>>>(
    '/api/v1/gitops/sync',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function getGitOpsPolicyReportList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsPolicyReport>>>(
    '/api/v1/gitops/policy-report',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}

export async function getGitOpsAuditList(
  params?: API.GitOpsListParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.GitOpsListData<API.GitOpsAudit>>>(
    '/api/v1/gitops/audit',
    {
      method: 'GET',
      params: toListParams(params),
      ...(options || {}),
    },
  )
}
