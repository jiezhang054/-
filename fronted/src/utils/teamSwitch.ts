import type { QueryClient } from '@tanstack/react-query';
import type { NavigateFunction } from 'react-router-dom';

/** 切换团队后：不在工作台则跳转到工作台 */
export function shouldResetRouteOnTeamSwitch(pathname: string) {
  return pathname !== '/workspace';
}

export function invalidateTeamScopedQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  queryClient.invalidateQueries({ queryKey: ['workspace'] });
  queryClient.invalidateQueries({ queryKey: ['navigation'] });
  queryClient.removeQueries({ queryKey: ['project'] });
  queryClient.removeQueries({ queryKey: ['board'] });
  queryClient.removeQueries({ queryKey: ['team'] });
  queryClient.removeQueries({ queryKey: ['burndown'] });
}

export function afterTeamSwitch(
  queryClient: QueryClient,
  navigate: NavigateFunction,
  pathname: string,
) {
  invalidateTeamScopedQueries(queryClient);
  if (shouldResetRouteOnTeamSwitch(pathname)) {
    navigate('/workspace', { replace: true });
  }
}
