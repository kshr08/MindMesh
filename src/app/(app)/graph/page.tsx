import { CURRENT_USER_ID } from "@/lib/current-user";
import { toFlowGraph } from "@/lib/graph-transform";
import { getKnowledgeGraph } from "@/server/services/knowledge-graph-service";
import GraphClient from "./graph-client";

export default async function GraphPage() {
  const graph = await getKnowledgeGraph(CURRENT_USER_ID);
  const { nodes, edges } = toFlowGraph(graph);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-3">
        <h1 className="text-sm font-medium text-zinc-100">
          {graph.nodeCount} knowledge{" "}
          {graph.nodeCount === 1 ? "node" : "nodes"}
        </h1>
        <p className="text-sm text-zinc-500">
          {graph.relationCount}{" "}
          {graph.relationCount === 1 ? "relationship" : "relationships"}
        </p>
      </header>
      <div className="min-h-0 flex-1 bg-zinc-950">
        <GraphClient initialNodes={nodes} initialEdges={edges} />
      </div>
    </div>
  );
}