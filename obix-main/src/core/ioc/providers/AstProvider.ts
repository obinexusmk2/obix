/**
 * src/core/ioc/providers/AstProvider.ts
 * 
 * Service provider for AST (Abstract Syntax Tree) module components.
 * Registers AST-related services with the IoC container.
 */

import { ServiceProvider } from './ServiceRegistry';
import { ServiceContainer } from '../ServiceContainer';

/**
 * Provider for AST services
 */
export class AstProvider implements ServiceProvider {
  /**
   * Register AST services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register HTML AST components
    this.registerHtmlAstServices(container);
    
    // Register CSS AST components
    this.registerCssAstServices(container);
    
    // Register factory functions
    this.registerFactoryFunctions(container);
  }
  
  /**
   * Boot AST services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // No additional boot logic required
  }
  
  /**
   * Register HTML AST services
   * 
   * @param container Service container
   */
  private registerHtmlAstServices(container: ServiceContainer): void {
    try {
      // Import HTML AST components dynamically to avoid circular dependencies
      const {
        HTMLAst,
        HTMLAstOptimizer,
        MemoryOptimizer,
        NodeMapBuilder,
        NodeReductionOptimizer
      } = require('../../ast/html/optimizers');
      
      // Register HTML AST classes
      container.transient('ast.html.ast', (container) => {
        return new HTMLAst();
      });
      
      container.transient('ast.html.optimizer', (container) => {
        return new HTMLAstOptimizer();
      });
      
      container.transient('ast.html.memoryOptimizer', (container) => {
        return new MemoryOptimizer();
      });
      
      container.transient('ast.html.nodeMapBuilder', (container) => {
        return new NodeMapBuilder();
      });
      
      container.transient('ast.html.nodeReductionOptimizer', (container) => {
        return new NodeReductionOptimizer();
      });
      
      // Register HTML AST validator components
      const {
        HtmlAstValidator,
        AttributeValidationRule,
        HTMLStructureRule
      } = require('../../ast/html/validators');
      
      container.transient('ast.html.validator', (container, options?: any) => {
        return new HtmlAstValidator(options);
      });
      
      container.transient('ast.html.attributeValidationRule', (container) => {
        return new AttributeValidationRule();
      });
      
      container.transient('ast.html.structureRule', (container) => {
        return new HTMLStructureRule();
      });
    } catch (error) {
      console.error('Error registering HTML AST services:', error);
    }
  }
  
  /**
   * Register CSS AST services
   * 
   * @param container Service container
   */
  private registerCssAstServices(container: ServiceContainer): void {
    try {
      // Import CSS AST components dynamically to avoid circular dependencies
      const {
        CSSNode,
        CSSAst,
        CSSAstOptimizer
      } = require('../../ast/css');
      
      // Register CSS AST classes
      container.transient('ast.css.ast', (container) => {
        return new CSSAst();
      });
      
      container.transient('ast.css.optimizer', (container) => {
        return new CSSAstOptimizer();
      });
      
      // Factory for creating CSS nodes
      container.transient('ast.css.createNode', (container, type: string, value?: string) => {
        return new CSSNode(type, value);
      });
    } catch (error) {
      console.error('Error registering CSS AST services:', error);
    }
  }
  
  /**
   * Register factory functions for convenient usage
   * 
   * @param container Service container
   */
  private registerFactoryFunctions(container: ServiceContainer): void {
    // Register factory function for optimizing HTML AST
    container.singleton('ast.optimizeHtmlAst', (container) => {
      return (ast: any, options?: any) => {
        try {
          const optimizer = container.resolve('ast.html.optimizer');
          return optimizer.optimize(ast, options);
        } catch (error) {
          console.error('Error optimizing HTML AST:', error);
          throw error;
        }
      };
    });
    
    // Register factory function for optimizing CSS AST
    container.singleton('ast.optimizeCssAst', (container) => {
      return (ast: any, options?: any) => {
        try {
          const optimizer = container.resolve('ast.css.optimizer');
          return optimizer.optimize(ast, options);
        } catch (error) {
          console.error('Error optimizing CSS AST:', error);
          throw error;
        }
      };
    });
    
    // Register factory function for validating HTML AST
    container.singleton('ast.validateHtmlAst', (container) => {
      return (ast: any, options?: any) => {
        try {
          const validator = container.resolve('ast.html.validator', options);
          return validator.validateAst(ast);
        } catch (error) {
          console.error('Error validating HTML AST:', error);
          throw error;
        }
      };
    });
  }
}