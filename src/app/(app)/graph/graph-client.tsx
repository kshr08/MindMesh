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
  BackgroundVariant,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { KnowledgeFlowEdge, KnowledgeFlowNode } from "@/types/graph-flow";
import { KnowledgeNode } from "@/components/graph/knowledge-node";

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

  const nodeTypes: NodeTypes = { knowledge: KnowledgeNode };
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
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  colorMode="dark"
  defaultEdgeOptions={{ style: { stroke: "#52525b", strokeWidth: 1.5 } }}
  fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
  <Controls className="..." />
  <MiniMap pannable zoomable className="..." maskColor="rgba(9, 9, 11, 0.6)" nodeColor="#3f3f46" />
</ReactFlow>
    </div>
  );
}