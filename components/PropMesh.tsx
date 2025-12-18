import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { PropData, OpeningType } from '../types';
import { Edges, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { TextureGenerator } from './ModuleMesh';

// Use textures from generator for props
const usePropMaterials = () => {
    return useMemo(() => {
        // --- IMPROVED PBR PROP TEXTURES ---
        // Wood
        const woodOak = TextureGenerator.createWoodTexture('#e6cdac', '#a67c52');
        
        // Fabric
        const fabricGrey = TextureGenerator.createFabricTexture('#64748b', 0.15);
        const fabricBeige = TextureGenerator.createFabricTexture('#f5f5dc', 0.1); 
        
        // Stone & Tile
        const stoneDark = TextureGenerator.createStoneTexture('#334155', 2);
        const tileWhite = TextureGenerator.createTileTexture('#ffffff', '#e2e8f0', 6, 6);
        
        // Plaster
        const plasterTex = TextureGenerator.createStoneTexture('#f8fafc', 0.5);
        const bump = TextureGenerator.createGenericBump(0.2);

        return {
            fabric: new THREE.MeshStandardMaterial({ 
                map: fabricGrey, 
                bumpMap: fabricGrey,
                bumpScale: 0.08,
                roughness: 0.9,
                color: '#ffffff' 
            }),
            fabric_light: new THREE.MeshStandardMaterial({ 
                map: fabricBeige, 
                bumpMap: fabricBeige,
                bumpScale: 0.08,
                roughness: 0.9,
                color: '#ffffff'
            }),
            wood: new THREE.MeshStandardMaterial({
                map: woodOak,
                bumpMap: woodOak,
                bumpScale: 0.02,
                roughness: 0.6,
                color: '#ffffff'
            }),
            stone: new THREE.MeshStandardMaterial({
                map: stoneDark,
                bumpMap: stoneDark,
                bumpScale: 0.02,
                roughness: 0.7,
                color: '#ffffff'
            }),
            tile_white: new THREE.MeshStandardMaterial({
                map: tileWhite,
                bumpMap: tileWhite,
                bumpScale: 0.01,
                roughness: 0.2,
                color: '#ffffff'
            }),
            plaster: new THREE.MeshStandardMaterial({
                map: plasterTex,
                bumpMap: bump,
                bumpScale: 0.01,
                roughness: 0.9,
                color: '#f8fafc'
            }),
            white_gloss: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.1, metalness: 0.0, envMapIntensity: 0.5 }),
            metal: new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.6, roughness: 0.3, envMapIntensity: 0.8 }),
            black_metal: new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.4, envMapIntensity: 0.5 }),
            porcelain: new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.1, metalness: 0.0, envMapIntensity: 0.5 }),
            chrome: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.0, metalness: 1.0, envMapIntensity: 1.5 }),
            
            // Solar
            solar_cell: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2, metalness: 0.8, envMapIntensity: 1.0 }),
            
            // Re-using Module Materials for internal walls
            plaster_white: new THREE.MeshStandardMaterial({ map: plasterTex, bumpMap: bump, bumpScale: 0.01, color: '#f8fafc', roughness: 0.9 }),
            plaster_anth: new THREE.MeshStandardMaterial({ map: plasterTex, bumpMap: bump, bumpScale: 0.01, color: '#475569', roughness: 0.9 }), 
            wpc_grey: new THREE.MeshStandardMaterial({ color: '#374151', roughness: 0.7 }),
            wpc_brown: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 }),
            stone_facade: new THREE.MeshStandardMaterial({ map: stoneDark, bumpMap: stoneDark, bumpScale: 0.05, roughness: 0.9 }),
            concrete: new THREE.MeshStandardMaterial({ map: TextureGenerator.createStoneTexture('#cbd5e1'), bumpMap: bump, bumpScale: 0.02, roughness: 0.9 }),
            alu_anthracite: new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.5, roughness: 0.4 }),
            alu_white: new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.3, roughness: 0.3 }),
            glass: new THREE.MeshPhysicalMaterial({ 
                color: '#ffffff', transmission: 0.98, opacity: 1, metalness: 0, roughness: 0.0, ior: 1.5, thickness: 0.02, transparent: true
            }),
            steel: new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.2 }),
        }
    }, []);
};

const nullRaycast = () => null;

// Re-using Door/Window logic components (Simplified for PropMesh context)
const PropDoor = ({ w, h, materials, type }: any) => {
    const frameThick = 0.05;
    const frameDepth = 0.12; 
    return (
        <group>
            {/* SUPERIOR HITBOX: Thicker and protrudes from wall to guarantee selection priority */}
            <mesh position={[0, h/2, 0]}>
                <boxGeometry args={[w, h, frameDepth + 0.3]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} color="red" />
            </mesh>

            {/* Frame Top */}
            <mesh position={[0, h - frameThick/2, 0]} material={materials.alu_anthracite}><boxGeometry args={[w, frameThick, frameDepth]} /></mesh>
            {/* Frame Sides */}
            <mesh position={[-w/2 + frameThick/2, h/2, 0]} material={materials.alu_anthracite}><boxGeometry args={[frameThick, h, frameDepth]} /></mesh>
            <mesh position={[w/2 - frameThick/2, h/2, 0]} material={materials.alu_anthracite}><boxGeometry args={[frameThick, h, frameDepth]} /></mesh>
            {/* Leaf */}
            <mesh position={[0, h/2, 0]} material={materials.white_gloss}><boxGeometry args={[w - 0.1, h - 0.05, 0.04]} /></mesh>
            {/* Handle */}
            <group position={[w/2 - 0.15, 1.05, 0.03]}>
                 <mesh material={materials.chrome} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.01, 0.01, 0.12]} /></mesh>
            </group>
        </group>
    )
}

// --- MINIMALIST STAIR COMPONENTS ---

const SimpleRailing = ({ start, end, materials }: any) => {
    // Minimalist Railing: Just start post, end post, and top bar
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const height = 0.9;
    const dist = s.distanceTo(e);
    
    // Calculate rotation
    const dx = e.x - s.x;
    const dz = e.z - s.z;
    const dy = e.y - s.y;
    const angleY = Math.atan2(dz, dx);
    const angleZ = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));

    const center = s.clone().add(e).multiplyScalar(0.5);
    center.y += height; // Bar height

    return (
        <group>
             {/* Post Start */}
             <mesh position={[s.x, s.y + height/2, s.z]} material={materials.black_metal}>
                 <boxGeometry args={[0.04, height, 0.04]} />
             </mesh>
             {/* Post End */}
             <mesh position={[e.x, e.y + height/2, e.z]} material={materials.black_metal}>
                 <boxGeometry args={[0.04, height, 0.04]} />
             </mesh>
             {/* Handrail */}
             <mesh position={center} rotation={[0, -angleY, angleZ]} material={materials.black_metal}>
                 <boxGeometry args={[dist, 0.05, 0.05]} />
             </mesh>
        </group>
    )
}

const StairStraight = ({ size, materials }: any) => {
    const w = size[0];
    const h = size[1];
    const d = size[2];
    const steps = 14;
    const riserH = h / steps;
    const treadD = d / steps;
    
    // Correction: Push spine lower to completely clear treads
    const spineOffset = 0.35;
    const spineLen = Math.sqrt(h**2 + d**2);

    return (
        <group>
             {/* Central Spine */}
             {/* Rotation fix: atan2(run, rise) for vertical beam rotation */}
             <mesh position={[0, h/2 - spineOffset, 0]} rotation={[Math.atan2(d, h), 0, 0]} material={materials.black_metal} castShadow>
                 <boxGeometry args={[0.12, spineLen + 0.2, 0.15]} />
             </mesh>
             
             {/* Floating Treads */}
             {[...Array(steps)].map((_, i) => (
                 <mesh key={i} position={[0, i * riserH + riserH, -d/2 + i * treadD + treadD/2]} material={materials.wood} castShadow receiveShadow>
                     <boxGeometry args={[w - 0.1, 0.06, treadD]} />
                 </mesh>
             ))}

             {/* Simple Railing */}
             <SimpleRailing start={[w/2-0.05, riserH, -d/2+treadD]} end={[w/2-0.05, h, d/2]} materials={materials} />
             <SimpleRailing start={[-w/2+0.05, riserH, -d/2+treadD]} end={[-w/2+0.05, h, d/2]} materials={materials} />
        </group>
    )
}

const StairSpiral = ({ size, materials }: any) => {
    const w = size[0];
    const h = size[1];
    const steps = 16;
    const riserH = h / steps;
    const radius = w/2;
    return (
        <group>
            {/* Center Pole */}
            <mesh position={[0, h/2, 0]} material={materials.black_metal} castShadow>
                <cylinderGeometry args={[0.1, 0.1, h]} />
            </mesh>
            {/* Steps */}
            {[...Array(steps)].map((_, i) => {
                const rot = (i / steps) * Math.PI * 1.5;
                return (
                    <group key={i} position={[0, i * riserH + riserH, 0]} rotation={[0, -rot, 0]}>
                         <mesh position={[radius/2, 0, 0]} material={materials.wood} castShadow receiveShadow>
                             <boxGeometry args={[radius, 0.05, 0.3]} />
                         </mesh>
                         {/* Simple vertical rod for railing per step */}
                         <mesh position={[radius - 0.1, 0.5, 0.1]} material={materials.black_metal}>
                             <cylinderGeometry args={[0.015, 0.015, 1]} />
                         </mesh>
                    </group>
                )
            })}
        </group>
    )
}

const StairL = ({ size, materials }: any) => {
    const w = size[0];
    const h = size[1];
    const d = size[2]; 
    
    // Dynamically calculate run width based on total bounding box, capping it at logical values
    // This ensures if user shrinks the stair, the path shrinks too to fit inside L-shape
    const runWidth = Math.min(1.0, w/2, d/2); 

    const stepsTotal = 15;
    const riserH = h / stepsTotal;
    
    // Landing Size
    const landingSize = runWidth;
    
    // Lengths
    const lowerRunLen = d - landingSize;
    const upperRunLen = w - landingSize;
    
    const stepsLower = 7;
    const stepsUpper = 7;
    
    const treadD_Lower = lowerRunLen / stepsLower;
    const treadD_Upper = upperRunLen / stepsUpper;
    
    const h_landing = (stepsLower + 1) * riserH;

    // Origin Coordinates (Center of Bounding Box)
    const cornerX = -w/2;
    const cornerZ = -d/2;
    
    const lowerRunX = cornerX + runWidth / 2;
    const upperRunZ = cornerZ + runWidth / 2;
    
    // Correction: Push spines lower so they don't clip treads
    const spineOffset = 0.35;
    const lowerSpineLen = Math.sqrt(h_landing**2 + lowerRunLen**2);
    const upperSpineLen = Math.sqrt((h-h_landing)**2 + upperRunLen**2);

    return (
        <group>
            {/* === LANDING === */}
            <mesh position={[cornerX + landingSize/2, h_landing - 0.03, cornerZ + landingSize/2]} material={materials.wood} castShadow receiveShadow>
                <boxGeometry args={[landingSize, 0.06, landingSize]} />
            </mesh>
            {/* Landing Support - connects spine to ground */}
            <mesh position={[cornerX + landingSize/2, h_landing/2, cornerZ + landingSize/2]} material={materials.black_metal}>
                <cylinderGeometry args={[0.08, 0.08, h_landing]} />
            </mesh>

            {/* === LOWER RUN (Z-Axis) === */}
            <group>
                 {/* Spine */}
                 {/* Fixed Rotation: Negative X rotation for Z-backward movement */}
                 <mesh 
                    position={[lowerRunX, h_landing/2 - spineOffset, d/2 - lowerRunLen/2]} 
                    rotation={[-Math.atan2(lowerRunLen, h_landing), 0, 0]} 
                    material={materials.black_metal}
                 >
                     <boxGeometry args={[0.12, lowerSpineLen + 0.2, 0.15]} />
                 </mesh>
                 
                 {/* Steps */}
                 {[...Array(stepsLower)].map((_, i) => {
                     // Start from front (Z+) going back (Z-)
                     const y = (i + 1) * riserH;
                     const z = (d/2) - (i * treadD_Lower) - treadD_Lower/2;
                     return (
                         <mesh key={`l-${i}`} position={[lowerRunX, y, z]} material={materials.wood} castShadow>
                             <boxGeometry args={[runWidth - 0.05, 0.06, treadD_Lower - 0.02]} />
                         </mesh>
                     )
                 })}
                 
                 {/* Railing Outer */}
                 <SimpleRailing 
                    start={[lowerRunX - runWidth/2 + 0.05, riserH, d/2 - 0.1]} 
                    end={[lowerRunX - runWidth/2 + 0.05, h_landing, cornerZ + landingSize]} 
                    materials={materials} 
                 />
            </group>

            {/* === UPPER RUN (X-Axis) === */}
            <group>
                 {/* Spine */}
                 {/* Fixed Rotation: Negative Z rotation for X-forward movement */}
                 <mesh 
                    position={[cornerX + landingSize + upperRunLen/2, h_landing + (h - h_landing)/2 - spineOffset, upperRunZ]} 
                    rotation={[0, 0, -Math.atan2(upperRunLen, h - h_landing)]} 
                    material={materials.black_metal}
                 >
                     <boxGeometry args={[0.12, upperSpineLen + 0.2, 0.15]} />
                 </mesh>

                 {/* Steps */}
                 {[...Array(stepsUpper)].map((_, i) => {
                     const y = h_landing + (i + 1) * riserH;
                     const x = (cornerX + landingSize) + (i * treadD_Upper) + treadD_Upper/2;
                     return (
                         <mesh key={`u-${i}`} position={[x, y, upperRunZ]} material={materials.wood} castShadow>
                             <boxGeometry args={[treadD_Upper - 0.02, 0.06, runWidth - 0.05]} />
                         </mesh>
                     )
                 })}

                 {/* Railing Outer */}
                 <SimpleRailing 
                    start={[cornerX + landingSize, h_landing, upperRunZ - runWidth/2 + 0.05]} 
                    end={[w/2 - 0.1, h, upperRunZ - runWidth/2 + 0.05]} 
                    materials={materials} 
                 />
            </group>
        </group>
    )
}

const StairU = ({ size, materials }: any) => {
    const w = size[0];
    const h = size[1];
    const d = size[2];
    
    // Dynamic runWidth based on total Width W. 
    // Usually U-Stair is 2 runs + gap.
    // If w=2.0, gap=0.1 -> runWidth ~= 0.95.
    // If user resizes to w=3.0, runWidth ~= 1.45.
    const gap = 0.1;
    const runWidth = (w - gap) / 2;

    const stepsRun = 7;
    const riserH = h / (stepsRun * 2 + 1); // +1 for landing
    
    // Geometry Constants
    const treadDepth = (d - runWidth) / stepsRun; // Tread depth based on remaining depth after landing
    const runLen = stepsRun * treadDepth;
    const runHeight = stepsRun * riserH;
    const spineLen = Math.sqrt(runHeight**2 + runLen**2);
    
    // Correction: Push spine lower
    const spineOffset = 0.35;
    
    // Calculate Angle based on Run/Rise for exact rotation
    const angle = Math.atan2(runLen, runHeight);

    return (
        <group>
             {/* Landing */}
             <mesh position={[0, stepsRun*riserH + riserH - 0.03, -d/2 + runWidth/2]} material={materials.wood} castShadow>
                 <boxGeometry args={[w, 0.06, runWidth]} />
             </mesh>
             {/* Landing Support */}
             <mesh position={[0, (stepsRun*riserH + riserH)/2, -d/2 + runWidth/2]} material={materials.black_metal}>
                 <cylinderGeometry args={[0.1, 0.1, stepsRun*riserH + riserH]} />
             </mesh>
             
             {/* Run 1 (Left) - Z backward */}
             <group position={[ -w/4 - 0.05, 0, 0 ]}>
                 {/* Spine - Centered in run length */}
                 {/* Start Z: d/2 - 0.3. End Z: d/2 - 0.3 - runLen. Mid Z: d/2 - 0.3 - runLen/2 */}
                 {/* Adjusted Z offset to match new dynamic treadDepth */}
                 <mesh 
                    position={[0, runHeight/2 - spineOffset, d/2 - 0.3 - runLen/2]} 
                    rotation={[-angle, 0, 0]} 
                    material={materials.black_metal}
                 >
                     <boxGeometry args={[0.12, spineLen + 0.4, 0.15]} /> 
                 </mesh>
                 {/* Steps */}
                 {[...Array(stepsRun)].map((_, i) => (
                     <mesh key={`u1-${i}`} position={[0, (i+1)*riserH, d/2 - i*treadDepth - 0.3]} material={materials.wood} castShadow>
                         <boxGeometry args={[runWidth, 0.06, treadDepth]} />
                     </mesh>
                 ))}
                 <SimpleRailing start={[runWidth/2-0.05, riserH, d/2-0.3]} end={[runWidth/2-0.05, stepsRun*riserH, d/2 - stepsRun*treadDepth - 0.3]} materials={materials} />
             </group>

             {/* Run 2 (Right) - Z forward */}
             <group position={[ w/4 + 0.05, stepsRun*riserH + riserH, 0 ]}>
                 {/* Spine - Centered in run length */}
                 {/* Start Z: -d/2 + runWidth + 0.2. End Z: ... + runLen. Mid Z: ... + runLen/2 */}
                 <mesh 
                    position={[0, runHeight/2 - spineOffset, -d/2 + runWidth + 0.2 + runLen/2]} 
                    rotation={[angle, 0, 0]} 
                    material={materials.black_metal}
                 >
                     <boxGeometry args={[0.12, spineLen + 0.4, 0.15]} />
                 </mesh>
                 {/* Steps */}
                 {[...Array(stepsRun)].map((_, i) => (
                     <mesh key={`u2-${i}`} position={[0, (i+1)*riserH, -d/2 + runWidth + i*treadDepth + 0.2]} material={materials.wood} castShadow>
                         <boxGeometry args={[runWidth, 0.06, treadDepth]} />
                     </mesh>
                 ))}
                 <SimpleRailing start={[-runWidth/2+0.05, riserH, -d/2 + runWidth + 0.2]} end={[-runWidth/2+0.05, stepsRun*riserH, -d/2 + runWidth + stepsRun*treadDepth + 0.2]} materials={materials} />
             </group>
        </group>
    )
}

const InternalWallMesh = ({ data, materials, isInteractive, raycastProps, handleClick, handlePointerDown }: any) => {
    const { id, size, wallData } = data;
    const { w, h, d } = { w: size?.[0] || 2.0, h: size?.[1] || 2.8, d: size?.[2] || 0.1 };
    const { selectObject, selection, activeTab } = useStore();
    const isSelected = selection?.type === 'prop' && selection?.id === id;
    const [openingHover, setOpeningHover] = useState<string|null>(null);
    useCursor(!!openingHover, 'pointer', 'auto');

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0);
        s.lineTo(w / 2, 0);
        s.lineTo(w / 2, h);
        s.lineTo(-w / 2, h);
        wallData?.openings.forEach((op: any) => {
            const cx = (op.x - 0.5) * w;
            const cy = op.y + op.h / 2;
            const hole = new THREE.Path();
            hole.moveTo(cx - op.w / 2, cy - op.h / 2);
            hole.lineTo(cx + op.w / 2, cy - op.h / 2);
            hole.lineTo(cx + op.w / 2, cy + op.h / 2);
            hole.lineTo(cx - op.w / 2, cy + op.h / 2);
            s.holes.push(hole);
        });
        return s;
    }, [w, h, wallData?.openings]);

    const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }), [shape, d]);
    const matName = wallData?.mat || 'plaster_white';
    const material = (materials as any)[matName] || materials.plaster;

    return (
        <group>
            <mesh 
                position={[0, 0, -d/2]} 
                geometry={geometry} 
                material={material} 
                castShadow 
                receiveShadow
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                {...raycastProps}
            >
                {isSelected && <Edges color="#f97316" threshold={15} scale={1.002} />}
            </mesh>
            {wallData?.openings.map((op: any) => (
                <group 
                    key={op.id} 
                    position={[(op.x - 0.5) * w, op.y, 0]} 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        selectObject({ type: 'opening', id: id, secondaryId: op.id }); 
                    }}
                    onPointerOver={(e) => { e.stopPropagation(); setOpeningHover(op.id); }}
                    onPointerOut={(e) => { e.stopPropagation(); setOpeningHover(null); }}
                >
                    {op.type.includes('door') ? (
                         <PropDoor w={op.w} h={op.h} materials={materials} type={op.type} />
                    ) : (
                        <group position={[0, op.h/2, 0]}>
                            {/* Hitbox for windows */}
                            <mesh>
                                <boxGeometry args={[op.w, op.h, 0.3]} />
                                <meshBasicMaterial transparent opacity={0} depthWrite={false} color="blue" />
                            </mesh>
                            <mesh><boxGeometry args={[op.w, op.h, 0.04]} /><primitive object={materials.glass} /></mesh>
                        </group>
                    )}
                    {selection?.secondaryId === op.id && <Edges color="#f97316" scale={1.05} threshold={15} />}
                </group>
            ))}
        </group>
    )
}

export const PropMesh: React.FC<{ data: PropData }> = ({ data }) => {
  const { id, type, pos, rot, size } = data;
  const { selectObject, selection, startDrag, dragState, activeTab, activeTool, addOpening, addProp, setWallMaterial, modules, environment } = useStore();
  const isSelected = selection?.type === 'prop' && selection?.id === id;
  const isDragging = dragState.active && dragState.id === id;
  const [hovered, setHover] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const materials = usePropMaterials();
  
  const isInternalWall = type === 'wall_internal';
  const isNight = environment.time < 6 || environment.time > 19;
  
  // UNLOCKED: Interaction always possible
  const isInteractive = true;

  const raycastProps = {}; 
  // FIXED: Correct ternary syntax for useCursor
  useCursor(hovered, (activeTool && isInternalWall) ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'), 'auto');
  
  const [isOpen, setIsOpen] = useState(false);
  const animRef = useRef({ val: 0 });

  useFrame((_, delta) => {
      animRef.current.val = THREE.MathUtils.lerp(animRef.current.val, isOpen ? 1 : 0, delta * 6);
      if (groupRef.current) {
          const val = animRef.current.val;
          if (type === 'wardrobe') {
              const doorL = groupRef.current.getObjectByName('doorL');
              const doorR = groupRef.current.getObjectByName('doorR');
              if (doorL) doorL.rotation.y = -val * 2.0;
              if (doorR) doorR.rotation.y = val * 2.0;
          }
          if (type === 'kitchen') {
              const drawer1 = groupRef.current.getObjectByName('drawer1');
              const drawer2 = groupRef.current.getObjectByName('drawer2');
              if (drawer1) drawer1.position.z = 0.3 + val * 0.4;
              if (drawer2) drawer2.position.z = 0.3 + val * 0.3;
          }
          if (type === 'shower') {
              const door = groupRef.current.getObjectByName('door');
              if (door) door.rotation.y = val * 1.5;
          }
      }
  });

  const handleWallClick = (e: any) => {
      e.stopPropagation();
      if (activeTool && !activeTool.includes('open') && !activeTool.includes('door') && !activeTool.includes('window')) { 
          // If a general prop tool is active, don't do wall specific logic, let drag happen or select
      }
      
      const isOpeningTool = activeTool && (activeTool.includes('door') || activeTool.includes('window') || activeTool.includes('balcony'));
      if (isOpeningTool) {
           const localPoint = e.object.worldToLocal(e.point.clone());
           const w = size?.[0] || 2.0;
           const relX = (localPoint.x + (w/2)) / w;
           if(activeTool?.includes('door')) addOpening(id, null, activeTool as OpeningType, relX, 0.05);
           else addOpening(id, null, activeTool as OpeningType, relX, 1.0);
           return;
      }
      selectObject({ type: 'prop', id });
  };

  const handlePointerDown = (e: any) => {
      if (activeTool && (activeTool.includes('door') || activeTool.includes('window'))) return;
      e.stopPropagation(); 
      startDrag(id, 'prop', [0, 0]); 
  };

  const handleStandardInteraction = (e: any) => {
      e.stopPropagation();
      if(['wardrobe', 'kitchen', 'shower'].includes(type)) setIsOpen(!isOpen);
      selectObject({ type: 'prop', id }); 
  }

  const renderModel = () => {
    switch (type) {
      case 'wall_internal':
          return (
             <InternalWallMesh 
                data={data} 
                materials={materials} 
                isInteractive={isInteractive} 
                raycastProps={raycastProps}
                handleClick={handleWallClick}
                handlePointerDown={handlePointerDown}
             />
          );
      case 'stair_straight': return <StairStraight size={size} materials={materials} />
      case 'stair_spiral': return <StairSpiral size={size} materials={materials} />
      case 'stair_l_shape': return <StairL size={size} materials={materials} />
      case 'stair_u_shape': return <StairU size={size} materials={materials} />
      case 'solar': 
          const sol_w = size ? size[0] : 1.6;
          const sol_d = size ? size[2] : 1.0;
          return (
              <group>
                  <mesh position={[0, 0.05, 0]} rotation={[-0.1, 0, 0]} material={materials.solar_cell} castShadow {...raycastProps}><boxGeometry args={[sol_w, 0.05, sol_d]} /></mesh>
                  <mesh position={[0, 0.05, 0]} rotation={[-0.1, 0, 0]} material={materials.alu_anthracite} {...raycastProps}><boxGeometry args={[sol_w+0.05, 0.04, sol_d+0.05]} /></mesh>
                  <mesh position={[0, 0.02, 0.3]} material={materials.alu_white}><cylinderGeometry args={[0.02, 0.02, 0.1]} /></mesh>
                  <mesh position={[0, 0.06, -0.3]} material={materials.alu_white}><cylinderGeometry args={[0.02, 0.02, 0.2]} /></mesh>
              </group>
          )
      case 'wc':
          const wc_w = size ? size[0] : 0.4;
          const wc_h = size ? size[1] : 0.8;
          const wc_d = size ? size[2] : 0.55;
          return (
              <group>
                  <mesh position={[0, wc_h/2 + 0.1, -0.1]} material={materials.porcelain} castShadow {...raycastProps}><boxGeometry args={[wc_w, wc_h, 0.1]} /></mesh>
                  <mesh position={[0, wc_h/2, wc_d/2 - 0.05]} castShadow material={materials.porcelain} {...raycastProps}><boxGeometry args={[wc_w * 0.9, wc_h * 0.7, wc_d]} /></mesh>
                  <group position={[0, wc_h + 0.2, -0.2]}><mesh material={materials.chrome} {...raycastProps}><boxGeometry args={[wc_w*0.6, 0.15, 0.02]} /></mesh></group>
              </group>
          )
      case 'tub':
          const tub_w = size ? size[0] : 1.7;
          const tub_h = size ? size[1] : 0.6;
          const tub_d = size ? size[2] : 0.8;
          return (
             <group>
                 <group position={[0, tub_h/2, 0]}>
                     <mesh castShadow material={materials.porcelain} {...raycastProps}><boxGeometry args={[tub_w, tub_h, tub_d]} /></mesh>
                     <mesh position={[0, 0.05, 0]} material={materials.white_gloss} {...raycastProps}><boxGeometry args={[tub_w-0.1, tub_h, tub_d-0.1]} /></mesh>
                 </group>
                 <group position={[0, 0, -tub_d/2 - 0.15]}>
                     <mesh position={[0, tub_h*0.8, 0]} material={materials.chrome} {...raycastProps}><cylinderGeometry args={[0.03, 0.04, tub_h*1.5]} /></mesh>
                 </group>
             </group>
          )
      case 'sink':
          const sink_w = size ? size[0] : 1.0;
          const sink_h = size ? size[1] : 0.85;
          const sink_d = size ? size[2] : 0.5;
          return (
              <group>
                  <mesh position={[0, sink_h/2, 0]} castShadow material={materials.wood} {...raycastProps}><boxGeometry args={[sink_w, sink_h * 0.6, sink_d]} /></mesh>
                  <mesh position={[0, sink_h * 0.8 + 0.01, 0]} material={materials.white_gloss} {...raycastProps}><boxGeometry args={[sink_w + 0.02, 0.02, sink_d + 0.02]} /></mesh>
                  <mesh position={[0, sink_h * 0.8 + 0.1, 0]} castShadow material={materials.porcelain} {...raycastProps}><cylinderGeometry args={[sink_d*0.4, sink_d*0.35, 0.15, 32]} /></mesh>
                  <group position={[0, sink_h * 0.8 + 0.05, -sink_d*0.3]}><mesh position={[0, 0.15, 0]} material={materials.chrome} {...raycastProps}><cylinderGeometry args={[0.02, 0.025, 0.3]} /></mesh></group>
              </group>
          )
      case 'shower':
          const sh_w = size ? size[0] : 1.0;
          const sh_h = size ? size[1] : 2.0;
          const sh_d = size ? size[2] : 1.0;
          return (
              <group>
                  <mesh position={[0, 0.03, 0]} receiveShadow material={materials.tile_white} {...raycastProps}><boxGeometry args={[sh_w, 0.06, sh_d]} /></mesh>
                  <mesh position={[sh_w/2 - 0.01, sh_h/2 + 0.03, 0]} {...raycastProps}><boxGeometry args={[0.02, sh_h, sh_d]} /><primitive object={materials.glass} /></mesh>
                  <mesh position={[0, sh_h/2 + 0.03, -sh_d/2 + 0.01]} {...raycastProps}><boxGeometry args={[sh_w, sh_h, 0.02]} /><primitive object={materials.glass} /></mesh>
              </group>
          )
      case 'sofa':
        const s_w = size ? size[0] : 2.2;
        const s_h = size ? size[1] : 0.8;
        const s_d = size ? size[2] : 0.9;
        const armW = 0.2;
        const seatH = s_h * 0.4;
        return (
          <group>
            <mesh position={[0, seatH/2, 0]} castShadow receiveShadow material={materials.fabric} {...raycastProps}><boxGeometry args={[s_w, seatH, s_d]} /></mesh>
            <mesh position={[0, s_h/2 + seatH/2, -s_d/2 + 0.1]} castShadow material={materials.fabric} {...raycastProps}><boxGeometry args={[s_w, s_h - seatH, 0.2]} /></mesh>
            <mesh position={[-s_w/2 + armW/2, s_h/2, 0]} castShadow material={materials.fabric} {...raycastProps}><boxGeometry args={[armW, s_h, s_d]} /></mesh>
            <mesh position={[s_w/2 - armW/2, s_h/2, 0]} castShadow material={materials.fabric} {...raycastProps}><boxGeometry args={[armW, s_h, s_d]} /></mesh>
          </group>
        )
      case 'kitchen':
          const k_w = size ? size[0] : 2.4;
          const k_h = size ? size[1] : 0.9;
          const k_d = size ? size[2] : 0.6;
          return (
              <group>
                  <mesh position={[0, k_h/2, 0]} castShadow material={materials.white_gloss} {...raycastProps}><boxGeometry args={[k_w, k_h, k_d]} /></mesh>
                  <mesh position={[0, k_h + 0.02, 0]} material={materials.stone} {...raycastProps}><boxGeometry args={[k_w + 0.02, 0.04, k_d + 0.02]} /></mesh>
                  <mesh position={[-k_w*0.2, k_h + 0.01, 0]} material={materials.chrome} {...raycastProps}><boxGeometry args={[0.6, 0.02, 0.4]} /></mesh>
                  <mesh position={[k_w*0.25, k_h + 0.025, 0]} material={materials.black_metal} {...raycastProps}><boxGeometry args={[0.6, 0.01, 0.5]} /></mesh>
                  <mesh name="drawer1" position={[-k_w*0.25, k_h*0.7, k_d/2 + 0.01]} material={materials.white_gloss} {...raycastProps}><boxGeometry args={[k_w*0.4, k_h*0.4, 0.02]} /></mesh>
                  <mesh name="drawer2" position={[k_w*0.25, k_h*0.7, k_d/2 + 0.01]} material={materials.white_gloss} {...raycastProps}><boxGeometry args={[k_w*0.4, k_h*0.4, 0.02]} /></mesh>
              </group>
          )
      case 'bed':
          const b_w = size ? size[0] : 1.6;
          const b_h = size ? size[1] : 0.5;
          const b_d = size ? size[2] : 2.1;
          const mattressH = 0.2;
          return (
              <group>
                  <mesh position={[0, (b_h-mattressH)/2, 0]} castShadow material={materials.wood} {...raycastProps}><boxGeometry args={[b_w, b_h - mattressH, b_d]} /></mesh>
                  <mesh position={[0, b_h - mattressH/2, 0]} material={materials.fabric_light} {...raycastProps}><boxGeometry args={[b_w - 0.1, mattressH, b_d - 0.1]} /></mesh>
                  <mesh position={[0, b_h + 0.4, -b_d/2 + 0.05]} castShadow material={materials.wood} {...raycastProps}><boxGeometry args={[b_w, 0.8, 0.1]} /></mesh>
              </group>
          )
      case 'wardrobe':
          const wd_w = size ? size[0] : 1.2;
          const wd_h = size ? size[1] : 2.2;
          const wd_d = size ? size[2] : 0.6;
          return (
              <group>
                  <mesh position={[0, wd_h/2, 0]} castShadow material={materials.white_gloss} {...raycastProps}><boxGeometry args={[wd_w, wd_h, wd_d]} /></mesh>
                  <group name="doorL" position={[-wd_w/2, 0, wd_d/2 + 0.01]}>
                      <mesh position={[wd_w/4, wd_h/2, 0]} material={materials.wood} {...raycastProps}><boxGeometry args={[wd_w/2 - 0.005, wd_h - 0.1, 0.02]} /></mesh>
                      <mesh position={[wd_w/2 - 0.05, wd_h/2, 0.03]} material={materials.black_metal} {...raycastProps}><boxGeometry args={[0.01, 0.2, 0.01]} /></mesh>
                  </group>
                  <group name="doorR" position={[wd_w/2, 0, wd_d/2 + 0.01]}>
                      <mesh position={[-wd_w/4, wd_h/2, 0]} material={materials.wood} {...raycastProps}><boxGeometry args={[wd_w/2 - 0.005, wd_h - 0.1, 0.02]} /></mesh>
                  </group>
              </group>
          )
      case 'socket': return <group position={[0,0.3,0]}><mesh material={materials.white_gloss} {...raycastProps}><boxGeometry args={[0.08, 0.08, 0.02]} /></mesh><mesh position={[0,0,0.011]} material={materials.black_metal}><circleGeometry args={[0.015, 32]} /></mesh></group>
      case 'switch': return <group position={[0,1.05,0]}><mesh material={materials.white_gloss} {...raycastProps}><boxGeometry args={[0.08, 0.08, 0.02]} /></mesh><mesh position={[0,0,0.015]} material={materials.white_gloss}><boxGeometry args={[0.04, 0.04, 0.01]} /></mesh></group>
      case 'light': return (
          <group>
              <mesh material={materials.white_gloss} {...raycastProps}><cylinderGeometry args={[0.15, 0.2, 0.1]} /></mesh>
              <mesh position={[0,-0.05,0]}><sphereGeometry args={[0.08]} /><meshBasicMaterial color="#fff" /></mesh>
              {isNight && environment.lights && <pointLight position={[0, -0.2, 0]} intensity={15} distance={5} color="#ffddaa" castShadow />}
          </group>
      )
      case 'ac': return <group position={[0, 2.2, 0]}><mesh material={materials.white_gloss} castShadow {...raycastProps}><boxGeometry args={[0.9, 0.3, 0.2]} /></mesh><mesh position={[0, -0.1, 0.1]} material={materials.black_metal}><boxGeometry args={[0.7, 0.05, 0.01]} /></mesh></group>
      case 'heater': return <group position={[0, 0.4, 0.05]}><mesh material={materials.white_gloss} castShadow {...raycastProps}><boxGeometry args={[0.8, 0.6, 0.1]} /></mesh><group position={[0,0,0.06]}>{[...Array(10)].map((_,i) => <mesh key={i} position={[0, i*0.05 - 0.2, 0]} material={materials.metal}><boxGeometry args={[0.7, 0.005, 0.01]} /></mesh>)}</group></group>
      case 'heatpump': return <group><mesh position={[0, 0.6, 0]} material={materials.metal} castShadow {...raycastProps}><boxGeometry args={[1.2, 1.2, 0.6]} /></mesh><mesh position={[0, 0.6, 0.31]} rotation={[Math.PI/2,0,0]} material={materials.black_metal}><cylinderGeometry args={[0.4, 0.4, 0.02]} /></mesh></group>
      case 'boiler': return <group><mesh position={[0, 0.8, 0]} material={materials.white_gloss} castShadow {...raycastProps}><cylinderGeometry args={[0.3, 0.3, 1.6]} /></mesh></group>
      default: return <mesh material={materials.white_gloss} castShadow {...raycastProps}><boxGeometry args={[0.5, 0.5, 0.5]} /></mesh>
    }
  }

  return (
    <group 
        ref={groupRef}
        name={id}
        position={pos} 
        rotation={[0, rot, 0]}
        onClick={handleStandardInteraction} 
        onPointerDown={(e) => {
            if (activeTool && (activeTool.includes('door') || activeTool.includes('window') || activeTool.includes('balcony'))) return;
            e.stopPropagation();
            startDrag(id, 'prop', [0, 0]);
        }}
        onPointerOver={(e) => { 
            e.stopPropagation(); setHover(true);
        }}
        onPointerOut={(e) => { 
            e.stopPropagation(); setHover(false);
        }}
    >
        {renderModel()}
        
        {(isSelected || hovered) && !isInternalWall && (
             <mesh position={[0, (size?.[1]||1)/2, 0]} material={new THREE.MeshBasicMaterial({ color: isSelected ? "#f97316" : "#fbbf24", wireframe: true, transparent: true, opacity: 0.5 })} {...raycastProps}>
                 <boxGeometry args={[ (size?.[0]||1)+0.1, (size?.[1]||1)+0.1, (size?.[2]||1)+0.1 ]} />
             </mesh>
        )}
    </group>
  );
};