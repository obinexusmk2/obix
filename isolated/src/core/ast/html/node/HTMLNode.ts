/**
 * HTMLNode.ts
 * 
 * Core HTML node implementation for the OBIX framework's AST system. Leverages
 * automaton state minimization principles based on Nnamdi Okpala's research.
 * 
 * This implementation provides a comprehensive type system for HTML nodes with
 * minimization capabilities, supporting the StateMachineMinimizer and the
 * HTMLAstOptimizer components as described in the development plan.
 * 
 * The HTMLNode architecture implements automaton-based minimization as described in
 * "Extended Automaton-AST Minimization and Validation" by implementing equivalent
 * state detection and transition optimization. Each node can function both as an
 * AST node and as a state in the finite automaton representation.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { HTMLToken } from "@/core/parser/html/tokens";
import { HTMLCommentNode } from "./HTMLCommentNode";
import { HTMLElementNode } from "./HTMLElementNode";
import { HTMLTextNode } from "./HTMLTextNode";
import { HTMLCDATANode } from "./HTMLCData";
import { HTMLFragmentNode } from "./HTMLFragmentNode";
import { HTMLProcessingInstructionNode } from "./HTMLProcessingInstructionNode";
import { HTMLDoctypeNode } from "./HTMLDoctypeNode";
import { HTMLRootNode } from "./HTMLRootNode";


/**
 * Node types enumeration for the HTML AST
 */
export enum HTMLNodeType {
  // Structural nodes
  ROOT = 'ROOT',
  ELEMENT = 'ELEMENT',
  TEXT = 'TEXT',
  COMMENT = 'COMMENT',
  DOCTYPE = 'DOCTYPE',
  CDATA = 'CDATA',
  FRAGMENT = 'FRAGMENT',
  
  // Processing nodes
  PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION',
  // Special nodes for state machine representation
  STATE = 'STATE',
  TRANSITION = 'TRANSITION',
  EQUIVALENCE_CLASS = 'EQUIVALENCE_CLASS'
}

/**
 * Position information interface
 */
export interface Position {
  start: number;
  end: number;
  line: number;
  column: number;
}

/**
 * Base interface for all HTML node attributes
 */
export interface HTMLAttribute {
  name: string;
  value: string;
  quoted: boolean;
  namespace?: string;
  position?: Position;
}

/**
 * Base interface for HTML node visitation
 */
export interface HTMLNodeVisitor {
  visitElement(node: HTMLElementNode): void;
  visitText(node: HTMLTextNode): void;
  visitComment(node: HTMLCommentNode): void;
  visitDoctype(node: HTMLDoctypeNode): void;
  visitCDATA(node: HTMLCDATANode): void;
  visitRoot(node: HTMLRootNode): void;
  visitFragment(node: HTMLFragmentNode): void;
  visitProcessingInstruction(node: HTMLProcessingInstructionNode): void;
}

/**
 * State machine related interfaces for node optimization
 */
export interface StateMachineData {
  equivalenceClass: number | null;
  isMinimized: boolean;
  stateSignature: string | null;
  transitions: Map<string, HTMLNode>;
  transitionCount: number;
  metadata?: Record<string, any>;
}

/**
 * Base HTML Node interface that all node types implement
 */
export interface HTMLNode {
  /**
   * Unique node identifier
   */
  readonly id: string;
  
  /**
   * Node type
   */
  readonly type: HTMLNodeType;
  
  /**
   * Parent node
   */
  parent?: HTMLNode;
  
  /**
   * Child nodes
   */
  children: HTMLNode[];
  
  /**
   * Position in source
   */
  readonly position: Position;
  
  /**
   * State machine data for minimization
   */
  readonly stateMachine: StateMachineData;
  
  /**
   * Original token that created this node
   */
  readonly sourceToken?: HTMLToken | undefined;
  
  /**
   * Clone this node
   */
  clone(): HTMLNode;
  
  /**
   * Add a child node
   */
  appendChild(child: HTMLNode): HTMLNode;
  
  /**
   * Remove a child node
   */
  removeChild(child: HTMLNode): boolean;
  
  /**
   * Replace a child node
   */
  replaceChild(oldChild: HTMLNode, newChild: HTMLNode): boolean;
  
  /**
   * Accept a visitor
   */
  accept(visitor: HTMLNodeVisitor): void;
  
  /**
   * Convert to HTML string
   */
  toHTML(): string;
  
  /**
   * Check if this node is equivalent to another for minimization
   */
  isEquivalentTo(other: HTMLNode): boolean;
  
  /**
   * Compute state signature for minimization
   */
  computeStateSignature(): string;
  
  /**
   * Get transition for a symbol
   */
  getTransition(symbol: string): HTMLNode | undefined;
  
  /**
   * Add a transition to another node
   */
  addTransition(symbol: string, target: HTMLNode): void;
  
  /**
   * Get all symbols for transitions from this node
   */
  getTransitionSymbols(): string[];
  
  /**
   * Set the equivalence class for this node
   */
  setEquivalenceClass(classId: number): void;
  
  /**
   * Mark this node as minimized
   */
  markAsMinimized(): void;
  
  /**
   * Check if this node is minimized
   */
  isMinimized(): boolean;
}





