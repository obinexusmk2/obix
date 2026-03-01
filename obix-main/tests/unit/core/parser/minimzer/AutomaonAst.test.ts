// tests/unit/core/parser/AutomatonASTMinimization.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { HTMLToken } from '../../../../src/core/parser/html/tokens/HTMLToken';
import { HTMLTokenBuilder } from '../../../../src/core/parser/html/tokens/HTMLTokenBuilder';
import { HTMLTokenType } from '../../../../src/core/parser/html/tokens/HTMLTokenType';
import { StateId, InputSymbol } from '../../../../src/core/types/state-machine-types';
import { OptimizationLevel } from '../../../../src/core/types/minimization-types';
import { DEFAULT_OPTIMIZATION_LEVEL } from '../../../../src/core/constants/minimization-constants';

// Import minimization utilities (paths may need adjustment)
import { computeEquivalenceClasses } from '../../../../src/core/automaton/minimization/EquivalenceClassComputer';
import { minimizeStateMachine } from '../../../../src/core/automaton/minimization/StateMachineMinimizer';
import { optimizeAST } from '../../../../src/core/automaton/optimization/ASTOptimizer';

/**
 * Test suite for automaton state minimization and AST optimization
 * This focuses specifically on the core technology described in Nnamdi Okpala's papers
 */
describe('Automaton State Minimization and AST Optimization', () => {
  // State Machine Minimization
  describe('State Machine Minimization Algorithm', () => {
    // Create a test automaton with redundant states
    // This simulates a simple HTML structure with some redundancy
    let tokenStates: Map<StateId, HTMLToken>;
    let transitions: Map<StateId, Map<InputSymbol, StateId>>;
    let inputAlphabet: Set<string>;
    
    beforeEach(() => {
      // Create a set of token states
      tokenStates = new Map();
      transitions = new Map();
      inputAlphabet = new Set(['childElement', 'text', 'end']);
      
      // Create token states (simulating HTML elements in different states)
      // State 1 and 2 are equivalent div elements
      const divToken1 = HTMLTokenBuilder.createToken(
        'StartTag',
        { name: 'div', selfClosing: false },
        { start: 0, end: 5, line: 1, column: 1 }
      );
      
      const divToken2 = HTMLTokenBuilder.createToken(
        'StartTag',
        { name: 'div', selfClosing: false },
        { start: 100, end: 105, line: 10, column: 1 }
      );
      
      // State 3 and 4 are equivalent span elements
      const spanToken1 = HTMLTokenBuilder.createToken(
        'StartTag',
        { name: 'span', selfClosing: false },
        { start: 6, end: 12, line: 1, column: 6 }
      );
      
      const spanToken2 = HTMLTokenBuilder.createToken(
        'StartTag',
        { name: 'span', selfClosing: false },
        { start: 106, end: 112, line: 10, column: 6 }
      );
      
      // State 5 is a text node
      const textToken = HTMLTokenBuilder.createToken(
        'Text',
        { content: 'Hello', isWhitespace: false },
        { start: 13, end: 18, line: 1, column: 13 }
      );
      
      // State 6 is an end tag
      const endToken = HTMLTokenBuilder.createToken(
        'EndTag',
        { name: 'div' },
        { start: 19, end: 25, line: 1, column: 19 }
      );
      
      // Add tokens to the state map
      tokenStates.set('1', divToken1);
      tokenStates.set('2', divToken2);
      tokenStates.set('3', spanToken1);
      tokenStates.set('4', spanToken2);
      tokenStates.set('5', textToken);
      tokenStates.set('6', endToken);
      
      // Define transitions
      // Both div states have similar transitions
      transitions.set('1', new Map([
        ['childElement', '3'], // div -> span
        ['end', '6']           // div -> end div
      ]));
      
      transitions.set('2', new Map([
        ['childElement', '4'], // div -> span
        ['end', '6']           // div -> end div
      ]));
      
      // Both span states transition to text
      transitions.set('3', new Map([
        ['text', '5'],         // span -> text
        ['end', '6']           // span -> end div (simplified)
      ]));
      
      transitions.set('4', new Map([
        ['text', '5'],         // span -> text
        ['end', '6']           // span -> end div (simplified)
      ]));
      
      // Text transitions to end
      transitions.set('5', new Map([
        ['end', '6']           // text -> end div
      ]));
      
      // End state has no transitions
      transitions.set('6', new Map());
    });
    
    test('computes equivalence classes correctly', () => {
      // Compute equivalence classes for the automaton
      const initialClasses = new Map<number, Set<StateId>>();
      
      // Initial partition: accepting vs non-accepting states
      // For simplicity, consider only end tags as accepting states
      const accepting = new Set<StateId>();
      const nonAccepting = new Set<StateId>();
      
      for (const [stateId, token] of tokenStates.entries()) {
        if (token.type === 'EndTag') {
          accepting.add(stateId);
        } else {
          nonAccepting.add(stateId);
        }
      }
      
      initialClasses.set(0, nonAccepting);
      initialClasses.set(1, accepting);
      
      // Compute equivalence classes
      const equivalenceClasses = computeEquivalenceClasses(
        tokenStates,
        transitions,
        inputAlphabet,
        initialClasses
      );
      
      // Verify correct number of equivalence classes
      // We expect: 
      // - Class for div elements (states 1 and 2)
      // - Class for span elements (states 3 and 4)
      // - Class for text (state 5)
      // - Class for end tag (state 6)
      expect(equivalenceClasses.size).toBe(4);
      
      // Verify div states are in the same class
      let divClassId: number | null = null;
      for (const [classId, states] of equivalenceClasses.entries()) {
        if (states.has('1')) {
          divClassId = classId;
          break;
        }
      }
      expect(divClassId).not.toBeNull();
      expect(equivalenceClasses.get(divClassId!)?.has('2')).toBe(true);
      
      // Verify span states are in the same class
      let spanClassId: number | null = null;
      for (const [classId, states] of equivalenceClasses.entries()) {
        if (states.has('3')) {
          spanClassId = classId;
          break;
        }
      }
      expect(spanClassId).not.toBeNull();
      expect(equivalenceClasses.get(spanClassId!)?.has('4')).toBe(true);
    });
    
    test('minimizes the state machine correctly', () => {
      // Initialize test data
      const initialStateId = '1';
      const acceptingStates = new Set(['6']);
      
      // Run minimization
      const minimized = minimizeStateMachine({
        states: tokenStates,
        transitions,
        initialStateId,
        acceptingStates,
        alphabet: inputAlphabet,
        optimizationLevel: DEFAULT_OPTIMIZATION_LEVEL
      });
      
      // Verify minimized state count
      // We expect 4 states instead of 6 (div, span, text, end)
      expect(minimized.states.size).toBe(4);
      
      // Verify transitions are preserved
      const minimizedDivStateId = minimized.initialStateId;
      const divTransitions = minimized.transitions.get(minimizedDivStateId);
      expect(divTransitions).toBeDefined();
      
      // Follow transitions to verify structure is preserved
      const spanStateId = divTransitions!.get('childElement');
      expect(spanStateId).toBeDefined();
      
      const spanTransitions = minimized.transitions.get(spanStateId!);
      expect(spanTransitions).toBeDefined();
      expect(spanTransitions!.has('text')).toBe(true);
      
      const textStateId = spanTransitions!.get('text');
      expect(textStateId).toBeDefined();
      
      const textTransitions = minimized.transitions.get(textStateId!);
      expect(textTransitions).toBeDefined();
      expect(textTransitions!.has('end')).toBe(true);
      
      const endStateId = textTransitions!.get('end');
      expect(endStateId).toBeDefined();
      expect(minimized.acceptingStates.has(endStateId!)).toBe(true);
    });
    
    test('different optimization levels affect minimization results', () => {
      const initialStateId = '1';
      const acceptingStates = new Set(['6']);
      
      // Run minimization with BASIC level
      const basicMinimized = minimizeStateMachine({
        states: tokenStates,
        transitions,
        initialStateId,
        acceptingStates,
        alphabet: inputAlphabet,
        optimizationLevel: OptimizationLevel.BASIC
      });
      
      // Run minimization with AGGRESSIVE level
      const aggressiveMinimized = minimizeStateMachine({
        states: tokenStates,
        transitions,
        initialStateId,
        acceptingStates,
        alphabet: inputAlphabet,
        optimizationLevel: OptimizationLevel.AGGRESSIVE
      });
      
      // Aggressive should have same or fewer states than basic
      expect(aggressiveMinimized.states.size).toBeLessThanOrEqual(basicMinimized.states.size);
      
      // Both should maintain correct behavior
      expect(aggressiveMinimized.acceptingStates.size).toBeGreaterThan(0);
      expect(basicMinimized.acceptingStates.size).toBeGreaterThan(0);
    });
  });
  
  // AST Optimization Tests
  describe('AST Optimization', () => {
    // Create a test AST structure with redundancy
    let ast: any;
    
    beforeEach(() => {
      // Create a sample AST representing HTML structure
      ast = {
        type: 'Document',
        children: [
          {
            type: 'Element',
            tagName: 'div',
            attributes: { class: 'container' },
            children: [
              {
                type: 'Element',
                tagName: 'div',
                attributes: { class: 'row' },
                children: [
                  {
                    type: 'Element',
                    tagName: 'div',
                    attributes: { class: 'col' },
                    children: [
                      { type: 'Text', content: 'Item 1' }
                    ]
                  },
                  {
                    type: 'Element',
                    tagName: 'div',
                    attributes: { class: 'col' },
                    children: [
                      { type: 'Text', content: 'Item 2' }
                    ]
                  },
                  {
                    type: 'Element',
                    tagName: 'div',
                    attributes: { class: 'col' },
                    children: [
                      { type: 'Text', content: 'Item 3' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
    });
    
    test('optimizes redundant AST nodes', () => {
      // Count nodes before optimization
      const countNodes = (node: any): number => {
        if (!node) return 0;
        if (!node.children || node.children.length === 0) return 1;
        
        return 1 + node.children.reduce((sum: number, child: any) => 
          sum + countNodes(child), 0);
      };
      
      const originalNodeCount = countNodes(ast);
      
      // Run AST optimization
      const optimizedAst = optimizeAST(ast);
      
      // Count nodes after optimization
      const optimizedNodeCount = countNodes(optimizedAst);
      
      // Verify node reduction while preserving structure
      expect(optimizedNodeCount).toBeLessThan(originalNodeCount);
      
      // Verify structure is preserved at important points
      expect(optimizedAst.type).toBe('Document');
      expect(optimizedAst.children.length).toBe(1);
      expect(optimizedAst.children[0].tagName).toBe('div');
      
      // Verify we still have a container with rows and columns
      const container = optimizedAst.children[0];
      expect(container.attributes.class).toBe('container');
      
      const row = container.children[0];
      expect(row.tagName).toBe('div');
      expect(row.attributes.class).toBe('row');
      
      // Verify we still have column structure
      // (even if implementation might use a more efficient representation)
      expect(row.children.length).toBeGreaterThan(0);
      
      // If we were using a template-based optimization,
      // verify all text content is still accessible
      const allText = JSON.stringify(optimizedAst);
      expect(allText).toContain('Item 1');
      expect(allText).toContain('Item 2');
      expect(allText).toContain('Item 3');
    });
    
    test('signature generation identifies similar subtrees', () => {
      // Get the row node containing multiple identical column structures
      const rowNode = ast.children[0].children[0];
      
      // Test that the signature generator produces identical signatures for equivalent nodes
      const columnSignatures = rowNode.children.map((col: any) => 
        generateNodeSignature(col)
      );
      
      // All column signatures should be the same since they have the same structure
      expect(columnSignatures[0]).toBe(columnSignatures[1]);
      expect(columnSignatures[1]).toBe(columnSignatures[2]);
      
      // But should be different from the row signature
      const rowSignature = generateNodeSignature(rowNode);
      expect(rowSignature).not.toBe(columnSignatures[0]);
    });
    
    test('node minimization preserves parent-child relationships', () => {
      // Initial node structure with parent references
      setupParentReferences(ast);
      
      // Optimize and verify parent references are maintained
      const optimizedAst = optimizeAST(ast);
      
      // Check if all nodes have correct parent references
      const validParentRefs = validateParentReferences(optimizedAst);
      expect(validParentRefs).toBe(true);
      
      // Verify parent-child relationships are correct
      const container = optimizedAst.children[0];
      const row = container.children[0];
      
      for (const child of row.children) {
        expect(child.parent).toBe(row);
      }
    });
  });
  
  // Integration Tests between State Minimization and AST Optimization
  describe('Integrated Automaton-AST Minimization', () => {
    test('minimized state machine produces consistent AST transformations', () => {
      // Create test data: a simple document with repeating structures
      const html = `
        <div class="container">
          <div class="row">
            <div class="col"><p>Item 1</p></div>
            <div class="col"><p>Item 2</p></div>
            <div class="col"><p>Item 3</p></div>
          </div>
        </div>
      `;
      
      // First parse to get tokens and AST
      const tokens = tokenizeHTML(html);
      const ast = parseTokensToAST(tokens);
      
      // Create a state machine from the document structure
      const stateMachine = createStateMachineFromAST(ast);
      
      // Minimize the state machine
      const minimizedStateMachine = minimizeStateMachine({
        states: stateMachine.states,
        transitions: stateMachine.transitions,
        initialStateId: stateMachine.initialStateId,
        acceptingStates: stateMachine.acceptingStates,
        alphabet: stateMachine.alphabet,
        optimizationLevel: OptimizationLevel.STANDARD
      });
      
      // Apply the minimized state machine to optimize the AST
      const optimizedAst = applyMinimizedStateMachineToAST(ast, minimizedStateMachine);
      
      // Verify optimization metrics
      expect(countNodes(optimizedAst)).toBeLessThan(countNodes(ast));
      
      // Verify the optimized AST still renders the same content
      const originalRendering = renderAST(ast);
      const optimizedRendering = renderAST(optimizedAst);
      expect(optimizedRendering).toBe(originalRendering);
    });
    
    test('minimization correctly handles dynamic content', () => {
      // Create a template with dynamic content
      const template = {
        type: 'Document',
        children: [
          {
            type: 'Element',
            tagName: 'ul',
            attributes: { class: 'list' },
            children: [
              // Dynamic list items would be generated here
              createDynamicListItems(5)
            ]
          }
        ]
      };
      
      // First, render the template to get original output
      const originalOutput = renderWithDynamicContent(template, ['A', 'B', 'C', 'D', 'E']);
      
      // Create automaton and minimize
      const stateMachine = createStateMachineFromTemplate(template);
      const minimizedStateMachine = minimizeStateMachine({
        states: stateMachine.states,
        transitions: stateMachine.transitions,
        initialStateId: stateMachine.initialStateId,
        acceptingStates: stateMachine.acceptingStates,
        alphabet: stateMachine.alphabet,
        optimizationLevel: OptimizationLevel.STANDARD
      });
      
      // Optimize the template
      const optimizedTemplate = applyMinimizedStateMachineToAST(template, minimizedStateMachine);
      
      // Render with same dynamic content
      const optimizedOutput = renderWithDynamicContent(optimizedTemplate, ['A', 'B', 'C', 'D', 'E']);
      
      // Outputs should be identical despite template optimization
      expect(optimizedOutput).toBe(originalOutput);
      
      // And optimized template should have fewer nodes
      expect(countNodes(optimizedTemplate)).toBeLessThan(countNodes(template));
    });
    
    test('minimization preserves interactive behavior', () => {
      // Create a template with event handlers
      const interactiveTemplate = createInteractiveTemplate();
      
      // Track event handler registrations during rendering
      const originalHandlers = new Set<string>();
      renderWithEventTracking(interactiveTemplate, originalHandlers);
      
      // Minimize the template
      const stateMachine = createStateMachineFromTemplate(interactiveTemplate);
      const minimizedStateMachine = minimizeStateMachine({
        states: stateMachine.states,
        transitions: stateMachine.transitions,
        initialStateId: stateMachine.initialStateId,
        acceptingStates: stateMachine.acceptingStates,
        alphabet: stateMachine.alphabet,
        optimizationLevel: OptimizationLevel.STANDARD
      });
      
      const optimizedTemplate = applyMinimizedStateMachineToAST(interactiveTemplate, minimizedStateMachine);
      
      // Track event handlers in the optimized template
      const optimizedHandlers = new Set<string>();
      renderWithEventTracking(optimizedTemplate, optimizedHandlers);
      
      // All original event handlers should still be present
      for (const handler of originalHandlers) {
        expect(optimizedHandlers.has(handler)).toBe(true);
      }
      
      // Event handler counts should match
      expect(optimizedHandlers.size).toBe(originalHandlers.size);
    });
  });
});

// Helper functions - these would be imported from actual implementation

// Mock function to generate a signature for an AST node
function generateNodeSignature(node: any): string {
  if (!node) return '';
  
  // Create a signature based on node type, tag name, and attributes
  let signature = `${node.type}:`;
  
  if (node.tagName) {
    signature += node.tagName;
  }
  
  if (node.attributes) {
    signature += `:${JSON.stringify(node.attributes)}`;
  }
  
  if (node.content) {
    signature += `:${node.content}`;
  }
  
  // Include child structure in signature (without their content)
  if (node.children && node.children.length > 0) {
    signature += ':[';
    for (const child of node.children) {
      // Just include the type and tag for children to avoid deep recursion
      signature += `${child.type}${child.tagName ? ':' + child.tagName : ''},`;
    }
    signature += ']';
  }
  
  return signature;
}

// Setup parent references in an AST tree
function setupParentReferences(node: any, parent: any = null): void {
  if (!node) return;
  
  node.parent = parent;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      setupParentReferences(child, node);
    }
  }
}

// Validate parent references in an AST tree
function validateParentReferences(node: any): boolean {
  if (!node) return true;
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.parent !== node) return false;
      
      // Recursively check children
      if (!validateParentReferences(child)) return false;
    }
  }
  
  return true;
}

// Count nodes in an AST
function countNodes(node: any): number {
  if (!node) return 0;
  if (!node.children || node.children.length === 0) return 1;
  
  return 1 + node.children.reduce((sum: number, child: any) => 
    sum + countNodes(child), 0);
}

// Mock tokenization function
function tokenizeHTML(html: string): HTMLToken[] {
  // This would use the actual tokenizer in the implementation
  return [];
}

// Mock parsing function
function parseTokensToAST(tokens: HTMLToken[]): any {
  // This would use the actual parser in the implementation
  return {};
}

// Mock state machine creation
function createStateMachineFromAST(ast: any): {
  states: Map<StateId, any>;
  transitions: Map<StateId, Map<InputSymbol, StateId>>;
  initialStateId: StateId;
  acceptingStates: Set<StateId>;
  alphabet: Set<string>;
} {
  const states = new Map<StateId, any>();
  const transitions = new Map<StateId, Map<InputSymbol, StateId>>();
  const acceptingStates = new Set<StateId>();
  const alphabet = new Set<string>(['child', 'sibling', 'parent', 'text', 'end']);
  let stateIdCounter = 1;
  let initialStateId = '1';
  
  // Recursive function to process AST nodes into states
  function processNode(node: any, parentStateId?: StateId): StateId {
    const currentStateId = String(stateIdCounter++);
    
    // Add node as a state
    states.set(currentStateId, node);
    
    // Add transition from parent if applicable
    if (parentStateId) {
      if (!transitions.has(parentStateId)) {
        transitions.set(parentStateId, new Map());
      }
      transitions.get(parentStateId)!.set('child', currentStateId);
    }
    
    // Initialize transitions map for this state
    transitions.set(currentStateId, new Map());
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      let previousSiblingId: StateId | undefined;
      
      for (let i = 0; i < node.children.length; i++) {
        const childStateId = processNode(node.children[i], currentStateId);
        
        // Add sibling transition if applicable
        if (previousSiblingId) {
          transitions.get(previousSiblingId)!.set('sibling', childStateId);
        }
        
        previousSiblingId = childStateId;
      }
      
      // Add transition back to parent
      if (parentStateId) {
        transitions.get(previousSiblingId!)!.set('parent', parentStateId);
      }
    } else if (node.type === 'Text') {
      // Text nodes are leaf nodes - they don't have children
      // Mark text nodes as accepting states for simplicity
      acceptingStates.add(currentStateId);
    }
    
    return currentStateId;
  }
  
  // Start processing from the root node
  if (ast.type === 'Document' && ast.children && ast.children.length > 0) {
    initialStateId = processNode(ast);
  }
  
  return {
    states,
    transitions,
    initialStateId,
    acceptingStates,
    alphabet
  };
}

// Apply minimized state machine to optimize AST
function applyMinimizedStateMachineToAST(ast: any, minimizedStateMachine: any): any {
  // Clone the AST to avoid modifying the original
  const clonedAst = JSON.parse(JSON.stringify(ast));
  
  // Map to track processed nodes and their optimized counterparts
  const nodeMap = new Map();
  
  // Map of state IDs to equivalent representative state IDs
  const stateEquivalenceMap = new Map();
  
  // Build equivalence map from the minimized state machine
  for (const [originalStateId, minimizedStateId] of minimizedStateMachine.stateMapping.entries()) {
    if (originalStateId !== minimizedStateId) {
      stateEquivalenceMap.set(originalStateId, minimizedStateId);
    }
  }
  
  // Recursive function to process and optimize nodes
  function optimizeNode(node: any, stateId: StateId): any {
    // Check if we already processed this node with this state ID
    const mapKey = `${stateId}:${generateNodeSignature(node)}`;
    if (nodeMap.has(mapKey)) {
      return nodeMap.get(mapKey);
    }
    
    // Check if this state has an equivalent representative state
    if (stateEquivalenceMap.has(stateId)) {
      const equivalentStateId = stateEquivalenceMap.get(stateId);
      const equivalentNode = minimizedStateMachine.states.get(equivalentStateId);
      
      // If we found an equivalent node, use it instead
      if (equivalentNode && equivalentNode !== node) {
        // Clone the equivalent node to maintain tree structure
        const clonedNode = JSON.parse(JSON.stringify(equivalentNode));
        nodeMap.set(mapKey, clonedNode);
        return clonedNode;
      }
    }
    
    // Clone this node
    const optimizedNode = { ...node };
    
    // Recursively optimize children
    if (node.children && node.children.length > 0) {
      optimizedNode.children = [];
      
      for (let i = 0; i < node.children.length; i++) {
        const childStateId = getChildStateId(stateId, i);
        
        if (childStateId) {
          const optimizedChild = optimizeNode(node.children[i], childStateId);
          optimizedNode.children.push(optimizedChild);
        } else {
          // If we can't find a state ID for this child (shouldn't happen in normal cases)
          // just clone it without optimization
          optimizedNode.children.push(JSON.parse(JSON.stringify(node.children[i])));
        }
      }
    }
    
    // Store optimized node in map
    nodeMap.set(mapKey, optimizedNode);
    return optimizedNode;
  }
  
  // Helper to find the state ID for a child node
  function getChildStateId(parentStateId: StateId, childIndex: number): StateId | undefined {
    const parentTransitions = minimizedStateMachine.transitions.get(parentStateId);
    if (!parentTransitions) return undefined;
    
    // Get first child state
    const firstChildStateId = parentTransitions.get('child');
    if (!firstChildStateId || childIndex === 0) return firstChildStateId;
    
    // Navigate through siblings to find the right child
    let currentStateId = firstChildStateId;
    for (let i = 0; i < childIndex; i++) {
      const siblingTransitions = minimizedStateMachine.transitions.get(currentStateId);
      if (!siblingTransitions) return undefined;
      
      const nextSibling = siblingTransitions.get('sibling');
      if (!nextSibling) return undefined;
      
      currentStateId = nextSibling;
    }
    
    return currentStateId;
  }
  
  // Start optimization from the root node with initial state ID
  return optimizeNode(clonedAst, minimizedStateMachine.initialStateId);
}

// Create template with dynamic list items
function createDynamicListItems(count: number): any[] {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push({
      type: 'Element',
      tagName: 'li',
      attributes: { class: 'item' },
      children: [
        {
          type: 'Element',
          tagName: 'span',
          attributes: { class: 'item-content' },
          children: [
            { type: 'Text', content: `Item ${i+1}` }
          ]
        }
      ]
    });
  }
  
  return items;
}

// Render template with dynamic content
function renderWithDynamicContent(template: any, items: string[]): string {
  // Deep clone the template
  const instance = JSON.parse(JSON.stringify(template));
  
  // Find the list container
  const list = instance.children[0];
  
  // Remove placeholder children
  list.children = [];
  
  // Add an item for each content string
  for (const item of items) {
    list.children.push({
      type: 'Element',
      tagName: 'li',
      attributes: { class: 'item' },
      children: [
        { type: 'Text', content: item }
      ]
    });
  }
  
  // Render the instance to HTML
  return renderAST(instance);
}

// Create an interactive template with event handlers
function createInteractiveTemplate(): any {
  return {
    type: 'Document',
    children: [
      {
        type: 'Element',
        tagName: 'div',
        attributes: { class: 'interactive' },
        children: [
          {
            type: 'Element',
            tagName: 'button',
            attributes: { 
              class: 'btn',
              id: 'btn1',
              'data-action': 'click'
            },
            eventHandlers: {
              click: 'handleClick1'
            },
            children: [
              { type: 'Text', content: 'Button 1' }
            ]
          },
          {
            type: 'Element',
            tagName: 'button',
            attributes: { 
              class: 'btn',
              id: 'btn2',
              'data-action': 'click'
            },
            eventHandlers: {
              click: 'handleClick2'
            },
            children: [
              { type: 'Text', content: 'Button 2' }
            ]
          },
          {
            type: 'Element',
            tagName: 'input',
            attributes: { 
              type: 'text',
              class: 'input',
              placeholder: 'Enter text'
            },
            eventHandlers: {
              input: 'handleInput',
              focus: 'handleFocus',
              blur: 'handleBlur'
            },
            children: []
          }
        ]
      }
    ]
  };
}

// Render with event tracking
function renderWithEventTracking(template: any, handlerSet: Set<string>): string {
  function traverseAndTrackHandlers(node: any): void {
    if (!node) return;
    
    // Track event handlers
    if (node.eventHandlers) {
      for (const [event, handler] of Object.entries(node.eventHandlers)) {
        handlerSet.add(`${event}:${handler}`);
      }
    }
    
    // Recursively process children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverseAndTrackHandlers(child);
      }
    }
  }
  
  // Process the entire template
  traverseAndTrackHandlers(template);
  
  // Return a rendered representation
  return renderAST(template);
}

// Render AST to HTML string (simplified mock implementation)
function renderAST(ast: any): string {
  function renderNode(node: any): string {
    if (!node) return '';
    
    if (node.type === 'Text') {
      return node.content || '';
    }
    
    if (node.type === 'Element') {
      const attributeString = node.attributes ? 
        Object.entries(node.attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ') : '';
      
      // Handle void elements
      const isVoidElement = ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(node.tagName);
      if (isVoidElement) {
        return `<${node.tagName}${attributeString ? ' ' + attributeString : ''}>`;
      }
      
      // Regular elements with children
      let childrenContent = '';
      if (node.children && node.children.length > 0) {
        childrenContent = node.children.map((child: any) => renderNode(child)).join('');
      }
      
      return `<${node.tagName}${attributeString ? ' ' + attributeString : ''}>${childrenContent}</${node.tagName}>`;
    }
    
    if (node.type === 'Document') {
      return node.children ? node.children.map((child: any) => renderNode(child)).join('') : '';
    }
    
    return '';
  }
  
  return renderNode(ast);
}

// Create a state machine from a template
function createStateMachineFromTemplate(template: any): {
  states: Map<StateId, any>;
  transitions: Map<StateId, Map<InputSymbol, StateId>>;
  initialStateId: StateId;
  acceptingStates: Set<StateId>;
  alphabet: Set<string>;
} {
  // For templates, we use the same approach as for AST
  return createStateMachineFromAST(template);
}