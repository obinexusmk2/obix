
/**
 * Signature generator utilities for CSS nodes and state machines
 * Part of the OBIX parser module
 */

import { CSSNode, CSSNodeType } from '../../../ast/node/CSSNode.js';
import { CSSToken, CSSTokenType } from '../tokenizer/CSSTokenType.js';
import { State } from '../states/CSSStateMachine.js';

/**
 * Options for signature generation
 */
export interface SignatureOptions {
  /** Whether to include node values in signatures */
  includeValues?: boolean;
  /** Whether to include child nodes in signatures */
  includeChildren?: boolean;
  /** Maximum depth for recursive signatures */
  maxDepth?: number;
  /** Custom signature components */
  customComponents?: (node: CSSNode) => string[];
}

/**
 * Handles generation of signatures for CSS components
 * Used in state minimization and node deduplication
 */
export class CSSSignatureGenerator {
  /**
   * Generate a signature for a CSS node
   * 
   * @param node Node to generate signature for
   * @param options Signature generation options
   * @returns Signature string
   */
  static generateNodeSignature(
    node: CSSNode, 
    options: SignatureOptions = {}
  ): string {
    const {
      includeValues = true,
      includeChildren = true,
      maxDepth = Infinity,
      customComponents
    } = options;
    
    return this.generateNodeSignatureRecursive(
      node, { includeValues, includeChildren, maxDepth, customComponents }, 0
    );
  }
  
  /**
   * Recursive implementation of node signature generation
   * 
   * @param node Node to generate signature for
   * @param options Signature generation options
   * @param depth Current recursion depth
   * @returns Signature string
   */
  public static generateNodeSignatureRecursive(
    node: CSSNode,
    options: Required<SignatureOptions>,
    depth: number
  ): string {
    const components: string[] = [];
    
    // Add node type
    components.push(`type:${node.type}`);
    
    // Add node value if requested
    if (options.includeValues && node.value !== null) {
      components.push(`value:${node.value}`);
    }
    
    // Add type-specific properties
    components.push(...this.getTypeSpecificSignatureComponents(node));
    
    // Add custom components if provided
    if (options.customComponents) {
      const custom = options.customComponents(node);
      if (custom.length > 0) {
        components.push(...custom);
      }
    }
    
    // Add child signatures if requested and within depth limit
    if (options.includeChildren && depth < options.maxDepth && node.children.length > 0) {
      const childSignatures = node.children.map(child => 
        this.generateNodeSignatureRecursive(child, options, depth + 1)
      );
      components.push(`children:[${childSignatures.join(',')}]`);
    } else if (node.children.length > 0) {
      // Just include child count if not including full signatures
      components.push(`childCount:${node.children.length}`);
    }
    
    return components.join('|');
  }
  
  /**
   * Get signature components specific to a node type
   * 
   * @param node Node to get components for
   * @returns Array of signature components
   */
  public static getTypeSpecificSignatureComponents(node: CSSNode): string[] {
    const components: string[] = [];
    
    switch (node.type) {
      case CSSNodeType.Rule:
        if (node.selector) {
          components.push(`selector:${node.selector}`);
        }
        break;
        
      case CSSNodeType.AtRule:
        if (node.name) {
          components.push(`name:${node.name}`);
        }
        if (node.prelude) {
          components.push(`prelude:${node.prelude}`);
        }
        break;
        
      case CSSNodeType.Declaration:
        if (node.important) {
          components.push('important:true');
        }
        break;
        
      case CSSNodeType.Function:
        // For functions, include the function name
        if (node.value) {
          components.push(`function:${node.value}`);
        }
        break;
        
      case CSSNodeType.MediaQuery:
        if (node.mediaType) {
          components.push(`mediaType:${node.mediaType}`);
        }
        if (node.mediaFeatures && node.mediaFeatures.length > 0) {
          components.push(`mediaFeatures:${node.mediaFeatures.join(',')}`);
        }
        break;
        
      case CSSNodeType.KeyframeBlock:
        if (node.keyText) {
          components.push(`keyText:${node.keyText}`);
        }
        break;
    }
    
    return components;
  }
  
  /**
   * Generate a signature for a CSS token
   * 
   * @param token Token to generate signature for
   * @returns Signature string
   */
  static generateTokenSignature(token: CSSToken): string {
    const components: string[] = [];
    
    // Add token type
    components.push(`type:${token.type}`);
    
    // Add token value if present
    if ('value' in token && token.value) {
      components.push(`value:${token.value}`);
    }
    
    // Add token-specific properties
    switch (token.type) {
      case CSSTokenType.AtKeyword:
        if ('keyword' in token && token.keyword) {
          components.push(`keyword:${token.keyword}`);
        }
        break;
        
      case CSSTokenType.Number:
        if ('numericValue' in token && token.numericValue !== undefined) {
          components.push(`numericValue:${token.numericValue}`);
        }
        break;
        
      case CSSTokenType.Function:
        if ('name' in token && token.name) {
          components.push(`name:${token.name}`);
        }
        break;
        
      case CSSTokenType.URL:
        if ('url' in token && token.url) {
          components.push(`url:${token.url}`);
        }
        break;
        
      case CSSTokenType.Error:
        if ('message' in token && token.message) {
          components.push(`message:${token.message}`);
        }
        break;
    }
    
    return components.join('|');
  }
  
  /**
   * Generate a signature for a state machine state
   * 
   * @param state State to generate signature for
   * @param stateMap Map to track already visited states
   * @returns Signature string
   */
  static generateStateSignature(
    state: State,
    stateMap: Map<string, number> = new Map()
  ): string {
    const components: string[] = [];
    
    // Add state name and accepting status
    components.push(`name:${state.name}`);
    components.push(`accepting:${state.isAccepting}`);
    
    // Add transitions
    const transitions: string[] = [];
    for (const [symbol, target] of state.transitions.entries()) {
      // Use state name for transitions
      transitions.push(`${symbol}:${target.name}`);
    }
    
    if (transitions.length > 0) {
      components.push(`transitions:[${transitions.sort().join(',')}]`);
    }
    
    // Include equivalence class if set
    if (state.equivalenceClass !== null) {
      components.push(`class:${state.equivalenceClass}`);
    }
    
    return components.join('|');
  }
  
  /**
   * Generate a deterministic hash for a signature
   * Useful for caching and comparison
   * 
   * @param signature Signature string
   * @returns Hash number
   */
  static hashSignature(signature: string): number {
    let hash = 0;
    
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash;
  }
  
  /**
   * Generate a fingerprint for a CSS structure
   * Used for caching and optimization
   * 
   * @param input Node, token, or state to generate fingerprint for
   * @returns Fingerprint string
   */
  static generateFingerprint(
    input: CSSNode | CSSToken | State
  ): string {
    let signature: string;
    
    if ('type' in input && typeof input.type === 'string') {
      if ('processToken' in input) {
        // It's a state
        signature = this.generateStateSignature(input as State);
      } else if ('position' in input) {
        // It's a token
        signature = this.generateTokenSignature(input as CSSToken);
      } else {
        // It's a node
        signature = this.generateNodeSignature(input as CSSNode);
      }
    } else {
      throw new Error('Unsupported input type for fingerprint generation');
    }
    
    // Generate a hash from the signature
    const hash = this.hashSignature(signature);
    return hash.toString(16);
  }
}