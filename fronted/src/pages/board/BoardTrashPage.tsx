import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Space, message, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { boardsApi } from '../../api/boards';

const { Title } = Typography;

export function BoardTrashPage() {
  const { boardId } = useParams();
  const id = Number(boardId);
  const navigate = useNavigate();

  const { data: items = [], refetch, isLoading } = useQuery({
    queryKey: ['board-trash', id],
    queryFn: () => boardsApi.getTrash(id),
  });

  const handleRestore = async (cardId: number) => {
    try {
      await boardsApi.restoreTrashCard(id, cardId);
      message.success('已恢复');
      refetch();
    } catch {
      message.error('恢复失败');
    }
  };

  const handlePurge = async (cardId: number) => {
    try {
      await boardsApi.purgeTrashCard(id, cardId);
      message.success('已彻底删除');
      refetch();
    } catch {
      message.error('删除失败');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/board/${id}`)}>
        返回看板
      </Button>
      <Title level={4}>回收站</Title>
      <Table
        loading={isLoading}
        rowKey="id"
        dataSource={items}
        locale={{ emptyText: '回收站为空' }}
        columns={[
          { title: '卡片标题', dataIndex: 'title' },
          { title: '类型', dataIndex: 'type' },
          {
            title: '操作',
            render: (_, row) => (
              <Space>
                <Button type="link" onClick={() => handleRestore(row.id)}>恢复</Button>
                <Button type="link" danger onClick={() => handlePurge(row.id)}>彻底删除</Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
