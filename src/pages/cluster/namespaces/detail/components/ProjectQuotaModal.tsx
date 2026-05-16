import {
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Button,
  Form,
  InputNumber,
  Modal,
  Select,
  Slider,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { ComputeQuotaFields, SelectValueEditor } from '@/components';
import type { SelectValueEditorItem } from '@/components/SelectValueEditor';
import {
  APP_QUOTA_OPTION_VALUES,
  APP_QUOTA_OPTIONS,
  type ProjectQuotaFormValues,
  type StorageClassQuotaRow,
} from './helpers';
import useStyles from './styles';

type ProjectQuotaModalProps = {
  activeStorageClassName?: string;
  appQuotaRows: SelectValueEditorItem[];
  form: FormInstance<ProjectQuotaFormValues>;
  open: boolean;
  saving: boolean;
  storageClassLoading: boolean;
  storageClassQuotaRows: StorageClassQuotaRow[];
  storageClasses: API.ClusterStorageClassItem[];
  onAddAppQuotaBlocked: () => void;
  onCancel: () => void;
  onChangeAppQuotaRows: (rows: SelectValueEditorItem[]) => void;
  onCreateAppQuotaRow: (keyName?: string) => SelectValueEditorItem;
  onDeleteStorageClassQuota: (storageClassName?: string) => void;
  onOk: () => void;
  onSelectStorageClassQuota: (storageClassName: string) => void;
  onSetActiveStorageClassName: (storageClassName?: string) => void;
  onUpdateStorageClassQuotaRow: (
    storageClassName: string,
    field: keyof Omit<StorageClassQuotaRow, 'id' | 'storageClassName'>,
    value?: number | null,
  ) => void;
};

const ProjectQuotaModal = ({
  activeStorageClassName,
  appQuotaRows,
  form,
  open,
  saving,
  storageClassLoading,
  storageClassQuotaRows,
  storageClasses,
  onAddAppQuotaBlocked,
  onCancel,
  onChangeAppQuotaRows,
  onCreateAppQuotaRow,
  onDeleteStorageClassQuota,
  onOk,
  onSelectStorageClassQuota,
  onSetActiveStorageClassName,
  onUpdateStorageClassQuotaRow,
}: ProjectQuotaModalProps) => {
  const { styles } = useStyles();
  const activeStorageClassQuotaRow = storageClassQuotaRows.find(
    (row) => row.storageClassName === activeStorageClassName,
  );
  const storageClassOptions = storageClasses.map((item) => ({
    label: item.name,
    value: item.name,
    disabled:
      item.name !== activeStorageClassName &&
      storageClassQuotaRows.some((row) => row.storageClassName === item.name),
  }));

  const renderStorageQuotaFields = (
    storageRequestName: keyof ProjectQuotaFormValues,
    storageLimitName: keyof ProjectQuotaFormValues,
    persistentVolumeClaimsName: keyof ProjectQuotaFormValues,
  ) => (
    <div className={styles.storageQuotaTotalBlock}>
      <div className={styles.storageQuotaFields}>
        <Form.Item
          label="持久卷声明容量(Gi)"
          name={storageRequestName}
          className={styles.storageQuotaSlider}
        >
          <Slider
            marks={{
              0: '无预留',
              512: '512',
              1024: '1024',
              1536: '1536',
              2048: '无上限',
            }}
            max={2048}
            min={0}
            step={1}
          />
        </Form.Item>
        <div className={styles.storageQuotaGrid}>
          <Form.Item
            label="资源上限"
            name={storageLimitName}
            className={styles.storageQuotaGridItem}
          >
            <InputNumber
              min={0}
              placeholder="无上限"
              precision={0}
              suffix="Gi"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            label="持久卷声明总量"
            name={persistentVolumeClaimsName}
            className={styles.storageQuotaGridItem}
          >
            <InputNumber
              min={0}
              placeholder="无上限"
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>
      </div>
    </div>
  );

  const renderStorageClassQuotaFields = () => (
    <div className={styles.storageQuotaFields}>
      <Form.Item
        label="持久卷声明容量(Gi)"
        className={styles.storageQuotaSlider}
      >
        <Slider
          marks={{
            0: '无预留',
            512: '512',
            1024: '1024',
            1536: '1536',
            2048: '无上限',
          }}
          max={2048}
          min={0}
          step={1}
          value={activeStorageClassQuotaRow?.requestsStorage || 0}
          onChange={(value) =>
            activeStorageClassName &&
            onUpdateStorageClassQuotaRow(
              activeStorageClassName,
              'requestsStorage',
              value,
            )
          }
        />
      </Form.Item>
      <div className={styles.storageQuotaGrid}>
        <Form.Item label="资源上限" className={styles.storageQuotaGridItem}>
          <InputNumber
            min={0}
            placeholder="无上限"
            precision={0}
            suffix="Gi"
            style={{ width: '100%' }}
            value={activeStorageClassQuotaRow?.limitsStorage}
            onChange={(value) =>
              activeStorageClassName &&
              onUpdateStorageClassQuotaRow(
                activeStorageClassName,
                'limitsStorage',
                value,
              )
            }
          />
        </Form.Item>
        <Form.Item
          label="持久卷声明总量"
          className={styles.storageQuotaGridItem}
        >
          <InputNumber
            min={0}
            placeholder="无上限"
            precision={0}
            style={{ width: '100%' }}
            value={activeStorageClassQuotaRow?.persistentVolumeClaims}
            onChange={(value) =>
              activeStorageClassName &&
              onUpdateStorageClassQuotaRow(
                activeStorageClassName,
                'persistentVolumeClaims',
                value,
              )
            }
          />
        </Form.Item>
      </div>
    </div>
  );

  return (
    <Modal
      destroyOnHidden
      confirmLoading={saving}
      open={open}
      title="编辑配额"
      width={920}
      okText="保存"
      cancelText="取消"
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form<ProjectQuotaFormValues>
        className={styles.quotaForm}
        form={form}
        layout="vertical"
      >
        <div className={styles.quotaFormSectionTitle}>可用配额</div>
        <ComputeQuotaFields
          cpuFields={[
            {
              label: 'CPU 预留',
              name: 'cpuRequest',
              placeholder: '无预留',
            },
            {
              label: 'CPU 限制',
              name: 'cpuLimit',
              placeholder: '无上限',
            },
          ]}
          memoryFields={[
            {
              label: '内存预留',
              name: 'memoryRequest',
              placeholder: '无预留',
            },
            {
              label: '内存上限',
              name: 'memoryLimit',
              placeholder: '无上限',
            },
          ]}
          memoryUnit="Gi"
        />
        <div className={styles.quotaFormSectionTitle}>存储资源配额</div>
        <div className={styles.storageQuotaCard}>
          <Tabs
            className={styles.storageQuotaTabs}
            items={[
              {
                key: 'storage-total',
                label: '存储资源总量',
                children: renderStorageQuotaFields(
                  'storageRequest',
                  'storageLimit',
                  'storagePersistentVolumeClaims',
                ),
              },
              {
                key: 'storage-class',
                label: '存储类关联资源',
                children: (
                  <>
                    {storageClassQuotaRows.length > 0 && (
                      <div className={styles.storageClassList}>
                        {storageClassQuotaRows.map((row) => {
                          const storageClass = storageClasses.find(
                            (item) => item.name === row.storageClassName,
                          );

                          return (
                            <div
                              className={styles.storageClassQuotaItem}
                              key={row.id}
                            >
                              <DatabaseOutlined
                                className={styles.storageClassIcon}
                              />
                              <div className={styles.storageClassMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {row.storageClassName}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  名称
                                </div>
                              </div>
                              <div className={styles.storageClassMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {row.persistentVolumeClaimsUsed || 0}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  已关联的持久卷声明数量
                                </div>
                              </div>
                              <div className={styles.storageClassMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {storageClass?.provisioner || '-'}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  供应者
                                </div>
                              </div>
                              <div className={styles.storageClassActions}>
                                <Tooltip title="删除">
                                  <Button
                                    aria-label="删除存储类关联资源"
                                    icon={<DeleteOutlined />}
                                    type="text"
                                    onClick={() =>
                                      onDeleteStorageClassQuota(
                                        row.storageClassName,
                                      )
                                    }
                                  />
                                </Tooltip>
                                <Tooltip title="编辑">
                                  <Button
                                    aria-label="编辑存储类关联资源"
                                    icon={<EditOutlined />}
                                    type="text"
                                    onClick={() =>
                                      onSetActiveStorageClassName(
                                        row.storageClassName,
                                      )
                                    }
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className={styles.storageClassSelectBox}>
                      <div className={styles.storageClassSelectHeader}>
                        <DatabaseOutlined className={styles.storageClassIcon} />
                        <div>
                          <Typography.Text strong>选择存储类</Typography.Text>
                          <div className={styles.quotaMetricLabel}>
                            设置与存储类关联的持久卷声明配额。
                          </div>
                        </div>
                      </div>
                      <Select
                        loading={storageClassLoading}
                        options={storageClassOptions}
                        placeholder="请选择存储类"
                        showSearch
                        style={{ width: '100%' }}
                        value={activeStorageClassName}
                        onChange={onSelectStorageClassQuota}
                      />
                      {activeStorageClassName && (
                        <div className={styles.storageClassFields}>
                          {renderStorageClassQuotaFields()}
                        </div>
                      )}
                    </div>
                  </>
                ),
              },
            ]}
          />
        </div>
        <div className={styles.quotaFormSectionTitle}>应用资源配额</div>
        <SelectValueEditor
          value={appQuotaRows}
          deleteAriaLabel="删除应用资源配额"
          keyPlaceholder="请选择资源类型"
          options={APP_QUOTA_OPTIONS.map((option) => ({
            label: option.label,
            value: option.name,
          }))}
          valuePlaceholder="无上限"
          onAddBlocked={onAddAppQuotaBlocked}
          onChange={onChangeAppQuotaRows}
          onCreateItem={() =>
            onCreateAppQuotaRow(
              APP_QUOTA_OPTION_VALUES.find(
                (option) => !appQuotaRows.some((row) => row.keyName === option),
              ),
            )
          }
        />
      </Form>
    </Modal>
  );
};

export default ProjectQuotaModal;
