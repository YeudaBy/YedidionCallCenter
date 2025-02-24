import {
    addEdge,
    Background,
    BackgroundVariant,
    Controls,
    OnConnect,
    ReactFlow,
    useEdgesState,
    useNodesState
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import {useCallback} from "react";

const initialNodes = [
    {id: '1', position: {x: 0, y: 0}, data: {label: '1'}},
    {id: '2', position: {x: 0, y: 100}, data: {label: '2'}},
    {id: '3', position: {x: 0, y: 200}, data: {label: '3'}},
    {id: '4', position: {x: 0, y: 300}, data: {label: '4'}},
];
const initialEdges = [{id: 'e1-2', source: '1', target: '2'}];

export default function Page() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );
    return (
        <div style={{width: '100vw', height: '100vh', backgroundColor: "oldlace", direction: "ltr"}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
            >
                <Background variant={BackgroundVariant.Lines} gap={12} size={4}/>
                <Controls/>
            </ReactFlow></div>
    );
}
