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
  MarkerType,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getBezierPath
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

// Simple node component with native tooltip
const SimpleNode: React.FC<NodeProps> = ({ data, selected, ...props }) => {
  return (
    <div 
      className="cursor-pointer"
      title={String(data.label || 'Unknown')}
    >
      {String(data.label || 'Unknown')}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Simple edge component with native tooltip
const SimpleEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  ...props
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g className="react-flow__edge-default">
      <title>{String(label || 'Connection')}</title>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          className="react-flow__edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '12px', fontWeight: '500' }}
        >
          {String(label)}
        </text>
      )}
    </g>
  );
};

const nodeTypes = {
  default: SimpleNode,
};

const edgeTypes = {
  default: SimpleEdge,
};

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
  
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set());
  const [savedNodePositions, setSavedNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map<string, { x: number; y: number }>());
  const [manuallyMovedNodes, setManuallyMovedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  
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

    // Calculate initial layout using force layout
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
    // Filter edges with refined visibility logic
    const filteredEdges = graphData.edges.filter(edge => {
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      // Always include class-to-class edges
      if (sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'class') {
        return true;
      }
      
      // Handle class-to-attribute edges
      if (sourceNode?.data?.type === 'class' && targetNode?.data?.type === 'attribute') {
        if (showAttributes) {
          // When attributes are globally ON, show unless class is in collapsedClasses
          return !collapsedClasses.has(edge.source);
        } else {
          // When attributes are globally OFF, show only if class is in expandedClasses
          return expandedClasses.has(edge.source);
        }
      }
      
      return false;
    });

    return filteredEdges.map((edge) => {
      const edgeId = `${edge.source}-${edge.target}`;
      const isHighlighted = highlightedEdges.has(edgeId);
      
      // Get source and target node data for edge label
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      
      return {
        ...edge,
        type: 'default',
        label: edge.label || `${sourceNode?.data?.label || edge.source} → ${targetNode?.data?.label || edge.target}`,
        style: {
          stroke: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: isHighlighted ? 4 : 2,
        },
        labelBgStyle: {
          fill: 'hsl(var(--background))',
          fillOpacity: 0.8,
        },
        labelStyle: {
          fill: 'hsl(var(--foreground))',
          fontSize: '12px',
          fontWeight: '500',
        },
      };
    });
  }, [graphData.edges, showAttributes, graphData.nodes, expandedClasses, collapsedClasses, highlightedEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize nodes state with all nodes and their visibility (don't depend on savedNodePositions to avoid re-creation)
  useEffect(() => {
    if (initialNodes.length > 0) {
      // Apply saved positions to initial nodes
      const nodesWithSavedPositions = initialNodes.map(node => {
        const savedPos = savedNodePositions.get(node.id);
        return savedPos ? { ...node, position: savedPos } : node;
      });
      
      setNodes(nodesWithSavedPositions);
    }
  }, [initialNodes, setNodes]); // Remove savedNodePositions dependency to prevent re-creation

  // Update node visibility when showAttributes, expandedClasses, or collapsedClasses change
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
          // Find connected classes
          const connectedClasses = graphData.edges
            .filter(edge => edge.target === node.id)
            .map(edge => edge.source);
          
          let shouldShow = false;
          let targetPosition = null;
          
          if (showAttributes) {
            // When globally ON, show unless ALL connected classes are collapsed
            shouldShow = connectedClasses.some(classId => !collapsedClasses.has(classId));
            
            // Find first non-collapsed class for positioning
            const activeClass = connectedClasses.find(classId => !collapsedClasses.has(classId));
            if (activeClass && shouldShow) {
              const classNode = currentNodes.find(n => n.id === activeClass);
              if (classNode && !manuallyMovedNodes.has(node.id)) {
                // Calculate position only if not manually moved
                const classAttributes = graphData.edges
                  .filter(edge => edge.source === activeClass && 
                    graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute' &&
                    !collapsedClasses.has(activeClass))
                  .map(edge => edge.target);
                
                const attributeIndex = classAttributes.indexOf(node.id);
                const totalAttributes = classAttributes.length;
                
                if (attributeIndex >= 0) {
                  const baseRadius = 140;
                  const labelLength = typeof node.data?.label === 'string' ? node.data.label.length : 8;
                  const nodeSize = Math.max(50, Math.min(70, labelLength * 6));
                  const minDistance = nodeSize + 20;
                  
                  const circumference = totalAttributes * minDistance;
                  const calculatedRadius = Math.max(baseRadius, circumference / (2 * Math.PI));
                  
                  const angle = (attributeIndex / totalAttributes) * 2 * Math.PI;
                  const x = classNode.position.x + Math.cos(angle) * calculatedRadius;
                  const y = classNode.position.y + Math.sin(angle) * calculatedRadius;
                  
                  targetPosition = { x, y };
                }
              }
            }
          } else {
            // When globally OFF, show only if ANY connected class is expanded
            shouldShow = connectedClasses.some(classId => expandedClasses.has(classId));
            
            // Find first expanded class for positioning
            const activeClass = connectedClasses.find(classId => expandedClasses.has(classId));
            if (activeClass && shouldShow) {
              const classNode = currentNodes.find(n => n.id === activeClass);
              if (classNode && !manuallyMovedNodes.has(node.id)) {
                // Calculate position only if not manually moved
                const classAttributes = graphData.edges
                  .filter(edge => edge.source === activeClass && 
                    graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute')
                  .map(edge => edge.target);
                
                const attributeIndex = classAttributes.indexOf(node.id);
                const totalAttributes = classAttributes.length;
                
                if (attributeIndex >= 0) {
                  const baseRadius = 140;
                  const labelLength = typeof node.data?.label === 'string' ? node.data.label.length : 8;
                  const nodeSize = Math.max(50, Math.min(70, labelLength * 6));
                  const minDistance = nodeSize + 20;
                  
                  const circumference = totalAttributes * minDistance;
                  const calculatedRadius = Math.max(baseRadius, circumference / (2 * Math.PI));
                  
                  const angle = (attributeIndex / totalAttributes) * 2 * Math.PI;
                  const x = classNode.position.x + Math.cos(angle) * calculatedRadius;
                  const y = classNode.position.y + Math.sin(angle) * calculatedRadius;
                  
                  targetPosition = { x, y };
                }
              }
            }
          }
          
          return {
            ...node,
            hidden: !shouldShow,
            ...(targetPosition && { position: targetPosition })
          };
        }
        
        return node;
      })
    );
  }, [showAttributes, expandedClasses, collapsedClasses, graphData.edges, graphData.nodes, setNodes, manuallyMovedNodes]);

  // Targeted drag handler that tracks manual moves and repositions attributes
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        if (change.dragging) {
          // Mark as manually moved when dragging starts/continues
          const draggedNode = nodes.find(n => n.id === change.id);
          if (draggedNode?.data?.type === 'attribute') {
            setManuallyMovedNodes(prev => new Set(prev).add(change.id));
          }
        } else {
          // Save position when dragging ends
          setSavedNodePositions(prev => {
            const newMap = new Map(prev);
            newMap.set(change.id, { x: change.position.x, y: change.position.y });
            return newMap;
          });
          
          // If a class was dragged and has visible attributes, reposition only non-manually-moved ones
          const draggedNode = nodes.find(n => n.id === change.id);
          if (draggedNode?.data?.type === 'class') {
            const hasVisibleAttributes = showAttributes 
              ? !collapsedClasses.has(change.id)
              : expandedClasses.has(change.id);
              
            if (hasVisibleAttributes) {
              setNodes(currentNodes => {
                // Find attributes connected to this class
                const classAttributes = graphData.edges
                  .filter(edge => edge.source === change.id && 
                    graphData.nodes.find(n => n.id === edge.target)?.data?.type === 'attribute')
                  .map(edge => edge.target);
                
                return currentNodes.map(node => {
                  if (classAttributes.includes(node.id) && !node.hidden && !manuallyMovedNodes.has(node.id)) {
                    // Only reposition if not manually moved
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
        }
      }
    });
  }, [onNodesChange, nodes, expandedClasses, collapsedClasses, showAttributes, graphData.edges, graphData.nodes, setNodes, manuallyMovedNodes]);

  // Clear all tracking state when data changes
  useEffect(() => {
    setSavedNodePositions(new Map<string, { x: number; y: number }>());
    setExpandedClasses(new Set());
    setCollapsedClasses(new Set());
    setManuallyMovedNodes(new Set());
    setHighlightedEdges(new Set());
  }, [ttlData]);

  // Universal double-click handler that works in both modes
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node double-clicked:', node);
    
    if (node.data?.type === 'class') {
      if (showAttributes) {
        // When attributes are globally ON, toggle individual class collapse
        setCollapsedClasses(prev => {
          const newSet = new Set(prev);
          if (newSet.has(node.id)) {
            newSet.delete(node.id);
          } else {
            newSet.add(node.id);
          }
          return newSet;
        });
      } else {
        // When attributes are globally OFF, toggle individual class expansion
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
    }
  }, [showAttributes]);

  // Edge click handler for highlighting
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const edgeId = `${edge.source}-${edge.target}`;
    
    setHighlightedEdges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(edgeId)) {
        newSet.delete(edgeId);
      } else {
        newSet.add(edgeId);
      }
      return newSet;
    });
  }, []);

  const relayoutGraph = useCallback(async () => {
    if (initialNodes.length > 0) {
      // Clear all tracking state to force fresh calculation
      setSavedNodePositions(new Map<string, { x: number; y: number }>());
      setExpandedClasses(new Set());
      setCollapsedClasses(new Set());
      setManuallyMovedNodes(new Set());
      setHighlightedEdges(new Set());
      
      // Recalculate fresh layout using force layout
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
      
      const newLayout = calculateLayout(baseNodes, graphData.edges, containerSize.width, containerSize.height);
      setNodes(newLayout);
    }
  }, [initialNodes, graphData.nodes, graphData.edges, containerSize, setNodes, showAttributes]);

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
            // Clean up state when toggling
            if (newValue) {
              // Clear expanded classes when turning attributes ON globally
              setExpandedClasses(new Set());
            } else {
              // Clear collapsed classes when turning attributes OFF globally
              setCollapsedClasses(new Set());
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
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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