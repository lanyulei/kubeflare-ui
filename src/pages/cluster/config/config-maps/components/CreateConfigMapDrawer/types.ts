type ConfigMapDataItem = {
  id?: string;
  keyName?: string;
  value?: string;
};

type CreateConfigMapFormValues = {
  dataItems?: ConfigMapDataItem[];
  name?: string;
  namespace?: string;
};

export type { ConfigMapDataItem, CreateConfigMapFormValues };
