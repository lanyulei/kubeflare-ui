export const getGitOpsErrorMessage = (
  error: unknown,
  fallback = '操作失败，请稍后重试',
) => {
  const apiError = error as {
    info?: { message?: string };
    message?: string;
    response?: { data?: { message?: string } };
  };
  return (
    apiError.info?.message ||
    apiError.response?.data?.message ||
    apiError.message ||
    fallback
  );
};

export const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

export const formatDateTimeText = (value?: string) =>
  value ? value.replace('T', ' ').replace(/\.\d+Z$/, '') : '-';

export const toGitOpsTableResult = <T>(data?: API.GitOpsListData<T>) => ({
  data: data?.items || [],
  success: true,
  total: data?.total || 0,
});
