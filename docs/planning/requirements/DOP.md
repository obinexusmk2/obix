
```mermaid
classDiagram
    %% Core Error Interfaces
    class ParserError {
        <<interface>>
        +ErrorCode code
        +string message
        +position: Position
        +context: string
        +severity: ErrorSeverity
        +toString() string
        +toJSON() object
    }
    
    class ErrorTracker {
        <<interface>>
        +errors: ParserError[]
        +addError(error: ParserError) void
        +getErrors() ParserError[]
        +hasErrors() boolean
        +getErrorTypeCounts() Map
        +generateSummary() string
    }
    
    %% DOP Adapter Components
    class ValidationAdapter {
        -dataModel: ValidationDataModel
        -behaviorModel: ValidationBehaviorModel
        -stateMachine: ValidationStateMachine
        +adapt(input: any) ValidationResult
        +registerRule(rule: ValidationRule) void
        +validate(ast: any) ValidationResult
        +createFromFunctional(config) ValidationAdapter
        +createFromClass(validatorClass) ValidationAdapter
    }
    
    class ValidationDataModel {
        -rules: ValidationRule[]
        -validationState: Map
        -errors: ParserError[]
        -optimizedRules: Map
        +withRule(rule: ValidationRule) ValidationDataModel
        +withValidationState(key, value) ValidationDataModel
        +withError(error: ParserError) ValidationDataModel
        +withOptimizedRules(nodeType, rules) ValidationDataModel
        +getState(key: string) any
        +getOptimizedRules(nodeType: string) ValidationRule[]
        +hasOptimizedRules(nodeType: string) boolean
    }
    
    class ValidationBehaviorModel {
        +findApplicableRules(node, rules) ValidationRule[]
        +applyRule(rule: ValidationRule, node) ValidationResult
        +optimizeRules(rules: ValidationRule[]) Map
        -getNodePosition(node: any) Position
    }
    
    %% State Machine Components
    class ValidationStateMachine {
        -states: Map~string, ValidationState~
        -currentState: ValidationState
        -transitions: Map~string, Map~string, string~~
        +addState(state: ValidationState) void
        +addTransition(from, on, to) void
        +transition(input: string) ValidationState
        +reset() void
        +minimize() void
    }
    
    class ValidationState {
        <<interface>>
        +id: string
        +isAccepting: boolean
        +metadata: Record~string, any~
        +equivalenceClass: number
        +getSignature() string
    }
    
    class StateMachineMinimizer {
        +minimizeStates(stateMachine) ValidationStateMachine
        +computeEquivalenceClasses(states) Map
        +mergeEquivalentStates(stateMachine, classes) ValidationStateMachine
    }
    
    %% Validation Components
    class ValidationRule {
        <<interface>>
        +id: string
        +description: string
        +severity: ErrorSeverity
        +validate(node: any) ValidationResult
    }
    
    class HTMLValidationRule {
        +id: string
        +description: string
        +severity: ErrorSeverity
        +targetNodeTypes: string[]
        +validate(node: HTMLNode) ValidationResult
    }
    
    class CSSValidationRule {
        +id: string
        +description: string
        +severity: ErrorSeverity
        +targetNodeTypes: string[]
        +validate(node: CSSNode) ValidationResult
    }
    
    class ValidationEngine {
        -rules: ValidationRule[]
        -errorTracker: ErrorTracker
        +registerRule(rule: ValidationRule) void
        +validate(ast: any) ValidationResult
        +validateNode(node: any) ValidationResult
    }
    
    class ValidationManager {
        -htmlValidator: ValidationEngine
        -cssValidator: ValidationEngine
        -adapter: ValidationAdapter
        -stateMachine: ValidationStateMachine
        +validateHTML(html: string) ValidationResult
        +validateCSS(css: string) ValidationResult
        +validateCombined(source: string) ValidationResult
        +registerRule(rule: ValidationRule) void
    }
    
    class ValidationAPI
    ```