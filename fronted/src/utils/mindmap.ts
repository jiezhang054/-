export type MindMapLayout =
  | 'logicalStructure'
  | 'logicalStructureLeft'
  | 'mindMap'
  | 'organizationStructure'
  | 'catalogOrganization'
  | 'timeline'
  | 'timeline2'
  | 'verticalTimeline'
  | 'verticalTimeline2'
  | 'verticalTimeline3'
  | 'fishbone'
  | 'fishbone2'
  | 'rightFishbone'
  | 'rightFishbone2';

export interface MindMapNodeData {
  text: string;
  uid?: string;
  expand?: boolean;
  [key: string]: unknown;
}

export interface MindMapTree {
  data: MindMapNodeData;
  children?: MindMapTree[];
}

export interface MindMapThemeConfig {
  template?: string;
  config?: Record<string, unknown>;
}

export interface MindMapPersistedContent {
  layout: MindMapLayout;
  root: MindMapTree;
  theme?: MindMapThemeConfig;
}

export interface MindMapLayoutOption {
  value: MindMapLayout;
  label: string;
  group: string;
}

export const MINDMAP_LAYOUT_OPTIONS: MindMapLayoutOption[] = [
  { value: 'logicalStructure', label: '逻辑结构图（右）', group: '结构' },
  { value: 'logicalStructureLeft', label: '逻辑结构图（左）', group: '结构' },
  { value: 'mindMap', label: '思维导图', group: '结构' },
  { value: 'organizationStructure', label: '组织结构图', group: '结构' },
  { value: 'catalogOrganization', label: '目录组织图', group: '结构' },
  { value: 'timeline', label: '时间轴', group: '时间轴' },
  { value: 'timeline2', label: '时间轴 II', group: '时间轴' },
  { value: 'verticalTimeline', label: '竖向时间轴', group: '时间轴' },
  { value: 'verticalTimeline2', label: '竖向时间轴 II', group: '时间轴' },
  { value: 'verticalTimeline3', label: '竖向时间轴 III', group: '时间轴' },
  { value: 'fishbone', label: '鱼骨图', group: '鱼骨图' },
  { value: 'fishbone2', label: '鱼骨图 II', group: '鱼骨图' },
  { value: 'rightFishbone', label: '向右鱼骨图', group: '鱼骨图' },
  { value: 'rightFishbone2', label: '向右鱼骨图 II', group: '鱼骨图' },
];

export const DEFAULT_MINDMAP_LAYOUT: MindMapLayout = 'logicalStructure';

interface ReactFlowNode {
  id: string;
  type?: string;
  data?: { label?: string };
}

interface ReactFlowEdge {
  source: string;
  target: string;
}

interface ReactFlowContent {
  nodes?: ReactFlowNode[];
  edges?: ReactFlowEdge[];
}

const VALID_LAYOUTS = new Set<string>(MINDMAP_LAYOUT_OPTIONS.map((o) => o.value));

function isValidLayout(value: unknown): value is MindMapLayout {
  return typeof value === 'string' && VALID_LAYOUTS.has(value);
}

export function createDefaultTree(rootText = '中心主题'): MindMapTree {
  return { data: { text: rootText || '中心主题' }, children: [] };
}

export function createDefaultContent(rootText = '中心主题'): MindMapPersistedContent {
  return {
    layout: DEFAULT_MINDMAP_LAYOUT,
    root: createDefaultTree(rootText),
    theme: { template: 'classic' },
  };
}

function isMindMapTree(value: unknown): value is MindMapTree {
  if (!value || typeof value !== 'object') return false;
  const obj = value as MindMapTree;
  return !!obj.data && typeof obj.data.text === 'string';
}

function reactFlowToTree(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): MindMapTree {
  if (!nodes.length) return createDefaultTree();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    const list = childrenMap.get(edge.source) ?? [];
    list.push(edge.target);
    childrenMap.set(edge.source, list);
    hasParent.add(edge.target);
  }

  const rootId =
    nodes.find((n) => n.type === 'input')?.id ??
    nodes.find((n) => !hasParent.has(n.id))?.id ??
    nodes[0]?.id;

  if (!rootId) return createDefaultTree();

  const build = (id: string): MindMapTree => {
    const node = nodeMap.get(id);
    const label = node?.data?.label ?? '节点';
    const childIds = childrenMap.get(id) ?? [];
    return {
      data: { text: String(label), uid: id },
      children: childIds.map(build),
    };
  };

  return build(rootId);
}

export function parseMindmapContent(content?: string, fallbackName?: string): MindMapPersistedContent {
  const fallback = createDefaultContent(fallbackName ?? '中心主题');
  if (!content?.trim()) return fallback;

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    if (parsed.root && isMindMapTree(parsed.root)) {
      return {
        layout: isValidLayout(parsed.layout) ? parsed.layout : DEFAULT_MINDMAP_LAYOUT,
        root: parsed.root as MindMapTree,
        theme: parsed.theme as MindMapThemeConfig | undefined,
      };
    }

    if (isMindMapTree(parsed)) {
      return {
        layout: isValidLayout(parsed.layout) ? parsed.layout : DEFAULT_MINDMAP_LAYOUT,
        root: parsed as MindMapTree,
        theme: parsed.theme as MindMapThemeConfig | undefined,
      };
    }

    if (Array.isArray((parsed as ReactFlowContent).nodes)) {
      const rf = parsed as ReactFlowContent;
      const tree = reactFlowToTree(rf.nodes ?? [], rf.edges ?? []);
      if (tree.data.text === '节点' && fallbackName) {
        tree.data.text = fallbackName;
      }
      return { ...fallback, root: tree };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export function serializeMindmapContent(content: MindMapPersistedContent): string {
  return JSON.stringify({
    layout: content.layout,
    root: content.root,
    ...(content.theme?.template ? { theme: { template: content.theme.template } } : {}),
  });
}

export function parseImportedMindmapJson(raw: string): MindMapPersistedContent {
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (parsed.root && isMindMapTree(parsed.root)) {
    return {
      layout: isValidLayout(parsed.layout) ? parsed.layout : DEFAULT_MINDMAP_LAYOUT,
      root: parsed.root as MindMapTree,
      theme: parsed.theme as MindMapThemeConfig | undefined,
    };
  }

  if (isMindMapTree(parsed)) {
    return {
      layout: isValidLayout(parsed.layout) ? parsed.layout : DEFAULT_MINDMAP_LAYOUT,
      root: parsed as MindMapTree,
    };
  }

  if (Array.isArray((parsed as ReactFlowContent).nodes)) {
    const rf = parsed as ReactFlowContent;
    return {
      layout: DEFAULT_MINDMAP_LAYOUT,
      root: reactFlowToTree(rf.nodes ?? [], rf.edges ?? []),
    };
  }

  throw new Error('无效的脑图 JSON 格式');
}

export function buildLayoutSelectOptions() {
  const groups = new Map<string, { label: string; value: MindMapLayout }[]>();
  for (const item of MINDMAP_LAYOUT_OPTIONS) {
    const list = groups.get(item.group) ?? [];
    list.push({ label: item.label, value: item.value });
    groups.set(item.group, list);
  }
  return Array.from(groups.entries()).map(([label, options]) => ({ label, options }));
}
