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
      console.log("Parsing TTL Data:", ttlData.substring ? ttlData.substring(0, 200) + "..." : ttlData);
      try {
        // Handle case where ttlData might be a JSON object with ttl property
        const actualTtlData = typeof ttlData === 'string' ? ttlData : (ttlData as any)?.ttl || ttlData;
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
};