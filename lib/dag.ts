/**
 * DAG cycle detection utility.
 * Uses DFS with three-color marking (white/gray/black).
 */

interface GraphEdge {
  source: string;
  target: string;
}

/**
 * Returns true if adding the proposed edge would create a cycle in the DAG.
 */
export function wouldCreateCycle(
  existingEdges: GraphEdge[],
  proposedSource: string,
  proposedTarget: string
): boolean {
  // Build adjacency list
  const adjacency = new Map<string, string[]>();

  // Include proposed edge for checking
  const allEdges = [
    ...existingEdges,
    { source: proposedSource, target: proposedTarget },
  ];

  for (const edge of allEdges) {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true; // Back edge → cycle found
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  // Check all nodes
  for (const nodeId of adjacency.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}

/**
 * Performs topological sort (Kahn's algorithm) and returns ordered node IDs.
 * Returns null if the graph has cycles.
 */
export function topologicalSort(
  nodeIds: string[],
  edges: GraphEdge[]
): string[] | null {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return result.length === nodeIds.length ? result : null;
}

/**
 * For each node, list which upstream node IDs it depends on.
 * Returns a Map<targetNodeId, sourceNodeId[]>
 */
export function buildDependencyMap(
  nodeIds: string[],
  edges: GraphEdge[]
): Map<string, string[]> {
  const deps = new Map<string, string[]>();
  for (const id of nodeIds) {
    deps.set(id, []);
  }
  for (const edge of edges) {
    deps.get(edge.target)?.push(edge.source);
  }
  return deps;
}

/**
 * For each (targetNode, targetHandle) pair, record where its data comes from.
 * Returns Map<targetNodeId, Map<targetHandleId, { sourceNodeId, sourceHandleId }>>
 */
export interface HandleRoute {
  sourceNodeId: string;
  sourceHandleId: string;
}

export function buildHandleRouting(
  edges: (GraphEdge & {
    sourceHandle?: string | null;
    targetHandle?: string | null;
  })[]
): Map<string, Map<string, HandleRoute>> {
  const routing = new Map<string, Map<string, HandleRoute>>();
  for (const edge of edges) {
    if (!edge.targetHandle || !edge.sourceHandle) continue;
    if (!routing.has(edge.target)) {
      routing.set(edge.target, new Map());
    }
    routing.get(edge.target)!.set(edge.targetHandle, {
      sourceNodeId: edge.source,
      sourceHandleId: edge.sourceHandle,
    });
  }
  return routing;
}

