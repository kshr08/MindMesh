import { auth } from "@/auth";
import { toFlowGraph } from "@/lib/graph-transform";
import { getKnowledgeGraph } from "@/server/services/knowledge-graph-service";
import { analyzeKnowledgeFreshness } from "@/server/services/knowledge-freshness-service";
import { LogoutButton } from "@/components/auth/logout-button";
import { redirect } from "next/navigation";
import GraphClient from "./graph-client";

export default async function GraphPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const graph = await getKnowledgeGraph(session.user.id);
  const { nodes, edges } = toFlowGraph(graph);
  const freshness = analyzeKnowledgeFreshness(graph.nodes);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-zinc-100">
            {graph.nodeCount} knowledge{" "}
            {graph.nodeCount === 1 ? "node" : "nodes"}
          </h1>

          <p className="text-sm text-zinc-500">
            {graph.relationCount}{" "}
            {graph.relationCount === 1
              ? "relationship"
              : "relationships"}
          </p>
        </div>

        <div className="ml-auto">
          <LogoutButton />
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-zinc-950">
        <GraphClient
          initialNodes={nodes}
          initialEdges={edges}
          freshness={freshness}
        />
      </div>
    </div>
  );
}