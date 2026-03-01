/**
 * NodeReductionOptimizer.ts
 * 
 * Implements optimization techniques for reducing the number of nodes in an HTML AST.
 * This class focuses on structural optimizations such as merging adjacent text nodes,
 * removing empty nodes, and simplifying the document structure.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { HTMLNode, HTMLNodeType, HTMLTextNode, HTMLElementNode } from "../node";


/**
 * Optimizes node structure to reduce AST size
 */
export class NodeReductionOptimizer {
  /**
   * Optimize node structure to reduce overall node count
   * 
   * @param node Node or node array to optimize
   * @returns Optimized node or node array
   */
  public optimizeNodeStructure(nodeOrArray: HTMLNode | HTMLNode[]): HTMLNode | HTMLNode[] {
    if (Array.isArray(nodeOrArray)) {
      // Process array of nodes
      const nodes = nodeOrArray as HTMLNode[];
      const optimizedNodes = this.removeEmptyTextNodes(nodes);
      return this.mergeAdjacentTextNodes(optimizedNodes);
    } else {
      // Process single node
      const node = nodeOrArray as HTMLNode;
      
      // First simplify the node based on its tag
      const simplifiedNode = this.simplifyStructureBasedOnTagName(node);
      
      // Then process its children recursively
      if (simplifiedNode.children.length > 0) {
        const optimizedChildren = this.optimizeNodeStructure(simplifiedNode.children) as HTMLNode[];
        
        // Update children array
        simplifiedNode.children = [];
        for (const child of optimizedChildren) {
          simplifiedNode.appendChild(child);
        }
      }
      
      return simplifiedNode;
    }
  }
  
  /**
   * Remove empty text nodes from an array of nodes
   * 
   * @param nodes Array of nodes to process
   * @returns Filtered array without empty text nodes
   */
  private removeEmptyTextNodes(nodes: HTMLNode[]): HTMLNode[] {
    return nodes.filter(node => {
      if (node.type === HTMLNodeType.TEXT) {
        // Check if text node has content
        const textNode = node as HTMLTextNode;
        return textNode.content.trim().length > 0;
      }
      return true;
    });
  }
  
  /**
   * Merge adjacent text nodes in an array of nodes
   * 
   * @param nodes Array of nodes to process
   * @returns Optimized array with merged text nodes
   */
  private mergeAdjacentTextNodes(nodes: HTMLNode[]): HTMLNode[] {
    if (nodes.length <= 1) {
      return nodes;
    }
    
    const result: HTMLNode[] = [];
    let currentTextNode: HTMLTextNode | null = null;
    
    for (const node of nodes) {
      if (node.type === HTMLNodeType.TEXT) {
        const textNode = node as HTMLTextNode;
        
        if (currentTextNode) {
          // Create new text node with merged content
          const mergedNode: HTMLTextNode = new HTMLTextNode(currentTextNode.content + textNode.content, currentTextNode.position);
          result[result.length - 1] = mergedNode;
          currentTextNode = mergedNode;
        } else {
          // Start a new text run
          currentTextNode = textNode;
          result.push(currentTextNode);
        }
      } else {
        // Non-text node, reset current text node
        currentTextNode = null;
        result.push(node);
      }
    }
    
    return result;
  }
  
  /**
   * Simplify a node's structure based on its tag name
   * 
   * @param node Node to simplify
   * @returns Simplified node
   */
  private simplifyStructureBasedOnTagName(node: HTMLNode): HTMLNode {
    if (node.type !== HTMLNodeType.ELEMENT) {
      return node;
    }
    
    const elementNode = node as HTMLElementNode;
    const tagName = elementNode.tagName.toLowerCase();
    
    // Apply tag-specific optimizations
    switch (tagName) {
      case 'p':
      case 'span':
      case 'div':
        // Simplify structure of container elements with a single text child
        if (elementNode.children.length === 1 && 
            elementNode.children[0]?.type === HTMLNodeType.TEXT &&
            (elementNode.children[0] as HTMLTextNode).content.trim() === '') {
          // Remove empty text nodes
          elementNode.children = [];
        }
        break;
        
      case 'style':
      case 'script':
        // Combine all child text nodes into a single node
        if (elementNode.children.length > 0) {
          let combinedContent = '';
          
          for (const child of elementNode.children) {
            if (child.type === HTMLNodeType.TEXT) {
              combinedContent += (child as HTMLTextNode).content;
            }
          }
          
          if (combinedContent) {
            // Create a single text node with combined content
            const combinedTextNode = new HTMLTextNode(
              combinedContent.trim(),
              elementNode.children[0]?.position ?? elementNode.position
            );
            
            elementNode.children = [combinedTextNode];
            combinedTextNode.parent = elementNode;
          }
        }
        break;
        
      case 'ul':
      case 'ol':
        // Ensure list elements only have li children
        elementNode.children = elementNode.children.filter((child: HTMLNode) => {
          if (child.type === HTMLNodeType.ELEMENT) {
            return (child as HTMLElementNode).tagName.toLowerCase() === 'li';
          }
          // Only keep text nodes if they're not just whitespace
          if (child.type === HTMLNodeType.TEXT) {
            return (child as HTMLTextNode).content.trim().length > 0;
          }
          return false;
        });
        break;
        
      case 'table':
        // Optimize table structure
        this.optimizeTableStructure(elementNode);
        break;
    }
    
    return node;
  }
  
  /**
   * Optimize the structure of a table element
   * 
   * @param tableNode Table element node to optimize
   */
  private optimizeTableStructure(tableNode: HTMLElementNode): void {
    // Group rows into proper sections (thead, tbody, tfoot)
    const rows: HTMLElementNode[] = [];
    const sections: Record<string, HTMLElementNode[]> = {
      thead: [],
      tbody: [],
      tfoot: []
    };
    
    // First, collect all rows and organize by section
    for (let i = 0; i < tableNode.children.length; i++) {
      const child = tableNode.children[i];
      
      if (child && child.type === HTMLNodeType.ELEMENT) {
        const elementChild = child as HTMLElementNode;
        const tagName = elementChild.tagName.toLowerCase();
        
        if (tagName === 'tr') {
          rows.push(elementChild);
        } else if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot') {
          // Collect rows from this section
          for (const sectionChild of elementChild.children) {
            if (sectionChild.type === HTMLNodeType.ELEMENT && 
                (sectionChild as HTMLElementNode).tagName.toLowerCase() === 'tr') {
              sections[tagName]?.push(sectionChild as HTMLElementNode);
            }
          }
        }
      }
    }
    
    // If there are loose rows outside of any section, add them to tbody
    if (rows.length > 0 && sections['tbody']) {
      sections['tbody'].push(...rows);
    }
    
    // Only restructure if we have any rows to organize
    if ((sections['thead']?.length ?? 0) > 0 || (sections['tbody']?.length ?? 0) > 0 || (sections['tfoot']?.length ?? 0) > 0) {
      // Clear existing children
      tableNode.children = [];
      
      // Add back organized sections
      for (const sectionName of ['thead', 'tbody', 'tfoot'] as const) {
        if (sections[sectionName] && sections[sectionName].length > 0) {
          const sectionNode = new HTMLElementNode(
            sectionName,
            new Map(),
            tableNode.position,
            false,
            tableNode.sourceToken
          );
          
          const sectionRows = sections[sectionName] || [];
          for (const row of sectionRows) {
            sectionNode.appendChild(row);
          }
          
          tableNode.appendChild(sectionNode);
        }
      }
    }
  }
  
  /**
   * Remove redundant nodes based on HTML semantics
   * 
   * @param nodes Array of nodes to process
   * @returns Optimized array with redundant nodes removed
   */
  public removeRedundantNodes(nodes: HTMLNode[]): HTMLNode[] {
    // Remove nodes that don't contribute to rendering or semantics
    return nodes.filter(node => {
      // Always keep element nodes
      if (node.type === HTMLNodeType.ELEMENT) {
        const elementNode = node as HTMLElementNode;
        
        // Filter out empty non-semantic elements
        if (this.isNonSemanticElement(elementNode) && 
            elementNode.children.length === 0) {
          return false;
        }
        
        // Keep all other elements
        return true;
      }
      
      // Keep non-empty text nodes
      if (node.type === HTMLNodeType.TEXT) {
        return (node as HTMLTextNode).content.trim().length > 0;
      }
      
      // Remove comments in optimized output
      if (node.type === HTMLNodeType.COMMENT) {
        return false;
      }
      
      // Keep other node types
      return true;
    });
  }
  
  /**
   * Check if an element is non-semantic (purely presentational)
   * 
   * @param element Element to check
   * @returns True if the element is non-semantic
   */
  private isNonSemanticElement(element: HTMLElementNode): boolean {
    const nonSemanticTags = ['div', 'span', 'br', 'hr'];
    return nonSemanticTags.includes(element.tagName.toLowerCase());
  }
  
  /**
   * Optimize node trees with identical subtrees through reference sharing
   * 
   * @param root Root node to start from
   * @returns Optimized node tree with shared references
   */
  public optimizeIdenticalSubtrees(root: HTMLNode): HTMLNode {
    // Map to track node signatures to node instances
    const subtreeMap = new Map<string, HTMLNode>();
    
    // Process the tree
    const processNode = (node: HTMLNode): HTMLNode => {
      // Process children first (bottom-up)
      if (node.children.length > 0) {
        const optimizedChildren: HTMLNode[] = [];
        
        for (const child of node.children) {
          optimizedChildren.push(processNode(child));
        }
        
        // Update children
        node.children = optimizedChildren;
      }
      
      // Generate a signature for this subtree
      const signature = this.generateSubtreeSignature(node);
      
      // Check if we've seen this signature before
      if (subtreeMap.has(signature)) {
        // Return the existing node
        return subtreeMap.get(signature)!;
      }
      
      // This is a new signature, store it
      subtreeMap.set(signature, node);
      return node;
    };
    
    return processNode(root);
  }
  
  /**
   * Generate a signature that uniquely identifies a subtree structure
   * 
   * @param node Root node of the subtree
   * @returns Signature string
   */
  private generateSubtreeSignature(node: HTMLNode): string {
    // For simple nodes, use type and content
    if (node.children.length === 0) {
      if (node.type === HTMLNodeType.TEXT) {
        return `TEXT:${(node as HTMLTextNode).content}`;
      }
      if (node.type === HTMLNodeType.ELEMENT) {
        const elementNode = node as HTMLElementNode;
        return `ELEMENT:${elementNode.tagName}:${this.serializeAttributes(elementNode)}`;
      }
      return `${node.type}`;
    }
    
    // For nodes with children, include child signatures
    const childSignatures: string = node.children.map((child: HTMLNode): string => 
      this.generateSubtreeSignature(child)
    ).join(',');
    
    if (node.type === HTMLNodeType.ELEMENT) {
      const elementNode = node as HTMLElementNode;
      return `ELEMENT:${elementNode.tagName}:${this.serializeAttributes(elementNode)}:[${childSignatures}]`;
    }
    
    return `${node.type}:[${childSignatures}]`;
  }
  
  /**
   * Serialize element attributes to a string
   * 
   * @param element Element node
   * @returns Serialized attributes string
   */
  private serializeAttributes(element: HTMLElementNode): string {
    if (!element.attributes || element.attributes.size === 0) {
      return '';
    }
    
    const sortedEntries = Array.from(element.attributes.entries())
      .map(([key, attr]) => [key, attr.toString()] as [string, string])
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    return sortedEntries.map((entry) => `${entry[0]}="${entry[1]}"`).join(' ');
  }
}