import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { ModuleData, PropData, Selection, TabId, ViewMode, WallSide, Opening, OpeningType, RoofType, ExportState, DragState, WeatherType, TerrainType, WallStructure, CutoutModifiers, WallData } from './types';

interface Snapshot {
  modules: ModuleData[];
  props: PropData[];
}

interface AppState {
  modules: ModuleData[];
  props: PropData[];
  selection: Selection | null;
  activeTab: TabId;
  viewMode: ViewMode;
  hoveredId: string | null;
  
  // Interaction Tools
  activeTool: string | null; 
  setActiveTool: (tool: string | null) => void;
  pendingDims: { w: number, d: number, h: number } | null; // Stored dimensions for module placement

  // Measuring Tool
  measureState: { active: boolean; start: [number,number,number] | null; end: [number,number,number] | null };
  setMeasureActive: (active: boolean) => void;
  setMeasurePoint: (point: [number,number,number] | null, isStart: boolean) => void;

  transformMode: 'translate' | 'rotate';
  setTransformMode: (mode: 'translate' | 'rotate') => void;

  // Environment & Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  environment: { time: number; lights: boolean; weather: WeatherType; terrain: TerrainType; showGrid: boolean }; 
  setEnvironment: (env: Partial<{ time: number; lights: boolean; weather: WeatherType; terrain: TerrainType; showGrid: boolean }>) => void;

  // Smart Roof
  smartRoof: boolean;
  toggleSmartRoof: () => void;

  // History
  history: { past: Snapshot[]; future: Snapshot[] };
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Drag & Interaction
  dragState: DragState;
  startDrag: (id: string, type: 'module' | 'prop', offset: [number, number]) => void;
  updateDrag: (x: number, z: number) => void;
  endDrag: () => void;

  // Screenshot & Exports
  screenshotRequested: boolean;
  exportState: ExportState;
  requestScreenshot: () => void;
  clearScreenshotRequest: () => void;
  startExportSequence: () => void;
  nextExportStep: () => void;
  finishExport: () => void;

  // Actions
  startModulePlacement: (w: number, d: number, h: number) => void;
  spawnModule: (x: number, z: number, kind?: 'living' | 'terrace') => void;
  
  startLevelPlacement: () => void;
  spawnLevelOnTop: (targetModuleId: string) => void;

  duplicateSelection: () => void;
  removeSelection: () => void;
  clearAll: () => void;
  selectObject: (sel: Selection | null) => void;
  moveModule: (id: string, axis: 'x' | 'z', delta: number) => void;
  rotateSelection: () => void;
  
  updateModulePosition: (id: string, x: number, z: number) => void;
  updateModuleSize: (id: string, w: number, d: number) => void; // NEW
  setModuleColor: (id: string, color: string) => void; // NEW

  updatePropPosition: (id: string, pos: [number, number, number]) => void;
  updatePropRotation: (id: string, rot: number) => void;
  updatePropSize: (id: string, size: [number, number, number]) => void;
  updatePropCutout: (id: string, modifiers: Partial<CutoutModifiers>) => void;
  updateModuleRotation: (id: string, rot: number) => void;
  
  setWallMaterial: (id: string, side: WallSide | null, mat: string) => void;
  setWallStructure: (id: string, side: WallSide | null, structure: WallStructure) => void;
  setWallCoverFrame: (id: string, side: WallSide | null, active: boolean) => void;
  getWallMat: (moduleId: string, side: WallSide) => string;
  addOpening: (targetId: string, side: WallSide | null, type: OpeningType, x?: number, y?: number) => void;
  removeOpening: (targetId: string, side: WallSide | null, openingId: string) => void;
  getOpening: (targetId: string, side: WallSide | null, openingId: string) => Opening | undefined;
  updateOpening: (targetId: string, side: WallSide | null, openingId: string, updates: Partial<Opening>) => void;
  
  setRoof: (moduleId: string, type: RoofType, angle?: number, overhang?: number) => void;
  setFloor: (moduleId: string, type: string) => void;
  setAllRoofs: (type: RoofType) => void;
  
  addProp: (type: string, position?: [number,number,number], rotation?: number) => void;
  
  setTab: (tab: TabId) => void;
  setViewMode: (mode: ViewMode) => void;
  setHovered: (id: string | null) => void;
  
  saveProject: () => void;
  loadProject: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  modules: [],
  props: [],
  selection: null,
  activeTab: 'structure',
  viewMode: '3d',
  hoveredId: null,
  activeTool: null,
  pendingDims: null,
  measureState: { active: false, start: null, end: null },
  transformMode: 'translate',
  setTransformMode: (mode) => set({ transformMode: mode }),
  
  smartRoof: false,
  toggleSmartRoof: () => set(state => ({ smartRoof: !state.smartRoof })),

  isDarkMode: false,
  toggleDarkMode: () => set(state => {
      const newMode = !state.isDarkMode;
      return { 
          isDarkMode: newMode,
          environment: { ...state.environment, time: newMode ? 22 : 12, lights: newMode }
      };
  }),

  environment: { time: 12, lights: false, weather: 'sun', terrain: 'grass', showGrid: true },
  setEnvironment: (env) => set(state => ({ environment: { ...state.environment, ...env } })),

  setMeasureActive: (active) => set({ measureState: { active, start: null, end: null }, activeTool: active ? 'measure' : null, selection: null }),
  setMeasurePoint: (point, isStart) => set(state => ({ 
      measureState: { ...state.measureState, [isStart ? 'start' : 'end']: point } 
  })),

  history: { past: [], future: [] },
  screenshotRequested: false,
  exportState: 'idle',
  dragState: { active: false, id: null, type: null, offset: [0,0] },

  pushHistory: () => {
    const { modules, props, history } = get();
    // Deep copy state for history to avoid reference issues
    const snapshot: Snapshot = {
        modules: JSON.parse(JSON.stringify(modules)),
        props: JSON.parse(JSON.stringify(props))
    };
    const newPast = [...history.past, snapshot].slice(-50);
    set({ history: { past: newPast, future: [] } });
  },

  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    // Save current state to future
    const currentSnapshot: Snapshot = {
        modules: JSON.parse(JSON.stringify(get().modules)),
        props: JSON.parse(JSON.stringify(get().props))
    };

    set({
      modules: previous.modules,
      props: previous.props,
      history: { past: newPast, future: [currentSnapshot, ...history.future] }
    });
  },

  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    // Save current to past
    const currentSnapshot: Snapshot = {
        modules: JSON.parse(JSON.stringify(get().modules)),
        props: JSON.parse(JSON.stringify(get().props))
    };

    set({
      modules: next.modules,
      props: next.props,
      history: { past: [...history.past, currentSnapshot], future: newFuture }
    });
  },

  // --- DRAG LOGIC ---
  startDrag: (id, type, offset) => {
      get().pushHistory();
      set({ dragState: { active: true, id, type, offset } });
  },

  updateDrag: (x, z) => {
      const { dragState, modules, props } = get();
      if (!dragState.active || !dragState.id) return;
      
      const snapX = Math.round((x - dragState.offset[0]) * 20) / 20;
      const snapZ = Math.round((z - dragState.offset[1]) * 20) / 20;

      if (dragState.type === 'module') {
          set({ modules: modules.map(m => m.id === dragState.id ? { ...m, grid: { ...m.grid, x: snapX, z: snapZ } } : m) });
      } else if (dragState.type === 'prop') {
          // Standard prop movement
          set({ props: props.map(p => p.id === dragState.id ? { ...p, pos: [snapX, p.pos[1], snapZ] } : p) });
      }
  },

  endDrag: () => set({ dragState: { active: false, id: null, type: null, offset: [0,0] } }),

  // --- UPDATE LOGIC ---
  updateModulePosition: (id, x, z) => {
      set(state => ({ modules: state.modules.map(m => m.id === id ? { ...m, grid: { ...m.grid, x: Math.round(x*10)/10, z: Math.round(z*10)/10 } } : m) }));
  },
  updateModuleSize: (id, w, d) => {
      get().pushHistory();
      set(state => ({ modules: state.modules.map(m => m.id === id ? { ...m, size: { ...m.size, w, d } } : m) }));
  },
  setModuleColor: (id, color) => {
      get().pushHistory();
      set(state => ({ modules: state.modules.map(m => m.id === id ? { ...m, color } : m) }));
  },
  updateModuleRotation: (id, rot) => {
      set(state => ({ modules: state.modules.map(m => m.id === id ? { ...m, grid: { ...m.grid, rot } } : m) }));
  },
  updatePropPosition: (id, pos) => {
      set(state => ({ props: state.props.map(p => p.id === id ? { ...p, pos: [Math.round(pos[0]*20)/20, pos[1], Math.round(pos[2]*20)/20] } : p) }));
  },
  updatePropRotation: (id, rot) => {
      set(state => ({ props: state.props.map(p => p.id === id ? { ...p, rot } : p) }));
  },
  updatePropSize: (id, size) => {
      set(state => ({ props: state.props.map(p => p.id === id ? { ...p, size } : p) }));
  },
  updatePropCutout: (id, modifiers) => {
      set(state => ({ 
          props: state.props.map(p => p.id === id ? { 
              ...p, 
              cutoutModifiers: { ...(p.cutoutModifiers || {offsetW:0, offsetD:0, offsetX:0, offsetZ:0}), ...modifiers } 
          } : p) 
      }));
  },

  setActiveTool: (tool) => {
      if (tool !== 'measure') set({ measureState: { active: false, start: null, end: null } });
      set({ activeTool: tool, selection: null });
  },

  setWallMaterial: (id, side, mat) => {
      get().pushHistory();
      const { modules, props } = get();
      
      const isModule = modules.some(m => m.id === id);
      if (isModule && side) {
          set(state => ({ 
              modules: state.modules.map(m => m.id === id ? { 
                  ...m, 
                  walls: { 
                      ...m.walls, 
                      [side]: { 
                          ...m.walls[side], 
                          mat,
                          openings: mat === 'open' ? [] : m.walls[side].openings 
                      } 
                  } 
              } : m) 
          }));
          return;
      }

      const isProp = props.some(p => p.id === id);
      if (isProp) {
          set(state => ({ 
              props: state.props.map(p => p.id === id && p.wallData ? { 
                  ...p, 
                  wallData: { 
                      ...p.wallData, 
                      mat,
                      openings: mat === 'open' ? [] : p.wallData.openings
                  } 
              } : p) 
          }));
      }
  },

  setWallStructure: (id, side, structure) => {
      get().pushHistory();
      set(state => ({
          modules: state.modules.map(m => m.id === id && side ? {
               ...m,
               walls: {
                   ...m.walls,
                   [side]: { ...m.walls[side], structure }
               }
          } : m)
      }));
  },

  setWallCoverFrame: (id, side, active) => {
      get().pushHistory();
      set(state => ({
          modules: state.modules.map(m => m.id === id && side ? {
              ...m,
              walls: {
                  ...m.walls,
                  [side]: { ...m.walls[side], coverFrame: active }
              }
          } : m)
      }));
  },

  getWallMat: (moduleId, side) => {
      const m = get().modules.find(m => m.id === moduleId);
      return m ? m.walls[side].mat : 'open';
  },

  addOpening: (targetId, side, type, x = 0.5, y) => {
      get().pushHistory();
      const newOpeningId = nanoid(); 
      
      let w = 1.0, h = 1.2;
      let defaultY = 0.9; 
      
      if (type.includes('door')) { w = 0.9; h = 2.1; defaultY = 0.05; }
      if (type === 'door_sliding') { w = 2.0; h = 2.1; defaultY = 0.05; }
      if (type === 'door_balcony') { w = 0.9; h = 2.1; defaultY = 0.05; }
      
      if (type === 'window_pano') { w = 2.0; h = 1.5; defaultY = 0.8; }
      if (type === 'window_skylight') { w = 1.0; h = 1.2; defaultY = 2.0; }
      if (type === 'wall_glass') { w = 2.8; h = 2.4; defaultY = 0.15; }

      const newOpening: Opening = { 
          id: newOpeningId, 
          type, 
          x, 
          y: y ?? defaultY, 
          w, 
          h,
          frameColor: 'anthracite', // Default
          glassType: 'transparent'  // Default
      };

      const { modules, props } = get();
      if (modules.some(m => m.id === targetId)) {
          if (!side) return;
          set(state => ({
              modules: state.modules.map(m => m.id === targetId ? {
                  ...m,
                  walls: { ...m.walls, [side]: { ...m.walls[side], openings: [...m.walls[side].openings, newOpening] } }
              } : m)
          }));
      } else if (props.some(p => p.id === targetId)) {
          set(state => ({
              props: state.props.map(p => p.id === targetId && p.wallData ? {
                  ...p,
                  wallData: { ...p.wallData, openings: [...p.wallData.openings, newOpening] }
              } : p)
          }));
      }

      get().selectObject({
          type: 'opening',
          id: targetId,
          side: side || undefined,
          secondaryId: newOpeningId
      });

      set({ activeTool: null }); 
  },

  removeOpening: (targetId, side, openingId) => {
    get().pushHistory();
    if (side) {
         set(state => ({
             modules: state.modules.map(m => m.id === targetId ? {
                 ...m,
                 walls: { ...m.walls, [side]: { ...m.walls[side], openings: m.walls[side].openings.filter(o => o.id !== openingId) } }
             } : m)
         }));
    } else {
         set(state => ({
             props: state.props.map(p => p.id === targetId && p.wallData ? {
                 ...p,
                 wallData: { ...p.wallData, openings: p.wallData.openings.filter(o => o.id !== openingId) }
             } : p)
         }));
    }
  },

  getOpening: (targetId, side, openingId) => {
    const { modules, props } = get();
    if (side) {
        return modules.find(m => m.id === targetId)?.walls[side].openings.find(o => o.id === openingId);
    } else {
        return props.find(p => p.id === targetId)?.wallData?.openings.find(o => o.id === openingId);
    }
  },

  updateOpening: (targetId, side, openingId, updates) => {
    get().pushHistory();
    if (side) {
         set(state => ({
             modules: state.modules.map(m => m.id === targetId ? {
                 ...m,
                 walls: { 
                     ...m.walls, 
                     [side]: { 
                         ...m.walls[side], 
                         openings: m.walls[side].openings.map(o => o.id === openingId ? { ...o, ...updates } : o) 
                     } 
                 }
             } : m)
         }));
    } else {
         set(state => ({
             props: state.props.map(p => p.id === targetId && p.wallData ? {
                 ...p,
                 wallData: {
                     ...p.wallData,
                     openings: p.wallData.openings.map(o => o.id === openingId ? { ...o, ...updates } : o)
                 }
             } : p)
         }));
    }
  },

  removeSelection: () => {
      get().pushHistory();
      const { selection } = get();
      if (!selection) return;

      if (selection.type === 'module') {
          set(state => ({ modules: state.modules.filter(m => m.id !== selection.id), selection: null }));
      } else if (selection.type === 'prop') {
          set(state => ({ props: state.props.filter(p => p.id !== selection.id), selection: null }));
      } else if (selection.type === 'opening' && selection.secondaryId) {
          get().removeOpening(selection.id, selection.side || null, selection.secondaryId);
          set({ selection: null });
      }
  },

  duplicateSelection: () => {
      const { selection, modules, props } = get();
      if (!selection) return;
      get().pushHistory();

      if (selection.type === 'module') {
          const original = modules.find(m => m.id === selection.id);
          if (original) {
              const newId = nanoid();
              const copy: ModuleData = {
                  ...JSON.parse(JSON.stringify(original)),
                  id: newId,
                  grid: { ...original.grid, x: original.grid.x + 2, z: original.grid.z } // Offset
              };
              // Reset openings IDs in copy to avoid conflicts
              ['north', 'south', 'east', 'west'].forEach((side) => {
                  copy.walls[side as WallSide].openings.forEach(op => op.id = nanoid());
              });
              
              set(state => ({ modules: [...state.modules, copy], selection: { type: 'module', id: newId } }));
          }
      } else if (selection.type === 'prop') {
          const original = props.find(p => p.id === selection.id);
          if (original) {
              const newId = nanoid();
              const copy: PropData = {
                  ...JSON.parse(JSON.stringify(original)),
                  id: newId,
                  pos: [original.pos[0] + 1, original.pos[1], original.pos[2] + 1] // Offset
              };
              if (copy.wallData) {
                  copy.wallData.openings.forEach(op => op.id = nanoid());
              }
              set(state => ({ props: [...state.props, copy], selection: { type: 'prop', id: newId } }));
          }
      }
  },

  clearAll: () => {
      get().pushHistory();
      set({ modules: [], props: [], selection: null });
  },

  selectObject: (sel) => set({ selection: sel }),

  moveModule: (id, axis, delta) => {
      get().pushHistory();
      set(state => ({
          modules: state.modules.map(m => m.id === id ? {
              ...m,
              grid: { ...m.grid, [axis]: m.grid[axis] + delta }
          } : m)
      }));
  },

  rotateSelection: () => {
      get().pushHistory();
      const { selection, modules, props } = get();
      if (!selection) return;

      if (selection.type === 'module') {
          set(state => ({
              modules: state.modules.map(m => m.id === selection.id ? { ...m, grid: { ...m.grid, rot: m.grid.rot + Math.PI / 2 } } : m)
          }));
      } else if (selection.type === 'prop') {
          set(state => ({
              props: state.props.map(p => p.id === selection.id ? { ...p, rot: p.rot + Math.PI / 2 } : p)
          }));
      }
  },

  // Missing implementations
  requestScreenshot: () => set({ screenshotRequested: true }),
  clearScreenshotRequest: () => set({ screenshotRequested: false }),
  startExportSequence: () => set({ exportState: 'top', viewMode: '2d' }),
  nextExportStep: () => {
      const { exportState } = get();
      const steps: ExportState[] = ['idle', 'top', 'north', 'south', 'east', 'west', 'done'];
      const idx = steps.indexOf(exportState);
      if (idx !== -1 && idx < steps.length - 1) {
          set({ exportState: steps[idx+1] });
      } else {
          set({ exportState: 'idle' });
      }
  },
  finishExport: () => set({ exportState: 'idle' }),

  startModulePlacement: (w, d, h) => set({ activeTool: 'place_module', pendingDims: { w, d, h }, selection: null }),
  spawnModule: (x, z, kind: 'living' | 'terrace' = 'living') => {
      const { pendingDims } = get();
      get().pushHistory();
      
      const dims = pendingDims || { w: 3.0, d: 6.0, h: 2.8 };
      
      const newModule: ModuleData = {
          id: nanoid(),
          kind,
          level: 0,
          size: kind === 'terrace' ? { ...dims, h: 0.2 } : dims, // Terraces are flat
          grid: { x, z, rot: 0 },
          walls: {
              north: { mat: 'open', structure: 'smooth', openings: [], coverFrame: false },
              south: { mat: 'open', structure: 'smooth', openings: [], coverFrame: false },
              east: { mat: 'open', structure: 'smooth', openings: [], coverFrame: false },
              west: { mat: 'open', structure: 'smooth', openings: [], coverFrame: false }
          },
          roof: { type: 'none', angle: 0, overhang: 0.3 },
          floor: kind === 'terrace' ? 'decking' : 'wood',
          color: kind === 'terrace' ? '#8a6242' : undefined // Default terrace color
      };
      set(state => ({ modules: [...state.modules, newModule], activeTool: null }));
  },

  startLevelPlacement: () => set({ activeTool: 'place_level', selection: null }),
  spawnLevelOnTop: (targetModuleId) => {
      const { modules } = get();
      const base = modules.find(m => m.id === targetModuleId);
      if(!base || base.kind === 'terrace') return; // Cannot build on terraces easily logic-wise yet
      get().pushHistory();
      
      const newModule: ModuleData = {
          ...(JSON.parse(JSON.stringify(base)) as ModuleData),
          id: nanoid(),
          level: base.level + 1,
          roof: { type: 'none', angle: 0, overhang: 0.3 }
      };
      
      set(state => ({ 
          modules: [...state.modules.map(m => m.id === targetModuleId ? { ...m, roof: { type: 'none' as RoofType, angle: 0 } } : m), newModule],
          activeTool: null 
      }));
  },

  setRoof: (moduleId, type, angle, overhang) => {
    get().pushHistory();
    set(state => ({
        modules: state.modules.map(m => m.id === moduleId ? { ...m, roof: { type, angle: angle ?? m.roof.angle, overhang: overhang ?? (m.roof.overhang || 0.3) } } : m)
    }));
  },

  setFloor: (moduleId, type) => {
    get().pushHistory();
    set(state => ({
        modules: state.modules.map(m => m.id === moduleId ? { ...m, floor: type as any } : m)
    }));
  },

  setAllRoofs: (type) => {
    get().pushHistory();
    set(state => ({
        modules: state.modules.map(m => ({ ...m, roof: { ...m.roof, type } }))
    }));
  },

  setTab: (tab) => set({ activeTab: tab, activeTool: null, selection: null }),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setHovered: (id) => set({ hoveredId: id }),
  
  saveProject: () => {
    const { modules, props, environment } = get();
    const data = JSON.stringify({ modules, props, environment });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modulmate-project.json';
    link.click();
  },
  
  loadProject: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.modules && data.props) {
                    get().pushHistory();
                    set({ modules: data.modules, props: data.props, environment: data.environment || get().environment });
                }
            } catch (err) {
                console.error("Failed to load project", err);
            }
        };
        reader.readAsText(file);
    };
    input.click();
  },

  addProp: (type, position, rotation) => {
    get().pushHistory();
    const { selection, modules } = get();
    let startPos: [number, number, number] = position || [0, 0, 0];
    let startRot = rotation || 0;
    
    let startSize: [number, number, number] | undefined = undefined;
    let wallData = undefined;

    switch(type) {
        case 'wall_internal': 
            startSize = [2.0, 2.8, 0.1]; 
            wallData = { mat: 'plaster_white', structure: 'smooth', openings: [] }; 
            break;
        case 'solar': startSize = [1.6, 0.05, 1.0]; break;
        case 'sofa': startSize = [2.2, 0.8, 0.9]; break; 
        case 'kitchen': startSize = [2.4, 0.9, 0.6]; break; 
        case 'bed': startSize = [1.6, 0.5, 2.1]; break; 
        case 'wardrobe': startSize = [1.2, 2.2, 0.6]; break;
        case 'wc': startSize = [0.4, 0.8, 0.55]; break;
        case 'shower': startSize = [1.0, 2.0, 1.0]; break;
        case 'tub': startSize = [1.7, 0.6, 0.8]; break;
        case 'sink': startSize = [1.0, 0.85, 0.5]; break;
        
        // STAIRS
        case 'stair_straight': startSize = [1.0, 2.8, 3.2]; break;
        case 'stair_spiral': startSize = [1.6, 2.8, 1.6]; break;
        case 'stair_l_shape': startSize = [2.0, 2.8, 2.0]; break;
        case 'stair_u_shape': startSize = [2.0, 2.8, 2.0]; break;
    }
    
    // Auto-placement logic if no position provided
    if (!position) {
        if (selection?.type === 'module') {
            const m = modules.find(m => m.id === selection.id);
            if(m) {
                let yOff = m.level * m.size.h; 
                startPos = [m.grid.x, yOff, m.grid.z];
            }
        }
    }

    const newProp: PropData = {
        id: nanoid(),
        type,
        pos: startPos,
        rot: startRot,
        size: startSize,
        wallData: wallData as any,
        cutoutModifiers: { offsetW: 0, offsetD: 0, offsetX: 0, offsetZ: 0 } // Default
    };
    
    set(state => ({ props: [...state.props, newProp], selection: { type: 'prop', id: newProp.id } }));
    set({ activeTool: null }); 
  }
}));