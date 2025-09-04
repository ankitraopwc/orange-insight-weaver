import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  MiniMap,
  ConnectionMode 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildClassERGraph } from '@/lib/ttl-parser';
import { calculateLayout } from '@/lib/graph-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw, Map, EyeOff, Eye } from 'lucide-react';

interface BubbleGraphProps {
  ttlData?: string;
}

const nodeTypes = {};

export const BubbleGraph: React.FC<BubbleGraphProps> = ({ ttlData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [showMiniMap, setShowMiniMap] = useState(() => {
    const saved = localStorage.getItem('bubble-graph-minimap');
    return saved ? JSON.parse(saved) : true;
  });
  const [showAttributes, setShowAttributes] = useState(() => {
    const saved = localStorage.getItem('bubble-graph-attributes');
    return saved ? JSON.parse(saved) : true;
  });
  
  const graphData = useMemo(() => {
    if (!ttlData) return { nodes: [], edges: [] };
    
    try {
      return buildClassERGraph(ttlData);
    } catch (error) {
      console.error('Error parsing TTL for ER graph:', error);
      return { nodes: [], edges: [] };
    }
  }, [ttlData]);

  // Calculate layout with proper positioning
  const layoutedNodes = useMemo(() => {
    if (graphData.nodes.length === 0) return [];
    
    // Filter nodes based on showAttributes setting
    const filteredNodes = showAttributes 
      ? graphData.nodes 
      : graphData.nodes.filter(node => node.data?.type === 'class');
    
    const baseNodes = filteredNodes.map((node) => {
      const label = node.data?.label || 'Unknown';
      const labelLength = typeof label === 'string' ? label.length : 8;
      const isClass = node.data?.type === 'class';
      const isAttribute = node.data?.type === 'attribute';
      
      // Calculate size based on node type
      const baseSize = isClass ? Math.max(80, Math.min(120, labelLength * 8)) : Math.max(50, Math.min(70, labelLength * 6));
      
      return {
        ...node,
        data: {
          ...node.data,
          label,
        },
        style: {
          background: isClass 
            ? 'hsl(32, 95%, 55%)' // Bright orange for classes
            : isAttribute 
            ? 'hsl(32, 80%, 70%)' // Lighter orange for attributes
            : 'hsl(32, 85%, 60%)', // Default orange
          color: isClass 
            ? 'hsl(32, 100%, 15%)' // Dark orange text for classes
            : 'hsl(32, 90%, 20%)', // Slightly lighter dark text for attributes
          border: isClass 
            ? '3px solid hsl(32, 90%, 45%)' // Darker orange border for classes
            : '2px solid hsl(32, 75%, 55%)', // Medium orange border for attributes
          borderRadius: '50%',
          width: baseSize,
          height: baseSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isClass ? '14px' : '12px',
          fontWeight: isClass ? '600' : '500',
          textAlign: 'center' as const,
          wordBreak: 'break-word' as const,
          boxShadow: isClass 
            ? '0 6px 16px hsl(32, 85%, 45% / 0.3)' // Stronger shadow for classes
            : '0 3px 8px hsl(32, 75%, 55% / 0.2)', // Subtle shadow for attributes
          padding: '8px',
        },
      };
    });

    // Filter edges based on showAttributes setting
    const filteredEdges = showAttributes 
      ? graphData.edges 
      : graphData.edges.filter(edge => {
          const sourceNode = graphData.nodes.find(n => n.id === edge.source);
          const targetNode = graphData.nodes.find(n => n.id === edge.target);
          return sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'class';
        });

    return calculateLayout(baseNodes, filteredEdges, containerSize.width, containerSize.height);
  }, [graphData.nodes, graphData.edges, containerSize, showAttributes]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: width || 800, height: height || 600 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const bubbleEdges: Edge[] = useMemo(() => {
    // Filter edges based on showAttributes setting
    const filteredEdges = showAttributes 
      ? graphData.edges 
      : graphData.edges.filter(edge => {
          const sourceNode = graphData.nodes.find(n => n.id === edge.source);
          const targetNode = graphData.nodes.find(n => n.id === edge.target);
          return sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'class';
        });

    return filteredEdges.map((edge) => ({
      ...edge,
      style: {
        stroke: 'hsl(var(--muted-foreground))',
        strokeWidth: 2,
      },
      labelBgStyle: {
        fill: 'hsl(var(--background))',
        fillOpacity: 0.8,
      },
      labelStyle: {
        fill: 'hsl(var(--foreground))',
        fontSize: '15px',
      },
    }));
  }, [graphData.edges, showAttributes, graphData.nodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    // Future: implement focus/zoom functionality
  }, []);

  const relayoutGraph = useCallback(() => {
    if (layoutedNodes.length > 0) {
      const filteredEdges = showAttributes 
        ? graphData.edges 
        : graphData.edges.filter(edge => {
            const sourceNode = graphData.nodes.find(n => n.id === edge.source);
            const targetNode = graphData.nodes.find(n => n.id === edge.target);
            return sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'class';
          });
      const newLayout = calculateLayout(layoutedNodes, filteredEdges, containerSize.width, containerSize.height);
      setNodes(newLayout);
    }
  }, [layoutedNodes, graphData.edges, graphData.nodes, containerSize, setNodes, showAttributes]);

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  // Update edges when bubbleEdges changes
  useEffect(() => {
    setEdges(bubbleEdges);
  }, [bubbleEdges, setEdges]);

  if (!ttlData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No graph data available
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          onClick={() => {
            const newValue = !showAttributes;
            setShowAttributes(newValue);
            localStorage.setItem('bubble-graph-attributes', JSON.stringify(newValue));
          }}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          {showAttributes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="ml-2">Attributes</span>
        </Button>
        <Button
          onClick={() => {
            const newValue = !showMiniMap;
            setShowMiniMap(newValue);
            localStorage.setItem('bubble-graph-minimap', JSON.stringify(newValue));
          }}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          {showMiniMap ? <EyeOff className="h-4 w-4" /> : <Map className="h-4 w-4" />}
        </Button>
        <Button
          onClick={relayoutGraph}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Re-layout
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 4 }}
        className="bg-background"
      >
        <Background 
          color="hsl(var(--muted))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card border border-border rounded-lg shadow-lg"
          position="top-right"
          style={{ top: 60, right: 16 }}
        />
        {showMiniMap && (
          <MiniMap 
            className="bg-card border border-border rounded-lg"
            nodeColor={() => 'hsl(var(--primary))'}
            maskColor="hsl(var(--background) / 0.8)"
          />
        )}
      </ReactFlow>
    </div>
  );
};