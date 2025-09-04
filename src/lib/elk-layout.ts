import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs';
import { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export const calculateHierarchicalLayout = async (
  nodes: Node[], 
  edges: Edge[], 
  width: number = 800, 
  height: number = 600
): Promise<Node[]> => {
  // Separate classes and attributes for layered layout
  const classNodes = nodes.filter(node => node.type === 'class');
  const attributeNodes = nodes.filter(node => node.type === 'attribute');
  
  // Create ELK nodes
  const elkNodes: ElkNode[] = nodes.map(node => ({
    id: node.id,
    width: 150,
    height: 80,
    // Add type-based properties for layering
    properties: {
      'org.eclipse.elk.layered.layering.nodePromotion.strategy': node.type === 'class' ? 'INTERACTIVE' : 'NONE',
      'org.eclipse.elk.layered.layering.layer': node.type === 'class' ? '0' : '1'
    }
  }));

  // Create ELK edges
  const elkEdges: ElkExtendedEdge[] = edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target]
  }));

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '100',
      'elk.layered.spacing.nodeNodeBetweenLayers': '150',
      'elk.spacing.edgeNode': '50',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'SIMPLE',
      'elk.layered.edgeRouting': 'ORTHOGONAL',
      'elk.padding': '[top=50,left=50,bottom=50,right=50]'
    },
    children: elkNodes,
    edges: elkEdges
  };

  try {
    const layoutedGraph = await elk.layout(elkGraph);
    
    // Map back to React Flow nodes with new positions
    return nodes.map(node => {
      const elkNode = layoutedGraph.children?.find(n => n.id === node.id);
      return {
        ...node,
        position: {
          x: elkNode?.x || 0,
          y: elkNode?.y || 0,
        },
      };
    });
  } catch (error) {
    console.error('ELK layout failed, falling back to original positions:', error);
    return nodes;
  }
};