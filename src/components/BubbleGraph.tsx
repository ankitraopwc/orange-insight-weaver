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
import { RotateCcw } from 'lucide-react';

interface BubbleGraphProps {
  ttlData?: string;
}

const nodeTypes = {};

export const BubbleGraph: React.FC<BubbleGraphProps> = ({ ttlData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const graphData = useMemo(() => {
    if (!ttlData) return { nodes: [], edges: [] };
    
    try {
      return buildClassERGraph(ttlData);
    } catch (error) {
      console.error('Error parsing TTL for graph:', error);
      return { nodes: [], edges: [] };
    }
  }, [ttlData]);

  // Calculate layout with proper positioning
  const layoutedNodes = useMemo(() => {
    if (graphData.nodes.length === 0) return [];
    
    const baseNodes = graphData.nodes.map((node) => {
      const label = node.data?.label || 'Unknown';
      const labelLength = typeof label === 'string' ? label.length : 8;
      
      return {
        ...node,
        data: {
          ...node.data,
          label,
        },
        style: {
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: '2px solid hsl(var(--border))',
          borderRadius: '8px',
          width: Math.max(100, Math.min(160, labelLength * 10)),
          height: Math.max(60, Math.min(80, 60)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: '600',
          textAlign: 'center' as const,
          wordBreak: 'break-word' as const,
          boxShadow: '0 4px 12px hsl(var(--primary) / 0.2)',
        },
      };
    });

    return calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
  }, [graphData.nodes, graphData.edges, containerSize]);

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
    return graphData.edges.map((edge) => ({
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
        fontSize: '12px',
      },
    }));
  }, [graphData.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(bubbleEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    // Future: implement focus/zoom functionality
  }, []);

  const relayoutGraph = useCallback(() => {
    if (layoutedNodes.length > 0) {
      const newLayout = calculateLayout(layoutedNodes, graphData.edges, containerSize.width, containerSize.height);
      setNodes(newLayout);
    }
  }, [layoutedNodes, graphData.edges, containerSize, setNodes]);

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  if (!ttlData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No graph data available
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      <div className="absolute top-4 right-4 z-10">
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
        fitViewOptions={{ padding: 0.2 }}
        className="bg-background"
      >
        <Background 
          color="hsl(var(--muted))" 
          gap={20} 
          size={1}
        />
        <Controls 
          className="bg-card border border-border rounded-lg shadow-lg"
        />
        <MiniMap 
          className="bg-card border border-border rounded-lg"
          nodeColor={() => 'hsl(var(--primary))'}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
};