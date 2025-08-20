import { Parser } from 'n3';
import { Node, Edge } from '@xyflow/react';
import React from 'react';

export interface ParsedTTLData {
  nodes: Node[];
  edges: Edge[];
}

export interface EntityProperty {
  name: string;
  type: 'datatype' | 'object';
  range?: string;
  domain?: string;
}

export interface EntityClass {
  name: string;
  uri: string;
  comment?: string;
  properties: EntityProperty[];
  relationships: EntityProperty[];
}

export interface ParsedEntities {
  entities: EntityClass[];
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

export function buildClassERGraph(ttlData: string): ParsedTTLData {
  console.log("Building class ER graph...");
  const parser = new Parser();
  const quads = parser.parse(ttlData);
  
  const classes = new Map<string, Node>();
  const edges: Edge[] = [];
  let nodeCount = 0;
  let edgeCount = 0;

  // First pass: Find all classes
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        (quad.object.value === 'http://www.w3.org/2002/07/owl#Class' ||
         quad.object.value === 'http://www.w3.org/2000/01/rdf-schema#Class')) {
      const classUri = quad.subject.value;
      const className = getShortName(classUri);
      
      if (!classes.has(classUri)) {
        classes.set(classUri, {
          id: `class-${nodeCount++}`,
          data: { label: className, uri: classUri, type: 'class' },
          position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
          type: 'class',
          style: {
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: '2px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '120px',
            textAlign: 'center' as const,
            fontWeight: '600'
          }
        });
      }
    }
  });

  // Second pass: Find object properties that connect classes
  const objectProperties = new Set<string>();
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        quad.object.value === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
      objectProperties.add(quad.subject.value);
    }
  });

  // Third pass: Create edges for object properties with domain and range
  const propertyConnections = new Map<string, { domain?: string, range?: string }>();
  
  quads.forEach((quad) => {
    const predicate = quad.predicate.value;
    const subject = quad.subject.value;
    
    if (objectProperties.has(subject)) {
      if (!propertyConnections.has(subject)) {
        propertyConnections.set(subject, {});
      }
      const connection = propertyConnections.get(subject)!;
      
      if (predicate === 'http://www.w3.org/2000/01/rdf-schema#domain') {
        connection.domain = quad.object.value;
      } else if (predicate === 'http://www.w3.org/2000/01/rdf-schema#range') {
        connection.range = quad.object.value;
      }
    }
  });

  // Create edges between classes based on object properties
  propertyConnections.forEach((connection, propertyUri) => {
    if (connection.domain && connection.range && 
        classes.has(connection.domain) && classes.has(connection.range)) {
      const sourceNode = classes.get(connection.domain)!;
      const targetNode = classes.get(connection.range)!;
      const propertyName = getShortName(propertyUri);
      
      edges.push({
        id: `edge-${edgeCount++}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: propertyName,
        type: 'default',
        style: { 
          stroke: 'hsl(var(--muted-foreground))', 
          strokeWidth: 2 
        },
        labelStyle: { 
          fill: 'hsl(var(--foreground))', 
          fontSize: '12px',
          fontWeight: '500'
        }
      });
    }
  });

  console.log("Created class nodes:", classes.size);
  console.log("Created relationship edges:", edges.length);

  return {
    nodes: Array.from(classes.values()),
    edges
  };
}

export function parseTTLToEntities(ttlData: string): ParsedEntities {
  console.log("Starting TTL entity parsing...");
  const parser = new Parser();
  const quads = parser.parse(ttlData);
  
  console.log("Parsed quads:", quads.length);
  
  const classes = new Map<string, EntityClass>();
  const properties = new Map<string, EntityProperty>();
  
  // Extract prefixes from TTL data
  const prefixMap = new Map<string, string>();
  const prefixRegex = /@prefix\s+(\w+):\s+<([^>]+)>\s*\./g;
  let match;
  while ((match = prefixRegex.exec(ttlData)) !== null) {
    prefixMap.set(match[2], match[1]);
  }
  
  // Helper function to get short name
  const getEntityName = (uri: string): string => {
    for (const [fullPrefix, shortPrefix] of prefixMap.entries()) {
      if (uri.startsWith(fullPrefix)) {
        return uri.replace(fullPrefix, '');
      }
    }
    const parts = uri.split(/[#/]/);
    return parts[parts.length - 1] || uri;
  };
  
  // First pass: identify classes
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        quad.object.value === 'http://www.w3.org/2002/07/owl#Class') {
      const classUri = quad.subject.value;
      const className = getEntityName(classUri);
      
      if (!classes.has(classUri)) {
        classes.set(classUri, {
          name: className,
          uri: classUri,
          properties: [],
          relationships: []
        });
      }
    }
  });
  
  // Second pass: get comments for classes
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/2000/01/rdf-schema#comment' &&
        classes.has(quad.subject.value)) {
      const classEntity = classes.get(quad.subject.value);
      if (classEntity) {
        classEntity.comment = quad.object.value;
      }
    }
  });
  
  // Third pass: identify properties
  quads.forEach((quad) => {
    const predicate = quad.predicate.value;
    const subject = quad.subject.value;
    
    if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
      const objectValue = quad.object.value;
      if (objectValue === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
        const propName = getEntityName(subject);
        properties.set(subject, {
          name: propName,
          type: 'datatype'
        });
      } else if (objectValue === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
        const propName = getEntityName(subject);
        properties.set(subject, {
          name: propName,
          type: 'object'
        });
      }
    }
  });
  
  // Fourth pass: get property domains and ranges
  quads.forEach((quad) => {
    const predicate = quad.predicate.value;
    const subject = quad.subject.value;
    
    if (properties.has(subject)) {
      const property = properties.get(subject)!;
      
      if (predicate === 'http://www.w3.org/2000/01/rdf-schema#domain') {
        property.domain = getEntityName(quad.object.value);
      } else if (predicate === 'http://www.w3.org/2000/01/rdf-schema#range') {
        // Handle unionOf ranges
        if (quad.object.termType === 'BlankNode') {
          // This might be a unionOf - we'll simplify and just show as generic range
          property.range = 'Multiple Types';
        } else {
          property.range = getEntityName(quad.object.value);
        }
      }
    }
  });
  
  // Fifth pass: assign properties to classes
  properties.forEach((property) => {
    if (property.domain) {
      // Find the class by name (since we converted URIs to names)
      const classEntity = Array.from(classes.values()).find(c => c.name === property.domain);
      if (classEntity) {
        if (property.type === 'datatype') {
          classEntity.properties.push(property);
        } else {
          classEntity.relationships.push(property);
        }
      }
    }
  });
  
  console.log("Parsed entities:", classes.size);
  console.log("Parsed properties:", properties.size);
  
  return {
    entities: Array.from(classes.values())
  };
}