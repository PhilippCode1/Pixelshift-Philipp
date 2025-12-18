import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, OrthographicCamera, PerspectiveCamera, Stars, TransformControls, Html, Instance, Instances, Sky, useCursor, BakeShadows } from '@react-three/drei';
import { useStore } from '../store';
import { ModuleMesh, TextureGenerator, SmartRoofRenderer } from './ModuleMesh';
import { PropMesh } from './PropMesh';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// --- UTILS ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper to determine terrain height at specific x,z coords
const getTerrainHeight = (x: number, z: number, terrain: string) => {
    const dist = Math.sqrt(x*x + z*z);
    
    // Central flat area for building (radius ~18m)
    if (dist < 18) {
        if(dist < 12) return 0;
        // Blend edge
        const t = (dist - 12) / 6;
        return t * (getTerrainHeight(18 * (x/dist), 18 * (z/dist), terrain));
    }

    if (terrain === 'agriculture') {
         // Rolling Hills + subtle variation
         const largeWaves = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 2.5;
         const smallWaves = Math.sin(z * 0.05 + x * 0.05) * 0.3;
         return largeWaves + smallWaves;
    } 
    else if (terrain === 'mountain') {
         const noise = Math.abs(Math.sin(x * 0.03) * Math.cos(z * 0.03) * 15 + Math.sin(x*0.1+z*0.1)*3);
         const peak = dist > 60 ? (dist - 60) * 0.12 * Math.random() : 0;
         return noise + peak;
    } 
    else if (terrain === 'forest') {
         return Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2.0;
    }
    
    // Default / Grass
    return Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
};

// Helper to determine agriculture field type based on grid
const getFieldType = (x: number, z: number) => {
    const patchSize = 45;
    const roadWidth = 5;
    
    const gx = Math.floor((x + 1000) / patchSize);
    const gz = Math.floor((z + 1000) / patchSize);
    
    const lx = Math.abs(x % patchSize);
    const lz = Math.abs(z % patchSize);
    
    if (lx < roadWidth || lz < roadWidth) return 'road';
    
    const seed = Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453;
    const rand = seed - Math.floor(seed);
    
    if (rand < 0.4) return 'wheat';
    if (rand < 0.7) return 'corn';
    return 'plowed';
};

// --- GEOMETRY FACTORIES ---

// --- EXPORT & CAMERA ---
const ExportManager = () => {
    const { screenshotRequested, clearScreenshotRequest, exportState, nextExportStep } = useStore();
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        if (screenshotRequested) {
            gl.render(scene, camera);
            const dataUrl = gl.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.setAttribute('download', 'modulmate-view.png');
            link.setAttribute('href', dataUrl);
            link.click();
            clearScreenshotRequest();
        }
    }, [screenshotRequested]);

    useEffect(() => {
        if (exportState === 'idle' || exportState === 'done') return;
        const timer = setTimeout(() => {
            gl.render(scene, camera);
            const dataUrl = gl.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.setAttribute('download', `bauplan-${exportState}.png`);
            link.setAttribute('href', dataUrl);
            link.click();
            nextExportStep();
        }, 600);
        return () => clearTimeout(timer);
    }, [exportState, gl, scene, camera, nextExportStep]);

    return null;
}

const CameraController = () => {
    const { viewMode, exportState } = useStore();
    
    if (exportState === 'top') return <OrthographicCamera makeDefault position={[0, 50, 0]} zoom={20} near={-50} far={200} rotation={[-Math.PI/2, 0, 0]} />;
    if (exportState === 'north') return <OrthographicCamera makeDefault position={[0, 0, -50]} zoom={20} near={-50} far={200} />;
    if (exportState === 'south') return <OrthographicCamera makeDefault position={[0, 0, 50]} zoom={20} near={-50} far={200} />;
    if (exportState === 'east') return <OrthographicCamera makeDefault position={[50, 0, 0]} zoom={20} near={-50} far={200} />;
    if (exportState === 'west') return <OrthographicCamera makeDefault position={[-50, 0, 0]} zoom={20} near={-50} far={200} />;
    
    if (viewMode === 'tech') return <OrthographicCamera makeDefault position={[0, 60, 0]} zoom={15} near={-50} far={200} />;
    if (viewMode === '2d') return <OrthographicCamera makeDefault position={[0, 10, 60]} zoom={20} near={-50} far={200} />;

    return <PerspectiveCamera makeDefault position={[12, 10, 18]} fov={35} near={0.1} far={300} />;
}

// --- DRAG CONTROLLER ---
const DragFloor = () => {
    const { dragState, updateDrag, endDrag, activeTool, measureState, setMeasurePoint, setMeasureActive } = useStore();
    
    const handleMeasureClick = (e: any) => {
        if (activeTool === 'measure') {
            e.stopPropagation();
            const point = [e.point.x, e.point.y, e.point.z] as [number, number, number];
            if (!measureState.start) {
                setMeasurePoint(point, true);
            } else if (!measureState.end) {
                setMeasurePoint(point, false);
                setTimeout(() => setMeasureActive(false), 2000);
            }
        }
    }

    const handleMeasureMove = (e: any) => {
        if (activeTool === 'measure' && measureState.start && !measureState.end) {
             // Logic for line preview could go here
        }
    }

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            visible={false} 
            onClick={handleMeasureClick}
            onPointerMove={(e) => {
                e.stopPropagation();
                if (dragState.active) {
                    updateDrag(e.point.x, e.point.z);
                } else {
                    handleMeasureMove(e);
                }
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
                if(dragState.active) endDrag();
            }}
        >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial />
        </mesh>
    );
};

// --- VISUALIZATIONS ---

const MeasurementOverlay = () => {
    const { measureState, activeTool } = useStore();
    if (activeTool !== 'measure' && !measureState.start) return null;

    const start = measureState.start ? new THREE.Vector3(...measureState.start) : null;
    const end = measureState.end ? new THREE.Vector3(...measureState.end) : null;

    return (
        <group>
            {start && (
                <mesh position={start}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="#ef4444" depthTest={false} />
                </mesh>
            )}
            {end && (
                <mesh position={end}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="#ef4444" depthTest={false} />
                </mesh>
            )}
            {start && end && (
                <>
                    <line>
                        <bufferGeometry>
                            <float32BufferAttribute attach="attributes-position" count={2} array={new Float32Array([...start.toArray(), ...end.toArray()])} itemSize={3} />
                        </bufferGeometry>
                        <lineBasicMaterial color="#ef4444" linewidth={3} depthTest={false} />
                    </line>
                    <Html position={start.clone().add(end).multiplyScalar(0.5)} center>
                        <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                            {start.distanceTo(end).toFixed(3)}m
                        </div>
                    </Html>
                </>
            )}
        </group>
    )
}

// --- GIZMO ---
const GizmoLayer = () => {
    const { selection, transformMode, updateModulePosition, updateModuleRotation, updatePropPosition, updatePropRotation, activeTab } = useStore();
    const { scene } = useThree();
    
    const selectedObj = selection?.type === 'module' || selection?.type === 'prop' ? scene.getObjectByName(selection.id) : undefined;
    
    if (!selectedObj || !selectedObj.parent) return null;
    if (selection.type === 'module' && activeTab !== 'structure') return null;

    return (
        <TransformControls 
            key={selectedObj.uuid} 
            object={selectedObj} 
            mode={transformMode}
            size={0.8} 
            showY={selection.type === 'prop' && transformMode === 'translate'} 
            showX={true}
            showZ={true}
            rotationSnap={Math.PI / 8} 
            translationSnap={0.1} 
            onMouseUp={() => {
                 if(selection.type === 'module') {
                     if(transformMode === 'translate') {
                         updateModulePosition(selection.id, selectedObj.position.x, selectedObj.position.z);
                         selectedObj.position.y = 0; 
                     } else {
                         updateModuleRotation(selection.id, selectedObj.rotation.y);
                     }
                 } else if (selection.type === 'prop') {
                     if(transformMode === 'translate') {
                         updatePropPosition(selection.id, [selectedObj.position.x, selectedObj.position.y, selectedObj.position.z]);
                     } else {
                         updatePropRotation(selection.id, selectedObj.rotation.y);
                     }
                 }
            }}
        />
    )
}

const DimensionLines = () => {
    const { selection, modules } = useStore();
    if (selection?.type !== 'module') return null;
    const m = modules.find(mod => mod.id === selection.id);
    if(!m) return null;

    const { w, d, h } = m.size;
    const { x, z, rot } = m.grid;
    
    const GroupRot = ({ children }: any) => <group position={[x, 0, z]} rotation={[0, rot, 0]}>{children}</group>;

    const DimLabel = ({ pos, text }: { pos: [number,number,number], text: string }) => (
        <Html position={pos} center transform sprite>
            <div className="bg-slate-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700 pointer-events-none select-none">
                {text}
            </div>
        </Html>
    );

    const Line = ({ start, end }: { start: [number,number,number], end: [number,number,number] }) => {
         return (
             <line>
                 <bufferGeometry>
                    <float32BufferAttribute attach="attributes-position" count={2} array={new Float32Array([...start, ...end])} itemSize={3} />
                 </bufferGeometry>
                 <lineBasicMaterial color="#334155" linewidth={2} />
             </line>
         )
    }

    return (
        <GroupRot>
            <Line start={[-w/2, 0.05, d/2 + 0.5]} end={[w/2, 0.05, d/2 + 0.5]} />
            <mesh position={[-w/2, 0.05, d/2 + 0.5]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#334155"/></mesh>
            <mesh position={[w/2, 0.05, d/2 + 0.5]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#334155"/></mesh>
            <DimLabel pos={[0, 0.2, d/2 + 0.5]} text={`${w.toFixed(2)}m`} />

            <Line start={[w/2 + 0.5, 0.05, -d/2]} end={[w/2 + 0.5, 0.05, d/2]} />
            <mesh position={[w/2 + 0.5, 0.05, -d/2]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#334155"/></mesh>
            <mesh position={[w/2 + 0.5, 0.05, d/2]}><sphereGeometry args={[0.05]} /><meshBasicMaterial color="#334155"/></mesh>
            <DimLabel pos={[w/2 + 0.5, 0.2, 0]} text={`${d.toFixed(2)}m`} />
        </GroupRot>
    );
}

// --- HIGH QUALITY LANDSCAPE ASSETS ---

const TerrainFloor = ({ terrain }: { terrain: string }) => {
    const { activeTool, spawnModule, measureState, setMeasurePoint, setMeasureActive } = useStore();
    const [hover, setHover] = useState(false);
    
    useCursor(activeTool === 'place_module' && hover, 'crosshair', 'auto');
    useCursor(activeTool === 'measure' && hover, 'crosshair', 'auto');

    // Advanced Geometry with Vertex Colors for "Patchwork" fields
    const geom = useMemo(() => {
        // High segment count for smooth rolling hills
        const g = new THREE.PlaneGeometry(400, 400, 200, 200); 
        g.rotateX(-Math.PI / 2);
        
        const count = g.attributes.position.count;
        const colors = new Float32Array(count * 3);
        const pos = g.attributes.position;

        // Realistic Palettes
        const cGrass = new THREE.Color('#4d6b3e'); // Desaturated natural green
        const cWheat = new THREE.Color('#c2a058'); // Dried wheat
        const cCorn = new THREE.Color('#385228'); // Deep crop green
        const cPlowed = new THREE.Color('#4a3c31'); // Rich soil
        const cRoad = new THREE.Color('#8a7e72'); // Gravel path
        const cStone = new THREE.Color('#5f6670'); // Slate

        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            
            // Set Height via shared function
            const y = getTerrainHeight(x, z, terrain);
            pos.setY(i, y);

            // Set Color based on Logic
            let color = cGrass;
            
            if (terrain === 'agriculture') {
                const dist = Math.sqrt(x*x + z*z);
                if (dist > 18) {
                    const type = getFieldType(x, z);
                    if (type === 'road') color = cRoad;
                    else if (type === 'wheat') color = cWheat;
                    else if (type === 'corn') color = cCorn;
                    else if (type === 'plowed') color = cPlowed;
                }
            } else if (terrain === 'mountain') {
                const dist = Math.sqrt(x*x + z*z);
                if (dist > 30) {
                    // Blend into stone at height
                    if (y > 4) color = cStone;
                }
            }

            // Apply with slight noise for realism (Dirt/Grime)
            const noise = (Math.random() - 0.5) * 0.08;
            colors[i*3] = Math.min(1, Math.max(0, color.r + noise));
            colors[i*3+1] = Math.min(1, Math.max(0, color.g + noise));
            colors[i*3+2] = Math.min(1, Math.max(0, color.b + noise));
        }
        
        g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        g.computeVertexNormals();
        return g;
    }, [terrain]);

    const handleClick = (e: any) => {
        if (activeTool === 'place_module') {
            e.stopPropagation();
            spawnModule(e.point.x, e.point.z);
        } else if (activeTool === 'measure') {
            e.stopPropagation();
            const point = [e.point.x, e.point.y, e.point.z] as [number, number, number];
            if (!measureState.start) {
                setMeasurePoint(point, true);
            } else if (!measureState.end) {
                setMeasurePoint(point, false);
                setTimeout(() => setMeasureActive(false), 3000);
            }
        }
    }
    
    // Custom shader-like material using vertex colors
    const terrainMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        vertexColors: true, 
        roughness: 1.0,
        bumpScale: 0.1
    }), [terrain]);

    // Apply texture based on type
    if (terrain === 'agriculture') {
        terrainMaterial.map = TextureGenerator.createSoilTexture('#ffffff');
        terrainMaterial.bumpMap = TextureGenerator.createSoilTexture('#808080');
    } else {
        terrainMaterial.map = TextureGenerator.createStoneTexture('#ffffff', 0.5);
        terrainMaterial.bumpMap = TextureGenerator.createGenericBump(0.5);
    }

    return (
        <mesh geometry={geom} receiveShadow position={[0, -0.05, 0]} material={terrainMaterial} onClick={handleClick} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} />
    );
}

const VegetationLayer = ({ terrain }: { terrain: string }) => {
    // === 1. Pre-calculate Positions ===
    const { wheat, corn, grass, trees, hay } = useMemo(() => {
        const _wheat: any[] = [];
        const _corn: any[] = [];
        const _grass: any[] = [];
        const _trees: any[] = [];
        const _hay: any[] = [];

        if (terrain === 'agriculture') {
            // High density farming
            const range = 140; 
            for (let x = -range; x < range; x += 1.5) {
                for (let z = -range; z < range; z += 1.5) {
                    const dist = Math.sqrt(x*x + z*z);
                    if (dist < 22) continue; // Clear area around house

                    const type = getFieldType(x, z);
                    const y = getTerrainHeight(x, z, terrain);
                    
                    if (type === 'wheat') {
                        if(Math.random() > 0.1) {
                            _wheat.push({ pos: [x + Math.random()*0.5, y, z + Math.random()*0.5], scale: randomRange(0.7, 1.3), rot: Math.random() * Math.PI });
                        }
                    } else if (type === 'corn') {
                        if(Math.random() > 0.2) {
                            _corn.push({ pos: [x, y, z], scale: randomRange(0.8, 1.2), rot: Math.random() * Math.PI });
                        }
                    } else if (type === 'plowed') {
                        if(Math.random() > 0.992) {
                            _hay.push({ pos: [x, y + 0.6, z], rot: Math.random() * Math.PI });
                        }
                    }
                }
            }
            // Road Trees
            for(let i=0; i<30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 25 + Math.random() * 100;
                const x = Math.cos(angle) * r;
                const z = Math.sin(angle) * r;
                if(getFieldType(x, z) === 'road') {
                     const y = getTerrainHeight(x, z, terrain);
                     _trees.push({ pos: [x, y, z], scale: [1, randomRange(0.9, 1.4), 1], rot: Math.random() * Math.PI });
                }
            }

        } else {
            // Natural Forests
            const isForest = terrain === 'forest';
            const count = isForest ? 350 : 60;
            const grassCount = isForest ? 3000 : 5000;
            
            for(let i=0; i<count; i++) {
                const r = randomRange(20, 160);
                const theta = Math.random() * Math.PI * 2;
                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = getTerrainHeight(x, z, terrain);
                const s = randomRange(0.8, 1.8);
                _trees.push({ pos: [x, y, z], scale: [s, s * randomRange(0.9, 1.2), s], rot: Math.random() * Math.PI });
            }
            
            for(let i=0; i<grassCount; i++) {
                const r = randomRange(15, 90);
                const theta = Math.random() * Math.PI * 2;
                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = getTerrainHeight(x, z, terrain);
                _grass.push({ pos: [x, y, z], scale: randomRange(0.6, 1.4), rot: Math.random() * Math.PI });
            }
        }

        return { wheat: _wheat, corn: _corn, grass: _grass, trees: _trees, hay: _hay };
    }, [terrain]);

    // === 2. Materials (STATIC, NO WIND) ===
    const wheatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eab308', side: THREE.DoubleSide }), []);
    const cornMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4d7c0f', side: THREE.DoubleSide }), []);
    const grassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#65a30d', side: THREE.DoubleSide, transparent: true }), []);
    const treeLeafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: terrain === 'forest' ? '#14532d' : '#15803d', roughness: 0.8 }), [terrain]);
    const treeTrunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f2e26', roughness: 1.0 }), []);
    const hayMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d4a017', map: TextureGenerator.createSoilTexture('#d4a017') }), []);

    // === 3. Geometries ===
    // Wheat: Simple vertical quad or crossed quads
    const wheatGeo = useMemo(() => {
        const g = new THREE.PlaneGeometry(0.15, 1.2);
        g.translate(0, 0.6, 0);
        return g;
    }, []);

    // Grass: Blade shape
    const grassGeo = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.05, 0);
        shape.lineTo(0.05, 0);
        shape.lineTo(0, 0.6);
        shape.lineTo(-0.05, 0);
        const g = new THREE.ExtrudeGeometry(shape, { depth: 0, bevelEnabled: false });
        return g;
    }, []);

    // Tree Trunks
    const treeTrunkGeo = useMemo(() => {
        const g = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6);
        g.translate(0, 0.75, 0);
        return g;
    }, []);
    
    // Tree Leaves
    const treeLeafGeo = useMemo(() => {
        if (terrain === 'forest' || terrain === 'mountain') {
             // Pine cone layers
             const geos = [];
             for(let i=0; i<3; i++) {
                 const g = new THREE.ConeGeometry(1.5 - i*0.4, 1.5, 7);
                 g.translate(0, 1.5 + i*1.0, 0);
                 geos.push(g);
             }
             const merged = mergeGeometries(geos);
             return merged || new THREE.BoxGeometry();
        } else {
             // Deciduous Sphere Cloud
             const g = new THREE.DodecahedronGeometry(1.5, 0);
             g.translate(0, 2.5, 0);
             return g;
        }
    }, [terrain]);


    const isAgriculture = terrain === 'agriculture';

    return (
        <group>
            {/* WHEAT */}
            {isAgriculture && wheat.length > 0 && (
                <Instances range={wheat.length} material={wheatMat} geometry={wheatGeo} castShadow receiveShadow>
                    {wheat.map((d, i) => (
                        <Instance key={i} position={d.pos} scale={[1, d.scale, 1]} rotation={[0, d.rot, 0]} />
                    ))}
                </Instances>
            )}

            {/* CORN (Re-using wheat logic but bigger) */}
            {isAgriculture && corn.length > 0 && (
                <Instances range={corn.length} material={cornMat} geometry={wheatGeo} castShadow receiveShadow>
                    {corn.map((d, i) => (
                        <Instance key={i} position={d.pos} scale={[2.5, d.scale * 1.5, 2.5]} rotation={[0, d.rot, 0]} />
                    ))}
                </Instances>
            )}

            {/* GRASS */}
            {!isAgriculture && grass.length > 0 && (
                <Instances range={grass.length} material={grassMat} geometry={grassGeo} receiveShadow>
                    {grass.map((d, i) => (
                        <Instance key={i} position={d.pos} scale={[d.scale, d.scale, d.scale]} rotation={[0, d.rot, 0]} />
                    ))}
                </Instances>
            )}

            {/* HAY */}
            {isAgriculture && hay.length > 0 && (
                <Instances range={hay.length} material={hayMat} castShadow receiveShadow>
                    <cylinderGeometry args={[0.6, 0.6, 0.9, 16]} rotation={[0,0,Math.PI/2]} />
                    {hay.map((d, i) => (
                        <Instance key={i} position={d.pos} rotation={[0, d.rot, Math.PI/2]} />
                    ))}
                </Instances>
            )}

            {/* TREES - Split into Trunk and Leaves for proper Materials on GPU */}
            {trees.length > 0 && (
                <group>
                    <Instances range={trees.length} material={treeTrunkMat} geometry={treeTrunkGeo} castShadow receiveShadow>
                        {trees.map((d, i) => (
                            <Instance key={`t-${i}`} position={d.pos} scale={d.scale} rotation={[0, d.rot, 0]} />
                        ))}
                    </Instances>
                    <Instances range={trees.length} material={treeLeafMat} geometry={treeLeafGeo} castShadow receiveShadow>
                        {trees.map((d, i) => (
                            <Instance key={`l-${i}`} position={d.pos} scale={d.scale} rotation={[0, d.rot, 0]} />
                        ))}
                    </Instances>
                </group>
            )}
        </group>
    )
}

const BackgroundMountains = () => {
    const mountData = useMemo(() => {
        const arr = [];
        for(let i=0; i<16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const r = 240 + Math.random() * 40;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            arr.push({ pos: [x, -10, z], scale: [90, randomRange(80, 140), 90], rot: randomRange(0, Math.PI) });
        }
        return arr;
    }, []);

    // Stylized Low Poly Mountain Material
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: '#64748b', 
        roughness: 1.0,
        flatShading: true 
    }), []);

    return (
        <Instances range={16} material={mat}>
            <coneGeometry args={[1, 1, 4]} />
            {mountData.map((d, i) => (
                <Instance key={i} position={d.pos} scale={d.scale} rotation={[0, d.rot, 0]} />
            ))}
        </Instances>
    )
}

// --- ATMOSPHERE & WEATHER ---

const WeatherOverlay = () => {
    const { environment } = useStore();
    const isRain = environment.weather === 'rain';
    const isSnow = environment.weather === 'snow';
    const isWeatherActive = isRain || isSnow;

    const count = 3000;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for(let i=0; i<count*3; i+=3) {
            pos[i] = (Math.random() - 0.5) * 80;
            pos[i+1] = Math.random() * 40;
            pos[i+2] = (Math.random() - 0.5) * 80;
        }
        return pos;
    }, []);
    
    const geom = useRef<THREE.BufferGeometry>(null);

    useFrame(() => {
        if (!isWeatherActive) return;
        if(geom.current) {
            const pos = geom.current.attributes.position.array as Float32Array;
            const fallSpeed = isRain ? 0.8 : 0.15;
            for(let i=1; i<count*3; i+=3) {
                pos[i] -= fallSpeed;
                if(pos[i] < 0) pos[i] = 40;
            }
            geom.current.attributes.position.needsUpdate = true;
        }
    });

    if (!isWeatherActive) return null;

    return (
        <points>
            <bufferGeometry ref={geom}>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial color={isRain ? "#a5f3fc" : "#fff"} size={isRain ? 0.05 : 0.15} transparent opacity={0.6} depthWrite={false} />
        </points>
    )
};

const Atmosphere = () => {
    const { environment, exportState } = useStore();
    const isExporting = exportState !== 'idle';
    
    // Improved Sun intensity logic from previous instruction
    const sunAngle = (environment.time - 6) / 16 * Math.PI;
    const sunX = Math.cos(sunAngle) * 50;
    const sunY = Math.sin(sunAngle) * 50;
    const sunZ = 20;

    const isNight = environment.time < 6 || environment.time > 20;
    const isRain = environment.weather === 'rain';
    const isSnow = environment.weather === 'snow';
    
    let skyConfig = { turbidity: 4, rayleigh: 0.8, mieCoefficient: 0.005, mieDirectionalG: 0.8, sunPos: [sunX, sunY, sunZ] };
    let ambIntensity = 0.5;
    let dirIntensity = 3.0;
    
    // Dynamic Brightness Boost between 12:00 and 16:00 if Sun is active
    if (environment.weather === 'sun' && !isNight) {
        if (environment.time >= 12 && environment.time <= 16) {
             dirIntensity = 4.5; // Boost
        }
    }

    let fogColor = '#e2e8f0';
    let fogDist = 200;

    if (environment.terrain === 'forest') {
        fogColor = '#dcfce7'; // Greenish tint
        skyConfig.turbidity = 5;
        fogDist = 90;
    } else if (environment.terrain === 'mountain') {
        fogColor = '#f1f5f9';
        skyConfig.rayleigh = 0.2; 
        fogDist = 350;
    } else if (environment.terrain === 'agriculture') {
        fogColor = '#fff7ed'; // Warm tint
        skyConfig.rayleigh = 0.6; 
        skyConfig.turbidity = 2; 
        ambIntensity = 0.6; 
        if(environment.weather !== 'sun') dirIntensity = 3.0; 
    }

    if (isRain) {
        skyConfig.turbidity = 10;
        skyConfig.rayleigh = 1;
        skyConfig.mieCoefficient = 0.1;
        ambIntensity = 0.6; 
        dirIntensity = 0.5; 
        fogColor = '#94a3b8';
        fogDist = 50;
    } else if (isSnow) {
        skyConfig.turbidity = 0;
        skyConfig.rayleigh = 0.5;
        ambIntensity = 0.9; 
        dirIntensity = 1.0; 
        fogColor = '#f8fafc';
        fogDist = 40;
    } else if (isNight) {
        ambIntensity = 0.1;
        dirIntensity = 0;
        fogColor = '#020617';
        fogDist = 80;
    }

    return (
        <>
            <fog attach="fog" args={[fogColor, 10, fogDist]} />
            
            <ambientLight intensity={ambIntensity} color={isNight ? "#1e293b" : "#fff"} />
            
            <directionalLight 
                position={[sunX, sunY, sunZ]} 
                intensity={dirIntensity} 
                castShadow={!isExporting && !isNight} 
                shadow-bias={-0.0001} 
                shadow-normalBias={0.04} 
                shadow-mapSize={[4096, 4096]} 
                color={environment.terrain === 'agriculture' && !isRain ? "#fffbeb" : "#fff"}
            >
                <orthographicCamera attach="shadow-camera" args={[-80, 80, 80, -80, 0.1, 200]} />
            </directionalLight>

            {!isNight && !isRain && !isSnow && <Sky sunPosition={[sunX, sunY, sunZ]} turbidity={skyConfig.turbidity} rayleigh={skyConfig.rayleigh} mieCoefficient={skyConfig.mieCoefficient} mieDirectionalG={skyConfig.mieDirectionalG} />}
            {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />}
            
            <Environment preset="city" environmentIntensity={0.6} blur={0.6} background={false} /> 
        </>
    )
}

// --- MAIN SCENE COMPOSITION ---

const SceneContent = () => {
  const { modules, props, selectObject, dragState, environment } = useStore();
  
  return (
    <>
      <ExportManager />
      <Atmosphere />
      <WeatherOverlay />
      <CameraController />
      <GizmoLayer />
      <DimensionLines />
      <MeasurementOverlay />
      <DragFloor />
      <BakeShadows /> {/* Optimization: Static shadows won't recalculate unless moved, but dynamic time needs updates? Removed Bake for dynamic sun */}
      
      <OrbitControls 
        makeDefault
        enableDamping 
        enabled={!dragState.active} 
        dampingFactor={0.08} 
        minDistance={2}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.05} 
        mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE, 
            MIDDLE: THREE.MOUSE.DOLLY, 
            RIGHT: THREE.MOUSE.PAN 
        }}
        enablePan={true}
      />

      <group position={[0, -0.05, 0]}>
          <TerrainFloor terrain={environment.terrain} />
          <VegetationLayer terrain={environment.terrain} />
          {environment.terrain === 'mountain' && <BackgroundMountains />}
      </group>

      {/* HELPER GRID TOGGLE */}
      {environment.showGrid && (
          <group position={[0, 0.01, 0]}>
              <Grid infiniteGrid fadeDistance={50} cellColor="#94a3b8" sectionColor="#475569" cellThickness={0.5} sectionThickness={1} />
          </group>
      )}

      {/* GROUND SHADOWS - High Quality Soft Shadows */}
      <ContactShadows 
        position={[0, 0.02, 0]} 
        opacity={0.6} 
        scale={80} 
        blur={2} 
        far={2} 
        color="#000000" 
        resolution={1024} 
        frames={1} 
      />

      {/* GLOBAL SMART ROOF RENDERER */}
      <SmartRoofRenderer />

      <group onPointerMissed={() => { if(!dragState.active) selectObject(null); }}>
          {modules.map(m => <ModuleMesh key={m.id} data={m} />)}
          {props.map(p => <PropMesh key={p.id} data={p} />)}
      </group>
    </>
  );
};

export const Scene = () => {
    return (
        <Canvas 
            shadows="soft"
            dpr={[1, 1.5]} 
            gl={{ 
                antialias: true, 
                toneMapping: THREE.AgXToneMapping, 
                toneMappingExposure: 1.1,
                powerPreference: "high-performance"
            }}
            className="w-full h-full"
        >
            <SceneContent />
        </Canvas>
    )
};