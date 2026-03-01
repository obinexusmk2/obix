/**
 * VHTMLPatchTypes.ts
 * 
 * Defines the types used in the Virtual DOM patching system. These types support
 * the automaton state minimization optimizations for virtual DOM operations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VNode, VNodeProps } from './VHTMLNode';

/**
 * Types of DOM patches
 */
export enum PatchType {
  /** Replace a node */
  REPLACE = 'replace',
  /** Update props */
  PROPS = 'props',
  /** Update text content */
  TEXT = 'text',
  /** Insert a new node */
  INSERT = 'insert',
  /** Remove a node */
  REMOVE = 'remove',
  /** Move a node to a new position */
  MOVE = 'move',
  /** Order children */
  ORDER = 'order',
  /** Update a keyed list */
  KEYED_LIST = 'keyed-list'
}

/**
 * Base patch interface
 */
export interface BasePatch {
  /** Type of patch */
  type: PatchType;
}

/**
 * Patch to replace a node
 */
export interface ReplacePatch extends BasePatch {
  type: PatchType.REPLACE;
  /** Node to replace */
  oldNode: VNode;
  /** New node */
  newNode: VNode;
}

/**
 * Patch to update props
 */
export interface PropsPatch extends BasePatch {
  type: PatchType.PROPS;
  /** Node to update */
  node: VNode;
  /** New props */
  props: VNodeProps;
}

/**
 * Patch to update text content
 */
export interface TextPatch extends BasePatch {
  type: PatchType.TEXT;
  /** Text node to update */
  node: VNode;
  /** New text content */
  text: string;
}

/**
 * Patch to insert a node
 */
export interface InsertPatch extends BasePatch {
  type: PatchType.INSERT;
  /** Node to insert */
  node: VNode;
  /** Parent node */
  parentNode: VNode;
  /** Index to insert at */
  index: number;
}

/**
 * Patch to remove a node
 */
export interface RemovePatch extends BasePatch {
  type: PatchType.REMOVE;
  /** Node to remove */
  node: VNode;
  /** Parent node */
  parentNode?: VNode;
}

/**
 * Patch to move a node
 */
export interface MovePatch extends BasePatch {
  type: PatchType.MOVE;
  /** Node to move */
  node: VNode;
  /** Parent node */
  parentNode?: VNode;
  /** New index */
  index: number;
}

/**
 * Patch to reorder children
 */
export interface OrderPatch extends BasePatch {
  type: PatchType.ORDER;
  /** Parent node */
  node: VNode;
  /** New child order */
  indices: number[];
}

/**
 * Patch to update a keyed list
 */
export interface KeyedListPatch extends BasePatch {
  type: PatchType.KEYED_LIST;
  /** Parent node */
  node: VNode;
  /** Key to index mapping */
  keyMap: Map<string | number, number>;
}

/**
 * Union of all patch types
 */
export type VNodePatch = 
  | ReplacePatch
  | PropsPatch
  | TextPatch
  | InsertPatch
  | RemovePatch
  | MovePatch
  | OrderPatch
  | KeyedListPatch;