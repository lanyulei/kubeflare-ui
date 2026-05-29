import type { FormInstance } from 'antd';
import { Col, Form, Row, Select, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getClusterWorkloadList } from '@/services/kubeflare/cluster/workload';
import type { WorkloadTargetKind } from './helpers';

type WorkloadTargetSelectorProps = {
  form: FormInstance<any>;
  namespaceOptions: { label: string; value: string }[];
  showNamespace?: boolean;
  targetKinds: WorkloadTargetKind[];
  onTargetChange?: (workload?: API.ClusterWorkloadItem) => void;
};

const workloadKindLabels: Record<WorkloadTargetKind, string> = {
  Deployment: '部署',
  StatefulSet: '有状态副本集',
  DaemonSet: '守护进程集',
};

const WorkloadTargetSelector = ({
  form,
  namespaceOptions,
  showNamespace = false,
  targetKinds,
  onTargetChange,
}: WorkloadTargetSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [workloads, setWorkloads] = useState<API.ClusterWorkloadItem[]>([]);
  const namespace = Form.useWatch('namespace', form) as string | undefined;
  const targetKind = Form.useWatch('targetKind', form) as
    | WorkloadTargetKind
    | undefined;
  const targetName = Form.useWatch('targetName', form) as string | undefined;

  const workloadOptions = useMemo(
    () =>
      workloads.map((item) => ({
        label: item.name,
        value: item.name,
      })),
    [workloads],
  );

  const fetchWorkloads = useCallback(async () => {
    if (!namespace || !targetKind) {
      setWorkloads([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterWorkloadList({
        namespace,
        type: targetKind,
      });
      setWorkloads(res.data.items || []);
    } finally {
      setLoading(false);
    }
  }, [namespace, targetKind]);

  useEffect(() => {
    void fetchWorkloads();
  }, [fetchWorkloads]);

  useEffect(() => {
    onTargetChange?.(
      workloads.find(
        (item) => item.name === targetName && item.type === targetKind,
      ),
    );
  }, [onTargetChange, targetKind, targetName, workloads]);

  return (
    <>
      {showNamespace && (
        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[{ required: true, message: '请选择命名空间' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={namespaceOptions}
            placeholder="请选择命名空间"
            onChange={() => {
              form.setFieldValue('targetName', undefined);
            }}
          />
        </Form.Item>
      )}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="目标类型"
            name="targetKind"
            rules={[{ required: true, message: '请选择目标类型' }]}
          >
            <Select
              options={targetKinds.map((kind) => ({
                label: workloadKindLabels[kind],
                value: kind,
              }))}
              placeholder="请选择目标类型"
              onChange={() => {
                form.setFieldValue('targetName', undefined);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="目标工作负载"
            name="targetName"
            rules={[{ required: true, message: '请选择目标工作负载' }]}
          >
            <Select
              showSearch
              notFoundContent={loading ? <Spin size="small" /> : undefined}
              optionFilterProp="label"
              options={workloadOptions}
              placeholder="请选择工作负载"
              disabled={!namespace || !targetKind}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default WorkloadTargetSelector;
