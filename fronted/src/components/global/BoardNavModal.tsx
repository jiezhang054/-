import { useState } from 'react';
import { Modal, Input, List, Typography, Tabs, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { globalApi } from '../../api/global';

const { Search } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BoardNavModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['navigation', keyword],
    queryFn: () => globalApi.navigation(keyword || undefined),
    enabled: open,
  });

  const goBoard = (boardId: number, name: string) => {
    globalApi.recordVisit('board', boardId, name).catch(() => {});
    onClose();
    navigate(`/board/${boardId}`);
  };

  const goVisit = (type: string, targetId: number, name: string) => {
    onClose();
    if (type === 'board') navigate(`/board/${targetId}`);
    else if (type === 'project') navigate(`/projects/${targetId}`);
    else if (type === 'mindmap') navigate(`/mindmap/${targetId}`);
    else navigate('/workspace');
    globalApi.recordVisit(type, targetId, name).catch(() => {});
  };

  return (
    <Modal title="看板导航" open={open} onCancel={onClose} footer={null} width={560} destroyOnClose>
      <Search placeholder="搜索看板" allowClear onSearch={setKeyword} style={{ marginBottom: 16 }} />
      <Tabs
        items={[
          {
            key: 'tree',
            label: '全部看板',
            children: isLoading ? <div>加载中...</div> : (
              <List
                dataSource={data?.boardTree ?? []}
                locale={{ emptyText: <Empty description="暂无看板" /> }}
                renderItem={(proj) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Typography.Text strong>{proj.projectName}</Typography.Text>
                      <List
                        size="small"
                        dataSource={proj.boards}
                        renderItem={(b) => (
                          <List.Item style={{ cursor: 'pointer', paddingLeft: 16 }} onClick={() => goBoard(b.id, b.name)}>
                            {b.name} <Typography.Text type="secondary">({b.type})</Typography.Text>
                          </List.Item>
                        )}
                      />
                    </div>
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'recent',
            label: '最近访问',
            children: (
              <List
                dataSource={data?.recentVisits ?? []}
                locale={{ emptyText: <Empty description="暂无最近访问" /> }}
                renderItem={(v) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => goVisit(v.type, v.targetId, v.name)}>
                    {v.name}
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'archived',
            label: '已归档',
            children: (
              <>
                <Typography.Text type="secondary">已归档看板</Typography.Text>
                <List
                  size="small"
                  dataSource={data?.archivedBoards ?? []}
                  locale={{ emptyText: '无' }}
                  renderItem={(b) => <List.Item>{b.name} · {b.projectName}</List.Item>}
                />
                <Typography.Text type="secondary">已归档项目</Typography.Text>
                <List
                  size="small"
                  dataSource={data?.archivedProjects ?? []}
                  locale={{ emptyText: '无' }}
                  renderItem={(p) => <List.Item>{p.name}</List.Item>}
                />
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
