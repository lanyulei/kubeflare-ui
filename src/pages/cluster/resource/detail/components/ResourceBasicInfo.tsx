import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { ProDescriptions } from '@ant-design/pro-components';

type ResourceBasicInfoProps<T extends Record<string, unknown>> = {
  className?: string;
  column?: number;
  columns: ProDescriptionsItemProps<T>[];
  dataSource: T;
};

const ResourceBasicInfo = <T extends Record<string, unknown>>({
  className,
  column = 2,
  columns,
  dataSource,
}: ResourceBasicInfoProps<T>) => (
  <ProDescriptions<T>
    className={className}
    column={column}
    columns={columns}
    dataSource={dataSource}
  />
);

export type { ResourceBasicInfoProps };
export default ResourceBasicInfo;
