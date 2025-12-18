import * as THREE from 'three';

export type ViewMode = '3d' | '2d' | 'tech';
export type TabId = 'structure' | 'walls' | 'openings' | 'interior' | 'tech' | 'roof';
export type WallSide = 'north' | 'south' | 'east' | 'west';
export type RoofType = 'none' | 'flat' | 'gable' | 'pent';
export type FloorType = 'wood' | 'tile' | 'vinyl' | 'concrete' | 'decking'; // Added decking
export type WeatherType = 'sun' | 'rain' | 'snow';
export type TerrainType = 'grass' | 'forest' | 'mountain' | 'dirt' | 'agriculture';

export type OpeningType = 'window_std' | 'window_pano' | 'window_skylight' | 'door_interior' | 'door_exterior' | 'door_balcony' | 'door_sliding' | 'wall_glass';
export type WallStructure = 'smooth' | 'plank' | 'wave' | 'brick' | 'wood_v';

export interface Opening {
  id: string;
  type: OpeningType;
  x: number; // 0 to 1 relative to wall width
  y: number; // height from floor
  w: number;
  h: number;
  // NEW: Customization
  frameColor?: 'white' | 'anthracite' | 'black';
  glassType?: 'transparent' | 'mirror';
}

export interface WallData {
  mat: string; // This now represents the COLOR hex or ID
  structure: WallStructure; // Texture type
  openings: Opening[];
  coverFrame?: boolean; // NEW: If true, facade covers the steel frame
}

export interface ModuleData {
  id: string;
  kind: 'living' | 'terrace'; // NEW: Distinguish usage
  level: number; // 0 = Ground, 1 = 1st Floor, etc.
  size: { w: number; d: number; h: number };
  grid: { x: number; z: number; rot: number };
  walls: Record<WallSide, WallData>;
  roof: { type: RoofType; angle: number; overhang?: number }; // ADDED overhang
  floor: FloorType;
  color?: string; // NEW: Custom color for terraces or modules
}

export interface CutoutModifiers {
    offsetW: number; // Width adjustment
    offsetD: number; // Depth/Length adjustment
    offsetX: number; // Shift X local
    offsetZ: number; // Shift Z local
}

export interface PropData {
  id: string;
  type: string;
  pos: [number, number, number]; // [x, y, z]
  rot: number;
  size?: [number, number, number]; // Optional scale/size [width, height, depth] for resizable props like walls
  // NEW: specific data for internal walls to behave like real walls
  wallData?: WallData; 
  // NEW: Manual override for ceiling cutout size
  cutoutModifiers?: CutoutModifiers;
}

export interface Selection {
  type: 'module' | 'prop' | 'opening';
  id: string; // Module ID or Prop ID
  secondaryId?: string; // Opening ID or specific wall side if needed
  side?: WallSide;
}

export interface DragState {
    active: boolean;
    id: string | null;
    type: 'module' | 'prop' | null;
    offset: [number, number]; // Offset from object center to mouse hit point [x, z]
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    image?: string; // base64 data url
    video?: string; // video url
    isLoading?: boolean;
}

export type ExportState = 'idle' | 'top' | 'north' | 'south' | 'east' | 'west' | 'done';