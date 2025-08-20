import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum
} from 'd3-force';
import { Node, Edge } from '@xyflow/react';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  type?: string;
  data?: any;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export const calculateLayout = (
  nodes: Node[], 
  edges: Edge[], 
  width: number = 800, 
  height: number = 600
): Node[] => {
  // Create simulation nodes with initial positions based on type
  const simulationNodes: GraphNode[] = nodes.map((node, index) => {
    // Seed initial positions by type to create better grouping
    let initialX = width / 2;
    let initialY = height / 2;
    
    if (node.type === 'class') {
      initialX = width * 0.3 + (Math.random() - 0.5) * 100;
      initialY = height * 0.3 + (Math.random() - 0.5) * 100;
    } else if (node.type === 'individual') {
      initialX = width * 0.7 + (Math.random() - 0.5) * 100;
      initialY = height * 0.7 + (Math.random() - 0.5) * 100;
    } else {
      initialX = width * 0.5 + (Math.random() - 0.5) * 200;
      initialY = height * 0.5 + (Math.random() - 0.5) * 200;
    }

    return {
      id: node.id,
      type: node.type,
      data: node.data,
      x: initialX,
      y: initialY,
    };
  });

  // Create simulation links
  const simulationLinks: GraphLink[] = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create and run the simulation
  const simulation = forceSimulation(simulationNodes)
    .force('link', forceLink(simulationLinks)
      .id((d: any) => d.id)
      .distance(150)
      .strength(0.5)
    )
    .force('charge', forceManyBody()
      .strength(-800)
      .distanceMax(400)
    )
    .force('center', forceCenter(width / 2, height / 2))
    .force('collision', forceCollide()
      .radius(60)
      .strength(0.8)
    );

  // Run simulation synchronously
  simulation.stop();
  for (let i = 0; i < 300; ++i) {
    simulation.tick();
  }

  // Return nodes with updated positions
  return nodes.map((node) => {
    const simNode = simulationNodes.find(n => n.id === node.id);
    return {
      ...node,
      position: {
        x: (simNode?.x || 0) - 50, // Offset for node center
        y: (simNode?.y || 0) - 50,
      },
    };
  });
};