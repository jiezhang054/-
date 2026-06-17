import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../../api/global';

export function ArchivedProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['archived-projects'],
    queryFn: projectsApi.listArchived,
  });

  const restoreMutation = useMutation({
    mutationFn: projectsApi.restore,
    onSuccess: () => { message.success('项目已恢复'); queryClient.invalidateQueries({ queryKey: ['archived-projects'] }); queryClient.invalidateQueries({ queryKey: ['projects'] }); },
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my/boards')}>返回</Button>
        <h2 style={{ margin: 0 }}>已归档项目</h2>
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={projects}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '描述', dataIndex: 'description' },
          {
            title: '操作',
            render: (_, r) => (
              <Button type="link" onClick={() => restoreMutation.mutate(r.id)}>恢复</Button>
            ),
          },
        ]}
      />
    </div>
  );
}
