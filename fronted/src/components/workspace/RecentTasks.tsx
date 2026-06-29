import { Card, List, Badge, Dropdown, Empty } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import type { WorkspaceTask } from '../../api/boards';
import { CARD_TYPE_COLORS } from '../common/CardTypeTag';
import { UserAvatarGroup } from '../common/UserAvatar';

interface Props {
  tasks: WorkspaceTask[];
  columnOptions?: Record<number, { id: number; name: string }[]>;
  onCardClick?: (task: WorkspaceTask) => void;
  onBoardClick?: (task: WorkspaceTask) => void;
  onQuickMove?: (cardId: number, columnId: number) => void;
}

export function RecentTasks({ tasks, columnOptions, onCardClick, onBoardClick, onQuickMove }: Props) {
  const { t } = useTranslation();

  return (
    <Card
      className="workspace-panel workspace-panel--tasks"
      title={<><Badge count={tasks.length} offset={[10, 0]}>{t('recentTasks')}</Badge></>}
      size="small"
    >
      {tasks.length === 0 ? (
        <Empty description="暂无事项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="workspace-panel__scroll">
          <List
            dataSource={tasks}
            split={false}
            renderItem={(task) => {
            const type = task.type || 'TASK';
            const memberIds = task.memberIds ?? [];
            const overdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), 'day');
            const cols = columnOptions?.[task.boardId] ?? [];

            const moveMenu: MenuProps['items'] = cols.map((col) => ({
              key: String(col.id),
              label: `移至「${col.name}」`,
              onClick: () => onQuickMove?.(task.id, col.id),
            }));

            return (
              <Dropdown menu={{ items: moveMenu }} trigger={['contextMenu']} disabled={!cols.length}>
                <List.Item
                  style={{ cursor: 'pointer', borderLeft: `4px solid ${overdue ? '#ff4d4f' : CARD_TYPE_COLORS[type as keyof typeof CARD_TYPE_COLORS] || '#1677ff'}`, paddingLeft: 8 }}
                  onClick={() => onCardClick?.(task)}
                  actions={[
                    <a
                      key="board"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBoardClick?.(task);
                      }}
                    >
                      <AppstoreOutlined /> 看板
                    </a>,
                    ...(cols.length ? [
                      <Dropdown key="move" menu={{ items: moveMenu }} trigger={['click']}>
                        <a onClick={(e) => e.stopPropagation()}>改状态</a>
                      </Dropdown>,
                    ] : []),
                  ]}
                >
                  <List.Item.Meta
                    title={task.title}
                    description={
                      <>
                        <div>
                          {task.columnName}
                          {' · '}
                          <a
                            onClick={(e) => {
                              e.stopPropagation();
                              onBoardClick?.(task);
                            }}
                          >
                            {task.boardName}
                          </a>
                          {task.projectName ? ` / ${task.projectName}` : null}
                        </div>
                        {task.dueDate && <div>截止 {dayjs(task.dueDate).format('MM-DD')}</div>}
                      </>
                    }
                  />
                  <UserAvatarGroup userIds={memberIds} />
                </List.Item>
              </Dropdown>
            );
          }}
          />
        </div>
      )}
    </Card>
  );
}
