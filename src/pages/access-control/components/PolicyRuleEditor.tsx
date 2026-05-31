import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Row, Select, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { RBAC_VERB_OPTIONS } from '../constants';

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  ruleCard: {
    borderColor: token.colorBorderSecondary,

    '.ant-card-head': {
      minHeight: 44,
      paddingInline: token.paddingMD,
      background: token.colorFillQuaternary,
    },

    '.ant-card-body': {
      padding: token.paddingMD,
    },
  },
  ruleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  ruleTitle: {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
}));

const RULE_MODE_OPTIONS = [
  { label: '资源权限', value: 'resource' },
  { label: '非资源 URL', value: 'nonResource' },
];

const API_GROUP_OPTIONS = [
  { label: 'core', value: '' },
  { label: '*', value: '*' },
  { label: 'apps', value: 'apps' },
  { label: 'batch', value: 'batch' },
  { label: 'networking.k8s.io', value: 'networking.k8s.io' },
  { label: 'rbac.authorization.k8s.io', value: 'rbac.authorization.k8s.io' },
  { label: 'storage.k8s.io', value: 'storage.k8s.io' },
  { label: 'apiextensions.k8s.io', value: 'apiextensions.k8s.io' },
  { label: 'autoscaling', value: 'autoscaling' },
  { label: 'policy', value: 'policy' },
  { label: 'coordination.k8s.io', value: 'coordination.k8s.io' },
  { label: 'discovery.k8s.io', value: 'discovery.k8s.io' },
  { label: 'events.k8s.io', value: 'events.k8s.io' },
];

const RESOURCE_OPTIONS = [
  '*',
  'pods',
  'pods/log',
  'pods/exec',
  'services',
  'endpoints',
  'configmaps',
  'secrets',
  'serviceaccounts',
  'persistentvolumeclaims',
  'deployments',
  'statefulsets',
  'daemonsets',
  'replicasets',
  'jobs',
  'cronjobs',
  'ingresses',
  'roles',
  'rolebindings',
  'clusterroles',
  'clusterrolebindings',
  'nodes',
  'namespaces',
  'persistentvolumes',
  'storageclasses',
  'customresourcedefinitions',
].map((value) => ({ label: value, value }));

const NON_RESOURCE_URL_OPTIONS = [
  '*',
  '/api',
  '/api/*',
  '/apis',
  '/apis/*',
  '/healthz',
  '/healthz/*',
  '/livez',
  '/livez/*',
  '/readyz',
  '/readyz/*',
  '/metrics',
  '/version',
].map((value) => ({ label: value, value }));

const createRule = () => ({
  mode: 'resource',
  apiGroups: [''],
  resources: [],
  verbs: ['get', 'list', 'watch'],
  resourceNames: [],
  nonResourceURLs: [],
});

type PolicyRuleEditorProps = {
  name?: string;
  clusterScoped?: boolean;
};

const PolicyRuleEditor = ({
  name = 'rules',
  clusterScoped = false,
}: PolicyRuleEditorProps) => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();

  return (
    <Form.List name={name} initialValue={[createRule()]}>
      {(fields, { add, remove }) => (
        <div className={styles.editor}>
          {fields.map((field, index) => (
            <Card
              className={styles.ruleCard}
              key={field.key}
              size="small"
              title={
                <div className={styles.ruleHeader}>
                  <span className={styles.ruleTitle}>权限规则 {index + 1}</span>
                  <Button
                    aria-label="删除权限规则"
                    disabled={fields.length <= 1}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              }
            >
              <Form.Item
                name={[field.name, 'mode']}
                rules={[{ required: true, message: '请选择规则类型' }]}
              >
                <Select
                  options={RULE_MODE_OPTIONS}
                  onChange={(nextMode) => {
                    if (nextMode === 'nonResource') {
                      form.setFieldValue([name, field.name, 'apiGroups'], []);
                      form.setFieldValue([name, field.name, 'resources'], []);
                      form.setFieldValue(
                        [name, field.name, 'resourceNames'],
                        [],
                      );
                      return;
                    }
                    form.setFieldValue([name, field.name, 'apiGroups'], ['']);
                    form.setFieldValue(
                      [name, field.name, 'nonResourceURLs'],
                      [],
                    );
                  }}
                />
              </Form.Item>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const mode = getFieldValue([name, field.name, 'mode']);

                  if (mode === 'nonResource') {
                    return (
                      <>
                        {!clusterScoped && (
                          <Typography.Paragraph type="secondary">
                            非资源 URL 权限仅适用于 ClusterRole。
                          </Typography.Paragraph>
                        )}
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="非资源 URL"
                              name={[field.name, 'nonResourceURLs']}
                              rules={[
                                { required: true, message: '请输入非资源 URL' },
                              ]}
                            >
                              <Select
                                mode="tags"
                                options={NON_RESOURCE_URL_OPTIONS}
                                placeholder="/healthz 或 /api/*"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="动作"
                              name={[field.name, 'verbs']}
                              rules={[
                                { required: true, message: '请选择动作' },
                              ]}
                            >
                              <Select
                                mode="tags"
                                options={RBAC_VERB_OPTIONS}
                                placeholder="请选择动作"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </>
                    );
                  }

                  return (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="API 组"
                            name={[field.name, 'apiGroups']}
                            rules={[
                              { required: true, message: '请选择 API 组' },
                            ]}
                          >
                            <Select
                              mode="tags"
                              options={API_GROUP_OPTIONS}
                              placeholder="core、apps 或 *"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="资源"
                            name={[field.name, 'resources']}
                            rules={[{ required: true, message: '请选择资源' }]}
                          >
                            <Select
                              mode="tags"
                              options={RESOURCE_OPTIONS}
                              placeholder="pods、deployments 或 *"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="动作"
                            name={[field.name, 'verbs']}
                            rules={[{ required: true, message: '请选择动作' }]}
                          >
                            <Select
                              mode="tags"
                              options={RBAC_VERB_OPTIONS}
                              placeholder="请选择动作"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            tooltip="留空表示匹配该资源类型下的所有对象"
                            label="资源名限制"
                            name={[field.name, 'resourceNames']}
                          >
                            <Select mode="tags" placeholder="可选" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  );
                }}
              </Form.Item>
            </Card>
          ))}
          <div className={styles.footer}>
            <Button icon={<PlusOutlined />} onClick={() => add(createRule())}>
              添加权限规则
            </Button>
          </div>
        </div>
      )}
    </Form.List>
  );
};

export { createRule };
export default PolicyRuleEditor;
