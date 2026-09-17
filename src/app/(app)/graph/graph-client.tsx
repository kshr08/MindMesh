"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type OnConnect,
  BackgroundVariant,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { RelationType } from "@prisma/client";

import type { KnowledgeFlowEdge, KnowledgeFlowNode } from "@/types/graph-flow";
import { KnowledgeNode } from "@/components/graph/knowledge-node";
import { Button } from "@/components/ui/button";
import {
  NodeFormDialog,
  type CreatedNodeResult,
} from "@/components/graph/node-form-dialog";
import { DeleteNodeDialog } from "@/components/graph/delete-node-dialog";
import { NodeDetailsPanel } from "@/components/graph/node-details-panel";
import {
  RelationFormDialog,
  type CreatedRelationResult,
  type PendingConnection,
} from "@/components/graph/relation-form-dialog";
import { RELATION_TYPE_LABEL } from "@/lib/validation/knowledge-relation";
import { deleteKnowledgeRelationAction } from "@/server/actions/knowledge-relation-actions";

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

function toFlowEdge(result: CreatedRelationResult): KnowledgeFlowEdge {
  return {
    id: result.id,
    source: result.sourceId,
    target: result.targetId,
    label: RELATION_TYPE_LABEL[result.relationType],
    data: { relationType: result.relationType },
  };
}

export default function GraphClient({ initialNodes, initialEdges }: GraphClientProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  // Relationship creation: onConnect no longer adds a local-only edge.
  // It captures the pending connection and opens the relation dialog;
  // the edge is only added to state after the server confirms creation.
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(
    null,
  );
  const [isRelationDialogOpen, setRelationDialogOpen] = useState(false);

  // Relationship deletion.
  const [relationError, setRelationError] = useState<string | null>(null);
  const [isDeletingRelation, startDeleteRelation] = useTransition();

  const nodeTypes: NodeTypes = { knowledge: KnowledgeNode };

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return; // reject self-loops

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      setPendingConnection({
        sourceId: sourceNode.id,
        sourceTitle: sourceNode.data.title,
        targetId: targetNode.id,
        targetTitle: targetNode.data.title,
      });
      setRelationDialogOpen(true);
    },
    [nodes],
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

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

  function handleRelationCreated(result: CreatedRelationResult) {
    setEdges((current) => [...current, toFlowEdge(result)]);
    setPendingConnection(null);
    router.refresh();
  }

  function handleDeleteRelation() {
    if (!selectedEdge) return;
    setRelationError(null);

    startDeleteRelation(async () => {
      const result = await deleteKnowledgeRelationAction({ id: selectedEdge.id });

      if (!result.success) {
        setRelationError(result.error);
        return;
      }

      setEdges((current) => current.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdgeId(null);
      router.refresh();
    });
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

      {selectedEdge && (
        <div className="absolute bottom-4 right-4 z-10 w-72 rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                Relationship
              </p>
              <h2 className="text-sm font-medium text-zinc-100">
                {RELATION_TYPE_LABEL[
                  (selectedEdge.data?.relationType ?? "RELATED_TO") as RelationType
                ]}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEdgeId(null)}
              className="text-zinc-500 hover:text-zinc-200"
              aria-label="Close relationship details"
            >
              ×
            </button>
          </div>

          {relationError && (
            <p role="alert" className="mt-2 text-xs text-rose-400">
              {relationError}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteRelation}
              disabled={isDeletingRelation}
              className="flex-1"
            >
              {isDeletingRelation ? "Deleting..." : "Delete relationship"}
            </Button>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => connection.source !== connection.target}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
          setRelationError(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        // Disable React Flow's built-in Delete-key edge/node removal: it
        // only mutates local state and would desync from PostgreSQL.
        // All deletion goes through the explicit panel actions above.
        deleteKeyCode={null}
        colorMode="dark"
        defaultEdgeOptions={{
          style: { stroke: "#52525b", strokeWidth: 1.5 },
          labelStyle: { fill: "#a1a1aa", fontSize: 10 },
          labelBgStyle: { fill: "#18181b", fillOpacity: 0.85 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 3,
        }}
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

      <RelationFormDialog
        key={`relation-${pendingConnection?.sourceId ?? "none"}-${pendingConnection?.targetId ?? "none"}-${isRelationDialogOpen}`}
        open={isRelationDialogOpen}
        onOpenChange={(open) => {
          setRelationDialogOpen(open);
          if (!open) setPendingConnection(null);
        }}
        connection={pendingConnection}
        onCreated={handleRelationCreated}
      />
    </div>
  );
}