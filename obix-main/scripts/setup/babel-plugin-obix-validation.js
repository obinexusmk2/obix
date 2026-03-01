/**
 * OBIX Validation Babel Plugin
 * 
 * This plugin adds automated error validation to OBIX components.
 * It analyzes component state and transitions to add validation rules
 * that integrate with the ValidationAdapter.
 */

module.exports = function(babel) {
    const { types: t } = babel;
    
    return {
      name: "babel-plugin-obix-validation",
      visitor: {
        // Add validation to functional components
        CallExpression(path) {
          if (t.isMemberExpression(path.node.callee) &&
              t.isIdentifier(path.node.callee.object, { name: 'DOPAdapter' }) &&
              t.isIdentifier(path.node.callee.property, { name: 'createFromFunctional' })) {
            
            // Get the configuration object (first argument)
            const configArg = path.node.arguments[0];
            if (!t.isObjectExpression(configArg)) {
              return;
            }
            
            // Find the initial state property to extract state shape
            const initialStateProperty = configArg.properties.find(
              prop => t.isObjectProperty(prop) && 
                     t.isIdentifier(prop.key, { name: 'initialState' })
            );
            
            if (!initialStateProperty) {
              return;
            }
            
            // Generate validation rules based on the state shape
            const validationRules = generateValidationRules(initialStateProperty.value);
            
            // Add validation property to the component config
            configArg.properties.push(
              t.objectProperty(
                t.identifier('validation'),
                validationRules
              )
            );
            
            // Add import for ValidationAdapter if needed
            addValidationImport(path);
          }
        },
        
        // Add validation to class components
        ClassDeclaration(path) {
          // Only process classes that extend OBIXComponent
          if (!path.node.superClass || 
              !t.isIdentifier(path.node.superClass, { name: 'OBIXComponent' })) {
            return;
          }
          
          // Find the initialState property
          const initialStateProperty = path.node.body.body.find(
            member => t.isClassProperty(member) && 
                     t.isIdentifier(member.key, { name: 'initialState' })
          );
          
          if (!initialStateProperty) {
            return;
          }
          
          // Generate validation method based on initial state
          const validateMethod = generateValidateMethod(initialStateProperty.value);
          
          // Add the validation method to the class
          path.node.body.body.push(validateMethod);
          
          // Add import for ValidationAdapter and error types if needed
          addValidationImport(path);
        },
        
        // Process imports
        Program: {
          exit(path) {
            // Check if we need to add validation imports
            let needsValidationImports = false;
            
            path.traverse({
              CallExpression(callPath) {
                if (t.isMemberExpression(callPath.node.callee) && 
                    t.isIdentifier(callPath.node.callee.object, { name: 'ValidationAdapter' })) {
                  needsValidationImports = true;
                }
              },
              Identifier(idPath) {
                if (idPath.node.name === 'ValidationRule' ||
                    idPath.node.name === 'ErrorSeverity' ||
                    idPath.node.name === 'ErrorCode') {
                  needsValidationImports = true;
                }
              }
            });
            
            // Add validation imports if needed
            if (needsValidationImports) {
              const importDeclaration = t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier('ValidationAdapter'),
                    t.identifier('ValidationAdapter')
                  ),
                  t.importSpecifier(
                    t.identifier('ValidationRule'),
                    t.identifier('ValidationRule')
                  ),
                  t.importSpecifier(
                    t.identifier('ErrorSeverity'),
                    t.identifier('ErrorSeverity')
                  ),
                  t.importSpecifier(
                    t.identifier('ErrorCode'),
                    t.identifier('ErrorCode')
                  )
                ],
                t.stringLiteral('@obinexuscomputing/obix/validation')
              );
              
              // Add the import declaration
              path.unshiftContainer('body', importDeclaration);
            }
          }
        }
      }
    };
    
    // Helper function to generate validation rules based on state shape
    function generateValidationRules(stateNode) {
      // Create an array expression to hold validation rules
      const rulesArray = [];
      
      // Extract properties from state object if it's an object expression
      if (t.isObjectExpression(stateNode)) {
        stateNode.properties.forEach(property => {
          if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
            // Create a validation rule for each state property
            const ruleName = property.key.name;
            const ruleObject = createValidationRule(ruleName, property.value);
            rulesArray.push(ruleObject);
          }
        });
      }
      
      // Create an array of validation rules
      return t.arrayExpression(rulesArray);
    }
    
    // Helper function to create a validation rule object
    function createValidationRule(propName, propValue) {
      // Determine the expected type based on the property value
      let expectedType = 'any';
      let validationExpression = null;
      
      if (t.isNumericLiteral(propValue)) {
        expectedType = 'number';
        validationExpression = t.binaryExpression(
          '===',
          t.unaryExpression('typeof', t.memberExpression(
            t.identifier('state'),
            t.identifier(propName)
          )),
          t.stringLiteral('number')
        );
      } else if (t.isStringLiteral(propValue)) {
        expectedType = 'string';
        validationExpression = t.binaryExpression(
          '===',
          t.unaryExpression('typeof', t.memberExpression(
            t.identifier('state'),
            t.identifier(propName)
          )),
          t.stringLiteral('string')
        );
      } else if (t.isBooleanLiteral(propValue)) {
        expectedType = 'boolean';
        validationExpression = t.binaryExpression(
          '===',
          t.unaryExpression('typeof', t.memberExpression(
            t.identifier('state'),
            t.identifier(propName)
          )),
          t.stringLiteral('boolean')
        );
      } else if (t.isArrayExpression(propValue)) {
        expectedType = 'array';
        validationExpression = t.callExpression(
          t.memberExpression(t.identifier('Array'), t.identifier('isArray')),
          [t.memberExpression(t.identifier('state'), t.identifier(propName))]
        );
      } else if (t.isObjectExpression(propValue)) {
        expectedType = 'object';
        validationExpression = t.logicalExpression(
          '&&',
          t.binaryExpression(
            '===',
            t.unaryExpression('typeof', t.memberExpression(
              t.identifier('state'),
              t.identifier(propName)
            )),
            t.stringLiteral('object')
          ),
          t.binaryExpression(
            '!==',
            t.memberExpression(t.identifier('state'), t.identifier(propName)),
            t.nullLiteral()
          )
        );
      }
      
      // Create validation function
      const validateFunction = t.arrowFunctionExpression(
        [t.identifier('state')],
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('isValid'),
              validationExpression || t.booleanLiteral(true)
            )
          ]),
          t.returnStatement(
            t.objectExpression([
              t.objectProperty(
                t.identifier('isValid'),
                t.identifier('isValid')
              ),
              t.objectProperty(
                t.identifier('errors'),
                t.conditionalExpression(
                  t.identifier('isValid'),
                  t.arrayExpression([]),
                  t.arrayExpression([
                    t.newExpression(
                      t.identifier('BaseParserError'),
                      [
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier('code'),
                            t.memberExpression(
                              t.identifier('ErrorCode'),
                              t.identifier('VALIDATION_ERROR')
                            )
                          ),
                          t.objectProperty(
                            t.identifier('message'),
                            t.stringLiteral(`Expected ${propName} to be ${expectedType}`)
                          ),
                          t.objectProperty(
                            t.identifier('position'),
                            t.objectExpression([
                              t.objectProperty(t.identifier('line'), t.numericLiteral(0)),
                              t.objectProperty(t.identifier('column'), t.numericLiteral(0)),
                              t.objectProperty(t.identifier('start'), t.numericLiteral(0)),
                              t.objectProperty(t.identifier('end'), t.numericLiteral(0))
                            ])
                          ),
                          t.objectProperty(
                            t.identifier('severity'),
                            t.memberExpression(
                              t.identifier('ErrorSeverity'),
                              t.identifier('ERROR')
                            )
                          )
                        ])
                      ]
                    )
                  ])
                )
              ),
              t.objectProperty(
                t.identifier('warnings'),
                t.arrayExpression([])
              ),
              t.objectProperty(
                t.identifier('metadata'),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('propertyName'),
                    t.stringLiteral(propName)
                  ),
                  t.objectProperty(
                    t.identifier('expectedType'),
                    t.stringLiteral(expectedType)
                  )
                ])
              )
            ])
          )
        ])
      );
      
      // Create the validation rule object
      return t.objectExpression([
        t.objectProperty(
          t.identifier('id'),
          t.stringLiteral(`${propName}_type_check`)
        ),
        t.objectProperty(
          t.identifier('description'),
          t.stringLiteral(`Validates that ${propName} is a ${expectedType}`)
        ),
        t.objectProperty(
          t.identifier('severity'),
          t.memberExpression(
            t.identifier('ErrorSeverity'),
            t.identifier('ERROR')
          )
        ),
        t.objectProperty(
          t.identifier('validate'),
          validateFunction
        )
      ]);
    }
    
    // Helper function to generate validate method for class components
    function generateValidateMethod(stateNode) {
      // Create the validate method using the same logic as createValidationRule
      // but adapted for class method syntax
      const validationChecks = [];
      
      // Extract properties from state object if it's an object expression
      if (t.isObjectExpression(stateNode)) {
        stateNode.properties.forEach(property => {
          if (t.isObjectProperty(property) && t.isIdentifier(property.key)) {
            const propName = property.key.name;
            let checkExpression = null;
            let expectedType = 'any';
            
            // Determine type check based on property value
            if (t.isNumericLiteral(property.value)) {
              expectedType = 'number';
              checkExpression = t.binaryExpression(
                '===',
                t.unaryExpression('typeof', t.memberExpression(
                  t.identifier('state'),
                  t.identifier(propName)
                )),
                t.stringLiteral('number')
              );
            } else if (t.isStringLiteral(property.value)) {
              expectedType = 'string';
              checkExpression = t.binaryExpression(
                '===',
                t.unaryExpression('typeof', t.memberExpression(
                  t.identifier('state'),
                  t.identifier(propName)
                )),
                t.stringLiteral('string')
              );
            } else if (t.isBooleanLiteral(property.value)) {
              expectedType = 'boolean';
              checkExpression = t.binaryExpression(
                '===',
                t.unaryExpression('typeof', t.memberExpression(
                  t.identifier('state'),
                  t.identifier(propName)
                )),
                t.stringLiteral('boolean')
              );
            } else if (t.isArrayExpression(property.value)) {
              expectedType = 'array';
              checkExpression = t.callExpression(
                t.memberExpression(t.identifier('Array'), t.identifier('isArray')),
                [t.memberExpression(t.identifier('state'), t.identifier(propName))]
              );
            } else if (t.isObjectExpression(property.value)) {
              expectedType = 'object';
              checkExpression = t.logicalExpression(
                '&&',
                t.binaryExpression(
                  '===',
                  t.unaryExpression('typeof', t.memberExpression(
                    t.identifier('state'),
                    t.identifier(propName)
                  )),
                  t.stringLiteral('object')
                ),
                t.binaryExpression(
                  '!==',
                  t.memberExpression(t.identifier('state'), t.identifier(propName)),
                  t.nullLiteral()
                )
              );
            }
            
            if (checkExpression) {
              // Create an if statement for each validation check
              validationChecks.push(
                t.ifStatement(
                  t.unaryExpression('!', checkExpression),
                  t.blockStatement([
                    t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(t.identifier('errors'), t.identifier('push')),
                        [
                          t.newExpression(
                            t.identifier('BaseParserError'),
                            [
                              t.objectExpression([
                                t.objectProperty(
                                  t.identifier('code'),
                                  t.memberExpression(
                                    t.identifier('ErrorCode'),
                                    t.identifier('VALIDATION_ERROR')
                                  )
                                ),
                                t.objectProperty(
                                  t.identifier('message'),
                                  t.stringLiteral(`Expected ${propName} to be ${expectedType}`)
                                ),
                                t.objectProperty(
                                  t.identifier('position'),
                                  t.objectExpression([
                                    t.objectProperty(t.identifier('line'), t.numericLiteral(0)),
                                    t.objectProperty(t.identifier('column'), t.numericLiteral(0)),
                                    t.objectProperty(t.identifier('start'), t.numericLiteral(0)),
                                    t.objectProperty(t.identifier('end'), t.numericLiteral(0))
                                  ])
                                ),
                                t.objectProperty(
                                  t.identifier('severity'),
                                  t.memberExpression(
                                    t.identifier('ErrorSeverity'),
                                    t.identifier('ERROR')
                                  )
                                )
                              ])
                            ]
                          )
                        ]
                      )
                    )
                  ])
                )
              );
            }
          }
        });
      }
      
      // Create the validate method
      return t.classMethod(
        'method',
        t.identifier('validate'),
        [t.identifier('state')],
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('errors'),
              t.arrayExpression([])
            ),
            t.variableDeclarator(
              t.identifier('warnings'),
              t.arrayExpression([])
            )
          ]),
          ...validationChecks,
          t.returnStatement(
            t.objectExpression([
              t.objectProperty(
                t.identifier('isValid'),
                t.binaryExpression('===', t.memberExpression(
                  t.identifier('errors'),
                  t.identifier('length')
                ), t.numericLiteral(0))
              ),
              t.objectProperty(
                t.identifier('errors'),
                t.identifier('errors')
              ),
              t.objectProperty(
                t.identifier('warnings'),
                t.identifier('warnings')
              ),
              t.objectProperty(
                t.identifier('metadata'),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('component'),
                    t.memberExpression(
                      t.thisExpression(),
                      t.identifier('constructor'),
                      false,
                      false
                    )
                  )
                ])
              )
            ])
          )
        ])
      );
    }
    
    // Helper to add ValidationAdapter import
    function addValidationImport(path) {
      // We rely on the Program.exit visitor to actually add the import
      // This function just marks that an import is needed
      const program = path.findParent(p => p.isProgram());
      program.data = program.data || {};
      program.data.needsValidationImport = true;
    }
  }