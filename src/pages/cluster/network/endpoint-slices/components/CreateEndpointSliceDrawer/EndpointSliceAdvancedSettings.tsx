import {
  CollapsibleField,
  ResourceFormSection,
  ResourceMetadataFields,
} from '@/components';

const EndpointSliceAdvancedSettings = () => (
  <ResourceFormSection
    description="关联服务标签会根据基本信息自动输出，这里可补充额外标签和注解。"
    title="元数据"
  >
    <CollapsibleField
      description="为 EndpointSlice 资源添加自定义标签和注解。"
      title="添加元数据"
    >
      <ResourceMetadataFields />
    </CollapsibleField>
  </ResourceFormSection>
);

export default EndpointSliceAdvancedSettings;
