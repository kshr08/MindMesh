/**
 * Force-directed layout for the knowledge graph, so that:
 *  - a hub node's directly connected neighbors cluster around it instead
 *    of being scattered across the canvas
 *  - edges stay short and readable, reducing crossings
 *  - disconnected parts of the graph (separate components) are kept
 *    visually apart instead of interleaved
 *
 * Compact, dependency-free Fruchterman-Reingold style force-directed
 * layout plus connected-component packing. No new package is
 * introduced; it only uses plain arithmetic.
 */

export interface GraphLayoutNode {
  id: string;
}

export interface GraphLayoutEdge {
  source: string;
  target: string;
}

export interface GraphLayoutPosition {
  x: number;
  y: number;
}

// Visual footprint of a node on the canvas (matches the largest node
// shapes rendered by KnowledgeNode, e.g. the SKILL/PROJECT clip-paths),
// used both as the FR "ideal distance" seed and for the minimum-
// separation pass so shapes don't overlap.
const NODE_FOOTPRINT = 160;

// Fruchterman-Reingold tuning.
const FR_ITERATIONS = 300;
const FR_INITIAL_TEMPERATURE = NODE_FOOTPRINT * 4;

// Gap left between packed connected components on the canvas.
const COMPONENT_GAP = 220;
// Soft cap on how wide the overall packed layout is allowed to get
// before wrapping components onto a new row.
const MAX_PACK_WIDTH = 1600;

interface Vec {
  x: number;
  y: number;
}

function findConnectedComponents(
  nodeIds: string[],
  edges: GraphLayoutEdge[],
): string[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeIds) adjacency.set(id, new Set());

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) continue;
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const id of nodeIds) {
    if (visited.has(id)) continue;

    const component: string[] = [];
    const queue = [id];
    visited.add(id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  // Larger, more connected components first: they need the most room,
  // and settling their layout first gives cleaner packing.
  return components.sort((a, b) => b.length - a.length);
}

/**
 * Lays out a single connected component with a Fruchterman-Reingold
 * force simulation, seeded on a deterministic golden-angle spiral so
 * results are reproducible (no randomness) and nodes don't start
 * exactly on top of each other.
 */
function layoutComponent(
  memberIds: string[],
  edges: GraphLayoutEdge[],
): Map<string, Vec> {
  const positions = new Map<string, Vec>();

  if (memberIds.length === 1) {
    positions.set(memberIds[0], { x: 0, y: 0 });
    return positions;
  }

  const memberSet = new Set(memberIds);
  const componentEdges = edges.filter(
    (edge) => memberSet.has(edge.source) && memberSet.has(edge.target),
  );

  // Deterministic golden-angle spiral seed: spreads nodes evenly
  // without randomness or obvious grid banding.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  memberIds.forEach((id, index) => {
    const radius = NODE_FOOTPRINT * 0.6 * Math.sqrt(index + 1);
    const angle = index * goldenAngle;
    positions.set(id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  });

  const area = NODE_FOOTPRINT * NODE_FOOTPRINT * memberIds.length * 2;
  const idealDistance = Math.sqrt(area / memberIds.length);

  let temperature = FR_INITIAL_TEMPERATURE;

  for (let iteration = 0; iteration < FR_ITERATIONS; iteration++) {
    const displacement = new Map<string, Vec>();
    for (const id of memberIds) displacement.set(id, { x: 0, y: 0 });

    // Repulsion between every pair in this component.
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const a = memberIds[i];
        const b = memberIds[j];
        const posA = positions.get(a)!;
        const posB = positions.get(b)!;
        let dx = posA.x - posB.x;
        let dy = posA.y - posB.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) {
          // Break exact overlap deterministically.
          dx = 0.01 * (i - j);
          dy = 0.01;
          distance = Math.sqrt(dx * dx + dy * dy);
        }
        const repulsiveForce = (idealDistance * idealDistance) / distance;
        const fx = (dx / distance) * repulsiveForce;
        const fy = (dy / distance) * repulsiveForce;

        const dispA = displacement.get(a)!;
        dispA.x += fx;
        dispA.y += fy;
        const dispB = displacement.get(b)!;
        dispB.x -= fx;
        dispB.y -= fy;
      }
    }

    // Attraction along edges pulls connected nodes toward each other,
    // which is what clusters a hub's neighbors around it.
    for (const edge of componentEdges) {
      const posA = positions.get(edge.source)!;
      const posB = positions.get(edge.target)!;
      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      const attractiveForce = (distance * distance) / idealDistance;
      const fx = (dx / distance) * attractiveForce;
      const fy = (dy / distance) * attractiveForce;

      const dispA = displacement.get(edge.source)!;
      dispA.x -= fx;
      dispA.y -= fy;
      const dispB = displacement.get(edge.target)!;
      dispB.x += fx;
      dispB.y += fy;
    }

    // Apply displacement, capped by the cooling temperature so the
    // simulation converges instead of oscillating.
    for (const id of memberIds) {
      const pos = positions.get(id)!;
      const disp = displacement.get(id)!;
      const dispLength = Math.max(Math.sqrt(disp.x * disp.x + disp.y * disp.y), 0.01);
      const cappedLength = Math.min(dispLength, temperature);
      pos.x += (disp.x / dispLength) * cappedLength;
      pos.y += (disp.y / dispLength) * cappedLength;
    }

    temperature *= 1 - iteration / FR_ITERATIONS;
  }

  // Minimum-separation cleanup pass: FR settles into approximate
  // equilibrium, which can still leave a hub's many neighbors close
  // enough to visually overlap. A few direct separation passes push
  // any pair still closer than the node footprint apart.
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const a = memberIds[i];
        const b = memberIds[j];
        const posA = positions.get(a)!;
        const posB = positions.get(b)!;
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < NODE_FOOTPRINT && distance > 0.01) {
          const push = (NODE_FOOTPRINT - distance) / 2;
          const ux = dx / distance;
          const uy = dy / distance;
          posA.x += ux * push;
          posA.y += uy * push;
          posB.x -= ux * push;
          posB.y -= uy * push;
        }
      }
    }
  }

  return positions;
}

function boundingBox(positions: Map<string, Vec>): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }

  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Computes a layout for a graph: each connected component is settled
 * independently with force-directed placement (so a hub's neighbors
 * cluster around it), then components are packed into rows with a
 * fixed gap so unrelated parts of the graph stay visually separated
 * instead of overlapping or interleaving.
 */
export function computeGraphLayout(
  nodes: GraphLayoutNode[],
  edges: GraphLayoutEdge[],
): Map<string, GraphLayoutPosition> {
  const nodeIds = nodes.map((node) => node.id);
  const components = findConnectedComponents(nodeIds, edges);

  const finalPositions = new Map<string, GraphLayoutPosition>();

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const component of components) {
    const localPositions = layoutComponent(component, edges);
    const box = boundingBox(localPositions);

    if (cursorX > 0 && cursorX + box.width > MAX_PACK_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight + COMPONENT_GAP;
      rowHeight = 0;
    }

    for (const id of component) {
      const local = localPositions.get(id)!;
      finalPositions.set(id, {
        x: cursorX + (local.x - box.minX),
        y: cursorY + (local.y - box.minY),
      });
    }

    cursorX += box.width + COMPONENT_GAP;
    rowHeight = Math.max(rowHeight, box.height);
  }

  return finalPositions;
}