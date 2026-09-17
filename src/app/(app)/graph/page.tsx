import { CURRENT_USER_ID } from "@/lib/current-user";
import { getKnowledgeGraph } from "@/server/services/knowledge-graph-service";

// Server Component: fetches data directly through the service layer.
// No Prisma import here, and no client-side data fetching.
export default async function GraphPage() {
  const graph = await getKnowledgeGraph(CURRENT_USER_ID);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-lg font-medium text-foreground">
        {graph.nodeCount} knowledge {graph.nodeCount === 1 ? "node" : "nodes"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {graph.relationCount}{" "}
        {graph.relationCount === 1 ? "relationship" : "relationships"}
      </p>
    </main>
  );
}
