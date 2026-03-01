/**
 * CSS AST Node implementation optimized for state minimization
 * Includes metadata for tracking equivalence classes and optimization
 */

/**
 * Metadata for CSS nodes used in state minimization
 */
export interface CSSNodeMetadata {
    /** Equivalence class for minimization */
    equivalenceClass: number | null;
    /** Computed signature for equivalence comparison */
    stateSignature: string | null;
    /** Whether this node has been minimized */
    isMinimized: boolean;
    /** Additional custom metadata */
    [key: string]: any;
  }
  
  /**
   * CSS Node Types
   */
  export enum CSSNodeType {
    Stylesheet = 'Stylesheet',
    Rule = 'Rule',
    AtRule = 'AtRule',
    Selector = 'Selector',
    Declaration = 'Declaration',
    Property = 'Property',
    Value = 'Value',
    Function = 'Function',
    Comment = 'Comment',
    MediaQuery = 'MediaQuery',
    Import = 'Import',
    Keyframes = 'Keyframes',
    KeyframeBlock = 'KeyframeBlock'
  }
  
  /**
   * Base interface for all CSS AST nodes
   */
  export interface ICSSNode {
    /** Type of the node */
    type: CSSNodeType;
    /** Node value (varies by type) */
    value: string | null;
    /** Child nodes */
    children: CSSNode[];
    /** Parent node reference */
    parent: CSSNode | null;
    /** Metadata for optimization */
    metadata: CSSNodeMetadata;
  }
  
  /**
   * CSS AST node implementation
   */
  export class CSSNode implements ICSSNode {
    /** Node type */
    public type: CSSNodeType;
    /** Node value */
    public value: string | null;
    /** Child nodes */
    public children: CSSNode[];
    /** Parent node reference */
    public parent: CSSNode | null;
    /** Metadata for optimization */
    public metadata: CSSNodeMetadata;
    /** Additional properties based on node type */
    [key: string]: any;
  
    /**
     * Create a new CSS node
     * 
     * @param type Node type
     * @param value Node value
     * @param additionalProps Additional properties for specialized nodes
     */
    constructor(
      type: CSSNodeType, 
      value: string | null = null,
      additionalProps: Record<string, any> = {}
    ) {
      this.type = type;
      this.value = value;
      this.children = [] as CSSNode[];
      this.parent = null;
      this.metadata = {
        equivalenceClass: null,
        stateSignature: null,
        isMinimized: false
      };
      
      // Add additional properties for specialized nodes
      Object.assign(this, additionalProps);
    }
  
    /**
     * Add a child node and set its parent reference
     * 
     * @param node Child node to add
     * @returns The added child node
     */
    addChild(node: CSSNode): CSSNode {
      node.parent = this;
      this.children.push(node);
      return node;
    }
  
    /**
     * Remove a child node
     * 
     * @param node Child node to remove
     * @returns Whether the node was removed
     */
    removeChild(node: CSSNode): boolean {
      const index = this.children.indexOf(node);
      if (index !== -1) {
        this.children.splice(index, 1);
        node.parent = null;
        return true;
      }
      return false;
    }
  
    /**
     * Replace a child node with another node
     * 
     * @param oldNode Node to replace
     * @param newNode Replacement node
     * @returns Whether the replacement was successful
     */
    replaceChild(oldNode: CSSNode, newNode: CSSNode): boolean {
      const index = this.children.indexOf(oldNode);
      if (index !== -1) {
        this.children[index] = newNode;
        oldNode.parent = null;
        newNode.parent = this;
        return true;
      }
      return false;
    }
  
    /**
     * Create a deep clone of this node
     * 
     * @param cloneChildren Whether to clone children
     * @returns Cloned node
     */
    clone(cloneChildren: boolean = true): CSSNode {
      const clonedNode = new CSSNode(this.type, this.value);
      
      // Copy metadata
      clonedNode.metadata = { ...this.metadata };
      
      // Copy additional properties
      for (const key in this) {
        if (
          this.hasOwnProperty(key) && 
          key !== 'type' && 
          key !== 'value' && 
          key !== 'children' && 
          key !== 'parent' && 
          key !== 'metadata'
        ) {
          clonedNode[key] = this[key];
        }
      }
      
      // Clone children if requested
      if (cloneChildren) {
        for (const child of this.children) {
          const clonedChild = child.clone(true);
          clonedNode.addChild(clonedChild);
        }
      }
      
      return clonedNode;
    }

    /**
     * isEquivalentTo
     * @param other Other node to compare with
     * @returns Whether the nodes are equivalent
     * @description Check if this node is equivalent to another node
     * Used in state minimization 
     */
    isEquivalentTo(other: CSSNode): boolean {
      // Different types are never equivalent
      if (this.type !== other.type) {
        return false;
      }
      
      // Check values
      if (this.value !== other.value) {
        return false;
      }
      
      // Check type-specific properties
      if (!this.areTypeSpecificPropertiesEqual(other)) {
        return false;
      }
      
      // Check children
      if (this.children.length !== other.children.length) {
        return false;
      }
      
      // For rules, declaration order doesn't matter
      if (
        this.type === CSSNodeType.Rule || 
        this.type === CSSNodeType.AtRule ||
        this.type === CSSNodeType.KeyframeBlock
      ) {
        return this.areChildrenEquivalentUnordered(other);
      }
      
      // For most other node types, order matters
      if (!other.children) {
        return false;
      }
      
      for (let i = 0; i < this.children.length; i++) {
        const otherChild = other.children[i];
        if (!otherChild || !(this.children[i]) !.isEquivalentTo(otherChild)) {
          return false;
        }
      }
      
      return true;
    }

  
    /**
     * Compute a signature for this node for equivalence comparison
     * Used in state minimization
     * 
     * @returns Node signature
     */
    computeSignature(): string {
      const components = [
        this.type,
        this.value || '',
        // Include additional significant properties based on node type
        ...this.getTypeSpecificSignatureComponents(),
        // Include child types and values
        this.children.map(child => 
          `${child.type}:${child.value || ''}`
        ).join(',')
      ];
      
      const signature = components.join('|');
      this.metadata.stateSignature = signature;
      return signature;
    }
  
    /**
     * Get type-specific signature components based on node type
     * 
     * @returns Array of components for the signature
     */
    public getTypeSpecificSignatureComponents(): string[] {
      switch (this.type) {
        case CSSNodeType.Rule:
          return [this['selector'] || ''];
        case CSSNodeType.AtRule:
          return [this['name'] || '', this['prelude'] || ''];
        case CSSNodeType.Declaration:
          return [this['important'] ? 'important' : ''];
        case CSSNodeType.MediaQuery:
          return [this['mediaType'] || '', this['mediaFeatures']?.join(',') || ''];
        case CSSNodeType.KeyframeBlock:
          return [this['keyText'] || ''];
        default:
          return [];
      }
    }
  
    /**
     * Set the equivalence class for this node
     * 
     * @param classId Equivalence class ID
     */
    setEquivalenceClass(classId: number): void {
      this.metadata.equivalenceClass = classId;
    }
  
    /**
     * Mark this node as minimized
     * 
     * @param isMinimized Whether the node is minimized
     */
    setMinimized(isMinimized: boolean = true): void {
      this.metadata.isMinimized = isMinimized;
    }
  
    /**
     * Find a child node by type
     * 
     * @param type Type of node to find
     * @returns First matching child node or undefined
     */
    findChild(type: CSSNodeType): CSSNode | undefined {
      return this.children.find(child => child.type === type);
    }
  
    /**
     * Find all child nodes by type
     * 
     * @param type Type of nodes to find
     * @returns Array of matching child nodes
     */
    findChildren(type: CSSNodeType): CSSNode[] {
      return this.children.filter(child => child.type === type);
    }
  
  
    /**
     * Check if type-specific properties are equal
     * 
     * @param other Other node to compare with
     * @returns Whether the properties are equal
     */
    public areTypeSpecificPropertiesEqual(other: CSSNode): boolean {
      switch (this.type) {
        case CSSNodeType.Rule:
          return this['selector'] === other['selector'];
        case CSSNodeType.AtRule:
          return this['name'] === other['name'] && this['prelude'] === other['prelude'];
        case CSSNodeType.Declaration:
          return this['important'] === other['important'];
        case CSSNodeType.MediaQuery:
          if (this['mediaType'] !== other['mediaType']) return false;
          if (!this['mediaFeatures'] || !other['mediaFeatures']) {
            return !this['mediaFeatures'] && !other['mediaFeatures'];
          }
          if (this['mediaFeatures'].length !== other['mediaFeatures'].length) return false;
          return this['mediaFeatures'].every((feature: any) => 
            other['mediaFeatures']!.includes(feature));
        case CSSNodeType.KeyframeBlock:
          return this['keyText'] === other['keyText'];
        default:
          return true;
      }
    }
  
    /**
     * Check if children are equivalent regardless of order
     * Used for nodes where child order doesn't matter
     * 
     * @param other Other node to compare with
     * @returns Whether children are equivalent
     */
    public areChildrenEquivalentUnordered(other: CSSNode): boolean {
      // Create a copy of other's children to mark them as matched
      const otherChildren = [...other.children];
      
      for (const child of this.children) {
        // Try to find an equivalent child in other's children
        const matchIndex = otherChildren.findIndex(otherChild => 
          child.isEquivalentTo(otherChild));
        
        if (matchIndex === -1) {
          // No equivalent child found
          return false;
        }
        
        // Remove the matched child to prevent double-matching
        otherChildren.splice(matchIndex, 1);
      }
      
      // All children matched
      return otherChildren.length === 0;
    }
  
    /**
     * Convert the node to a CSS string
     * 
     * @returns CSS string representation
     */
    toCSS(): string {
      switch (this.type) {
        case CSSNodeType.Stylesheet:
          return this.children.map(child => child.toCSS()).join('\n\n');
          
        case CSSNodeType.Rule:
          const declarations = this.children
            .filter(child => child.type === CSSNodeType.Declaration)
            .map(child => child.toCSS())
            .join('\n  ');
          return `${this['selector']} {\n  ${declarations}\n}`;
          
        case CSSNodeType.AtRule:
          if (this.children.length === 0) {
            return `@${this['name']} ${this['prelude'] || ''};`;
          } else {
            const content = this.children.map(child => child.toCSS()).join('\n  ');
            return `@${this['name']} ${this['prelude'] || ''} {\n  ${content}\n}`;
          }
          
        case CSSNodeType.Declaration:
          const property = this.findChild(CSSNodeType.Property);
          const values = this.findChildren(CSSNodeType.Value)
            .map(value => value.toCSS())
            .join(' ');
          const important = this['important'] ? ' !important' : '';
          return `${property?.value}: ${values}${important};`;
          
        case CSSNodeType.Property:
          return this.value || '';
          
        case CSSNodeType.Value:
          return this.value || '';
          
        case CSSNodeType.Function:
          const args = this.children.map(child => child.toCSS()).join(', ');
          return `${this.value}(${args})`;
          
        case CSSNodeType.Comment:
          return `/* ${this.value} */`;
          
        case CSSNodeType.MediaQuery:
          const rules = this.children.map(child => `  ${child.toCSS().replace(/\n/g, '\n  ')}`).join('\n\n');
          return `@media ${this['mediaType'] || 'all'}${this['mediaFeatures']?.length ? 
            ` and (${this['mediaFeatures'].join(') and (')})` : ''} {\n${rules}\n}`;
          
        case CSSNodeType.KeyframeBlock:
          const keyframeDeclarations = this.children
            .map(child => `  ${child.toCSS()}`)
            .join('\n');
          return `${this['keyText']} {\n${keyframeDeclarations}\n}`;
          
        default:
          return this.value || '';
      }
    }
  }