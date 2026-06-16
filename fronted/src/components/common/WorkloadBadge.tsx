import { Badge } from 'antd';

export function WorkloadBadge({ workload }: { workload: number }) {
  return <Badge count={`${workload}SP`} style={{ backgroundColor: '#1677ff' }} />;
}
