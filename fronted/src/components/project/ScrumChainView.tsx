import { Tooltip } from 'antd';
import { LockOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { BoardSummary } from '../../types/board';
import { BoardTypeTag } from '../common/BoardTypeTag';
import { getBoardTypeMeta } from '../../constants/boardTypes';

interface Props {
  boards: BoardSummary[];
}

function ChainNode({ board }: { board: BoardSummary }) {
  const navigate = useNavigate();
  const meta = getBoardTypeMeta(board.type);
  const locked = board.chainLocked;

  const card = (
    <div
      className={`scrum-chain-node__card${locked ? ' scrum-chain-node__card--locked' : ''}`}
      style={{ ['--node-accent' as string]: meta.color }}
      onClick={() => navigate(`/board/${board.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/board/${board.id}`)}
    >
      <BoardTypeTag type={board.type} size="small" />
      <div className="scrum-chain-node__name">{board.name}</div>
      <div className="scrum-chain-node__meta">
        {board.cardCount} 卡片
        {board.completed && ' · 已填写'}
        {locked && ' · 只读'}
      </div>
      {locked && board.chainMessage && (
        <div className="scrum-chain-node__lock">
          <LockOutlined /> {board.chainMessage}
        </div>
      )}
    </div>
  );

  return (
    <div className="scrum-chain-node">
      {locked && board.chainMessage ? <Tooltip title={board.chainMessage}>{card}</Tooltip> : card}
    </div>
  );
}

function Arrow() {
  return <div className="scrum-chain-arrow"><RightOutlined /></div>;
}

export function ScrumChainView({ boards }: Props) {
  const roadmap = boards.find((b) => b.type === 'ROADMAP');
  const milestone = boards.find((b) => b.type === 'MILESTONE');
  const sprints = boards.filter((b) => b.type === 'SPRINT');

  if (!roadmap) return null;

  return (
    <div className="scrum-chain-panel">
      <div className="scrum-chain-panel__title">Scrum 看板链路</div>
      <div className="scrum-chain-panel__desc">
        产品路线图 → 里程碑 → Sprint → 缺陷 / 回顾。上级看板有卡片后，方可编辑下级看板。
      </div>
      <div className="scrum-chain-row">
        <ChainNode board={roadmap} />
        {milestone && (
          <>
            <Arrow />
            <ChainNode board={milestone} />
          </>
        )}
        {sprints.map((sprint) => {
          const defect = sprint.linkedDefectBoardId
            ? boards.find((b) => b.id === sprint.linkedDefectBoardId)
            : boards.find((b) => b.type === 'DEFECT' && (b.linkedSprintId === sprint.id || b.parentBoardId === sprint.id));
          const retro = sprint.linkedRetroBoardId
            ? boards.find((b) => b.id === sprint.linkedRetroBoardId)
            : boards.find((b) => b.type === 'RETROSPECTIVE' && (b.linkedSprintId === sprint.id || b.parentBoardId === sprint.id));
          return (
            <div key={sprint.id} style={{ display: 'flex', alignItems: 'stretch' }}>
              <Arrow />
              <div className="scrum-chain-sprint-group">
                <ChainNode board={sprint} />
                {(defect || retro) && (
                  <div className="scrum-chain-sprint-children">
                    {defect && <ChainNode board={defect} />}
                    {retro && <ChainNode board={retro} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
