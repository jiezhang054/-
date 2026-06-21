import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import MindMap from 'simple-mind-map';
import MiniMap from 'simple-mind-map/src/plugins/MiniMap.js';
import Drag from 'simple-mind-map/src/plugins/Drag.js';
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js';
import Select from 'simple-mind-map/src/plugins/Select.js';
import 'simple-mind-map/dist/simpleMindMap.esm.min.css';
import '../../styles/mindmap.css';
import {
  DEFAULT_MINDMAP_LAYOUT,
  type MindMapLayout,
  type MindMapPersistedContent,
} from '../../utils/mindmap';

type MindMapInstance = InstanceType<typeof MindMap> & {
  miniMap?: {
    calculationMiniMap: (w: number, h: number) => {
      svgHTML: string;
      viewBoxStyle: Record<string, string>;
    };
  };
};

let pluginsRegistered = false;

function ensurePlugins() {
  if (pluginsRegistered) return;
  MindMap.usePlugin(MiniMap)
    .usePlugin(Drag)
    .usePlugin(KeyboardNavigation)
    .usePlugin(Select);
  pluginsRegistered = true;
}

function buildPersistedContent(mm: MindMapInstance): MindMapPersistedContent {
  const full = mm.getData(true) as {
    layout?: MindMapLayout;
    root?: MindMapPersistedContent['root'];
    theme?: { template?: string; config?: Record<string, unknown> };
  };
  return {
    layout: (full.layout ?? DEFAULT_MINDMAP_LAYOUT) as MindMapLayout,
    root: full.root ?? (mm.getData(false) as MindMapPersistedContent['root']),
    theme: full.theme?.template ? { template: full.theme.template } : undefined,
  };
}

export interface MindMapEditorHandle {
  getContent: () => MindMapPersistedContent;
  getSerializedContent: () => string;
  insertChild: () => void;
  insertSibling: () => void;
  removeNode: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  centerRoot: () => void;
  setLayout: (layout: MindMapLayout) => void;
  getLayout: () => MindMapLayout;
  setData: (content: MindMapPersistedContent) => void;
}

interface Props {
  content: MindMapPersistedContent;
  readonly?: boolean;
  onChange?: (content: MindMapPersistedContent) => void;
}

export const MindMapEditor = forwardRef<MindMapEditorHandle, Props>(function MindMapEditor(
  { content, readonly = false, onChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const viewBoxRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<MindMapInstance | null>(null);
  const initialContentRef = useRef(content);
  const onChangeRef = useRef(onChange);
  const readyRef = useRef(false);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    getContent: () => (mindMapRef.current ? buildPersistedContent(mindMapRef.current) : initialContentRef.current),
    getSerializedContent: () => JSON.stringify(
      mindMapRef.current ? buildPersistedContent(mindMapRef.current) : initialContentRef.current,
    ),
    insertChild: () => mindMapRef.current?.execCommand('INSERT_CHILD_NODE'),
    insertSibling: () => mindMapRef.current?.execCommand('INSERT_NODE'),
    removeNode: () => mindMapRef.current?.execCommand('REMOVE_NODE'),
    zoomIn: () => (mindMapRef.current?.view as { enlarge: (...args: unknown[]) => void }).enlarge(undefined, undefined, false),
    zoomOut: () => (mindMapRef.current?.view as { narrow: (...args: unknown[]) => void }).narrow(undefined, undefined, false),
    fit: () => (mindMapRef.current?.view as { fit: (...args: unknown[]) => void }).fit(undefined, false, undefined),
    centerRoot: () => (mindMapRef.current?.renderer as { setRootNodeCenter: () => void }).setRootNodeCenter(),
    setLayout: (layout) => {
      mindMapRef.current?.setLayout(layout);
      window.setTimeout(() => {
        (mindMapRef.current?.view as { fit: (...args: unknown[]) => void })?.fit(undefined, false, undefined);
      }, 50);
    },
    getLayout: () => (mindMapRef.current?.getLayout() as MindMapLayout) ?? initialContentRef.current.layout,
    setData: (next) => {
      mindMapRef.current?.setFullData({
        layout: next.layout,
        root: next.root,
        theme: next.theme?.template
          ? { template: next.theme.template, config: next.theme.config ?? {} }
          : undefined,
      });
      mindMapRef.current?.render(() => {}, 'api');
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    ensurePlugins();
    readyRef.current = false;

    const initial = initialContentRef.current;
    const mm = new MindMap({
      el: containerRef.current,
      data: initial.root,
      layout: initial.layout ?? DEFAULT_MINDMAP_LAYOUT,
      theme: initial.theme?.template ?? 'classic',
      readonly,
      fit: true,
      enableFreeDrag: true,
      mousewheelAction: 'zoom',
      addHistoryOnInit: false,
    } as ConstructorParameters<typeof MindMap>[0]);
    mindMapRef.current = mm as MindMapInstance;

    const renderMiniMap = () => {
      const box = miniMapRef.current;
      const viewBox = viewBoxRef.current;
      if (!box || !(mm as MindMapInstance).miniMap) return;

      const width = box.clientWidth || 200;
      const height = box.clientHeight || 120;
      const result = (mm as MindMapInstance).miniMap!.calculationMiniMap(width, height);
      const inner = box.querySelector('.mindmap-minimap-inner');
      if (!inner) return;

      const svgWrap = inner.querySelector('.mindmap-minimap-svg') as HTMLDivElement | null;
      if (svgWrap) {
        svgWrap.innerHTML = result.svgHTML;
      }

      if (viewBox && result.viewBoxStyle) {
        Object.assign(viewBox.style, result.viewBoxStyle);
      }
    };

    const handleDataChange = () => {
      if (!readyRef.current || !mindMapRef.current) return;
      onChangeRef.current?.(buildPersistedContent(mindMapRef.current));
      renderMiniMap();
    };

    mm.on('data_change', handleDataChange);
    mm.on('view_data_change', renderMiniMap);
    mm.on('node_tree_render_end', renderMiniMap);

    const timer = window.setTimeout(() => {
      renderMiniMap();
      readyRef.current = true;
    }, 300);

    const onResize = () => {
      mm.resize();
      renderMiniMap();
    };
    window.addEventListener('resize', onResize);

    return () => {
      readyRef.current = false;
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      mm.destroy();
      mindMapRef.current = null;
    };
  }, [readonly]);

  return (
    <div className="mindmap-editor">
      <div ref={containerRef} className="mindmap-container" />
      <div ref={miniMapRef} className="mindmap-minimap">
        <div className="mindmap-minimap-inner">
          <div className="mindmap-minimap-svg" />
          <div ref={viewBoxRef} className="mindmap-minimap-viewbox" />
        </div>
      </div>
    </div>
  );
});
