export const normalizeSimulatorParams = (
  values: API.RbacSimulatorParams,
): API.RbacSimulatorParams => {
  const params = { ...values };

  if (params.subjectKind === 'Self') {
    delete params.subjectName;
    delete params.subjectNamespace;
    delete params.groups;
  }

  if (params.nonResourceURL) {
    delete params.namespace;
    delete params.apiGroup;
    delete params.resource;
    delete params.subresource;
    delete params.resourceName;
  }

  return params;
};

export const getSimulatorSubjectQuery = (
  params: API.RbacSimulatorParams,
): API.RbacSubjectQuery | undefined => {
  if (params.subjectKind === 'Self' || !params.subjectName) {
    return undefined;
  }

  return {
    kind: params.subjectKind,
    name: params.subjectName,
    namespace: params.subjectNamespace,
    scopeNamespace: params.namespace,
  };
};

export const getSimulatorSubjectText = (query?: API.RbacSubjectQuery) => {
  if (!query) {
    return '当前用户';
  }

  return `${query.kind}:${query.namespace ? `${query.namespace}/` : ''}${query.name}`;
};
