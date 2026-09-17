"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import {
  NodeFormDialog,
  type CreatedNodeResult,
} from "@/components/graph/node-form-dialog";
import { DeleteNodeDialog } from "@/components/graph/delete-node-dialog";
import { NodeDetailsPanel } from "@/components/graph/node-details-panel";

interface GraphClientProps {
  initialNodes: KnowledgeFlowNode[];
  initialEdges: KnowledgeFlowEdge[];
}

// Same grid constants as graph-transform.ts's initial layout, so newly
// created nodes fall into the next open grid slot deterministically.
const COLUMN_WIDTH = 240;
const ROW_HEIGHT = 180;
const COLUMNS = 4;

function toFlowNode(result: CreatedNodeResult, index: number): KnowledgeFlowNode {
  return {
    id: result.id,
    type: "knowledge",
    position: {
      x: (index % COLUMNS) * COLUMN_WIDTH,
      y: Math.floor(index / COLUMNS) * ROW_HEIGHT,
    },
    data: {
      id: result.id,
      title: result.title,
      type: result.type,
      status: result.status,
      description: result.description,
    },
  };
}

export default function GraphClient({ initialNodes, initialEdges }: GraphClientProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const nodeTypes: NodeTypes = { knowledge: KnowledgeNode };
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function handleCreated(result: CreatedNodeResult) {
    setNodes((current) => [...current, toFlowNode(result, current.length)]);
    router.refresh();
  }

  function handleUpdated(result: CreatedNodeResult) {
    setNodes((current) =>
      current.map((n) =>
        n.id === result.id
          ? {
              ...n,
              data: {
                id: result.id,
                title: result.title,
                type: result.type,
                status: result.status,
                description: result.description,
              },
            }
          : n,
      ),
    );
    router.refresh();
  }

  function handleDeleted(id: string) {
    setNodes((current) => current.filter((n) => n.id !== id));
    setEdges((current) => current.filter((e) => e.source !== id && e.target !== id));
    setSelectedNodeId(null);
    router.refresh();
  }

  if (nodes.length === 0) {
    return (
      <div className="relative flex h-full w-full flex-1 items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-zinc-400">
            Your knowledge graph is empty. Nodes you add will appear here.
          </p>
          <Button onClick={() => setCreateOpen(true)}>Add your first node</Button>
        </div>

        <NodeFormDialog
          key={`create-${isCreateOpen}`}
          open={isCreateOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          onCreated={handleCreated}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex-1">
      <div className="absolute left-4 top-4 z-10">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Add node
        </Button>
      </div>

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        colorMode="dark"
        defaultEdgeOptions={{ style: { stroke: "#52525b", strokeWidth: 1.5 } }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#27272a" />
        <Controls className="..." />
        <MiniMap
          pannable
          zoomable
          className="..."
          maskColor="rgba(9, 9, 11, 0.6)"
          nodeColor="#3f3f46"
        />
      </ReactFlow>

      <NodeFormDialog
        key={`create-${isCreateOpen}`}
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onCreated={handleCreated}
      />

      <NodeFormDialog
        key={`edit-${selectedNode?.id ?? "none"}-${isEditOpen}`}
        open={isEditOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        node={selectedNode}
        onUpdated={handleUpdated}
      />

      <DeleteNodeDialog
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
        node={selectedNode}
        onDeleted={handleDeleted}
      />
    </div>
  );
}