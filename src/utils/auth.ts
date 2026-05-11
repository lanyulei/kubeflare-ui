const CSRF_TOKEN_COOKIE = 'kubeflare_csrf_token';

// Auth state lives exclusively in HttpOnly cookies issued by the backend on
// /auth/login and /auth/refresh. Keeping the access token out of JavaScript
// reach eliminates the most common XSS escalation path (token theft from
// localStorage). The CSRF double-submit token remains readable so we can
// echo it back in the X-Kubeflare-CSRF header.
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

// setAuthSession / clearAuthSession are kept as no-ops so call sites in
// app.tsx, AvatarDropdown, login page, and the request interceptor stay
// untouched. The browser cookie jar is now the single source of truth.
export const setAuthSession = (_session: API.AuthSession) => {
  void _session;
};

export const clearAuthSession = () => {
  // Best-effort: also wipe any legacy keys an older build of the app may
  // have left in localStorage so a returning user does not carry stale
  // tokens around.
  try {
    localStorage.removeItem('kubeflare_access_token');
    localStorage.removeItem('kubeflare_refresh_token');
  } catch (_error) {
    /* ignore: storage may be disabled in private mode */
  }
};

export const clearAccessToken = clearAuthSession;
