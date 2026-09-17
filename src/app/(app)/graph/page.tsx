import { CURRENT_USER_ID } from "@/lib/current-user";
import { toFlowGraph } from "@/lib/graph-transform";
import { getKnowledgeGraph } from "@/server/services/knowledge-graph-service";
import GraphClient from "./graph-client";

export default async function GraphPage() {
  const graph = await getKnowledgeGraph(CURRENT_USER_ID);
  const { nodes, edges } = toFlowGraph(graph);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <h1 className="text-sm font-medium text-foreground">
          {graph.nodeCount} knowledge{" "}
          {graph.nodeCount === 1 ? "node" : "nodes"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {graph.relationCount}{" "}
          {graph.relationCount === 1 ? "relationship" : "relationships"}
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <GraphClient initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}