"use client"

import React, { useCallback, useMemo, useEffect, useState } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
  Handle,
  MarkerType,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import dagre from "dagre"
import { useTRPC } from "@/trpc/client"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { Network, FolderTree, LayoutList, Plus } from "lucide-react"
import { CreatePositionModal } from "./create-position-modal"
import { PositionSidebar } from "./position-sidebar"

type PositionItem = {
  id: string
  code: string
  title: string
  parentId: string | null
  hierarchyPath: string
  isSigner?: boolean | null
}

const nodeWidth = 320
const nodeHeight = 140

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const newNode = {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
    return newNode
  })

  return { nodes: newNodes, edges }
}

// Custom Node Component for "Soft Structuralism" Aesthetic
function CustomPositionNode({ data, selected }: { data: any, selected: boolean }) {
  return (
    <div className={`relative group flex items-start gap-4 p-5 w-[300px] rounded-[1.75rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border transition-all duration-500 ease-[var(--ease-fluid)] ${
      selected 
        ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] bg-white/95 dark:bg-neutral-900/95" 
        : "border-black/5 dark:border-white/10 shadow-ambient hover:shadow-xl hover:bg-white dark:hover:bg-neutral-900 hover:-translate-y-1 hover:border-primary/30"
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-12 h-2 bg-primary/30 hover:bg-primary border-none rounded-full transition-colors -mt-1 opacity-0 group-hover:opacity-100"
      />
      
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
        <FolderTree className="w-6 h-6 text-primary" />
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-base text-foreground leading-tight line-clamp-2">{data.title}</span>
        <span className="text-xs text-muted-foreground font-medium mt-1 truncate">{data.code}</span>
        
        <div className="flex items-center gap-2 mt-3">
          {data.isSigner ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Penandatangan
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground border border-border/50">
              Staff / Non-Signer
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-12 h-2 bg-primary/30 hover:bg-primary border-none rounded-full transition-colors -mb-1 opacity-0 group-hover:opacity-100"
      />
    </div>
  )
}

const nodeTypes = {
  positionNode: CustomPositionNode,
}

function OrgChartCanvas({ items }: { items: PositionItem[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const { fitView } = useReactFlow()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const updateParentMutation = useMutation(
    trpc.admin.updatePositionParent.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["admin", "getPositions"]] })
      },
    })
  )

  // Initialize nodes and edges from database items
  useEffect(() => {
    const initialNodes: Node[] = items.map((item) => ({
      id: item.id,
      type: "positionNode",
      data: { title: item.title, code: item.code, path: item.hierarchyPath, isSigner: item.isSigner },
      position: { x: 0, y: 0 },
    }))

    const initialEdges: Edge[] = items
      .filter((item) => item.parentId)
      .map((item) => ({
        id: `edge-${item.parentId}-${item.id}`,
        source: item.parentId!,
        target: item.id,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "hsl(var(--primary))",
        },
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      }))

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 800 })
    })
  }, [items, setNodes, setEdges, fitView])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return
      
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--primary))",
        },
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      }
      
      // Only one parent allowed. Remove existing edge to this target
      setEdges((eds) => addEdge(newEdge, eds.filter((e) => e.target !== params.target)))

      // Fire mutation
      updateParentMutation.mutate({
        positionId: params.target,
        newParentId: params.source,
      })
    },
    [setEdges, updateParentMutation]
  )

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes([...layoutedNodes])
    setEdges([...layoutedEdges])
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 800 })
    })
  }, [nodes, edges, setNodes, setEdges, fitView])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedPositionId(node.id)
  }, [])

  const selectedPosition = useMemo(() => {
    return items.find((i) => i.id === selectedPositionId) || null
  }, [items, selectedPositionId])

  return (
    <div className="w-full h-full rounded-[2rem] overflow-hidden border border-border/50 bg-muted/20 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedPositionId(null)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--foreground)/0.1)" />
        <Controls className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden" />
        <MiniMap 
          className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-xl border border-black/5 dark:border-white/10 shadow-sm"
          nodeColor="hsl(var(--primary)/0.2)"
          maskColor="hsl(var(--background)/0.5)"
        />
        <Panel position="bottom-center" className="mb-8">
          <div className="flex items-center gap-2 p-1.5 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.15)] pointer-events-auto">
            <button
              onClick={onLayout}
              className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              title="Rapikan Layout (Auto Layout)"
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-primary pl-5 pr-6 py-3 rounded-full text-sm font-bold shadow-md hover:shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all text-primary-foreground cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Posisi Baru
            </button>
          </div>
        </Panel>
      </ReactFlow>
      
      {items.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
          <Network className="w-12 h-12 mb-4 opacity-20" />
          <p>Belum ada posisi di sistem ini.</p>
        </div>
      )}

      <PositionSidebar 
        position={selectedPosition} 
        onClose={() => setSelectedPositionId(null)} 
      />
      
      <CreatePositionModal 
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}

export function OrgChartEditor({ items }: { items: PositionItem[] }) {
  return (
    <ReactFlowProvider>
      <OrgChartCanvas items={items} />
    </ReactFlowProvider>
  )
}
