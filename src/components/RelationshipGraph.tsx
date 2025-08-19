import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { parseTTLToGraph, createMedicalPlaceholderGraph } from "@/lib/ttl-parser";

interface RelationshipGraphProps {
  ttlData?: string;
}

export const RelationshipGraph = ({ ttlData }: RelationshipGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    if (ttlData) {
      // Handle case where ttlData might be a JSON object with ttl property
      const actualTtlData = typeof ttlData === 'string' ? ttlData : (ttlData as any)?.ttl || ttlData;
      console.log("Parsing TTL Data:", typeof actualTtlData === 'string' ? actualTtlData.substring(0, 200) + "..." : actualTtlData);
      try {
        const parsedGraph = parseTTLToGraph(actualTtlData);
        console.log("Successfully parsed graph with", parsedGraph.nodes.length, "nodes and", parsedGraph.edges.length, "edges");
        setNodes(parsedGraph.nodes);
        setEdges(parsedGraph.edges);
      } catch (error) {
        console.error("Error parsing TTL data:", error);
        console.error("TTL Data type:", typeof ttlData);
        console.error("TTL Data:", ttlData);
        // Fallback to placeholder if parsing fails
        const placeholderGraph = createMedicalPlaceholderGraph();
        setNodes(placeholderGraph.nodes);
        setEdges(placeholderGraph.edges);
      }
    } else {
      // Show medical placeholder when no TTL data
      const placeholderGraph = createMedicalPlaceholderGraph();
      setNodes(placeholderGraph.nodes);
      setEdges(placeholderGraph.edges);
    }
  }, [ttlData, setNodes, setEdges]);

  // Commented out graph visualization - will show human readable format instead
  /* 
  return (
    <div className="flex-1">
      <div className="bg-card border border-border rounded-lg h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">
              {ttlData ? "Ontology Relationship Graph" : "Sample Medical Entity Relationships"}
            </h3>
            {!ttlData && (
              <span className="text-sm text-muted-foreground">
                Click Ontology to generate actual relationships
              </span>
            )}
          </div>
        </div>
        <div className="h-[calc(100%-60px)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            style={{ 
              backgroundColor: "hsl(var(--background))",
              borderRadius: "0 0 8px 8px"
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color="hsl(var(--muted-foreground))" 
              gap={20} 
              size={1}
            />
            <Controls />
            <MiniMap 
              style={{
                backgroundColor: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))"
              }}
              nodeColor={() => "hsl(var(--primary))"}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
  */

  const renderHumanReadableFormat = () => {
    if (!ttlData) {
      return null;
    }

    // Parse actual TTL data to show human readable format
    const actualTtlData = typeof ttlData === 'string' ? ttlData : (ttlData as any)?.ttl || ttlData;
    const lines = actualTtlData.split('\n');
    
    // Extract main entities and their properties
    const entities: Record<string, { properties: string[], relationships: string[] }> = {};
    
    for (const line of lines) {
      if (line.includes('a owl:Class') && line.includes('rdfs:label')) {
        const match = line.match(/ns1:(\w+)\s+a\s+owl:Class/);
        if (match) {
          const entityName = match[1];
          if (!entities[entityName]) {
            entities[entityName] = { properties: [], relationships: [] };
          }
        }
      }
      
      // Extract properties
      if (line.includes('a owl:DatatypeProperty') || line.includes('a owl:ObjectProperty')) {
        const match = line.match(/ns1:(\w+)\s+a\s+owl:(Datatype|Object)Property/);
        if (match) {
          const propName = match[1];
          const propType = match[2];
          
          // Find which entity this property belongs to by looking at domain
          const domainMatch = line.match(/rdfs:domain\s+ns1:(\w+)/);
          if (domainMatch) {
            const entityName = domainMatch[1];
            if (!entities[entityName]) {
              entities[entityName] = { properties: [], relationships: [] };
            }
            
            if (propType === 'Datatype') {
              entities[entityName].properties.push(propName);
            } else {
              entities[entityName].relationships.push(propName);
            }
          }
        }
      }
    }

    return (
      <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {Object.entries(entities).slice(0, 10).map(([entityName, data]) => (
          <div key={entityName} className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg mb-3 text-foreground">{entityName}</h4>
            <div className="ml-4 space-y-1">
              {data.properties.slice(0, 5).map((prop, idx) => (
                <div key={idx} className="text-muted-foreground">• {prop}</div>
              ))}
              {data.relationships.slice(0, 3).map((rel, idx) => (
                <div key={idx} className="text-blue-600">• {rel} (relationship)</div>
              ))}
              {(data.properties.length > 5 || data.relationships.length > 3) && (
                <div className="text-xs text-muted-foreground italic">... and more</div>
              )}
            </div>
          </div>
        ))}
        {Object.keys(entities).length > 10 && (
          <div className="text-center text-muted-foreground text-sm">
            ... and {Object.keys(entities).length - 10} more entities
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1">
      {ttlData && (
        <div className="bg-card border border-border rounded-lg h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">
                Ontology Entity Structure
              </h3>
            </div>
          </div>
          <div className="p-6 h-[calc(100%-60px)] overflow-y-auto">
            {renderHumanReadableFormat()}
          </div>
        </div>
      )}
    </div>
  );
};