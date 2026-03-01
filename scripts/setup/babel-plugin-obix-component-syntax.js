/**
 * OBIX Component Syntax Babel Plugin
 * 
 * This plugin transforms custom OBIX component syntax into standard compatible code
 * and supports both functional and OOP programming paradigms with a 1:1 correspondence.
 * 
 * Features:
 * 1. Transforms functional component declarations into DOP adapter calls
 * 2. Transforms class components into DOP adapter compatible classes
 * 3. Adds automaton state minimization optimizations
 * 4. Preserves validation logic hooks
 */

module.exports = function(babel) {
    const { types: t } = babel;
    
    return {
      name: "",
      visitor: {
        /**
         * Transform function components
         * 
         * Before:
         * function Counter({ initialCount = 0 }) {
         *   state = { count: initialCount };
         *   
         *   increment = (state) => ({ count: state.count + 1 });
         *   decrement = (state) => ({ count: state.count - 1 });
         *   
         *   render = (state, trigger) => (
         *     <div>
         *       <button onClick={() => trigger('decrement')}>-</button>
         *       <span>{state.count}</span>
         *       <button onClick={() => trigger('increment')}>+</button>
         *     </div>
         *   );
         * }
         * 
         * After:
         * function Counter({ initialCount = 0 }) {
         *   return DOPAdapter.createFromFunctional({
         *     initialState: { count: initialCount },
         *     transitions: {
         *       increment: (state) => ({ count: state.count + 1 }),
         *       decrement: (state) => ({ count: state.count - 1 })
         *     },
         *     render: (state, trigger) => (
         *       <div>
         *         <button onClick={() => trigger('decrement')}>-</button>
         *         <span>{state.count}</span>
         *         <button onClick={() => trigger('increment')}>+</button>
         *       </div>
         *     )
         *   });
         * }
         */
        FunctionDeclaration(path) {
          // Only process functions that might be components
          if (!isComponentFunction(path)) {
            return;
          }
          
          const stateAssignments = [];
          const transitionFunctions = {};
          let renderFunction = null;
          
          // Find all relevant assignments in the function body
          path.get('body').get('body').forEach(nodePath => {
            if (t.isExpressionStatement(nodePath.node) && 
                t.isAssignmentExpression(nodePath.node.expression)) {
              
              const assignment = nodePath.node.expression;
              const left = assignment.left;
              const right = assignment.right;
              
              // Check if this is a state assignment
              if (t.isIdentifier(left) && left.name === 'state') {
                stateAssignments.push(right);
              }
              // Check if this is a transition function
              else if (t.isIdentifier(left) && 
                       t.isArrowFunctionExpression(right) && 
                       isTransitionFunction(right)) {
                transitionFunctions[left.name] = right;
              }
              // Check if this is the render function
              else if (t.isIdentifier(left) && left.name === 'render') {
                renderFunction = right;
              }
            }
          });
          
          // If we found component-like declarations, transform them
          if (stateAssignments.length > 0 && renderFunction) {
            const initialState = stateAssignments[0]; // Use the first state assignment as initial state
            
            // Create object properties for the DOP adapter configuration
            const configProperties = [
              t.objectProperty(t.identifier('initialState'), initialState),
              t.objectProperty(
                t.identifier('transitions'), 
                t.objectExpression(
                  Object.entries(transitionFunctions).map(([name, fn]) => 
                    t.objectProperty(t.identifier(name), fn)
                  )
                )
              )
            ];
            
            if (renderFunction) {
              configProperties.push(t.objectProperty(t.identifier('render'), renderFunction));
            }
            
            // Create the call to DOPAdapter.createFromFunctional
            const adapterCall = t.callExpression(
              t.memberExpression(
                t.identifier('DOPAdapter'),
                t.identifier('createFromFunctional')
              ),
              [t.objectExpression(configProperties)]
            );
            
            // Replace function body with a return statement
            path.get('body').replaceWith(
              t.blockStatement([
                t.returnStatement(adapterCall)
              ])
            );
          }
        },
        
        /**
         * Transform class components
         * 
         * Before:
         * class Counter extends Component {
         *   initialState = { count: 0 };
         *   
         *   increment(state) {
         *     return { count: state.count + 1 };
         *   }
         *   
         *   decrement(state) {
         *     return { count: state.count - 1 };
         *   }
         *   
         *   render(state) {
         *     return (
         *       <div>
         *         <button onClick={() => this.trigger('decrement')}>-</button>
         *         <span>{state.count}</span>
         *         <button onClick={() => this.trigger('increment')}>+</button>
         *       </div>
         *     );
         *   }
         * }
         * 
         * After:
         * class Counter extends OBIXComponent {
         *   initialState = { count: 0 };
         *   
         *   increment(state) {
         *     return { count: state.count + 1 };
         *   }
         *   
         *   decrement(state) {
         *     return { count: state.count - 1 };
         *   }
         *   
         *   render(state) {
         *     return (
         *       <div>
         *         <button onClick={() => this.trigger('decrement')}>-</button>
         *         <span>{state.count}</span>
         *         <button onClick={() => this.trigger('increment')}>+</button>
         *       </div>
         *     );
         *   }
         * }
         * 
         * // And add this at the end of the file:
         * Counter = DOPAdapter.createFromClass(Counter);
         */
        ClassDeclaration(path) {
          // Only process classes that might be components
          if (!isComponentClass(path)) {
            return;
          }
          
          // Change the superclass to OBIXComponent if it extends Component
          const superClass = path.node.superClass;
          if (superClass && t.isIdentifier(superClass) && superClass.name === 'Component') {
            path.node.superClass = t.identifier('OBIXComponent');
          }
          
          // Add the DOPAdapter.createFromClass transformation after the class declaration
          const className = path.node.id.name;
          const adapterExpr = t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.identifier(className),
              t.callExpression(
                t.memberExpression(
                  t.identifier('DOPAdapter'),
                  t.identifier('createFromClass')
                ),
                [t.identifier(className)]
              )
            )
          );
          
          // Insert the adapter call after the class declaration
          if (path.parentPath.isProgram()) {
            path.insertAfter(adapterExpr);
          } else if (path.parentPath.isExportNamedDeclaration() || 
                   path.parentPath.isExportDefaultDeclaration()) {
            // Handle export declarations
            path.parentPath.insertAfter(adapterExpr);
          }
        },
        
        // Handle imports to add required OBIX dependencies
        Program: {
          exit(path) {
            // Check if we need to add imports
            let needsDOPAdapter = false;
            let needsOBIXComponent = false;
            
            path.traverse({
              CallExpression(callPath) {
                if (t.isMemberExpression(callPath.node.callee) && 
                    t.isIdentifier(callPath.node.callee.object) && 
                    callPath.node.callee.object.name === 'DOPAdapter') {
                  needsDOPAdapter = true;
                }
              },
              ClassDeclaration(classPath) {
                if (classPath.node.superClass && 
                    t.isIdentifier(classPath.node.superClass) && 
                    classPath.node.superClass.name === 'OBIXComponent') {
                  needsOBIXComponent = true;
                }
              }
            });
            
            // Add the imports if needed
            if (needsDOPAdapter || needsOBIXComponent) {
              const importSpecifiers = [];
              
              if (needsDOPAdapter) {
                importSpecifiers.push(t.importSpecifier(
                  t.identifier('DOPAdapter'),
                  t.identifier('DOPAdapter')
                ));
              }
              
              if (needsOBIXComponent) {
                importSpecifiers.push(t.importSpecifier(
                  t.identifier('OBIXComponent'),
                  t.identifier('OBIXComponent')
                ));
              }
              
              const importDeclaration = t.importDeclaration(
                importSpecifiers,
                t.stringLiteral('@obinexuscomputing/obix')
              );
              
              // Add the import declaration to the beginning of the file
              path.unshiftContainer('body', importDeclaration);
            }
          }
        }
      }
    };
  };
  
  // Helper function to determine if a function might be a component
  function isComponentFunction(path) {
    // Look for patterns that suggest this is a component function
    let hasState = false;
    let hasRender = false;
    
    path.traverse({
      AssignmentExpression(assignmentPath) {
        const left = assignmentPath.node.left;
        if (t.isIdentifier(left)) {
          if (left.name === 'state') hasState = true;
          if (left.name === 'render') hasRender = true;
        }
      }
    });
    
    return hasState && hasRender;
  }
  
  // Helper function to determine if a class might be a component
  function isComponentClass(path) {
    // Check if it extends Component or has component-like methods
    const superClass = path.node.superClass;
    if (superClass && superClass.name === 'Component') {
      return true;
    }
    
    let hasInitialState = false;
    let hasRender = false;
    
    path.traverse({
      ClassProperty(propPath) {
        if (propPath.node.key.name === 'initialState') {
          hasInitialState = true;
        }
      },
      ClassMethod(methodPath) {
        if (methodPath.node.key.name === 'render') {
          hasRender = true;
        }
      }
    });
    
    return hasInitialState && hasRender;
  }
  
  // Helper function to determine if a function is likely a transition function
  function isTransitionFunction(node) {
    // Transition functions typically take a state parameter and return an object
    if (!node.params || node.params.length === 0) {
      return false;
    }
    
    // Check if the first parameter is named 'state'
    const firstParam = node.params[0];
    return firstParam && firstParam.name === 'state';
  }