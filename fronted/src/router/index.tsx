import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthBootstrap } from '../components/auth/AuthBootstrap';
import { PrivateRoute } from './PrivateRoute';
import { GuestRoute } from './GuestRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { WorkspacePage } from '../pages/workspace/WorkspacePage';
import { ProjectPage } from '../pages/project/ProjectPage';
import { BoardPage } from '../pages/board/BoardPage';
import { BoardStatsPage } from '../pages/board/BoardStatsPage';
import { BoardTimelinePage } from '../pages/board/BoardTimelinePage';
import { BoardChartsPage } from '../pages/board/BoardChartsPage';
import { DemoIndexPage } from '../pages/demo/DemoIndexPage';
import { MindMapPage } from '../pages/mindmap/MindMapPage';
import { MindMapListPage } from '../pages/mindmap/MindMapListPage';
import { ProfilePage } from '../pages/settings/ProfilePage';

export const router = createBrowserRouter([
  { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
  { path: '/register', element: <GuestRoute><RegisterPage /></GuestRoute> },
  { path: '/demo', element: <DemoIndexPage /> },
  {
    path: '/',
    element: (
      <AuthBootstrap>
        <PrivateRoute><AppLayout /></PrivateRoute>
      </AuthBootstrap>
    ),
    children: [
      { index: true, element: <Navigate to="/workspace" replace /> },
      { path: 'workspace', element: <WorkspacePage /> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'projects/:projectId', element: <ProjectPage /> },
      { path: 'board/:boardId', element: <BoardPage /> },
      { path: 'board/:boardId/stats', element: <BoardStatsPage /> },
      { path: 'board/:boardId/timeline', element: <BoardTimelinePage /> },
      { path: 'board/:boardId/charts', element: <BoardChartsPage /> },
      { path: 'my/boards', element: <ProjectPage /> },
      { path: 'my/mindmaps', element: <MindMapListPage /> },
      { path: 'mindmap/:mindmapId', element: <MindMapPage /> },
    ],
  },
]);
