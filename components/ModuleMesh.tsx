import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { ModuleData, WallSide, OpeningType, WallStructure, RoofType } from '../types';
import { Edges, useCursor } from '@react-three/drei';

// --- CONSTANTS ---
const COLUMN_W = 0.15; // Width of the steel columns
const WALL_THICKNESS = 0.10; // Core wall thickness
const FACADE_THICKNESS = 0.02; // Facade layer thickness
const TOTAL_THICKNESS = WALL_THICKNESS + FACADE_THICKNESS; // 0.12

// --- ADVANCED PROCEDURAL TEXTURE GENERATOR ---
export const TextureGenerator = {
    createTexture: (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
        const canvas = document.createElement('canvas'); 
        canvas.width = width; 
        canvas.height = height;
        const ctx = canvas.getContext('2d')!; 
        drawFn(ctx);
        const tex = new THREE.CanvasTexture(canvas); 
        tex.wrapS = THREE.RepeatWrapping; 
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        
        // HIGHER QUALITY FILTERING TO PREVENT FLICKERING/MOIRE
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true; 
        tex.anisotropy = 16; // Max anisotropy for sharp angles
        tex.needsUpdate = true;
        
        return tex;
    },
    createWoodTexture: (baseColorHex: string, grainColorHex: string) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = baseColorHex;
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.lineWidth = 2;
            ctx.strokeStyle = grainColorHex;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 60; i++) {
                const x = Math.random() * 1024;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                for (let y = 0; y <= 1024; y += 20) {
                    const wobble = Math.sin(y * 0.01 + x) * 5 + (Math.random() - 0.5) * 2;
                    ctx.lineTo(x + wobble, y);
                }
                ctx.stroke();
            }
        });
    },
    createDeckingTexture: () => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            const plankW = 1024 / 16;
            for(let i=0; i<16; i++) {
                const x = i * plankW;
                // Plank Base
                ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f0f0f0'; 
                ctx.fillRect(x, 0, plankW - 2, 1024);
                // Nail holes
                ctx.fillStyle = '#cccccc';
                for(let y=50; y<1024; y+=200) {
                    ctx.fillRect(x + plankW - 10, y, 4, 4);
                    ctx.fillRect(x + 10, y, 4, 4);
                }
            }
        });
    },
    createBrickTexture: (colorHex: string) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            // Background (Mortar)
            ctx.fillStyle = '#d6d3d1'; 
            ctx.fillRect(0, 0, 1024, 1024);
            
            const rows = 16;
            const brickH = 1024 / rows;
            const brickW = brickH * 2.5;
            const gap = 4;

            ctx.fillStyle = colorHex;
            
            for(let y=0; y<rows; y++) {
                const offset = (y % 2) * (brickW / 2);
                for(let x=-1; x<10; x++) {
                    // Add some color variation
                    ctx.globalAlpha = 0.9 + Math.random() * 0.1;
                    ctx.fillRect(x * brickW + offset + gap, y * brickH + gap, brickW - gap*2, brickH - gap*2);
                }
            }
            // Add noise
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#000';
            for(let i=0; i<5000; i++) ctx.fillRect(Math.random()*1024, Math.random()*1024, 2, 2);
        });
    },
    createBrickBump: () => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = '#404040'; // Low mortar
            ctx.fillRect(0, 0, 1024, 1024);
            
            const rows = 16;
            const brickH = 1024 / rows;
            const brickW = brickH * 2.5;
            const gap = 4;

            ctx.fillStyle = '#ffffff'; // High brick
            for(let y=0; y<rows; y++) {
                const offset = (y % 2) * (brickW / 2);
                for(let x=-1; x<10; x++) {
                    ctx.fillRect(x * brickW + offset + gap, y * brickH + gap, brickW - gap*2, brickH - gap*2);
                }
            }
        });
    },
    createFabricTexture: (colorHex: string, opacity: number = 0.05) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = colorHex;
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.fillStyle = `rgba(255,255,255,${opacity})`;
            ctx.globalCompositeOperation = 'overlay';
            const step = 4;
            for(let x=0; x<1024; x+=step) { if(Math.random() > 0.5) ctx.fillRect(x, 0, 1, 1024); }
            for(let y=0; y<1024; y+=step) { if(Math.random() > 0.5) ctx.fillRect(0, y, 1024, 1); }
        });
    },
    createStoneTexture: (colorHex: string, scale: number = 1) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = colorHex;
            ctx.fillRect(0, 0, 1024, 1024);
            for(let i=0; i<2000 * scale; i++) {
                const shade = Math.random() > 0.5 ? 255 : 0;
                ctx.fillStyle = `rgba(${shade},${shade},${shade}, 0.05)`;
                const s = Math.random() * 3;
                ctx.fillRect(Math.random() * 1024, Math.random() * 1024, s, s);
            }
        });
    },
    // NEW: Soil texture for agriculture
    createSoilTexture: (baseColor: string) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 1024, 1024);
            // Noise
            for(let i=0; i<15000; i++) {
                const v = Math.random();
                ctx.fillStyle = v > 0.5 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.05)';
                ctx.fillRect(Math.random()*1024, Math.random()*1024, 3, 3);
            }
            // Furrows (Plow lines)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 4;
            for(let y=0; y<1024; y+=20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(1024, y);
                ctx.stroke();
            }
        });
    },
    createTileTexture: (c1: string, c2: string, tilesX: number, tilesY: number) => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = c2;
            ctx.fillRect(0, 0, 1024, 1024);
            const w = 1024 / tilesX;
            const h = 1024 / tilesY;
            const gap = 4;
            for(let x=0; x<tilesX; x++) {
                for(let y=0; y<tilesY; y++) {
                    ctx.fillStyle = c1;
                    if (Math.random() > 0.9) ctx.globalAlpha = 0.95;
                    else ctx.globalAlpha = 1.0;
                    ctx.fillRect(x*w + gap, y*h + gap, w - gap*2, h - gap*2);
                }
            }
        });
    },
    createPlankBump: () => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = '#808080'; ctx.fillRect(0,0,1024,1024);
            const lines = 12; const plankH = 1024 / lines; const gap = 6; 
            for(let i=0; i<lines; i++) {
                const y = i * plankH;
                const grad = ctx.createLinearGradient(0, y, 0, y + plankH - gap);
                grad.addColorStop(0, '#505050'); grad.addColorStop(0.1, '#909090'); 
                grad.addColorStop(0.95, '#e0e0e0'); grad.addColorStop(1.0, '#404040'); 
                ctx.fillStyle = grad; ctx.fillRect(0, y, 1024, plankH - gap);
            }
        });
    },
    createVerticalPlankBump: () => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = '#808080'; ctx.fillRect(0,0,1024,1024);
            const lines = 16; const plankW = 1024 / lines; const gap = 4;
            for(let i=0; i<lines; i++) {
                const x = i * plankW;
                const grad = ctx.createLinearGradient(x, 0, x + plankW - gap, 0);
                grad.addColorStop(0, '#505050'); grad.addColorStop(0.1, '#909090'); 
                grad.addColorStop(0.95, '#e0e0e0'); grad.addColorStop(1.0, '#404040'); 
                ctx.fillStyle = grad; ctx.fillRect(x, 0, plankW - gap, 1024);
            }
        });
    },
    createWaveBump: () => {
        return TextureGenerator.createTexture(1024, 1024, (ctx) => {
            const id = ctx.createImageData(1024,1024); const data = id.data; const freq = 0.08;
            for(let y=0; y<1024; y++) {
                 const val = ((Math.sin(y * freq) + 1) / 2) * 255; 
                 for(let x=0; x<1024; x++) {
                     const idx = (y*1024 + x)*4;
                     data[idx] = val; data[idx+1] = val; data[idx+2] = val; data[idx+3] = 255;
                 }
            }
            ctx.putImageData(id, 0, 0);
        });
    },
    createGenericBump: (scale: number = 1) => {
         return TextureGenerator.createTexture(512, 512, (ctx) => {
             ctx.fillStyle = '#808080'; ctx.fillRect(0,0,512,512);
             const id = ctx.getImageData(0,0,512,512); const data = id.data;
             for(let i=0; i<data.length; i+=4) {
                 const v = (Math.random()-0.5) * 30 * scale; 
                 data[i] += v; data[i+1] += v; data[i+2] += v;
             }
             ctx.putImageData(id, 0, 0);
         });
    },
    getGrassMaterial: () => new THREE.MeshStandardMaterial({ color: '#557a35', roughness: 1.0, map: TextureGenerator.createStoneTexture('#557a35', 0.5) }),
    getFieldMaterial: () => new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 1.0, map: TextureGenerator.createSoilTexture('#5d4037'), bumpMap: TextureGenerator.createSoilTexture('#808080'), bumpScale: 0.2 }),
    getStoneFacadeMaterial: () => new THREE.MeshStandardMaterial({ color: '#a8a29e', roughness: 0.9, map: TextureGenerator.createStoneTexture('#a8a29e', 2) }),
    getConcreteMaterials: () => new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8, map: TextureGenerator.createStoneTexture('#cbd5e1', 1) }),
    getRoofMaterial: () => new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8, bumpMap: TextureGenerator.createGenericBump(1), bumpScale: 0.05 }),
};

const useMaterials = () => {
    return useMemo(() => {
        const bumpPlank = TextureGenerator.createPlankBump();
        const bumpVertical = TextureGenerator.createVerticalPlankBump();
        const bumpWave = TextureGenerator.createWaveBump();
        const bumpBrick = TextureGenerator.createBrickBump();
        const bumpSmooth = TextureGenerator.createGenericBump(0.5); 
        const woodFloorTex = TextureGenerator.createWoodTexture('#e1d5c0', '#bfae95');
        const tileFloorTex = TextureGenerator.createTileTexture('#94a3b8', '#64748b', 8, 8);
        const vinylFloorTex = TextureGenerator.createWoodTexture('#f3e5ab', '#dbc38a'); 
        const deckFloorTex = TextureGenerator.createDeckingTexture();
        const plasterTex = TextureGenerator.createStoneTexture('#f8fafc', 0.5);

        return {
            bumpPlank, bumpVertical, bumpWave, bumpBrick, bumpSmooth,
            plasterWhite: new THREE.MeshStandardMaterial({ map: plasterTex, color: '#f8fafc', roughness: 0.85, bumpMap: bumpSmooth, bumpScale: 0.005 }),
            alu_anthracite: new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.4, roughness: 0.3, envMapIntensity: 1.0 }),
            alu_white: new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.3, roughness: 0.3, envMapIntensity: 1.0 }),
            alu_black: new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.5, roughness: 0.2, envMapIntensity: 1.0 }),
            chrome: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.95, roughness: 0.05, envMapIntensity: 1.5 }),
            steel: new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.7, roughness: 0.2, envMapIntensity: 0.8 }),
            glass: new THREE.MeshPhysicalMaterial({ 
                color: '#ffffff', 
                transmission: 0.99, 
                opacity: 1, 
                metalness: 0.0, 
                roughness: 0.02, 
                ior: 1.5, 
                thickness: 0.05, 
                transparent: true, 
                depthWrite: false, 
                side: THREE.DoubleSide, 
                envMapIntensity: 1.5, 
                clearcoat: 1.0 
            }),
            mirror: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1.0, roughness: 0.02, envMapIntensity: 1.8 }),
            roof_tiles: TextureGenerator.getRoofMaterial(),
            floor_wood: new THREE.MeshStandardMaterial({ map: woodFloorTex, roughness: 0.6, bumpMap: woodFloorTex, bumpScale: 0.02 }),
            floor_tile: new THREE.MeshStandardMaterial({ map: tileFloorTex, roughness: 0.4, bumpMap: tileFloorTex, bumpScale: 0.02 }),
            floor_vinyl: new THREE.MeshStandardMaterial({ map: vinylFloorTex, roughness: 0.4 }),
            // Decking is handled dynamically now but we keep base
            floor_decking: new THREE.MeshStandardMaterial({ map: deckFloorTex, roughness: 0.9, bumpMap: deckFloorTex, bumpScale: 0.05 }), 
            plaster_anth: new THREE.MeshStandardMaterial({ map: plasterTex, color: '#475569', roughness: 0.9 })
        };
    }, []);
};

const nullRaycast = () => null;

const DoorHandle = ({ materials, side = 'left' }: { materials: any, side?: 'left'|'right' }) => (
    <group position={[side === 'left' ? 0.35 : -0.35, 1.05, 0.06]}>
         <mesh material={materials.chrome} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.005, 16]} /></mesh>
         <mesh material={materials.chrome} rotation={[Math.PI/2,0,0]} position={[0,0,0.02]} castShadow><cylinderGeometry args={[0.01, 0.01, 0.04, 16]} /></mesh>
         <mesh material={materials.chrome} position={[side === 'left' ? 0.06 : -0.06, 0, 0.04]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.01, 0.01, 0.12, 16]} /></mesh>
    </group>
);

const SmartDoor = ({ w, h, materials, type, isSelected, frameColor, glassType }: any) => {
    const isBalcony = type === 'door_balcony';
    const frameDepth = TOTAL_THICKNESS; 
    const frameThick = isBalcony ? 0.08 : 0.05; 
    const leafThick = isBalcony ? 0.06 : 0.05;
    const frameMat = frameColor === 'white' ? materials.alu_white : (frameColor === 'black' ? materials.alu_black : materials.alu_anthracite);
    const isGlassDoor = type.includes('glass') || type.includes('balcony') || type.includes('sliding');
    let leafMat = isGlassDoor ? (glassType === 'mirror' ? materials.mirror : materials.glass) : frameColor ? frameMat : materials.alu_white;
    const sashW = isBalcony ? 0.08 : 0.1;

    return (
        <group>
            <mesh position={[0, h/2, 0]}><boxGeometry args={[w, h, frameDepth + 0.3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} color="red" /></mesh>
            <mesh position={[0, h - frameThick/2, 0]} material={frameMat} castShadow><boxGeometry args={[w, frameThick, frameDepth]} /></mesh>
            <mesh position={[-w/2 + frameThick/2, h/2, 0]} material={frameMat} castShadow><boxGeometry args={[frameThick, h, frameDepth]} /></mesh>
            <mesh position={[w/2 - frameThick/2, h/2, 0]} material={frameMat} castShadow><boxGeometry args={[frameThick, h, frameDepth]} /></mesh>
            {isBalcony && <mesh position={[0, 0.03, 0]} material={frameMat} castShadow><boxGeometry args={[w, 0.06, frameDepth]} /></mesh>}
            <group position={[0, h/2 + (isBalcony ? 0.03 : 0), 0]}>
                {isGlassDoor ? (
                    <group>
                        <mesh position={[-w/2 + frameThick + sashW/2, 0, 0]} material={frameMat}><boxGeometry args={[sashW, h - (isBalcony ? 0.15 : 0.1), leafThick]} /></mesh>
                        <mesh position={[w/2 - frameThick - sashW/2, 0, 0]} material={frameMat}><boxGeometry args={[sashW, h - (isBalcony ? 0.15 : 0.1), leafThick]} /></mesh>
                        <mesh position={[0, h/2 - (isBalcony ? 0.08 : 0.05) - 0.03, 0]} material={frameMat}><boxGeometry args={[w - frameThick*2, sashW, leafThick]} /></mesh>
                        <mesh position={[0, -h/2 + (isBalcony ? 0.08 : 0.05) + (isBalcony?0:0.03), 0]} material={frameMat}><boxGeometry args={[w - frameThick*2, sashW, leafThick]} /></mesh>
                        <mesh material={glassType === 'mirror' ? materials.mirror : materials.glass} renderOrder={1}><boxGeometry args={[w - frameThick*2 - sashW*2 + 0.02, h - (isBalcony?0.2:0.1) - sashW*2 + 0.02, 0.01]} /></mesh>
                    </group>
                ) : (
                    <mesh material={leafMat} castShadow><boxGeometry args={[w - frameThick*2 - 0.01, h - frameThick - 0.01, leafThick]} /></mesh>
                )}
                {!type.includes('sliding') && <><DoorHandle materials={materials} side="left" /><group rotation={[0, Math.PI, 0]} position={[0,0,-0.12]}><DoorHandle materials={materials} side="right" /></group></>}
                {type.includes('sliding') && <mesh position={[w/2 - 0.2, 1.05, 0.03]} material={materials.alu_black}><boxGeometry args={[0.03, 0.2, 0.02]} /></mesh>}
            </group>
            {isSelected && <Edges color="#f97316" scale={1.05} />}
        </group>
    )
}

const SmartWindow = ({ w, h, materials, type, isSelected, frameColor, glassType }: any) => {
    const frameThick = 0.06; const sashThick = 0.06; const depth = TOTAL_THICKNESS;
    const frameMat = frameColor === 'white' ? materials.alu_white : (frameColor === 'black' ? materials.alu_black : materials.alu_anthracite);
    const glassMat = glassType === 'mirror' ? materials.mirror : materials.glass;

    return (
        <group>
            <mesh position={[0, h/2, 0]}><boxGeometry args={[w, h, depth + 0.3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} color="blue" /></mesh>
            <mesh position={[0, frameThick/2, 0]} material={frameMat} castShadow><boxGeometry args={[w, frameThick, depth]} /></mesh>
            <mesh position={[0, h - frameThick/2, 0]} material={frameMat} castShadow><boxGeometry args={[w, frameThick, depth]} /></mesh>
            <mesh position={[-w/2 + frameThick/2, h/2, 0]} material={frameMat} castShadow><boxGeometry args={[frameThick, h, depth]} /></mesh>
            <mesh position={[w/2 - frameThick/2, h/2, 0]} material={frameMat} castShadow><boxGeometry args={[frameThick, h, depth]} /></mesh>
            {type !== 'wall_glass' && <group><mesh position={[0, -0.02, -0.04]} material={materials.alu_anthracite} castShadow receiveShadow><boxGeometry args={[w + 0.04, 0.04, 0.1]} /></mesh><mesh position={[0, -0.01, 0.06]} material={materials.plasterWhite} receiveShadow><boxGeometry args={[w + 0.02, 0.02, 0.1]} /></mesh></group>}
            {type !== 'wall_glass' && <group position={[0, h/2, 0]}><mesh position={[0, h/2 - frameThick - sashThick/2, 0]} material={frameMat}><boxGeometry args={[w - frameThick*2, sashThick, depth-0.02]} /></mesh><mesh position={[0, -h/2 + frameThick + sashThick/2, 0]} material={frameMat}><boxGeometry args={[w - frameThick*2, sashThick, depth-0.02]} /></mesh><mesh position={[-w/2 + frameThick + sashThick/2, 0, 0]} material={frameMat}><boxGeometry args={[sashThick, h - frameThick*2, depth-0.02]} /></mesh><mesh position={[w/2 - frameThick - sashThick/2, 0, 0]} material={frameMat}><boxGeometry args={[sashThick, h - frameThick*2, depth-0.02]} /></mesh><group position={[w/2 - frameThick - sashThick - 0.02, 0, 0.04]}><DoorHandle materials={materials} side="left" /></group></group>}
            <mesh position={[0, h/2, 0]} material={glassMat} renderOrder={1}><boxGeometry args={[w - (type !== 'wall_glass' ? 0.3 : 0.15), h - (type !== 'wall_glass' ? 0.3 : 0.15), 0.02]} /></mesh>
            {isSelected && <Edges color="#f97316" scale={1.05} />}
        </group>
    )
}

const SteelFrame = ({ w, d, h, materials }: any) => {
    const t = COLUMN_W; 
    return (
        <group>
            {/* ENABLED RAYCASTING FOR FRAME */}
            <mesh position={[-w/2+t/2, h/2, -d/2+t/2]} material={materials.steel} castShadow><boxGeometry args={[t, h, t]} /></mesh>
            <mesh position={[w/2-t/2, h/2, -d/2+t/2]} material={materials.steel} castShadow><boxGeometry args={[t, h, t]} /></mesh>
            <mesh position={[-w/2+t/2, h/2, d/2-t/2]} material={materials.steel} castShadow><boxGeometry args={[t, h, t]} /></mesh>
            <mesh position={[w/2-t/2, h/2, d/2-t/2]} material={materials.steel} castShadow><boxGeometry args={[t, h, t]} /></mesh>
            <mesh position={[0, t/2, -d/2+t/2]} material={materials.steel}><boxGeometry args={[w, t, t]} /></mesh>
            <mesh position={[0, h-t/2, -d/2+t/2]} material={materials.steel}><boxGeometry args={[w, t, t]} /></mesh>
            <mesh position={[0, t/2, d/2-t/2]} material={materials.steel}><boxGeometry args={[w, t, t]} /></mesh>
            <mesh position={[0, h-t/2, d/2-t/2]} material={materials.steel}><boxGeometry args={[w, t, t]} /></mesh>
            <mesh position={[-w/2+t/2, t/2, 0]} material={materials.steel}><boxGeometry args={[t, t, d]} /></mesh>
            <mesh position={[w/2-t/2, t/2, 0]} material={materials.steel}><boxGeometry args={[t, t, d]} /></mesh>
            <mesh position={[-w/2+t/2, h-t/2, 0]} material={materials.steel}><boxGeometry args={[t, t, d]} /></mesh>
            <mesh position={[w/2-t/2, h-t/2, 0]} material={materials.steel}><boxGeometry args={[t, t, d]} /></mesh>
        </group>
    )
}

const FloorWithHoles = ({ module, materials, raycastProps }: { module: ModuleData, materials: any, raycastProps: any }) => {
    const { size, grid, level, id } = module;
    const { activeTool, addProp, setActiveTool, props, selectObject } = useStore();
    const [hovered, setHover] = useState(false);
    
    // UPDATED: Added 'wall_internal' to isPropTool list
    const isPropTool = activeTool && [
        'kitchen', 'sofa', 'bed', 'wardrobe', 'wc', 'shower', 'tub', 'sink', 
        'light', 'switch', 'socket', 'heatpump', 'ac', 'stair_straight', 'stair_spiral', 'stair_l_shape', 'stair_u_shape',
        'wall_internal', 'solar'
    ].includes(activeTool);

    const isLevelTool = activeTool === 'place_level';

    useCursor(isPropTool && hovered, 'crosshair', 'auto');

    const handleFloorClick = (e: any) => {
        // IMPORTANT: If 'place_level' is active, DO NOT stop propagation. 
        // Let it bubble to ModuleMesh to trigger spawnLevelOnTop.
        if (isLevelTool) return;

        e.stopPropagation();
        if (isPropTool) {
            addProp(activeTool, [e.point.x, e.point.y, e.point.z]);
            setActiveTool(null); 
        } else {
            selectObject({ type: 'module', id });
        }
    }

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const w = size.w;
        const d = size.d;
        
        s.moveTo(-w/2, -d/2);
        s.lineTo(w/2, -d/2);
        s.lineTo(w/2, d/2);
        s.lineTo(-w/2, d/2);
        s.lineTo(-w/2, -d/2);
        
        // Safety Cutout Logic for Stairs
        if (level > 0 && module.kind === 'living') {
            const tolerance = 0.5;
            const stairsBelow = props.filter(p => 
                p.type.startsWith('stair_') && 
                Math.abs(p.pos[1] - (level - 1) * size.h) < tolerance
            );

            stairsBelow.forEach(stair => {
                const mods = stair.cutoutModifiers || { offsetW: 0, offsetD: 0, offsetX: 0, offsetZ: 0 };
                
                const sw = (stair.size ? stair.size[0] : 1.0) + mods.offsetW;
                const sd = (stair.size ? stair.size[2] : 2.0) + mods.offsetD;
                
                const dx = (stair.pos[0] - grid.x) + mods.offsetX; // Apply manual offsets locally
                const dz = (stair.pos[2] - grid.z) + mods.offsetZ;
                
                // Rotation relative to module
                const relRot = stair.rot - grid.rot;
                
                // Helper to rotate point relative to stair center
                const rotatePoint = (x: number, z: number) => {
                     const rx = x * Math.cos(relRot) - z * Math.sin(relRot);
                     const rz = x * Math.sin(relRot) + z * Math.cos(relRot);
                     // Local Stair Position relative to floor center
                     const cosM = Math.cos(-grid.rot);
                     const sinM = Math.sin(-grid.rot);
                     const localStairX = dx * cosM - dz * sinM;
                     const localStairZ = dx * sinM + dz * cosM;
                     
                     return { x: localStairX + rx, y: localStairZ + rz };
                };
                
                const holePath = new THREE.Path();

                if (stair.type === 'stair_spiral') {
                    // Circular hole for spiral stairs
                    const radius = (sw / 2);
                    // Local Stair Position logic
                    const cosM = Math.cos(-grid.rot);
                    const sinM = Math.sin(-grid.rot);
                    const localStairX = dx * cosM - dz * sinM;
                    const localStairZ = dx * sinM + dz * cosM;
                    
                    holePath.absarc(localStairX, localStairZ, radius, 0, Math.PI * 2, false);
                    s.holes.push(holePath);

                } else if (stair.type === 'stair_l_shape') {
                     // L-Shape Cutout - Matching PropMesh layout
                     const runWidth = 1.0 + (mods.offsetW / 2); // Also adjusting run width a bit
                     // Local coordinates relative to stair center (0,0)
                     const p1 = rotatePoint(-sw/2, -sd/2);
                     const p2 = rotatePoint(-sw/2 + runWidth, -sd/2);
                     const p3 = rotatePoint(-sw/2 + runWidth, sd/2 - runWidth);
                     const p4 = rotatePoint(sw/2, sd/2 - runWidth);
                     const p5 = rotatePoint(sw/2, sd/2);
                     const p6 = rotatePoint(-sw/2, sd/2);

                     holePath.moveTo(p1.x, p1.y);
                     holePath.lineTo(p2.x, p2.y);
                     holePath.lineTo(p3.x, p3.y);
                     holePath.lineTo(p4.x, p4.y);
                     holePath.lineTo(p5.x, p5.y);
                     holePath.lineTo(p6.x, p6.y);
                     holePath.lineTo(p1.x, p1.y);
                     s.holes.push(holePath);
                     
                } else if (stair.type === 'stair_u_shape') {
                     // U-Shape Cutout
                     const runWidth = 0.95 + (mods.offsetW / 2); 
                     const p1 = rotatePoint(-sw/4 - 0.1, -sd/2);
                     const p2 = rotatePoint(-sw/4 - 0.1 + 0.1 + runWidth, -sd/2);
                     const p3 = rotatePoint(-sw/4 + runWidth, sd/2 - runWidth);
                     const p4 = rotatePoint(sw/4 - runWidth, sd/2 - runWidth);
                     const p5 = rotatePoint(sw/4 - runWidth, -sd/2);
                     const p6 = rotatePoint(sw/4 + 0.1, -sd/2);
                     const p7 = rotatePoint(sw/4 + 0.1, sd/2);
                     const p8 = rotatePoint(-sw/4 - 0.1, sd/2);

                     holePath.moveTo(p1.x, p1.y);
                     holePath.lineTo(p2.x, p2.y);
                     holePath.lineTo(p3.x, p3.y);
                     holePath.lineTo(p4.x, p4.y);
                     holePath.lineTo(p5.x, p5.y);
                     holePath.lineTo(p6.x, p6.y);
                     holePath.lineTo(p7.x, p7.y);
                     holePath.lineTo(p8.x, p8.y);
                     holePath.lineTo(p1.x, p1.y);
                     s.holes.push(holePath);
                } else {
                    // Standard Rectangular Hole for straight stairs
                    const margin = 0.01; 
                    const halfW = sw / 2 - margin; 
                    const halfD = sd / 2 - margin;
                    const corners = [{ x: -halfW, z: -halfD }, { x: halfW, z: -halfD }, { x: halfW, z: halfD }, { x: -halfW, z: halfD }];
                    
                    const transformedCorners = corners.map(c => rotatePoint(c.x, c.z));
                    
                    holePath.moveTo(transformedCorners[0].x, transformedCorners[0].y);
                    holePath.lineTo(transformedCorners[1].x, transformedCorners[1].y);
                    holePath.lineTo(transformedCorners[2].x, transformedCorners[2].y);
                    holePath.lineTo(transformedCorners[3].x, transformedCorners[3].y);
                    holePath.lineTo(transformedCorners[0].x, transformedCorners[0].y);
                    s.holes.push(holePath);
                }
            });
        }
        return s;
    }, [size, grid, level, props, module.kind]);

    const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false }), [shape]);
    
    // Dynamic Material Logic for Terrace
    const floorMat = useMemo(() => {
        if (module.kind === 'terrace' && module.color) {
            return new THREE.MeshStandardMaterial({ 
                color: module.color, 
                map: materials.floor_decking.map, 
                bumpMap: materials.floor_decking.bumpMap,
                bumpScale: 0.05,
                roughness: 0.8 
            });
        }
        return (materials as any)[`floor_${module.floor}`] || materials.floor_wood;
    }, [module.kind, module.color, module.floor, materials]);

    return (
        <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.05, 0]} 
            geometry={geometry}
            receiveShadow 
            material={floorMat} 
            {...raycastProps}
            onClick={handleFloorClick}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
        />
    );
}

const Wall = ({ moduleId, side, data, width, height, offset, rotation, isDragging, materials }: any) => {
  const { selectObject, selection, activeTab, activeTool, setWallMaterial, addOpening, setWallStructure, setWallCoverFrame } = useStore();
  const isSelected = selection?.type === 'module' && selection?.id === moduleId && selection?.side === side;
  const isInteractive = true;
  
  const coverFrame = data.coverFrame || false;
  
  // Logic helpers
  const isPainting = activeTab === 'walls' && !!activeTool;
  const isOpeningTool = activeTab === 'openings' && !!activeTool;
  const isLevelTool = activeTool === 'place_level';

  const [hovered, setHover] = useState(false);
  useCursor(hovered && isInteractive, (isPainting || isOpeningTool) ? 'crosshair' : 'pointer', 'auto');
  const raycastProps = (isDragging) ? { raycast: nullRaycast } : {};

  const facadeMaterial = useMemo(() => {
       if (data.mat === 'open') return null;
       
       let map = null, bumpMap = null, bumpScale = 0, roughness = 0.8, metalness = 0.0, color = data.mat;
       
       if (data.structure === 'plank') { 
           bumpMap = materials.bumpPlank; bumpScale = 0.15; roughness = 0.6; 
       } else if (data.structure === 'wood_v') {
           // Vertical Timber
           bumpMap = materials.bumpVertical; bumpScale = 0.2; roughness = 0.7; 
           if(color === '#ffffff') color = '#e2e8f0'; // Slight tint for wood
       } else if (data.structure === 'brick') {
           // Brick Wall
           map = TextureGenerator.createBrickTexture(data.mat);
           bumpMap = materials.bumpBrick; bumpScale = 0.3; roughness = 0.9;
           color = '#ffffff'; // Use texture color
       } else if (data.structure === 'wave') { 
           bumpMap = materials.bumpWave; bumpScale = 0.25; roughness = 0.4; metalness = 0.3; 
       }

       // Fixed Z-fighting by tuning polygonOffset
       return new THREE.MeshStandardMaterial({ 
           color: color, 
           map: map,
           bumpMap: bumpMap, 
           bumpScale: bumpScale, 
           roughness: roughness, 
           metalness: metalness, 
           polygonOffset: true, 
           polygonOffsetFactor: -1, 
           polygonOffsetUnits: -1 
       });
  }, [data.mat, data.structure, materials]);

  const { coreShape, facadeShape } = useMemo(() => {
      const coreS = new THREE.Shape();
      const facadeS = new THREE.Shape();
      const inset = COLUMN_W; 
      const facadeInset = coverFrame ? 0 : COLUMN_W;
      coreS.moveTo(-width/2 + inset, 0); coreS.lineTo(width/2 - inset, 0); coreS.lineTo(width/2 - inset, height); coreS.lineTo(-width/2 + inset, height); coreS.lineTo(-width/2 + inset, 0);
      facadeS.moveTo(-width/2 + facadeInset, 0); facadeS.lineTo(width/2 - facadeInset, 0); facadeS.lineTo(width/2 - facadeInset, height); facadeS.lineTo(-width/2 + facadeInset, height); facadeS.lineTo(-width/2 + facadeInset, 0);
      data.openings.forEach((op: any) => {
          const cx = (op.x - 0.5) * width; const minX = cx - op.w / 2; const maxX = cx + op.w / 2; const minY = op.y; const maxY = op.y + op.h;
          const hole = new THREE.Path(); hole.moveTo(minX, minY); hole.lineTo(minX, maxY); hole.lineTo(maxX, maxY); hole.lineTo(maxX, minY); hole.lineTo(minX, minY);
          coreS.holes.push(hole); facadeS.holes.push(hole);
      });
      return { coreShape: coreS, facadeShape: facadeS };
  }, [width, height, data.openings, coverFrame]);

  const coreGeometry = useMemo(() => new THREE.ExtrudeGeometry(coreShape, { depth: WALL_THICKNESS, bevelEnabled: false }), [coreShape]);
  const facadeGeometry = useMemo(() => new THREE.ExtrudeGeometry(facadeShape, { depth: FACADE_THICKNESS, bevelEnabled: false }), [facadeShape]);

  const handleClick = (e: any) => {
    // 1. CRITICAL: If placing a level, propagate event up to ModuleMesh.
    if (isLevelTool) return;

    // 2. Painting Logic
    if (isPainting) {
        e.stopPropagation();
        if (activeTool === 'cover_frame') {
            setWallCoverFrame(moduleId, side, !coverFrame);
        } else if (['smooth', 'plank', 'wave', 'brick', 'wood_v'].includes(activeTool!)) {
            setWallStructure(moduleId, side, activeTool as WallStructure);
        } else {
            setWallMaterial(moduleId, side as WallSide, activeTool!);
        }
        return;
    }

    // 3. Opening Logic
    if (isOpeningTool) {
        e.stopPropagation();
        const localPoint = e.object.worldToLocal(e.point.clone());
        const relX = (localPoint.x + (width / 2)) / width;
        if (activeTool?.includes('door')) {
             addOpening(moduleId, side as WallSide, activeTool as OpeningType, relX, 0.05); 
        } else {
             addOpening(moduleId, side as WallSide, activeTool as OpeningType, relX, 1.0); 
        }
        return;
    }
    
    // 4. Selection
    e.stopPropagation();
    selectObject({ type: 'module', id: moduleId, side: side as WallSide });
  };

  const [openingHover, setOpeningHover] = useState<string|null>(null);
  useCursor(!!openingHover, 'pointer', 'auto');

  return (
    <group position={offset} rotation={rotation}>
      <mesh position={[0, height / 2, 0.05]} onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={(e) => { e.stopPropagation(); setHover(false); }} {...raycastProps}>
          <boxGeometry args={[width + 0.1, height + 0.1, 0.15]} />
          <meshBasicMaterial visible={false} />
      </mesh>

      {data.mat === 'open' ? (
        <group position={[0, height / 2, 0.075]}>
             <mesh raycast={nullRaycast}><boxGeometry args={[width - 0.3, height - 0.2, 0.02]} /><meshBasicMaterial color={hovered && activeTool !== 'open' ? "#3b82f6" : "#cbd5e1"} transparent opacity={hovered ? 0.2 : 0.0} side={THREE.DoubleSide} /></mesh>
             <Edges color={hovered ? "#3b82f6" : "#cbd5e1"} threshold={15} />
        </group>
      ) : (
          <group>
               <mesh geometry={facadeGeometry} material={facadeMaterial} castShadow receiveShadow raycast={nullRaycast}>
                   {(isSelected || hovered) && <Edges color={activeTool === 'open' && hovered ? "#ef4444" : (isOpeningTool ? "#3b82f6" : "#f97316")} threshold={15} scale={1.002} />}
               </mesh>
               <mesh position={[0, 0, FACADE_THICKNESS]} geometry={coreGeometry} material={materials.plasterWhite} castShadow receiveShadow raycast={nullRaycast} />
          </group>
      )}
      
      {data.openings.map((op: any) => (
        <group key={op.id} position={[(op.x - 0.5) * width, op.y, TOTAL_THICKNESS / 2]} 
            onClick={(e) => {
                // If placing a level, let it bubble up, otherwise consume
                if (isLevelTool) return;
                e.stopPropagation(); 
                selectObject({ type: 'opening', id: moduleId, side, secondaryId: op.id });
            }}
            onPointerOver={(e) => { e.stopPropagation(); setOpeningHover(op.id); }}
            onPointerOut={(e) => { e.stopPropagation(); setOpeningHover(null); }}
        >
           {op.type.includes('door') ? <SmartDoor w={op.w} h={op.h} materials={materials} type={op.type} isSelected={selection?.secondaryId === op.id} frameColor={op.frameColor} glassType={op.glassType}/> : <SmartWindow w={op.w} h={op.h} materials={materials} type={op.type} isSelected={selection?.secondaryId === op.id} frameColor={op.frameColor} glassType={op.glassType}/>}
        </group>
      ))}
    </group>
  );
};

export const SmartRoofRenderer = () => {
    const { modules, smartRoof } = useStore();
    const materials = useMaterials();
    
    // Only active if toggled
    if (!smartRoof) return null;

    // Group modules by level
    const levels = new Map<number, ModuleData[]>();
    let maxLevel = -1;
    modules.forEach(m => {
        if(m.kind === 'terrace') return;
        if(!levels.has(m.level)) levels.set(m.level, []);
        levels.get(m.level)?.push(m);
        if(m.level > maxLevel) maxLevel = m.level;
    });

    if (maxLevel === -1) return null;

    const topModules = levels.get(maxLevel) || [];
    if(topModules.length === 0) return null;

    // Calculate Bounding Box of top floor
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    topModules.forEach(m => {
        // Assume rotation 0 or 180 (aligned to axes) for simplicity in smart roof
        // This is a "Simple" smart roof that bounds the extent.
        // Handling arbitrary rotation bounding boxes is much harder.
        const halfW = m.size.w / 2;
        const halfD = m.size.d / 2;
        // Simple AABB logic
        if(m.grid.x - halfW < minX) minX = m.grid.x - halfW;
        if(m.grid.x + halfW > maxX) maxX = m.grid.x + halfW;
        if(m.grid.z - halfD < minZ) minZ = m.grid.z - halfD;
        if(m.grid.z + halfD > maxZ) maxZ = m.grid.z + halfD;
    });

    // Determine roof properties from the FIRST module
    const refMod = topModules[0];
    const { type, angle, overhang } = refMod.roof;
    
    if (type === 'none') return null;

    const totalW = maxX - minX;
    const totalD = maxZ - minZ;
    const centerX = minX + totalW / 2;
    const centerZ = minZ + totalD / 2;
    const posY = (maxLevel * 2.8) + 2.8; // Approximate height top

    const rw = totalW + (overhang || 0.3) * 2;
    const rd = totalD + (overhang || 0.3) * 2;
    const hCenter = (rd / 2) * Math.tan((angle || 30) * Math.PI / 180);

    // Reuse Geometry Logic
    const renderSmartGeometry = () => {
        if (type === 'flat') {
            const roofThick = 0.2;
            const parapetH = 0.3;
             return (
              <group>
                  <mesh castShadow receiveShadow material={materials.roof_tiles}>
                      <boxGeometry args={[rw, roofThick, rd]} />
                  </mesh>
                  <group position={[0, roofThick/2 + parapetH/2, 0]}>
                      <mesh position={[0, 0, rd/2]} castShadow material={materials.alu_anthracite}><boxGeometry args={[rw, parapetH, 0.05]} /></mesh>
                      <mesh position={[0, 0, -rd/2]} castShadow material={materials.alu_anthracite}><boxGeometry args={[rw, parapetH, 0.05]} /></mesh>
                      <mesh position={[rw/2, 0, 0]} castShadow material={materials.alu_anthracite}><boxGeometry args={[0.05, parapetH, rd]} /></mesh>
                      <mesh position={[-rw/2, 0, 0]} castShadow material={materials.alu_anthracite}><boxGeometry args={[0.05, parapetH, rd]} /></mesh>
                  </group>
              </group>
          )
        }
        else if (type === 'gable') {
             const shape = new THREE.Shape();
             shape.moveTo(-rw/2, 0); 
             shape.lineTo(rw/2, 0); 
             shape.lineTo(0, hCenter); 
             shape.lineTo(-rw/2, 0);
             const geom = new THREE.ExtrudeGeometry(shape, { depth: rd, bevelEnabled: false }); 
             geom.translate(0, 0, -rd/2);
             return <mesh geometry={geom} material={materials.roof_tiles} castShadow receiveShadow />
        }
        else if (type === 'pent') {
            const hLow = 0.1; 
            const angleRad = (angle || 15) * Math.PI / 180; 
            const hHigh = hLow + Math.tan(angleRad) * rd;
            const shape = new THREE.Shape();
            shape.moveTo(-rd/2, 0); shape.lineTo(rd/2, 0); shape.lineTo(rd/2, hLow); shape.lineTo(-rd/2, hHigh); shape.lineTo(-rd/2, 0);
            const geom = new THREE.ExtrudeGeometry(shape, { depth: rw, bevelEnabled: false }); 
            geom.rotateY(-Math.PI/2); 
            geom.translate(rw/2, 0, 0);
            return (
                 <group>
                    <mesh geometry={geom} material={materials.roof_tiles} castShadow receiveShadow />
                     <mesh position={[0, hHigh - 0.1, -rd/2]} material={materials.alu_anthracite}><boxGeometry args={[rw + 0.05, 0.25, 0.05]} /></mesh>
                 </group>
            )
        }
        return null;
    }

    return (
        <group position={[centerX, posY, centerZ]}>
            {renderSmartGeometry()}
        </group>
    )
}

export const ModuleMesh: React.FC<{ data: ModuleData }> = ({ data }) => {
  const { id, size, grid, walls, roof, level, kind, color } = data;
  const { selection, startDrag, dragState, activeTab, activeTool, selectObject, spawnLevelOnTop, environment, smartRoof } = useStore();
  const isSelected = selection?.type === 'module' && selection?.id === id && !selection.side;
  const isDragging = dragState.active && dragState.id === id;
  const [hovered, setHover] = useState(false);
  const materials = useMaterials();
  const raycastProps = isDragging ? { raycast: nullRaycast } : {};
  
  const isNight = environment.time < 6 || environment.time > 19;
  const isTerrace = kind === 'terrace';

  // Advanced Roof Geometry Logic
  const roofRender = useMemo(() => {
      // If smartRoof is ON, we disable individual roofs
      if (smartRoof) return null;
      if (roof.type === 'none' || isTerrace) return null;
      
      const overhang = roof.overhang !== undefined ? roof.overhang : 0.3; // Default 0.3 if undefined
      const rw = size.w + overhang * 2; 
      const rd = size.d + overhang * 2;
      
      if (roof.type === 'flat') {
          // Flat roof with parapet (Attika)
          const parapetH = 0.3;
          const roofThick = 0.2;
          
          return (
              <group position={[0, size.h + roofThick/2, 0]}>
                  {/* Main Roof Slab */}
                  <mesh castShadow receiveShadow material={materials.roof_tiles}>
                      <boxGeometry args={[rw, roofThick, rd]} />
                  </mesh>
                  {/* Parapet / Fascia (Attika Blende) */}
                  <group position={[0, roofThick/2 + parapetH/2, 0]}>
                      <mesh position={[0, 0, rd/2]} castShadow material={materials.alu_anthracite}><boxGeometry args={[rw, parapetH, 0.05]} /></mesh>
                      <mesh position={[0, 0, -rd/2]} castShadow material={materials.alu_anthracite}><boxGeometry args={[rw, parapetH, 0.05]} /></mesh>
                      <mesh position={[rw/2, 0, 0]} castShadow material={materials.alu_anthracite}><boxGeometry args={[0.05, parapetH, rd]} /></mesh>
                      <mesh position={[-rw/2, 0, 0]} castShadow material={materials.alu_anthracite}><boxGeometry args={[0.05, parapetH, rd]} /></mesh>
                  </group>
              </group>
          )
      }
      else if (roof.type === 'pent') {
          // Pent roof with fascia board
          const hLow = 0.1; 
          const angleRad = (roof.angle || 15) * Math.PI / 180; 
          const hHigh = hLow + Math.tan(angleRad) * rd;
          const shape = new THREE.Shape();
          shape.moveTo(-rd/2, 0); 
          shape.lineTo(rd/2, 0); 
          shape.lineTo(rd/2, hLow); 
          shape.lineTo(-rd/2, hHigh); 
          shape.lineTo(-rd/2, 0);
          
          const geom = new THREE.ExtrudeGeometry(shape, { depth: rw, bevelEnabled: false }); 
          geom.rotateY(-Math.PI/2); 
          geom.translate(rw/2, size.h, 0);
          
          return (
              <group>
                 <mesh geometry={geom} material={materials.roof_tiles} castShadow receiveShadow />
                 {/* Fascia Board (Front/High side) */}
                 <mesh position={[0, size.h + hHigh - 0.1, -rd/2]} rotation={[0,0,0]} castShadow material={materials.alu_anthracite}>
                     <boxGeometry args={[rw + 0.05, 0.25, 0.05]} />
                 </mesh>
              </group>
          );
      } else if (roof.type === 'gable') {
          // Gable roof with overhang thickness
          const angleRad = (roof.angle || 30) * Math.PI / 180;
          const hCenter = (rd / 2) * Math.tan(angleRad); 
          const shape = new THREE.Shape();
          
          // Outer triangle
          shape.moveTo(-rw/2, 0); 
          shape.lineTo(rw/2, 0); 
          shape.lineTo(0, hCenter); 
          shape.lineTo(-rw/2, 0);
          
          const geom = new THREE.ExtrudeGeometry(shape, { depth: rd, bevelEnabled: false }); 
          geom.translate(0, size.h, -rd/2); 
          
          return (
               <group>
                   <mesh geometry={geom} material={materials.roof_tiles} castShadow receiveShadow />
                   {/* Ridge Cap? Maybe later. For now just clean geometry */}
               </group>
          );
      }
      return null;
  }, [roof.type, roof.angle, roof.overhang, size, materials, isTerrace, smartRoof]);

  const posY = level * (kind === 'terrace' ? size.h : 2.8); // Simple estimation, really should rely on actual stack height

  const handlePointerDown = (e: any) => {
      if (!activeTool && activeTab === 'structure') {
           e.stopPropagation();
           const offsetX = e.point.x - grid.x;
           const offsetZ = e.point.z - grid.z;
           startDrag(id, 'module', [offsetX, offsetZ]);
      }
  };

  const handleGroupClick = (e: any) => {
      if (activeTool === 'place_level') {
          e.stopPropagation(); 
          spawnLevelOnTop(id);
          return;
      }
      if (!activeTool) {
          e.stopPropagation();
          selectObject({ type: 'module', id });
      }
  }
  
  const isRoofTool = activeTab === 'roof';
  const cursorStyle = activeTool === 'place_level' ? 'copy' : (isDragging ? 'grabbing' : 'grab');

  useCursor(hovered && !activeTool && activeTab === 'structure', cursorStyle, 'auto');
  useCursor(hovered && activeTool === 'place_level', 'copy', 'auto');
  useCursor(hovered && isRoofTool, 'pointer', 'auto');

  // Automatic Light Logic for Night Mode
  const interiorLight = useMemo(() => {
      if (!isTerrace && isNight && environment.lights) {
          return (
              <pointLight 
                  position={[0, size.h - 0.5, 0]} 
                  intensity={20} 
                  distance={8} 
                  color="#ffaa77" 
                  castShadow 
                  shadow-bias={-0.0001}
              />
          );
      }
      return null;
  }, [isTerrace, isNight, environment.lights, size.h]);

  return (
      <group position={[grid.x, posY, grid.z]} rotation={[0, grid.rot, 0]} onPointerDown={handlePointerDown} onClick={handleGroupClick} onPointerOver={(e) => { e.stopPropagation(); setHover(true); }} onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}>
           {/* GHOST VISUAL DURING DRAG */}
           {isDragging && (
               <mesh position={[0, size.h/2, 0]} material={new THREE.MeshBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.1, wireframe: true })}>
                   <boxGeometry args={[size.w, size.h, size.d]} />
               </mesh>
           )}
           
           <FloorWithHoles module={data} materials={materials} raycastProps={raycastProps} />
           
           {/* Only render structure and walls if NOT a terrace */}
           {!isTerrace && (
               <>
                   <SteelFrame w={size.w} d={size.d} h={size.h} materials={materials} />
                   <Wall moduleId={id} side="north" data={walls.north} width={size.w} height={size.h} offset={[0, 0, -size.d/2]} rotation={[0, 0, 0]} isDragging={isDragging} materials={materials} />
                   <Wall moduleId={id} side="south" data={walls.south} width={size.w} height={size.h} offset={[0, 0, size.d/2]} rotation={[0, Math.PI, 0]} isDragging={isDragging} materials={materials} />
                   <Wall moduleId={id} side="east" data={walls.east} width={size.d} height={size.h} offset={[size.w/2, 0, 0]} rotation={[0, -Math.PI/2, 0]} isDragging={isDragging} materials={materials} />
                   <Wall moduleId={id} side="west" data={walls.west} width={size.d} height={size.h} offset={[-size.w/2, 0, 0]} rotation={[0, Math.PI/2, 0]} isDragging={isDragging} materials={materials} />
                   {interiorLight}
               </>
           )}
           
           {/* Roof - Render only if SmartRoof is OFF */}
           <group onClick={(e) => {
               if (activeTool === 'place_level') { e.stopPropagation(); spawnLevelOnTop(id); return; }
               if (activeTab === 'roof') { e.stopPropagation(); selectObject({ type: 'module', id }); }
           }}>
               {!smartRoof && roofRender}
           </group>

           {isSelected && <mesh position={[0, size.h/2, 0]}><boxGeometry args={[size.w + 0.1, size.h + 0.1, size.d + 0.1]} /><meshBasicMaterial color="#f97316" wireframe transparent opacity={0.3} /></mesh>}
      </group>
  )
};