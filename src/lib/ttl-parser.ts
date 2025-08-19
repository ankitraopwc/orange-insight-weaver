import { Parser } from 'n3';
import { Node, Edge } from '@xyflow/react';

export interface ParsedTTLData {
  nodes: Node[];
  edges: Edge[];
}

export function parseTTLToGraph(ttlData: string): ParsedTTLData {
  const parser = new Parser();
  const quads = parser.parse(ttlData);
  
  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];
  let nodeCount = 0;
  let edgeCount = 0;

  // Extract classes and individuals
  quads.forEach((quad) => {
    const subject = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object.value;

    // Create nodes for classes and individuals
    if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && 
        object === 'http://www.w3.org/2000/01/rdf-schema#Class') {
      const nodeId = `class-${nodeCount++}`;
      const label = getShortName(subject);
      
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          id: nodeId,
          data: { label, uri: subject, type: 'class' },
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          type: 'default',
          style: {
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '120px',
            textAlign: 'center'
          }
        });
      }
    }

    // Create nodes for individuals
    if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && 
        !object.includes('rdfs#Class')) {
      const nodeId = `individual-${nodeCount++}`;
      const label = getShortName(subject);
      
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          id: nodeId,
          data: { label, uri: subject, type: 'individual' },
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          type: 'default',
          style: {
            background: 'hsl(var(--accent))',
            color: 'hsl(var(--accent-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '120px',
            textAlign: 'center'
          }
        });
      }
    }
  });

  // Create edges for relationships
  quads.forEach((quad) => {
    const subject = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object.value;

    // Skip basic RDF/RDFS properties
    if (predicate.includes('rdf-syntax-ns#') || predicate.includes('rdfs#')) {
      return;
    }

    const sourceNode = Array.from(nodes.values()).find(n => n.data.uri === subject);
    const targetNode = Array.from(nodes.values()).find(n => n.data.uri === object);

    if (sourceNode && targetNode) {
      edges.push({
        id: `edge-${edgeCount++}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: getShortName(predicate),
        type: 'default',
        style: { stroke: 'hsl(var(--muted-foreground))' },
        labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
      });
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    edges
  };
}

function getShortName(uri: string): string {
  const parts = uri.split(/[#/]/);
  return parts[parts.length - 1] || uri;
}

// Create placeholder medical ER diagram
export function createMedicalPlaceholderGraph(): ParsedTTLData {
  const nodes: Node[] = [
    {
      id: 'patient',
      data: { label: 'Patient', type: 'class' },
      position: { x: 100, y: 100 },
      type: 'default',
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    },
    {
      id: 'doctor',
      data: { label: 'Doctor', type: 'class' },
      position: { x: 400, y: 100 },
      type: 'default',
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    },
    {
      id: 'diagnosis',
      data: { label: 'Diagnosis', type: 'class' },
      position: { x: 250, y: 250 },
      type: 'default',
      style: {
        background: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    },
    {
      id: 'treatment',
      data: { label: 'Treatment', type: 'class' },
      position: { x: 550, y: 250 },
      type: 'default',
      style: {
        background: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    },
    {
      id: 'medication',
      data: { label: 'Medication', type: 'class' },
      position: { x: 100, y: 400 },
      type: 'default',
      style: {
        background: 'hsl(var(--secondary))',
        color: 'hsl(var(--secondary-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    },
    {
      id: 'hospital',
      data: { label: 'Hospital', type: 'class' },
      position: { x: 400, y: 400 },
      type: 'default',
      style: {
        background: 'hsl(var(--secondary))',
        color: 'hsl(var(--secondary-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '500'
      }
    }
  ];

  const edges: Edge[] = [
    {
      id: 'patient-doctor',
      source: 'patient',
      target: 'doctor',
      label: 'treated by',
      type: 'default',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
    },
    {
      id: 'patient-diagnosis',
      source: 'patient',
      target: 'diagnosis',
      label: 'has',
      type: 'default',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
    },
    {
      id: 'doctor-treatment',
      source: 'doctor',
      target: 'treatment',
      label: 'prescribes',
      type: 'default',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
    },
    {
      id: 'treatment-medication',
      source: 'treatment',
      target: 'medication',
      label: 'includes',
      type: 'default',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
    },
    {
      id: 'doctor-hospital',
      source: 'doctor',
      target: 'hospital',
      label: 'works at',
      type: 'default',
      style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 },
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '12px' }
    }
  ];

  return { nodes, edges };
}