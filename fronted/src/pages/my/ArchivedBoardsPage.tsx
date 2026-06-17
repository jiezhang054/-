import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, message, Modal } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myApi } from '../../api/my';

export function ArchivedBoardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['archived-boards'],
    queryFn: myApi.listArchivedBoards,
  });

  const restoreMutation = useMutation({
    mutationFn: myApi.restoreBoard,
    onSuccess: () => { message.success('看板已恢复'); queryClient.invalidateQueries({ queryKey: ['archived-boards'] }); queryClient.invalidateQueries({ queryKey: ['my-boards'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: myApi.deleteBoard,
    onSuccess: () => { message.success('看板已删除'); queryClient.invalidateQueries({ queryKey: ['archived-boards'] }); },
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my/boards')}>返回</Button>
        <h2 style={{ margin: 0 }}>已归档看板</h2>
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={boards}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '类型', dataIndex: 'type' },
          { title: '所属项目', dataIndex: 'projectName' },
          {
            title: '操作',
            render: (_, r) => (
              <Space>
                <Button type="link" onClick={() => restoreMutation.mutate(r.id)}>恢复</Button>
                <Button type="link" danger onClick={() => Modal.confirm({
                  title: '确定彻底删除？', okType: 'danger', onOk: () => deleteMutation.mutate(r.id),
                })}>删除</Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
