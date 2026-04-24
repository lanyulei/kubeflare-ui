import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { getRequestInstance, history } from '@umijs/max';
import { message } from 'antd';
import {
  clearAuthSession,
  getAccessToken,
  getCsrfToken,
  setAuthSession,
} from '@/utils/auth';

type ApiErrorPayload = {
  code?: number;
  message?: string;
  request_id?: string;
};

const loginPath = '/user/login';
const successCode = 20000;
const refreshPath = '/api/v1/auth/refresh';
let refreshTask: Promise<API.AuthSession> | undefined;

const createBizError = (payload?: Partial<API.ApiResponse<unknown>>) => {
  const error: Error & { info?: ApiErrorPayload } = new Error(
    payload?.message || '请求失败',
  );
  error.name = 'BizError';
  error.info = {
    code: payload?.code,
    message: payload?.message,
    request_id: payload?.request_id,
  };
  return error;
};

const isApiResponse = (data: unknown): data is API.ApiResponse<unknown> => {
  return Boolean(
    data && typeof (data as API.ApiResponse<unknown>).code === 'number',
  );
};

const isAuthRequest = (url?: string) => {
  if (!url) {
    return false;
  }

  return ['/api/v1/auth/login', refreshPath].some((path) => url.includes(path));
};

const redirectToLogin = () => {
  if (history.location.pathname === loginPath) {
    return;
  }

  const redirect = `${history.location.pathname}${history.location.search || ''}`;
  history.replace({
    pathname: loginPath,
    search: redirect ? `redirect=${encodeURIComponent(redirect)}` : '',
  });
};

const refreshSession = async () => {
  if (!refreshTask) {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {};

    if (csrfToken) {
      headers['X-Kubeflare-CSRF'] = csrfToken;
    }

    const refreshConfig = {
      url: refreshPath,
      method: 'POST',
      withCredentials: true,
      skipAuthRefresh: true,
      skipAuthorization: true,
      headers,
    } as RequestOptions;

    refreshTask = getRequestInstance()
      .request<API.ApiResponse<API.AuthSession>>(refreshConfig)
      .then((response) => {
        const payload = response.data;

        if (
          !isApiResponse(payload) ||
          payload.code !== successCode ||
          !payload.data
        ) {
          throw createBizError(payload as API.ApiResponse<unknown>);
        }

        setAuthSession(payload.data as API.AuthSession);
        return payload.data as API.AuthSession;
      })
      .finally(() => {
        refreshTask = undefined;
      });
  }

  return refreshTask;
};

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const payload = res as API.ApiResponse<unknown>;
      if (isApiResponse(payload) && payload.code !== successCode) {
        throw createBizError(payload);
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) {
        throw error;
      }

      if (error.name === 'BizError') {
        message.error(error.info?.message || error.message || '请求失败');
        return;
      }

      const status = error?.response?.status;
      if (status === 401) {
        clearAuthSession();
        redirectToLogin();
        message.error('登录状态已失效，请重新登录');
        return;
      }

      if (status === 403) {
        message.error(error?.response?.data?.message || '无权限执行当前操作');
        return;
      }

      if (status === 404) {
        message.error(error?.response?.data?.message || '请求的资源不存在');
        return;
      }

      if (status) {
        message.error(error?.response?.data?.message || `请求失败(${status})`);
        return;
      }

      if (error?.request) {
        message.error('服务暂时不可用，请稍后重试');
        return;
      }

      message.error(error?.message || '请求失败，请稍后重试');
    },
  },
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getAccessToken();
      const csrfToken = getCsrfToken();
      const method = (config.method || 'GET').toUpperCase();
      const headers = {
        ...(config.headers || {}),
      } as Record<string, string>;

      if (token && !config.skipAuthorization) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        headers['X-Kubeflare-CSRF'] = csrfToken;
      }

      return {
        ...config,
        withCredentials: true,
        headers,
      };
    },
  ],
  responseInterceptors: [
    [
      async (response) => {
        if (response.status === 204) {
          return response;
        }

        if (
          isApiResponse(response.data) &&
          response.data.code !== successCode
        ) {
          throw createBizError(response.data);
        }

        return response;
      },
      async (error: any) => {
        const status = error?.response?.status;
        const originalConfig = error?.config || error?.response?.config;

        if (
          status !== 401 ||
          !originalConfig ||
          originalConfig._kubeflareRetry ||
          originalConfig.skipAuthRefresh ||
          isAuthRequest(originalConfig.url)
        ) {
          return Promise.reject(error);
        }

        originalConfig._kubeflareRetry = true;

        try {
          await refreshSession();
          return getRequestInstance().request(originalConfig);
        } catch (refreshError) {
          clearAuthSession();
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      },
    ],
  ],
};
