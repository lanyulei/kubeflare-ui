/**
 * 这个文件作为组件的目录
 * 目的是统一管理对外输出的组件，方便分类
 */
/**
 * 布局组件
 */

import {
  EventDetailDrawer,
  EventTypeBadge,
  EventTypeTag,
  useClusterEventWatch,
} from './ClusterEventCenter';
import ClusterEventTable from './ClusterEventTable';
import ClusterMetadata from './ClusterMetadata';
import ClusterPodList from './ClusterPodList';
import ClusterTableSearch from './ClusterTableSearch';
import ComputeQuotaFields from './ComputeQuotaFields';
import Footer from './Footer';
import KeyValueEditor from './KeyValueEditor';
import KeyValueList from './KeyValueList';
import KubernetesCompatibilityNotice from './KubernetesCompatibilityNotice';
import ReplicaSummary from './ReplicaSummary';
import { ClusterSwitch, Question, SelectLang } from './RightContent';
import { AvatarDropdown, AvatarName } from './RightContent/AvatarDropdown';
import SectionTitle from './SectionTitle';
import SegmentedTabs from './SegmentedTabs';
import SelectValueEditor from './SelectValueEditor';
import SettingsNavDrawer from './SettingsNavDrawer';
import TaintEditor from './TaintEditor';
import UnitInputNumber from './UnitInputNumber';
import YamlEditor from './YamlEditor';

export type { WatchStatus } from './ClusterEventCenter';
export type { SettingsNavDrawerSection } from './SettingsNavDrawer';
export {
  AvatarDropdown,
  AvatarName,
  ClusterEventTable,
  ClusterMetadata,
  ClusterPodList,
  ClusterSwitch,
  ClusterTableSearch,
  ComputeQuotaFields,
  EventDetailDrawer,
  EventTypeBadge,
  EventTypeTag,
  Footer,
  KeyValueEditor,
  KeyValueList,
  KubernetesCompatibilityNotice,
  Question,
  ReplicaSummary,
  SectionTitle,
  SegmentedTabs,
  SelectLang,
  SelectValueEditor,
  SettingsNavDrawer,
  TaintEditor,
  UnitInputNumber,
  useClusterEventWatch,
  YamlEditor,
};
