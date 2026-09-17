"use client";

import { useCallback } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type OnConnect,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { KnowledgeFlowEdge, KnowledgeFlowNode } from "@/types/graph-flow";

interface GraphClientProps {
  initialNodes: KnowledgeFlowNode[];
  initialEdges: KnowledgeFlowEdge[];
}

export default function GraphClient({
  initialNodes,
  initialEdges,
}: GraphClientProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full w-full flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Your knowledge graph is empty. Nodes you add will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}