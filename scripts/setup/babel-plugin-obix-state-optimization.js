/**
 * OBIX State Optimization Babel Plugin
 * 
 * This plugin analyzes components and adds automaton state minimization optimizations.
 * It identifies state transition patterns and applies pre-computed optimizations.
 */

module.exports = function(babel) {
    const { types: t } = babel;
    
    return {
      name: "babel-plugin-obix-state-optimization",
      visitor: {
        // Identify calls to createFromFunctional and add optimization options
        CallExpression(path) {
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'DOPAdapter' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'createFromFunctional' })) {
            
            // Get the configuration object (first argument)
            const configArg = path.node.arguments[0];
            if (!t.isObjectExpression(configArg)) {
              return;
            }
            
            // Find the transitions property in the config
            const transitionsProperty = configArg.properties.find(
              prop => t.isObjectProperty(prop) && 
                     t.isIdentifier(prop.key, { name: 'transitions' })
            );
            
            if (!transitionsProperty || !t.isObjectExpression(transitionsProperty.value)) {
              return;
            }
            
            // Extract transition information for optimization analysis
            const transitions = transitionsProperty.value.properties;
            
            // Add optimization hints if we find patterns that can be optimized
            if (transitions.length > 0 && containsOptimizablePatterns(transitions)) {
              // Add stateMachine optimization property
              configArg.properties.push(
                t.objectProperty(
                  t.identifier('optimizeStateMachine'),
                  t.booleanLiteral(true)
                )
              );
              
              // Add cache settings property if we detect patterns that benefit from caching
              if (containsCacheablePatterns(transitions)) {
                configArg.properties.push(
                  t.objectProperty(
                    t.identifier('cacheTransitions'),
                    t.booleanLiteral(true)
                  )
                );
              }
            }
          }
        },
        
        // Add optimizations to class components
        ClassDeclaration(path) {
          // Find if this class is wrapped with DOPAdapter.createFromClass
          let isWrappedComponent = false;
          const className = path.node.id.name;
          
          // Look through the parent program to find if this class is adapted
          if (path.parentPath.isProgram()) {
            path.parentPath.node.body.forEach(node => {
              if (t.isExpressionStatement(node) && 
                  t.isAssignmentExpression(node.expression) &&
                  t.isIdentifier(node.expression.left, { name: className }) &&
                  t.isCallExpression(node.expression.right) &&
                  t.isMemberExpression(node.expression.right.callee) &&
                  t.isIdentifier(node.expression.right.callee.object, { name: 'DOPAdapter' }) &&
                  t.isIdentifier(node.expression.right.callee.property, { name: 'createFromClass' })) {
                isWrappedComponent = true;
              }
            });
          }
          
          if (!isWrappedComponent) {
            return;
          }
          
          // Extract class methods to analyze for optimizations
          const methods = path.node.body.body.filter(
            member => t.isClassMethod(member) && !t.isIdentifier(member.key, { name: 'render' })
          );
          
          // Add optimization properties if we find optimizable patterns
          if (methods.length > 0 && containsOptimizableClassMethods(methods)) {
            // Add static optimization flag property
            path.node.body.body.push(
              t.classProperty(
                t.identifier('_enableStateMachineOptimization'),
                t.booleanLiteral(true),
                null,
                null,
                null,
                true // static
              )
            );
            
            // Add static cache hints if we detect cacheable patterns
            if (containsCacheableClassMethods(methods)) {
              path.node.body.body.push(
                t.classProperty(
                  t.identifier('_enableTransitionCaching'),
                  t.booleanLiteral(true),
                  null,
                  null,
                  null,
                  true // static
                )
              );
            }
          }
        }
      }
    };
  };
  
  // Helper to identify optimizable patterns in functional transitions
  function containsOptimizablePatterns(transitions) {
    // Look for patterns that benefit from state machine optimization:
    // - Multiple transitions that modify the same state properties
    // - Transitions that depend only on state, not external data
    // - Finite, well-defined state spaces
    
    // This is a simplified analysis - a real implementation would 
    // need more sophisticated static analysis
    return transitions.length >= 2;
  }
  
  // Helper to identify cacheable patterns in functional transitions
  function containsCacheablePatterns(transitions) {
    // Look for patterns that benefit from transition caching:
    // - Transitions that perform expensive computations
    // - Transitions that are likely called frequently with the same inputs
    
    // This is a simplified analysis - a real implementation would
    // need more sophisticated static analysis
    return transitions.some(prop => {
      // Look for complex computations in the transition body
      if (t.isObjectProperty(prop) && 
          (t.isArrowFunctionExpression(prop.value) || t.isFunctionExpression(prop.value))) {
        const func = prop.value;
        let complexity = 0;
        
        babel.traverse(func, {
          BinaryExpression() { complexity += 1; },
          CallExpression() { complexity += 2; },
          ForStatement() { complexity += 3; },
          WhileStatement() { complexity += 3; },
          ConditionalExpression() { complexity += 1; }
        }, path.scope);
        
        return complexity > 3; // Arbitrary threshold for demonstration
      }
      return false;
    });
  }
  
  // Helper to identify optimizable patterns in class methods
  function containsOptimizableClassMethods(methods) {
    // Similar to the functional version but for class methods
    return methods.length >= 2;
  }
  
  // Helper to identify cacheable patterns in class methods
  function containsCacheableClassMethods(methods) {
    // Similar to the functional version but for class methods
    return methods.some(method => {
      let complexity = 0;
      
      babel.traverse(method.body, {
        BinaryExpression() { complexity += 1; },
        CallExpression() { complexity += 2; },
        ForStatement() { complexity += 3; },
        WhileStatement() { complexity += 3; },
        ConditionalExpression() { complexity += 1; }
      }, path.scope);
      
      return complexity > 3;
    });
  }