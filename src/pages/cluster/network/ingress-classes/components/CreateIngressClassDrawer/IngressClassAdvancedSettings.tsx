import {
  CollapsibleField,
  ResourceFormSection,
  ResourceMetadataFields,
} from '@/components';

const IngressClassAdvancedSettings = () => (
  <ResourceFormSection title="元数据">
    <CollapsibleField
      description="为 IngressClass 资源添加标签和注解。"
      title="添加元数据"
    >
      <ResourceMetadataFields />
    </CollapsibleField>
  </ResourceFormSection>
);

export default IngressClassAdvancedSettings;
