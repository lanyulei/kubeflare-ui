const ACCESS_TOKEN_KEY = 'kubeflare_access_token';
const REFRESH_TOKEN_KEY = 'kubeflare_refresh_token';
const CSRF_TOKEN_COOKIE = 'kubeflare_csrf_token';

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
};

export const setAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getCookie = (name: string) => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return '';
  }

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch (_error) {
    return '';
  }
};

export const getCsrfToken = () => {
  return getCookie(CSRF_TOKEN_COOKIE);
};

export const setAuthSession = (session: API.AuthSession) => {
  setAccessToken(session.access_token);
};

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAccessToken = clearAuthSession;
