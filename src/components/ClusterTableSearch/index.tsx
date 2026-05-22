import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import type { CSSProperties } from 'react';
import { useState } from 'react';

type ClusterTableSearchProps = {
  className?: string;
  clearTriggersSearch?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  onSearch: (value: string) => void;
};

const ClusterTableSearch = ({
  className,
  clearTriggersSearch,
  placeholder,
  style,
  onSearch,
}: ClusterTableSearchProps) => {
  const [keywordDraft, setKeywordDraft] = useState('');

  return (
    <Input
      allowClear
      className={className}
      placeholder={placeholder}
      suffix={<SearchOutlined />}
      style={style}
      value={keywordDraft}
      onChange={(event) => {
        const nextKeyword = event.target.value;
        setKeywordDraft(nextKeyword);

        if (clearTriggersSearch && !nextKeyword) {
          onSearch('');
        }
      }}
      onPressEnter={(event) => {
        onSearch(event.currentTarget.value.trim());
      }}
    />
  );
};

export default ClusterTableSearch;
