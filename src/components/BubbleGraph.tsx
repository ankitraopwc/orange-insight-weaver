import React, { useMemo, useCallback } from 'react';
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
import { parseTTLToGraph } from '@/lib/ttl-parser';

interface BubbleGraphProps {
  ttlData?: string;
}

const nodeTypes = {};

export const BubbleGraph: React.FC<BubbleGraphProps> = ({ ttlData }) => {
  const graphData = useMemo(() => {
    if (!ttlData) return { nodes: [], edges: [] };
    
    try {
      return parseTTLToGraph(ttlData);
    } catch (error) {
      console.error('Error parsing TTL for graph:', error);
      return { nodes: [], edges: [] };
    }
  }, [ttlData]);

  // Transform nodes to bubble style
  const bubbleNodes: Node[] = useMemo(() => {
    return graphData.nodes.map((node) => {
      const label = (node.data as any)?.label || 'Unknown';
      const labelLength = typeof label === 'string' ? label.length : 8;
      
      return {
        ...node,
        style: {
          background: node.type === 'class' ? 'hsl(var(--primary))' : 
                     node.type === 'individual' ? 'hsl(var(--secondary))' : 
                     'hsl(var(--accent))',
          color: node.type === 'class' ? 'hsl(var(--primary-foreground))' : 
                 node.type === 'individual' ? 'hsl(var(--secondary-foreground))' : 
                 'hsl(var(--accent-foreground))',
          border: '2px solid hsl(var(--border))',
          borderRadius: '50%',
          width: Math.max(80, Math.min(120, labelLength * 8)),
          height: Math.max(80, Math.min(120, labelLength * 8)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          wordWrap: 'break-word',
          boxShadow: '0 4px 12px hsl(var(--primary) / 0.2)',
          transition: 'all 0.3s ease',
        },
      };
    });
  }, [graphData.nodes]);

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

  const [nodes, , onNodesChange] = useNodesState(bubbleNodes);
  const [edges, , onEdgesChange] = useEdgesState(bubbleEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    // Future: implement focus/zoom functionality
  }, []);

  if (!ttlData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No graph data available
      </div>
    );
  }

  return (
    <div className="h-full w-full">
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
          nodeColor={(node) => {
            if (node.type === 'class') return 'hsl(var(--primary))';
            if (node.type === 'individual') return 'hsl(var(--secondary))';
            return 'hsl(var(--accent))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
};