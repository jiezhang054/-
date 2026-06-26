import { Tag } from 'antd';
import type { BoardType } from '../../types/board';
import { getBoardTypeMeta } from '../../constants/boardTypes';

interface Props {
  type: BoardType | string;
  size?: 'small' | 'default';
}

export function BoardTypeTag({ type, size = 'default' }: Props) {
  const meta = getBoardTypeMeta(type);
  return (
    <Tag
      bordered={false}
      style={{
        color: meta.color,
        background: meta.bg,
        fontWeight: 500,
        fontSize: size === 'small' ? 11 : 12,
        margin: 0,
      }}
    >
      {meta.label}
    </Tag>
  );
}
