import { Parser } from 'n3';
import { Node, Edge, MarkerType } from '@xyflow/react';
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
        label: humanizeName(getShortName(predicate)),
        type: 'default',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 },
        labelStyle: { fill: 'hsl(var(--foreground))', fontSize: '11px' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: 'hsl(var(--muted-foreground))'
        }
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

function humanizeName(name: string): string {
  return name
    // Convert camelCase to space-separated words
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Convert underscores and hyphens to spaces
    .replace(/[_-]/g, ' ')
    // Capitalize first letter and make rest lowercase
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    // Handle common relationship patterns
    .replace(/^Has\s/, 'has ')
    .replace(/^Is\s/, 'is ')
    .replace(/^Belongs\s/, 'belongs ')
    .replace(/^Contains\s/, 'contains ')
    .replace(/^Includes\s/, 'includes ');
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

// Build ER graph with only classes and their object properties (relationships)
export function buildClassERGraph(ttlData: string): ParsedTTLData {
  console.log("Building ER diagram with orange bubble nodes...");
  const parser = new Parser();
  const quads = parser.parse(ttlData);
  
  console.log("Parsed quads:", quads.length);
  
  const classes = new Map<string, Node>();
  const attributes = new Map<string, Node>();
  const objectProperties = new Map<string, { name: string; domain?: string; range?: string }>();
  const dataTypeProperties = new Map<string, { name: string; domain?: string }>();
  const edges: Edge[] = [];
  let nodeCount = 0;
  let edgeCount = 0;
  
  // Extract prefixes from TTL data
  const prefixMap = new Map<string, string>();
  const prefixRegex = /@prefix\s+(\w+):\s+<([^>]+)>\s*\./g;
  let match;
  while ((match = prefixRegex.exec(ttlData)) !== null) {
    prefixMap.set(match[2], match[1]);
  }
  
  // Helper function to get short name (ignore labels and comments)
  const getEntityName = (uri: string): string => {
    for (const [fullPrefix, shortPrefix] of prefixMap.entries()) {
      if (uri.startsWith(fullPrefix)) {
        return uri.replace(fullPrefix, '');
      }
    }
    const parts = uri.split(/[#/]/);
    return parts[parts.length - 1] || uri;
  };
  
  // First pass: identify classes (orange bubble nodes)
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        quad.object.value === 'http://www.w3.org/2002/07/owl#Class') {
      const classUri = quad.subject.value;
      const className = getEntityName(classUri);
      
      if (!classes.has(classUri)) {
        const nodeId = `class-${nodeCount++}`;
        classes.set(classUri, {
          id: nodeId,
          data: { label: className, uri: classUri, type: 'class' },
          position: { x: Math.random() * 800, y: Math.random() * 600 },
          type: 'default'
        });
      }
    }
  });
  
  // Second pass: identify datatype properties (attributes - smaller orange nodes)
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        quad.object.value === 'http://www.w3.org/2002/07/owl#DatatypeProperty') {
      const propUri = quad.subject.value;
      const propName = getEntityName(propUri);
      
      // Only create essential attributes (skip common prefixes like rdfs, owl)
      if (!propName.startsWith('rdfs:') && !propName.startsWith('owl:') && 
          !propName.includes('label') && !propName.includes('comment')) {
        dataTypeProperties.set(propUri, {
          name: propName
        });
      }
    }
  });
  
  // Third pass: identify object properties for relationships
  quads.forEach((quad) => {
    if (quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        quad.object.value === 'http://www.w3.org/2002/07/owl#ObjectProperty') {
      const propUri = quad.subject.value;
      const propName = getEntityName(propUri);
      
      objectProperties.set(propUri, {
        name: propName
      });
    }
  });
  
  // Fourth pass: get domains for datatype properties and create attribute nodes
  quads.forEach((quad) => {
    const predicate = quad.predicate.value;
    const subject = quad.subject.value;
    
    if (dataTypeProperties.has(subject) && 
        predicate === 'http://www.w3.org/2000/01/rdf-schema#domain') {
      const property = dataTypeProperties.get(subject)!;
      property.domain = quad.object.value;
      
      // Create attribute node
      const attrId = `attr-${nodeCount++}`;
      attributes.set(subject, {
        id: attrId,
        data: { label: property.name, uri: subject, type: 'attribute' },
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        type: 'default'
      });
    }
    
    // Get domains and ranges for object properties
    if (objectProperties.has(subject)) {
      const property = objectProperties.get(subject)!;
      
      if (predicate === 'http://www.w3.org/2000/01/rdf-schema#domain') {
        property.domain = quad.object.value;
      } else if (predicate === 'http://www.w3.org/2000/01/rdf-schema#range') {
        property.range = quad.object.value;
      }
    }
  });
  
  // Fifth pass: create edges for class-attribute relationships
  dataTypeProperties.forEach((property, propUri) => {
    if (property.domain && classes.has(property.domain)) {
      const classNode = classes.get(property.domain);
      const attrNode = attributes.get(propUri);
      
      if (classNode && attrNode) {
        edges.push({
          id: `edge-${edgeCount++}`,
          source: classNode.id,
          target: attrNode.id,
          type: 'default',
          style: { 
            stroke: 'hsl(32, 75%, 60%)', 
            strokeWidth: 1,
            strokeDasharray: '5,5'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: 'hsl(32, 75%, 60%)'
          }
        });
      }
    }
  });
  
  // Seventh pass: create edges for class-class relationships
  objectProperties.forEach((property) => {
    if (property.domain && property.range && 
        classes.has(property.domain) && classes.has(property.range)) {
      const sourceNode = classes.get(property.domain);
      const targetNode = classes.get(property.range);
      
      if (sourceNode && targetNode) {
        edges.push({
          id: `edge-${edgeCount++}`,
          source: sourceNode.id,
          target: targetNode.id,
          label: property.name,
          type: 'default',
          style: { 
            stroke: 'hsl(32, 85%, 45%)', 
            strokeWidth: 2
          },
          labelStyle: { 
            fill: 'hsl(32, 85%, 25%)', 
            fontSize: '12px',
            fontWeight: '500'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: 'hsl(32, 85%, 45%)'
          }
        });
      }
    }
  });
  
  console.log("Created class nodes:", classes.size);
  console.log("Created attribute nodes:", attributes.size);
  console.log("Created relationship edges:", edges.length);
  
  const allNodes = [...Array.from(classes.values()), ...Array.from(attributes.values())];
  
  return {
    nodes: allNodes,
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
  
  // Third pass: identify properties (including datatypes for human readable)
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
  
  // Fifth pass: identify classes that have relationships with other classes
  const classesWithRelationships = new Set<string>();
  
  // Only add classes that have object properties (relationships with other classes)
  // Don't include classes that only have datatype properties (attributes)
  properties.forEach((property) => {
    if (property.type === 'object' && property.domain) {
      // Find the class URI by name
      const classEntity = Array.from(classes.entries()).find(([uri, c]) => c.name === property.domain);
      if (classEntity) {
        classesWithRelationships.add(classEntity[0]);
      }
    }
    if (property.type === 'object' && property.range) {
      // Also include range classes for object properties
      const rangeClassEntity = Array.from(classes.entries()).find(([uri, c]) => c.name === property.range);
      if (rangeClassEntity) {
        classesWithRelationships.add(rangeClassEntity[0]);
      }
    }
  });
  
  // Filter classes to only include those with relationships
  const filteredClasses = new Map<string, EntityClass>();
  classesWithRelationships.forEach((classUri) => {
    if (classes.has(classUri)) {
      filteredClasses.set(classUri, classes.get(classUri)!);
    }
  });
  
  // Update classes map
  classes.clear();
  filteredClasses.forEach((entity, uri) => {
    classes.set(uri, entity);
  });

  // Sixth pass: assign properties to classes
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