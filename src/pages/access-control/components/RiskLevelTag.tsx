import { Tag, Tooltip } from 'antd';
import { RISK_LEVEL_TEXT } from '../constants';

const colorMap: Record<API.RbacRiskLevel, string> = {
  Critical: 'red',
  High: 'volcano',
  Medium: 'orange',
  Low: 'blue',
  Info: 'default',
};

type RiskLevelTagProps = {
  level?: API.RbacRiskLevel;
  reasons?: string[];
};

const RiskLevelTag = ({ level = 'Info', reasons }: RiskLevelTagProps) => {
  const tag = <Tag color={colorMap[level]}>{RISK_LEVEL_TEXT[level]}</Tag>;

  if (!reasons?.length) {
    return tag;
  }

  return <Tooltip title={reasons.join('；')}>{tag}</Tooltip>;
};

export default RiskLevelTag;
