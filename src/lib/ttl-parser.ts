import { Parser } from 'n3';
import { Node, Edge } from '@xyflow/react';
import React from 'react';

export interface ParsedTTLData {
  nodes: Node[];
  edges: Edge[];
}

export function parseTTLToGraph(ttlData: string): ParsedTTLData {
  console.log("Starting TTL parsing...");
  const parser = new Parser();
  const quads = parser.parse(ttlData);
  
  console.log("Parsed quads:", quads.length);
  
  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];
  let nodeCount = 0;
  let edgeCount = 0;

  // First pass: Create nodes for all entities
  quads.forEach((quad) => {
    const subject = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object.value;

    // Create node for subject if it doesn't exist
    if (!nodes.has(subject)) {
      const label = getShortName(subject);
      const nodeId = `node-${nodeCount++}`;
      
      // Determine node type based on the triple
      let nodeType = 'entity';
      let nodeStyle: React.CSSProperties = {
        background: 'hsl(var(--secondary))',
        color: 'hsl(var(--secondary-foreground))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '120px',
        textAlign: 'center' as const
      };

      // Check if it's a class
      if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && 
          (object.includes('rdfs#Class') || object.includes('Class'))) {
        nodeType = 'class';
        nodeStyle.background = 'hsl(var(--primary))';
        nodeStyle.color = 'hsl(var(--primary-foreground))';
      }
      // Check if it's an instance/individual
      else if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        nodeType = 'individual';
        nodeStyle.background = 'hsl(var(--accent))';
        nodeStyle.color = 'hsl(var(--accent-foreground))';
      }

      nodes.set(subject, {
        id: nodeId,
        data: { label, uri: subject, type: nodeType },
        position: { 
          x: Math.random() * 800, 
          y: Math.random() * 600 
        },
        type: 'default',
        style: nodeStyle
      });
    }

    // Create node for object if it's a URI and doesn't exist
    if (quad.object.termType === 'NamedNode' && !nodes.has(object)) {
      const label = getShortName(object);
      const nodeId = `node-${nodeCount++}`;
      
      nodes.set(object, {
        id: nodeId,
        data: { label, uri: object, type: 'entity' },
        position: { 
          x: Math.random() * 800, 
          y: Math.random() * 600 
        },
        type: 'default',
        style: {
          background: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          textAlign: 'center' as const
        }
      });
    }
  });

  // Second pass: Create edges for relationships
  quads.forEach((quad) => {
    const subject = quad.subject.value;
    const predicate = quad.predicate.value;
    const object = quad.object.value;

    // Skip basic RDF/RDFS properties that don't add meaningful relationships
    if (predicate.includes('rdf-syntax-ns#type') || 
        predicate.includes('rdfs#label') || 
        predicate.includes('rdfs#comment')) {
      return;
    }

    const sourceNode = nodes.get(subject);
    const targetNode = nodes.get(object);

    if (sourceNode && targetNode && quad.object.termType === 'NamedNode') {
      edges.push({
        id: `edge-${edgeCount++}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: getShortName(predicate),
        type: 'default',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 },
        labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '11px' }
      });
    }
  });

  console.log("Created nodes:", nodes.size);
  console.log("Created edges:", edges.length);

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
        textAlign: 'center' as const,
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
        textAlign: 'center' as const,
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
        textAlign: 'center' as const,
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
        textAlign: 'center' as const,
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
        textAlign: 'center' as const,
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
        textAlign: 'center' as const,
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