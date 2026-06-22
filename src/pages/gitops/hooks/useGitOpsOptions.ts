import { useEffect, useMemo, useState } from 'react';
import {
  getGitOpsApplicationList,
  getGitOpsEnvironmentList,
  getGitOpsProviderList,
  getGitOpsRepositoryList,
} from '@/services/kubeflare/gitops';

type SelectOption = {
  label: string;
  value: string;
};

const GITOPS_OPTIONS_CHANGE_EVENT = 'kubeflare:gitopsOptionsChange';

let cachedProviders: API.GitOpsProvider[] | undefined;
let cachedRepositories: API.GitOpsRepository[] | undefined;
let cachedApplications: API.GitOpsApplication[] | undefined;
let cachedEnvironments: API.GitOpsEnvironment[] | undefined;

const loadProviders = async () => {
  if (!cachedProviders) {
    cachedProviders = (
      await getGitOpsProviderList({ pageSize: 100 }, { skipErrorHandler: true })
    ).data.items;
  }
  return cachedProviders || [];
};

const loadRepositories = async () => {
  if (!cachedRepositories) {
    cachedRepositories = (
      await getGitOpsRepositoryList(
        { pageSize: 100 },
        { skipErrorHandler: true },
      )
    ).data.items;
  }
  return cachedRepositories || [];
};

const loadApplications = async () => {
  if (!cachedApplications) {
    cachedApplications = (
      await getGitOpsApplicationList(
        { pageSize: 100 },
        { skipErrorHandler: true },
      )
    ).data.items;
  }
  return cachedApplications || [];
};

const loadEnvironments = async () => {
  if (!cachedEnvironments) {
    cachedEnvironments = (
      await getGitOpsEnvironmentList(
        { pageSize: 100 },
        { skipErrorHandler: true },
      )
    ).data.items;
  }
  return cachedEnvironments || [];
};

export const invalidateGitOpsOptions = () => {
  cachedProviders = undefined;
  cachedRepositories = undefined;
  cachedApplications = undefined;
  cachedEnvironments = undefined;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(GITOPS_OPTIONS_CHANGE_EVENT));
  }
};

const useOptions = <T>(
  loader: () => Promise<T[]>,
  mapper: (item: T) => SelectOption,
) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const reload = () => {
      setLoading(true);
      loader()
        .then((nextItems) => {
          if (mounted) {
            setItems(nextItems);
          }
        })
        .catch(() => {
          if (mounted) {
            setItems([]);
          }
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
    };

    reload();
    window.addEventListener(GITOPS_OPTIONS_CHANGE_EVENT, reload);

    return () => {
      mounted = false;
      window.removeEventListener(GITOPS_OPTIONS_CHANGE_EVENT, reload);
    };
  }, [loader]);

  const options = useMemo(() => items.map(mapper), [items, mapper]);

  return {
    items,
    loading,
    options,
  };
};

export const useGitOpsProviderOptions = () =>
  useOptions(loadProviders, (provider) => ({
    label: `${provider.name} (${provider.base_url})`,
    value: provider.id,
  }));

export const useGitOpsRepositoryOptions = () =>
  useOptions(loadRepositories, (repository) => ({
    label: `${repository.name} / ${repository.default_ref}`,
    value: repository.id,
  }));

export const useGitOpsApplicationOptions = () =>
  useOptions(loadApplications, (application) => ({
    label: application.display_name || application.name,
    value: application.id,
  }));

export const useGitOpsEnvironmentOptions = () =>
  useOptions(loadEnvironments, (environment) => ({
    label: `${environment.name} / ${environment.tier}`,
    value: environment.id,
  }));
