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
  ConnectionMode,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildClassERGraph } from '@/lib/ttl-parser';
import { calculateLayout } from '@/lib/graph-layout';
import { calculateHierarchicalLayout } from '@/lib/elk-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw, Map as MapIcon, EyeOff, Eye } from 'lucide-react';

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
  const [useHierarchicalLayout, setUseHierarchicalLayout] = useState(() => {
    const saved = localStorage.getItem('bubble-graph-hierarchical');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [savedNodePositions, setSavedNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map<string, { x: number; y: number }>());
  
  const graphData = useMemo(() => {
    if (!ttlData) return { nodes: [], edges: [] };
    
    try {
      return buildClassERGraph(ttlData);
    } catch (error) {
      console.error('Error parsing TTL for ER graph:', error);
      return { nodes: [], edges: [] };
    }
  }, [ttlData]);

  // Calculate layout with ALL nodes first (stable positions)
  const fullLayoutNodes = useMemo(() => {
    if (graphData.nodes.length === 0) return [];
    
    const baseNodes = graphData.nodes.map((node) => {
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

    // Calculate layout only if no saved positions exist, otherwise use saved positions
    const layoutedNodes = calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
    
    // Apply saved positions if they exist
    return layoutedNodes.map(node => {
      const savedPos = savedNodePositions.get(node.id);
      if (savedPos) {
        return {
          ...node,
          position: savedPos
        };
      }
      return node;
    });
  }, [graphData.nodes, graphData.edges, containerSize, savedNodePositions]);

  // Filter the full layout for display based on current settings
  const layoutedNodes = useMemo(() => {
    const filteredNodes = fullLayoutNodes.filter(node => {
      if (showAttributes) return true;
      if (node.data?.type === 'class') return true;
      if (node.data?.type === 'attribute') {
        // Show attribute if any connected class is expanded
        const connectedClasses = graphData.edges
          .filter(edge => edge.target === node.id)
          .map(edge => edge.source);
        return connectedClasses.some(classId => expandedClasses.has(classId));
      }
      return false;
    });

    // Position attributes in circles around expanded classes
    return filteredNodes.map(node => {
      if (node.data?.type === 'attribute' && !showAttributes) {
        // Find the connected class that is expanded
        const connectedClass = graphData.edges
          .filter(edge => edge.target === node.id)
          .find(edge => expandedClasses.has(edge.source));
          
        if (connectedClass) {
          const classNode = fullLayoutNodes.find(n => n.id === connectedClass.source);
          if (classNode) {
            // Get all attributes for this class
            const classAttributes = graphData.edges
              .filter(edge => edge.source === connectedClass.source && 
                graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute')
              .map(edge => edge.target);
            
            const attributeIndex = classAttributes.indexOf(node.id);
            const totalAttributes = classAttributes.length;
            
            // Calculate circular position around class
            const radius = 120; // Distance from class center
            const angle = (attributeIndex / totalAttributes) * 2 * Math.PI;
            const x = classNode.position.x + Math.cos(angle) * radius;
            const y = classNode.position.y + Math.sin(angle) * radius;
            
            return {
              ...node,
              position: { x, y }
            };
          }
        }
      }
      return node;
    });
  }, [fullLayoutNodes, showAttributes, expandedClasses, graphData.edges, graphData.nodes]);

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
    // Filter edges based on showAttributes setting and expandedClasses
    const filteredEdges = showAttributes 
      ? graphData.edges 
      : graphData.edges.filter(edge => {
          const sourceNode = graphData.nodes.find(n => n.id === edge.source);
          const targetNode = graphData.nodes.find(n => n.id === edge.target);
          
          // Always include class-to-class edges
          if (sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'class') {
            return true;
          }
          
          // Include class-to-attribute edges only if the class is expanded
          if (sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'attribute') {
            return expandedClasses.has(edge.source);
          }
          
          return false;
        });

    return filteredEdges.map((edge) => ({
      ...edge,
      type: 'default', // Changed from 'smoothstep' to default Bezier
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
  }, [graphData.edges, showAttributes, graphData.nodes, expandedClasses]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Save node positions when they are moved by user
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Save positions when nodes are dragged
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        setSavedNodePositions(prev => {
          const newMap = new Map(prev);
          newMap.set(change.id, { x: change.position.x, y: change.position.y });
          return newMap;
        });
      }
    });
  }, [onNodesChange]);

  // Clear saved positions when data changes
  useEffect(() => {
    setSavedNodePositions(new Map<string, { x: number; y: number }>());
  }, [ttlData]);

  // Update displayed nodes based on filtering
  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node double-clicked:', node);
    
    // Toggle attribute visibility for individual classes when global attributes are hidden
    if (!showAttributes && node.data?.type === 'class') {
      setExpandedClasses(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
    }
  }, [showAttributes]);

  const relayoutGraph = useCallback(async () => {
    if (fullLayoutNodes.length > 0) {
      // Clear saved positions to force recalculation
      setSavedNodePositions(new Map<string, { x: number; y: number }>());
      
      // Recalculate fresh layout
      const baseNodes = graphData.nodes.map((node) => {
        const label = node.data?.label || 'Unknown';
        const labelLength = typeof label === 'string' ? label.length : 8;
        const isClass = node.data?.type === 'class';
        const isAttribute = node.data?.type === 'attribute';
        
        const baseSize = isClass ? Math.max(80, Math.min(120, labelLength * 8)) : Math.max(50, Math.min(70, labelLength * 6));
        
        return {
          ...node,
          data: { ...node.data, label },
          style: {
            background: isClass ? 'hsl(32, 95%, 55%)' : isAttribute ? 'hsl(32, 80%, 70%)' : 'hsl(32, 85%, 60%)',
            color: isClass ? 'hsl(32, 100%, 15%)' : 'hsl(32, 90%, 20%)',
            border: isClass ? '3px solid hsl(32, 90%, 45%)' : '2px solid hsl(32, 75%, 55%)',
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
            boxShadow: isClass ? '0 6px 16px hsl(32, 85%, 45% / 0.3)' : '0 3px 8px hsl(32, 75%, 55% / 0.2)',
            padding: '8px',
          },
        };
      });
      
      if (useHierarchicalLayout) {
        try {
          const hierarchicalNodes = await calculateHierarchicalLayout(
            baseNodes, 
            graphData.edges,
            containerSize.width, 
            containerSize.height
          );
          setNodes(hierarchicalNodes);
        } catch (error) {
          console.error('Hierarchical layout failed, falling back to force layout:', error);
          const newLayout = calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
          setNodes(newLayout);
        }
      } else {
        const newLayout = calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
        setNodes(newLayout);
      }
    }
  }, [graphData.nodes, graphData.edges, containerSize, setNodes, useHierarchicalLayout]);

  // Update nodes with async layout calculation (hierarchical only)
  useEffect(() => {
    const updateLayout = async () => {
      if (fullLayoutNodes.length === 0) return;
      
      if (useHierarchicalLayout && savedNodePositions.size === 0) {
        // Only use hierarchical layout if no saved positions exist
        try {
          const hierarchicalNodes = await calculateHierarchicalLayout(
            fullLayoutNodes, 
            graphData.edges,
            containerSize.width, 
            containerSize.height
          );
          setNodes(hierarchicalNodes);
        } catch (error) {
          console.error('Hierarchical layout failed, using force layout:', error);
          setNodes(fullLayoutNodes);
        }
      } else {
        setNodes(fullLayoutNodes);
      }
    };
    
    updateLayout();
  }, [fullLayoutNodes, useHierarchicalLayout, graphData.edges, containerSize, setNodes, savedNodePositions.size]);

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
            // Clear expanded classes when toggling attributes ON
            if (newValue) {
              setExpandedClasses(new Set());
            }
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
            const newValue = !useHierarchicalLayout;
            setUseHierarchicalLayout(newValue);
            localStorage.setItem('bubble-graph-hierarchical', JSON.stringify(newValue));
          }}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <span>{useHierarchicalLayout ? 'Force' : 'Hierarchical'}</span>
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
          {showMiniMap ? <EyeOff className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
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
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
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