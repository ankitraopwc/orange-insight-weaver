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
    return saved ? JSON.parse(saved) : false; // Default to hidden
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

  // Initialize all nodes with layout and visibility flags (only recalculated on data change)
  const initialNodes = useMemo(() => {
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
            ? 'hsl(200, 85%, 65%)' // Blue for attributes to differentiate
            : 'hsl(32, 85%, 60%)', // Default orange
          color: isClass 
            ? 'hsl(32, 100%, 15%)' // Dark orange text for classes
            : 'hsl(200, 90%, 20%)', // Dark blue text for attributes
          border: isClass 
            ? '3px solid hsl(32, 90%, 45%)' // Darker orange border for classes
            : '2px solid hsl(200, 75%, 50%)', // Blue border for attributes
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
            : '0 3px 8px hsl(200, 75%, 50% / 0.2)', // Blue shadow for attributes
          padding: '8px',
        },
        // Initially hide all attributes unless showAttributes is true
        hidden: isAttribute && !showAttributes,
      };
    });

    // Calculate initial layout
    return calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
  }, [graphData.nodes, graphData.edges, containerSize.width, containerSize.height, ttlData]); // Only recalculate on data change

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

  // Initialize nodes state with all nodes and their visibility
  useEffect(() => {
    if (initialNodes.length > 0) {
      // Apply saved positions to initial nodes
      const nodesWithSavedPositions = initialNodes.map(node => {
        const savedPos = savedNodePositions.get(node.id);
        return savedPos ? { ...node, position: savedPos } : node;
      });
      
      setNodes(nodesWithSavedPositions);
    }
  }, [initialNodes, savedNodePositions, setNodes]);

  // Update node visibility when showAttributes or expandedClasses change
  useEffect(() => {
    setNodes(currentNodes => 
      currentNodes.map(node => {
        const isAttribute = node.data?.type === 'attribute';
        const isClass = node.data?.type === 'class';
        
        if (isClass) {
          // Classes are always visible
          return { ...node, hidden: false };
        }
        
        if (isAttribute) {
          if (showAttributes) {
            // All attributes visible when global toggle is on
            return { ...node, hidden: false };
          } else {
            // Check if any connected class is expanded
            const connectedClasses = graphData.edges
              .filter(edge => edge.target === node.id)
              .map(edge => edge.source);
            const shouldShow = connectedClasses.some(classId => expandedClasses.has(classId));
            
            // Position attributes in circle around expanded class if visible
            if (shouldShow) {
              const connectedClass = graphData.edges
                .filter(edge => edge.target === node.id)
                .find(edge => expandedClasses.has(edge.source));
                
              if (connectedClass) {
                const classNode = currentNodes.find(n => n.id === connectedClass.source);
                if (classNode) {
                  // Get all attributes for this class
                  const classAttributes = graphData.edges
                    .filter(edge => edge.source === connectedClass.source && 
                      graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute')
                    .map(edge => edge.target);
                  
                  const attributeIndex = classAttributes.indexOf(node.id);
                  const totalAttributes = classAttributes.length;
                  
                  // Calculate circular position around class with collision avoidance
                  const baseRadius = 140;
                  const labelLength = typeof node.data?.label === 'string' ? node.data.label.length : 8;
                  const nodeSize = Math.max(50, Math.min(70, labelLength * 6));
                  const minDistance = nodeSize + 20;
                  
                  const circumference = totalAttributes * minDistance;
                  const calculatedRadius = Math.max(baseRadius, circumference / (2 * Math.PI));
                  
                  const angle = (attributeIndex / totalAttributes) * 2 * Math.PI;
                  const x = classNode.position.x + Math.cos(angle) * calculatedRadius;
                  const y = classNode.position.y + Math.sin(angle) * calculatedRadius;
                  
                  return {
                    ...node,
                    hidden: false,
                    position: { x, y }
                  };
                }
              }
            }
            
            return { ...node, hidden: !shouldShow };
          }
        }
        
        return node;
      })
    );
  }, [showAttributes, expandedClasses, graphData.edges, graphData.nodes, setNodes]);

  // Targeted drag handler that only updates dragged node and repositions its attributes
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        // Save position
        setSavedNodePositions(prev => {
          const newMap = new Map(prev);
          newMap.set(change.id, { x: change.position.x, y: change.position.y });
          return newMap;
        });
        
        // If a class was dragged and has expanded attributes, reposition them
        const draggedNode = nodes.find(n => n.id === change.id);
        if (draggedNode?.data?.type === 'class' && expandedClasses.has(change.id)) {
          setNodes(currentNodes => {
            // Find attributes connected to this class
            const classAttributes = graphData.edges
              .filter(edge => edge.source === change.id && 
                graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute')
              .map(edge => edge.target);
            
            return currentNodes.map(node => {
              if (classAttributes.includes(node.id) && !node.hidden) {
                // Recalculate circular position
                const attributeIndex = classAttributes.indexOf(node.id);
                const totalAttributes = classAttributes.length;
                
                const baseRadius = 140;
                const labelLength = typeof node.data?.label === 'string' ? node.data.label.length : 8;
                const nodeSize = Math.max(50, Math.min(70, labelLength * 6));
                const minDistance = nodeSize + 20;
                
                const circumference = totalAttributes * minDistance;
                const calculatedRadius = Math.max(baseRadius, circumference / (2 * Math.PI));
                
                const angle = (attributeIndex / totalAttributes) * 2 * Math.PI;
                const x = change.position.x + Math.cos(angle) * calculatedRadius;
                const y = change.position.y + Math.sin(angle) * calculatedRadius;
                
                return {
                  ...node,
                  position: { x, y }
                };
              }
              return node;
            });
          });
        }
      }
    });
  }, [onNodesChange, nodes, expandedClasses, graphData.edges, graphData.nodes, setNodes]);

  // Clear saved positions and expanded classes when data changes
  useEffect(() => {
    setSavedNodePositions(new Map<string, { x: number; y: number }>());
    setExpandedClasses(new Set()); // Reset expanded classes for new graph
  }, [ttlData]);

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
    if (initialNodes.length > 0) {
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
            background: isClass ? 'hsl(32, 95%, 55%)' : isAttribute ? 'hsl(200, 85%, 65%)' : 'hsl(32, 85%, 60%)',
            color: isClass ? 'hsl(32, 100%, 15%)' : 'hsl(200, 90%, 20%)',
            border: isClass ? '3px solid hsl(32, 90%, 45%)' : '2px solid hsl(200, 75%, 50%)',
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
            boxShadow: isClass ? '0 6px 16px hsl(32, 85%, 45% / 0.3)' : '0 3px 8px hsl(200, 75%, 50% / 0.2)',
            padding: '8px',
          },
          hidden: isAttribute && !showAttributes,
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
  }, [initialNodes, graphData.nodes, graphData.edges, containerSize, setNodes, useHierarchicalLayout, showAttributes]);

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