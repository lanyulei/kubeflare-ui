import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { cronScheduleOptions, NAME_PATTERN } from './helpers';

const useStyles = createStyles(({ token }) => ({
  basicFields: {
    width: '100%',

    '.ant-form-item': {
      marginBottom: token.marginLG,
    },

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  advancedToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: token.marginLG,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: token.colorPrimary,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  numberInput: {
    width: '100%',
  },
}));

type CronJobBasicSettingsProps = {
  namespaceOptions: { label: string; value: string }[];
};

const concurrencyPolicyOptions = [
  { label: '允许并发运行', value: 'Allow' },
  { label: '跳过新任务', value: 'Forbid' },
  { label: '替换旧任务', value: 'Replace' },
];

const CronJobBasicSettings = ({
  namespaceOptions,
}: CronJobBasicSettingsProps) => {
  const { styles } = useStyles();
  const [advancedOpen, setAdvancedOpen] = useState(true);

  return (
    <div className={styles.basicFields}>
      <Row gutter={18}>
        <Col span={12}>
          <Form.Item
            extra="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 63, message: '名称最长 63 个字符' },
              {
                pattern: NAME_PATTERN,
                message:
                  '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
              },
            ]}
          >
            <Input placeholder="请输入名称" autoFocus />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra="项目用于对资源进行分组管理和控制不同用户的资源管理权限。"
            label="项目"
            name="namespace"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select
              optionFilterProp="label"
              options={namespaceOptions}
              placeholder="请选择项目"
              showSearch
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            extra="为定时任务设置定时计划。KubeSphere 默认使用 UTC 时间，您需要根据时区调整定时计划。"
            label="定时计划"
            name="schedule"
            rules={[{ required: true, message: '请选择或输入定时计划' }]}
          >
            <Select
              optionFilterProp="label"
              options={cronScheduleOptions}
              placeholder="请选择定时计划"
              showSearch
            />
          </Form.Item>
        </Col>
      </Row>

      <button
        className={styles.advancedToggle}
        type="button"
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        <span>高级设置</span>
        {advancedOpen ? <UpOutlined /> : <DownOutlined />}
      </button>

      {advancedOpen && (
        <Row gutter={18}>
          <Col span={12}>
            <Form.Item
              extra="由于某种原因未能按计划启动任务时，任务启动的最大延迟时间。"
              label="最大启动延后时间（s）"
              name="startingDeadlineSeconds"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入最大启动延后时间"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              extra="允许保留的成功任务的个数。默认值为 3。"
              label="成功任务保留数量"
              name="successfulJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入成功任务保留数量"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              extra="允许保留的失败任务的个数。默认值为 1。"
              label="失败任务保留数量"
              name="failedJobsHistoryLimit"
            >
              <InputNumber
                className={styles.numberInput}
                controls={false}
                min={0}
                placeholder="请输入失败任务保留数量"
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              extra="定时任务创建的多个任务发生重叠时，系统采取的策略。"
              label="并发策略"
              name="concurrencyPolicy"
            >
              <Select
                options={concurrencyPolicyOptions}
                placeholder="请选择并发策略"
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CronJobBasicSettings;
