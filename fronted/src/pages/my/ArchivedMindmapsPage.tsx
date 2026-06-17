import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myApi } from '../../api/my';

export function ArchivedMindmapsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: mindmaps = [], isLoading } = useQuery({
    queryKey: ['archived-mindmaps'],
    queryFn: myApi.listArchivedMindmaps,
  });

  const restoreMutation = useMutation({
    mutationFn: myApi.restoreMindmap,
    onSuccess: () => {
      message.success('脑图已恢复');
      queryClient.invalidateQueries({ queryKey: ['archived-mindmaps'] });
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: myApi.deleteMindmap,
    onSuccess: () => {
      message.success('脑图已删除');
      queryClient.invalidateQueries({ queryKey: ['archived-mindmaps'] });
    },
  });

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/my/mindmaps')}>返回</Button>
        <h2 style={{ margin: 0 }}>已归档脑图</h2>
      </Space>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={mindmaps}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '所属项目', dataIndex: 'projectName', render: (v) => v || '个人' },
          {
            title: '操作',
            render: (_, r) => (
              <Space>
                <Button type="link" onClick={() => restoreMutation.mutate(r.id)}>恢复</Button>
                <Button type="link" danger onClick={() => deleteMutation.mutate(r.id)}>删除</Button>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
