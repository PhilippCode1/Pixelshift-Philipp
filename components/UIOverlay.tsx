import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { 
    LayoutGrid, BrickWall, DoorOpen, Armchair, Zap, Home, 
    Undo2, Camera, Trash2, 
    Move, RotateCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    MousePointer2, Plus, 
    Maximize, Grid3x3, Square, AlignJustify, Layers,
    Sun, CloudRain, Snowflake, PaintBucket, Scaling, RotateCcw,
    CopyPlus, Minus, TreePine, Mountain, Sprout, Tent, Wheat,
    Network, Palette, Ruler, Frame, Activity, GripHorizontal, Waves, Copy, 
    LayoutTemplate, Clock, GripVertical,
    Bed, Bath, Utensils, CornerDownRight
} from 'lucide-react';
import { TabId } from '../types';
import { TextureGenerator } from './ModuleMesh';

// --- STYLED COMPONENTS ---

const GlassPanel = ({ children, className = '' }: any) => (
    // Premium Frosted Glass Effect: Higher blur, subtler border, cleaner background opacity
    <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 shadow-2xl ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ children }: any) => (
    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 mt-6 px-1 border-b border-slate-100 pb-1">
        {children}
    </h3>
);

const ActionButton = ({ onClick, icon: Icon, label, active, color }: any) => (
    <button 
        onClick={onClick}
        className={`relative group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ease-out
        ${active 
            ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform scale-[1.02] ring-1 ring-slate-700' 
            : 'bg-white/60 hover:bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5'}`}
    >
        {color && <div className="w-8 h-8 rounded-lg mb-2 border border-black/10 shadow-sm" style={{background: color}} />}
        {!color && Icon && <Icon size={22} strokeWidth={1.5} className={`mb-2 transition-colors duration-300 ${active ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`} />}
        
        <span className="text-[10px] font-semibold tracking-tight">{label}</span>
        
        {/* Active Indicator Dot */}
        {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />}
    </button>
);

const NumberControl = ({ label, value, min, max, step, onChange, unit='m' }: any) => (
    <div className="bg-white/60 p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:bg-white/80">
         <div className="flex justify-between items-center mb-3">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
             <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-right w-16">{value.toFixed(2)}{unit}</span>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition-colors"><Minus size={14}/></button>
             <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-full accent-slate-800 appearance-none cursor-pointer hover:accent-orange-500 transition-all" />
             <button onClick={() => onChange(Math.min(max, Number((value + step).toFixed(2))))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition-colors"><Plus size={14}/></button>
         </div>
    </div>
);

// --- GLOBAL PROPERTY PANELS ---

const TerraceProperties = ({ module }: { module: any }) => {
    const { updateModuleSize, setModuleColor } = useStore();
    return (
        <div className="fixed bottom-6 left-[340px] bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50 w-72 animate-in slide-in-from-bottom-4 z-50">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg"><LayoutTemplate size={16} /></div>
                     <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Terrasse</span>
                 </div>
             </div>

             <div className="space-y-3 mb-5">
                 <NumberControl label="Breite" value={module.size.w} min={2.0} max={10.0} step={0.1} onChange={(val: number) => updateModuleSize(module.id, val, module.size.d)} />
                 <NumberControl label="Tiefe" value={module.size.d} min={2.0} max={8.0} step={0.1} onChange={(val: number) => updateModuleSize(module.id, module.size.w, val)} />
             </div>

             <div className="space-y-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holzfarbe</span>
                 <div className="flex gap-2">
                     <button onClick={() => setModuleColor(module.id, '#8a6242')} className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110`} style={{background: '#8a6242'}} title="Natur"></button>
                     <button onClick={() => setModuleColor(module.id, '#5d4037')} className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110`} style={{background: '#5d4037'}} title="Dunkel"></button>
                     <button onClick={() => setModuleColor(module.id, '#a1887f')} className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110`} style={{background: '#a1887f'}} title="Grau"></button>
                     <button onClick={() => setModuleColor(module.id, '#e0e0e0')} className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110`} style={{background: '#e0e0e0'}} title="Weiß"></button>
                 </div>
             </div>
        </div>
    )
}

const InternalWallProperties = ({ prop }: { prop: any }) => {
    const { updatePropSize, setWallMaterial, updatePropRotation } = useStore();
    // Default size fallback
    const w = prop.size ? prop.size[0] : 2.0;
    const h = prop.size ? prop.size[1] : 2.8;
    const d = prop.size ? prop.size[2] : 0.1;
    const mat = prop.wallData?.mat || 'plaster_white';

    return (
        <div className="fixed bottom-6 left-[340px] bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50 w-72 animate-in slide-in-from-bottom-4 z-50">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Scaling size={16} /></div>
                     <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Innenwand</span>
                 </div>
             </div>
             
             {/* Rotation Control */}
             <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Rotation</span>
                <div className="flex gap-2">
                    <button onClick={() => updatePropRotation(prop.id, prop.rot - Math.PI/4)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-orange-500"><RotateCcw size={16} className="mx-auto"/></button>
                    <button onClick={() => updatePropRotation(prop.id, prop.rot + Math.PI/4)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-orange-500"><RotateCw size={16} className="mx-auto"/></button>
                </div>
            </div>
             
             <div className="space-y-3 mb-5">
                 <NumberControl label="Länge" value={w} min={0.5} max={8.0} step={0.1} onChange={(val: number) => updatePropSize(prop.id, [val, h, d])} />
                 <NumberControl label="Höhe" value={h} min={1.0} max={4.0} step={0.1} onChange={(val: number) => updatePropSize(prop.id, [w, val, d])} />
             </div>

             <div className="space-y-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material & Farbe</span>
                 <div className="flex gap-2">
                     <button onClick={() => setWallMaterial(prop.id, null, 'plaster_white')} className={`flex-1 h-10 rounded-xl border shadow-sm transition-all ${mat === 'plaster_white' ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105' : 'border-slate-200 hover:scale-105'}`} style={{background: '#f8fafc'}} title="Weiß"></button>
                     <button onClick={() => setWallMaterial(prop.id, null, 'concrete')} className={`flex-1 h-10 rounded-xl border shadow-sm transition-all ${mat === 'concrete' ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105' : 'border-slate-200 hover:scale-105'}`} style={{background: '#cbd5e1'}} title="Grau (Beton)"></button>
                     <button onClick={() => setWallMaterial(prop.id, null, 'plaster_anth')} className={`flex-1 h-10 rounded-xl border shadow-sm transition-all ${mat === 'plaster_anth' ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105' : 'border-slate-200 hover:scale-105'}`} style={{background: '#475569'}} title="Schwarz/Anthrazit"></button>
                 </div>
             </div>
        </div>
    )
}

const OpeningProperties = ({ opening, targetId, side }: { opening: any, targetId: string, side: any }) => {
    const { updateOpening } = useStore();
    const glassType = opening.glassType || 'transparent';
    const frameColor = opening.frameColor || 'anthracite';

    const hasGlass = opening.type.includes('window') || opening.type.includes('glass') || opening.type.includes('balcony') || opening.type.includes('sliding');
    const hasFrame = !opening.type.includes('wall_glass'); // Glass wall might not have standard frame options? keeping standard for now

    return (
        <div className="fixed bottom-6 left-[340px] bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50 w-72 animate-in slide-in-from-bottom-4 z-50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Grid3x3 size={16}/></div>
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Öffnung</span>
                </div>
            </div>
            
            <div className="space-y-4 mb-5">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase"><span>Breite</span><span className="text-slate-900">{opening.w.toFixed(2)}m</span></div>
                    <input type="range" min="0.5" max="4.0" step="0.1" value={opening.w} onChange={(e) => updateOpening(targetId, side, opening.id, {w: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-full accent-slate-800 cursor-pointer" />
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase"><span>Höhe</span><span className="text-slate-900">{opening.h.toFixed(2)}m</span></div>
                    <input type="range" min="0.4" max="2.8" step="0.05" value={opening.h} onChange={(e) => updateOpening(targetId, side, opening.id, {h: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-full accent-slate-800 cursor-pointer" />
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase"><span>Brüstung</span><span className="text-slate-900">{opening.y.toFixed(2)}m</span></div>
                    <input type="range" min="0.0" max="2.4" step="0.05" value={opening.y} onChange={(e) => updateOpening(targetId, side, opening.id, {y: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-full accent-slate-800 cursor-pointer" />
                </div>
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase"><span>Position X</span><span className="text-slate-900">{opening.x.toFixed(2)}</span></div>
                    <input type="range" min="0.1" max="0.9" step="0.05" value={opening.x} onChange={(e) => updateOpening(targetId, side, opening.id, {x: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-full accent-slate-800 cursor-pointer" />
                </div>
            </div>

            {hasFrame && (
                <div className="mb-4">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider"><Frame size={12}/> Rahmen Farbe</div>
                     <div className="flex gap-2">
                         <button onClick={() => updateOpening(targetId, side, opening.id, {frameColor: 'white'})} className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-transform ${frameColor === 'white' ? 'ring-2 ring-orange-500 border-white scale-110' : 'border-slate-200 hover:scale-105'}`} style={{background: '#f1f5f9'}} title="Weiß"></button>
                         <button onClick={() => updateOpening(targetId, side, opening.id, {frameColor: 'anthracite'})} className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-transform ${frameColor === 'anthracite' ? 'ring-2 ring-orange-500 border-white scale-110' : 'border-slate-600 hover:scale-105'}`} style={{background: '#334155'}} title="Anthrazit"></button>
                         <button onClick={() => updateOpening(targetId, side, opening.id, {frameColor: 'black'})} className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-transform ${frameColor === 'black' ? 'ring-2 ring-orange-500 border-white scale-110' : 'border-slate-800 hover:scale-105'}`} style={{background: '#0f172a'}} title="Schwarz"></button>
                     </div>
                </div>
            )}

            {hasGlass && (
                <div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider"><Grid3x3 size={12}/> Glas Typ</div>
                     <div className="flex gap-2">
                         <button onClick={() => updateOpening(targetId, side, opening.id, {glassType: 'transparent'})} className={`flex-1 py-1.5 px-3 text-xs rounded-lg border font-medium transition-all ${glassType === 'transparent' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Transparent</button>
                         <button onClick={() => updateOpening(targetId, side, opening.id, {glassType: 'mirror'})} className={`flex-1 py-1.5 px-3 text-xs rounded-lg border font-medium transition-all ${glassType === 'mirror' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>Spiegel</button>
                     </div>
                </div>
            )}
        </div>
    )
}

const PropProperties = ({ prop }: { prop: any }) => {
    const { updatePropRotation, updatePropCutout, updatePropSize } = useStore();
    const isStair = prop.type.startsWith('stair_');
    const modifiers = prop.cutoutModifiers || { offsetW: 0, offsetD: 0, offsetX: 0, offsetZ: 0 };
    const pW = prop.size ? prop.size[0] : 1.0;
    const pH = prop.size ? prop.size[1] : 2.8;
    const pD = prop.size ? prop.size[2] : 2.0;

    return (
        <div className="fixed bottom-6 left-[340px] bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 w-72 animate-in slide-in-from-bottom-4 z-50">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Move size={16}/></div>
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        {isStair ? 'Treppe & Deckenöffnung' : 'Objekt'}
                    </span>
                </div>
            </div>
            
            <div className="mb-4">
                <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Rotation</span>
                <div className="flex gap-2">
                    <button onClick={() => updatePropRotation(prop.id, prop.rot - Math.PI/4)} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-orange-500"><RotateCcw size={18} className="mx-auto"/></button>
                    <button onClick={() => updatePropRotation(prop.id, prop.rot + Math.PI/4)} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600 hover:text-orange-500"><RotateCw size={18} className="mx-auto"/></button>
                </div>
            </div>
            
            {/* STAIR DIMENSIONS */}
            {isStair && (
                <div className="mb-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Ruler size={16}/></div>
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Treppenmaße</span>
                    </div>
                    
                    <div className="space-y-3">
                        <NumberControl 
                            label="Gesamtbreite" 
                            value={pW} 
                            min={0.8} max={3.5} step={0.05} 
                            onChange={(val: number) => updatePropSize(prop.id, [val, pH, pD])} 
                        />
                        <NumberControl 
                            label="Gesamthöhe" 
                            value={pH} 
                            min={2.0} max={4.0} step={0.05} 
                            onChange={(val: number) => updatePropSize(prop.id, [pW, val, pD])} 
                        />
                         <NumberControl 
                            label="Gesamttiefe" 
                            value={pD} 
                            min={1.2} max={5.0} step={0.1} 
                            onChange={(val: number) => updatePropSize(prop.id, [pW, pH, val])} 
                        />
                    </div>
                </div>
            )}

            {/* MANUAL CEILING HOLE ADJUSTMENT */}
            {isStair && (
                <div className="mt-4 pt-3 border-t border-slate-100 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><Grid3x3 size={16}/></div>
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Deckenöffnung</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-3 leading-tight">Korrigieren Sie die Größe und Position der Öffnung in der Decke.</p>
                    
                    <div className="space-y-3">
                        <NumberControl 
                            label="Breite +/-" 
                            value={modifiers.offsetW} 
                            min={-2.0} max={2.0} step={0.05} 
                            onChange={(val: number) => updatePropCutout(prop.id, { offsetW: val })} 
                        />
                        <NumberControl 
                            label="Länge +/-" 
                            value={modifiers.offsetD} 
                            min={-2.0} max={2.0} step={0.05} 
                            onChange={(val: number) => updatePropCutout(prop.id, { offsetD: val })} 
                        />
                        <NumberControl 
                            label="Verschieben X" 
                            value={modifiers.offsetX} 
                            min={-4.0} max={4.0} step={0.1} 
                            onChange={(val: number) => updatePropCutout(prop.id, { offsetX: val })} 
                        />
                        <NumberControl 
                            label="Verschieben Z" 
                            value={modifiers.offsetZ} 
                            min={-4.0} max={4.0} step={0.1} 
                            onChange={(val: number) => updatePropCutout(prop.id, { offsetZ: val })} 
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// --- PANELS ---

const StructurePanel = () => {
    const { startModulePlacement, startLevelPlacement, activeTool, environment, setEnvironment, spawnModule } = useStore();
    const [w, setW] = useState(3.0);
    const [l, setL] = useState(6.0);
    const [h, setH] = useState(2.8);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <SectionTitle>Modul Erstellung</SectionTitle>
            
            {activeTool && (activeTool === 'place_module' || activeTool === 'place_level') && (
                <div className="bg-blue-50/80 backdrop-blur p-3 rounded-xl border border-blue-100 text-blue-800 text-xs mb-4 flex items-center gap-2 animate-pulse shadow-sm">
                    <MousePointer2 size={16}/>
                    <span className="font-medium">
                        {activeTool === 'place_module' ? 'Klicken Sie auf den Boden zum Platzieren.' : 'Klicken Sie auf ein Modul für eine Etage.'}
                    </span>
                </div>
            )}

            <div className="space-y-4 mb-8">
                <NumberControl label="Breite" value={w} min={2} max={4} step={0.1} onChange={setW} />
                <NumberControl label="Länge" value={l} min={2} max={8} step={0.1} onChange={setL} />
                <NumberControl label="Höhe" value={h} min={2.4} max={3.5} step={0.05} onChange={setH} />
                
                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={() => startModulePlacement(w, l, h)} 
                        className={`flex-1 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent
                        ${activeTool === 'place_module' ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300 hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                        <Plus size={18}/> Modul
                    </button>
                    <button 
                        onClick={startLevelPlacement} 
                        className={`flex-1 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent
                        ${activeTool === 'place_level' ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-200' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200 hover:shadow-xl hover:-translate-y-0.5'}`}
                    >
                        <CopyPlus size={18}/> Etage
                    </button>
                </div>
                
                {/* NEW TERRACE BUTTON */}
                <button 
                    onClick={() => spawnModule(0, 0, 'terrace')} 
                    className="w-full py-3 rounded-xl font-bold bg-white text-slate-700 shadow-sm border border-slate-200 hover:border-orange-300 hover:text-orange-600 hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <LayoutTemplate size={18}/> Terrasse hinzufügen
                </button>
            </div>

            <SectionTitle>Schattenstudie</SectionTitle>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase">Tageszeit</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-100">
                        {Math.floor(environment.time)}:{(environment.time % 1 * 60).toFixed(0).padStart(2, '0')} Uhr
                    </span>
                </div>
                <input 
                    type="range" 
                    min="6" max="22" step="0.25" 
                    value={environment.time} 
                    onChange={(e) => setEnvironment({time: parseFloat(e.target.value)})} 
                    className="w-full h-2 bg-gradient-to-r from-blue-300 via-yellow-200 to-blue-900 rounded-full accent-slate-800 cursor-pointer hover:accent-orange-500 transition-all" 
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1 px-1">
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>22:00</span>
                </div>
            </div>

            <SectionTitle>Umgebung</SectionTitle>
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/60 shadow-sm mb-4">
                <span className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-wider">Landschaft</span>
                <div className="grid grid-cols-5 gap-2 mb-4">
                    <ActionButton icon={Sprout} label="Wiese" active={environment.terrain === 'grass'} onClick={() => setEnvironment({terrain: 'grass'})} />
                    <ActionButton icon={TreePine} label="Wald" active={environment.terrain === 'forest'} onClick={() => setEnvironment({terrain: 'forest'})} />
                    <ActionButton icon={Mountain} label="Berg" active={environment.terrain === 'mountain'} onClick={() => setEnvironment({terrain: 'mountain'})} />
                    <ActionButton icon={Tent} label="Erde" active={environment.terrain === 'dirt'} onClick={() => setEnvironment({terrain: 'dirt'})} />
                    <ActionButton icon={Wheat} label="Land" active={environment.terrain === 'agriculture'} onClick={() => setEnvironment({terrain: 'agriculture'})} />
                </div>

                <span className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-wider">Wetter & Hilfe</span>
                <div className="grid grid-cols-4 gap-3">
                    <ActionButton icon={Sun} label="Sonne" active={environment.weather === 'sun'} onClick={() => setEnvironment({weather: 'sun'})} />
                    <ActionButton icon={CloudRain} label="Regen" active={environment.weather === 'rain'} onClick={() => setEnvironment({weather: 'rain'})} />
                    <ActionButton icon={Snowflake} label="Schnee" active={environment.weather === 'snow'} onClick={() => setEnvironment({weather: 'snow'})} />
                    <ActionButton icon={Grid3x3} label="Raster" active={environment.showGrid} onClick={() => setEnvironment({showGrid: !environment.showGrid})} />
                </div>
            </div>
        </div>
    )
}

const RoofPanel = () => {
    const { setRoof, addProp, activeTool, setActiveTool, selection, modules, smartRoof, toggleSmartRoof } = useStore();
    const selModule = selection?.type === 'module' ? modules.find(m => m.id === selection.id) : null;
    const roofType = selModule?.roof.type;

    const applyRoof = (type: any) => {
        if (selModule) {
            setRoof(selModule.id, type, selModule.roof.angle, selModule.roof.overhang);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <SectionTitle>Dachform</SectionTitle>
            
            {/* SMART ROOF TOGGLE */}
            <div className="mb-6 p-4 bg-slate-800 rounded-xl text-white shadow-lg border border-slate-700">
                <div className="flex justify-between items-center">
                     <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"><LayoutTemplate size={16}/> Einheitliches Dach</span>
                     <button 
                        onClick={toggleSmartRoof}
                        className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${smartRoof ? 'bg-orange-500' : 'bg-slate-600'}`}
                     >
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${smartRoof ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                </div>
                {smartRoof && <p className="text-[10px] text-slate-400 mt-2">Alle Module im obersten Stockwerk werden unter einem gemeinsamen Dach verbunden.</p>}
            </div>

            {!selModule && !smartRoof && (
                <div className="bg-orange-50/80 backdrop-blur p-3 rounded-xl border border-orange-100 text-orange-800 text-xs mb-4 flex items-center gap-2 shadow-sm">
                    <MousePointer2 size={16}/>
                    <span className="font-medium">Bitte wählen Sie ein Modul aus, um das Dach zu ändern.</span>
                </div>
            )}
            
            <div className={`grid grid-cols-2 gap-3 mb-6 ${!selModule ? 'opacity-50 pointer-events-none' : ''}`}>
                <ActionButton label="Flachdach" active={roofType === 'flat'} onClick={() => applyRoof('flat')} />
                <ActionButton label="Satteldach" active={roofType === 'gable'} onClick={() => applyRoof('gable')} />
                <ActionButton label="Pultdach" active={roofType === 'pent'} onClick={() => applyRoof('pent')} />
                <ActionButton label="Offen" active={roofType === 'none'} onClick={() => applyRoof('none')} />
            </div>

            {selModule && (roofType === 'gable' || roofType === 'pent' || roofType === 'flat') && (
                 <div className="space-y-4 mb-6 animate-in slide-in-from-top-2">
                     {roofType !== 'flat' && (
                         <NumberControl 
                            label="Dachneigung" 
                            value={selModule.roof.angle || (roofType === 'gable' ? 30 : 15)} 
                            min={10} max={60} step={5} unit="°"
                            onChange={(val: number) => setRoof(selModule.id, roofType, val, selModule.roof.overhang)} 
                         />
                     )}
                     <NumberControl 
                        label="Dachüberstand" 
                        value={selModule.roof.overhang !== undefined ? selModule.roof.overhang : 0.3} 
                        min={0.0} max={1.5} step={0.1}
                        onChange={(val: number) => setRoof(selModule.id, roofType, selModule.roof.angle, val)} 
                     />
                 </div>
            )}
        </div>
    )
}

const WallsPanel = () => {
    const { activeTool, setActiveTool } = useStore();
    
    // Helper to toggle tool
    const toggle = (tool: string) => setActiveTool(activeTool === tool ? null : tool);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <SectionTitle>Fassaden Design</SectionTitle>
            <div className="bg-blue-50/80 backdrop-blur p-3 rounded-xl border border-blue-100 text-blue-800 text-xs mb-4 flex items-center gap-2 shadow-sm">
                <PaintBucket size={16}/>
                <span className="font-medium">Wählen Sie ein Material und klicken Sie auf eine Außenwand.</span>
            </div>

            <SectionTitle>Farben & Materialien</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mb-6">
                <ActionButton label="Weißputz" active={activeTool === '#ffffff'} onClick={() => toggle('#ffffff')} color="#ffffff" />
                <ActionButton label="Anthrazit" active={activeTool === '#334155'} onClick={() => toggle('#334155')} color="#334155" />
                <ActionButton label="Holz Natur" active={activeTool === '#e1d5c0'} onClick={() => toggle('#e1d5c0')} color="#e1d5c0" />
                <ActionButton label="Backstein" active={activeTool === '#8d6e63'} onClick={() => toggle('#8d6e63')} color="#8d6e63" />
                <ActionButton label="Hellgrau" active={activeTool === '#cbd5e1'} onClick={() => toggle('#cbd5e1')} color="#cbd5e1" />
                <ActionButton label="Schwarz" active={activeTool === '#0f172a'} onClick={() => toggle('#0f172a')} color="#0f172a" />
            </div>

            <SectionTitle>Strukturen</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={AlignJustify} label="Glatt" active={activeTool === 'smooth'} onClick={() => toggle('smooth')} />
                 <ActionButton icon={GripHorizontal} label="Planken" active={activeTool === 'plank'} onClick={() => toggle('plank')} />
                 <ActionButton icon={GripVertical} label="Vertikal" active={activeTool === 'wood_v'} onClick={() => toggle('wood_v')} />
                 <ActionButton icon={Grid3x3} label="Ziegel" active={activeTool === 'brick'} onClick={() => toggle('brick')} />
                 <ActionButton icon={Waves} label="Welle" active={activeTool === 'wave'} onClick={() => toggle('wave')} />
            </div>

            <SectionTitle>Konstruktion</SectionTitle>
             <div className="grid grid-cols-1 gap-3">
                 <ActionButton icon={Frame} label="Rahmen verkleiden (Ein/Aus)" active={activeTool === 'cover_frame'} onClick={() => toggle('cover_frame')} />
            </div>
        </div>
    );
};

const OpeningsPanel = () => {
    const { activeTool, setActiveTool } = useStore();
    const toggle = (tool: string) => setActiveTool(activeTool === tool ? null : tool);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
             <SectionTitle>Öffnungen</SectionTitle>
             <div className="bg-blue-50/80 backdrop-blur p-3 rounded-xl border border-blue-100 text-blue-800 text-xs mb-4 flex items-center gap-2 shadow-sm">
                <MousePointer2 size={16}/>
                <span className="font-medium">Klicken Sie auf eine Wand um die Öffnung zu platzieren.</span>
            </div>

             <SectionTitle>Fenster</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={Square} label="Standard" active={activeTool === 'window_std'} onClick={() => toggle('window_std')} />
                 <ActionButton icon={Maximize} label="Panorama" active={activeTool === 'window_pano'} onClick={() => toggle('window_pano')} />
                 <ActionButton icon={LayoutGrid} label="Glaswand" active={activeTool === 'wall_glass'} onClick={() => toggle('wall_glass')} />
                 <ActionButton icon={Sun} label="Dachfenster" active={activeTool === 'window_skylight'} onClick={() => toggle('window_skylight')} />
             </div>

             <SectionTitle>Türen</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={DoorOpen} label="Eingangstür" active={activeTool === 'door_exterior'} onClick={() => toggle('door_exterior')} />
                 <ActionButton icon={Frame} label="Balkontür" active={activeTool === 'door_balcony'} onClick={() => toggle('door_balcony')} />
                 <ActionButton icon={GripVertical} label="Schiebetür" active={activeTool === 'door_sliding'} onClick={() => toggle('door_sliding')} />
             </div>
        </div>
    );
};

const InteriorPanel = () => {
    const { activeTool, setActiveTool, addProp } = useStore();
    const toggle = (tool: string) => setActiveTool(activeTool === tool ? null : tool);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
             <SectionTitle>Innenausbau</SectionTitle>
             
             <SectionTitle>Wände & Treppen</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={Scaling} label="Innenwand" active={activeTool === 'wall_internal'} onClick={() => toggle('wall_internal')} />
                 <ActionButton icon={AlignJustify} label="Gerade Treppe" active={activeTool === 'stair_straight'} onClick={() => toggle('stair_straight')} />
                 <ActionButton icon={RotateCw} label="Wendeltreppe" active={activeTool === 'stair_spiral'} onClick={() => toggle('stair_spiral')} />
                 <ActionButton icon={CornerDownRight} label="L-Treppe" active={activeTool === 'stair_l_shape'} onClick={() => toggle('stair_l_shape')} />
                 <ActionButton icon={Undo2} label="U-Treppe" active={activeTool === 'stair_u_shape'} onClick={() => toggle('stair_u_shape')} />
             </div>

             <SectionTitle>Möbel</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={Utensils} label="Küche" active={activeTool === 'kitchen'} onClick={() => toggle('kitchen')} />
                 <ActionButton icon={Armchair} label="Sofa" active={activeTool === 'sofa'} onClick={() => toggle('sofa')} />
                 <ActionButton icon={Bed} label="Bett" active={activeTool === 'bed'} onClick={() => toggle('bed')} />
                 <ActionButton icon={GripVertical} label="Schrank" active={activeTool === 'wardrobe'} onClick={() => toggle('wardrobe')} />
             </div>

             <SectionTitle>Sanitär</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={Armchair} label="WC" active={activeTool === 'wc'} onClick={() => toggle('wc')} />
                 <ActionButton icon={CloudRain} label="Dusche" active={activeTool === 'shower'} onClick={() => toggle('shower')} />
                 <ActionButton icon={Bath} label="Badewanne" active={activeTool === 'tub'} onClick={() => toggle('tub')} />
                 <ActionButton icon={Waves} label="Waschbecken" active={activeTool === 'sink'} onClick={() => toggle('sink')} />
             </div>
        </div>
    );
};

const TechPanel = () => {
    const { activeTool, setActiveTool } = useStore();
    const toggle = (tool: string) => setActiveTool(activeTool === tool ? null : tool);

    return (
         <div className="animate-in fade-in slide-in-from-left-4 duration-500">
             <SectionTitle>Technik & Energie</SectionTitle>
             
             <SectionTitle>Energie</SectionTitle>
             <div className="grid grid-cols-2 gap-3 mb-6">
                 <ActionButton icon={Sun} label="Solar" active={activeTool === 'solar'} onClick={() => toggle('solar')} />
                 <ActionButton icon={Activity} label="Wärmepumpe" active={activeTool === 'heatpump'} onClick={() => toggle('heatpump')} />
                 <ActionButton icon={Snowflake} label="Klima" active={activeTool === 'ac'} onClick={() => toggle('ac')} />
             </div>

             <SectionTitle>Elektro</SectionTitle>
             <div className="grid grid-cols-3 gap-3 mb-6">
                 <ActionButton icon={Zap} label="Licht" active={activeTool === 'light'} onClick={() => toggle('light')} />
                 <ActionButton icon={Zap} label="Schalter" active={activeTool === 'switch'} onClick={() => toggle('switch')} />
                 <ActionButton icon={Zap} label="Steckdose" active={activeTool === 'socket'} onClick={() => toggle('socket')} />
             </div>
         </div>
    )
};

// --- SIDEBAR ---

const Sidebar = () => {
    const { activeTab, undo, redo, removeSelection, requestScreenshot, duplicateSelection, activeTool, setActiveTool, setMeasureActive } = useStore();

    return (
        <GlassPanel className="w-[320px] h-full flex flex-col border-r border-slate-200/50">
            {/* Logo Area */}
            <div className="p-6 pb-2 border-b border-white/40">
                <div className="flex flex-col items-center mb-6">
                    {/* NEW WIDE LANDSCAPE LOGO */}
                    <div className="relative w-full h-28 flex items-center justify-center p-0 mb-2">
                        <svg viewBox="0 0 350 100" className="w-full h-full drop-shadow-xl">
                            <defs>
                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#bf953f" />
                                    <stop offset="50%" stopColor="#b38728" />
                                    <stop offset="100%" stopColor="#fbf5b7" />
                                </linearGradient>
                            </defs>

                            {/* Minimalist Luxury Lines */}
                            <line x1="50" y1="15" x2="300" y2="15" stroke="url(#goldGradient)" strokeWidth="1.5" />
                            <line x1="80" y1="85" x2="270" y2="85" stroke="url(#goldGradient)" strokeWidth="1.5" />
                            
                            {/* Main Title */}
                            <text x="175" y="55" textAnchor="middle" fill="url(#goldGradient)" fontFamily="serif" fontSize="36" fontWeight="bold" letterSpacing="1">
                                MODUL MATE
                            </text>
                            
                            {/* GmbH - small superscript */}
                            <text x="305" y="40" textAnchor="start" fill="#64748b" fontFamily="sans-serif" fontSize="8" fontWeight="bold">
                                GmbH
                            </text>

                            {/* Subtitle */}
                            <text x="175" y="75" textAnchor="middle" fill="#475569" fontFamily="sans-serif" fontSize="10" fontWeight="500" letterSpacing="4" className="uppercase">
                                Architekten Studio
                            </text>
                        </svg>
                    </div>
                    {/* NEW TEXT */}
                    <span className="text-[9px] text-slate-400 font-medium tracking-tight -mt-4 opacity-70">
                        (Nur für Computer Nutzung ausgearbeitet)
                    </span>
                </div>
                
                {/* Global Actions */}
                <div className="flex gap-1 justify-between bg-slate-50/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 shadow-inner">
                    <button onClick={undo} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 hover:shadow-sm transition-all" title="Rückgängig"><Undo2 size={18}/></button>
                    <button onClick={redo} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-800 hover:shadow-sm transition-all" title="Wiederholen"><RotateCw size={18} className="scale-x-[-1]"/></button>
                    <div className="w-px h-5 bg-slate-200 my-auto mx-1"></div>
                    <button 
                        onClick={() => setMeasureActive(activeTool !== 'measure')} 
                        className={`p-2 rounded-lg transition-all ${activeTool === 'measure' ? 'bg-orange-100 text-orange-600' : 'hover:bg-white text-slate-400 hover:text-orange-500'}`} 
                        title="Messen"
                    >
                        <Ruler size={18}/>
                    </button>
                    <button onClick={duplicateSelection} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-500 hover:shadow-sm transition-all" title="Duplizieren"><Copy size={18}/></button>
                    <button onClick={removeSelection} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 hover:shadow-sm transition-all" title="Löschen"><Trash2 size={18}/></button>
                    <button onClick={requestScreenshot} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-500 hover:shadow-sm transition-all" title="Screenshot"><Camera size={18}/></button>
                </div>
            </div>

            {/* Navigation & Content */}
            <div className="flex-1 overflow-hidden flex">
                <div className="w-20 flex flex-col items-center py-6 gap-3 border-r border-slate-100 bg-white/40">
                    <button onClick={() => useStore.getState().setTab('structure')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'structure' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><LayoutGrid size={24}/></button>
                    <button onClick={() => useStore.getState().setTab('walls')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'walls' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><BrickWall size={24}/></button>
                    <button onClick={() => useStore.getState().setTab('openings')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'openings' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><DoorOpen size={24}/></button>
                    <button onClick={() => useStore.getState().setTab('interior')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'interior' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><Armchair size={24}/></button>
                    <button onClick={() => useStore.getState().setTab('tech')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'tech' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><Zap size={24}/></button>
                    <button onClick={() => useStore.getState().setTab('roof')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'roof' ? 'bg-slate-800 shadow-lg text-white scale-105 ring-2 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/60'}`}><Home size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200">
                    {activeTab === 'structure' && <StructurePanel />}
                    {activeTab === 'walls' && <WallsPanel />}
                    {activeTab === 'openings' && <OpeningsPanel />}
                    {activeTab === 'interior' && <InteriorPanel />}
                    {activeTab === 'tech' && <TechPanel />}
                    {activeTab === 'roof' && <RoofPanel />}
                </div>
            </div>
        </GlassPanel>
    );
}

export const UIOverlay = () => {
    const { selection, activeTab, moveModule, rotateSelection, props, getOpening, activeTool, modules } = useStore();
    const isStructureTab = activeTab === 'structure';
    const showMovementControls = selection?.type === 'module' && isStructureTab;

    // Resolve selection
    const selProp = selection?.type === 'prop' ? props.find(p => p.id === selection.id) : null;
    const selOpening = selection?.type === 'opening' && selection.secondaryId ? getOpening(selection.id, selection.side!, selection.secondaryId) : null;
    const isInternalWall = selProp?.type === 'wall_internal';
    const selModule = selection?.type === 'module' ? modules.find(m => m.id === selection.id) : null;
    const isTerrace = selModule?.kind === 'terrace';

    return (
        <div className="w-full h-full flex justify-between pointer-events-none font-sans text-slate-800">
            <div className="h-full pointer-events-auto shadow-2xl z-50">
                <Sidebar />
            </div>
            
            {/* Measuring Tool Active Indicator */}
            {activeTool === 'measure' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4">
                    <Ruler size={18} className="text-orange-500" />
                    <span className="font-bold text-sm">Messwerkzeug aktiv</span>
                    <span className="text-xs text-slate-400 border-l border-white/20 pl-3">Startpunkt klicken → Endpunkt klicken</span>
                </div>
            )}

            {/* GLOBAL PROPERTIES - Always Visible when selected */}
            <div className="pointer-events-auto z-50">
                {selOpening && <OpeningProperties opening={selOpening} targetId={selection!.id} side={selection!.side} />}
                {isInternalWall && selProp && <InternalWallProperties prop={selProp} />}
                {!isInternalWall && selProp && <PropProperties prop={selProp} />}
                
                {/* NEW: Terrace Properties */}
                {isTerrace && selModule && <TerraceProperties module={selModule} />}
            </div>

            {/* MODULE CONTROLS */}
            {showMovementControls && (
                <div className="absolute bottom-8 right-8 pointer-events-auto flex flex-col gap-3 animate-in fade-in slide-in-from-right-4">
                     {/* REMOVED ARROW BUTTONS CONTAINER */}
                     <button onClick={rotateSelection} className="bg-white/80 backdrop-blur-lg p-4 rounded-2xl shadow-2xl border border-white/60 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-white hover:text-orange-500 transition-all hover:scale-105">
                         <RotateCw size={18}/> 90° Drehen
                     </button>
                </div>
            )}
        </div>
    );
};