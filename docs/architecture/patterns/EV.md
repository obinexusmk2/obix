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
    
    %% HTML Parser Components
    class HTMLTokenizer {
        -state: TokenizerState
        -buffer: string
        -position: Position
        -errorTracker: ErrorTracker
        +tokenize(input: string) Token[]
        +registerErrorTracker(tracker: ErrorTracker) void
        -consumeToken() Token
        -handleError(code: ErrorCode, message: string) void
    }
    
    class HTMLParser {
        -tokens: Token[]
        -ast: HTMLNode
        -errorTracker: ErrorTracker
        +parse(tokens: Token[]) HTMLNode
        +registerErrorTracker(tracker: ErrorTracker) void
        -parseNode() HTMLNode
        -handleError(code: ErrorCode, message: string) void
    }
    
    class HTMLAstOptimizer {
        -ast: HTMLNode
        -stateMachine: ValidationStateMachine
        -errorTracker: ErrorTracker
        +optimize(ast: HTMLNode) HTMLNode
        +minimizeStateSpaces(ast: HTMLNode) HTMLNode
        +computeNodeSignatures(ast: HTMLNode) Map
        -handleError(code: ErrorCode, message: string) void
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
    
    %% Error Components
    class BaseParserError {
        +ErrorCode code
        +string message
        +position: Position
        +context: string
        +severity: ErrorSeverity
        +metadata: Record~string, any~
        +toString() string
        +toJSON() object
    }
    
    class HTMLParserError {
        +tokenType: HTMLTokenType
        +expectedTokens: HTMLTokenType[]
        +generateRecoveryStrategy() RecoveryStrategy
    }
    
    class HTMLErrorTracker {
        -errors: ParserError[]
        +categorizeErrors() Map
        +getSyntaxErrors() HTMLParserError[]
        +getSemanticErrors() HTMLParserError[]
    }
    
    %% Recovery Strategy Components
    class RecoveryStrategy {
        <<interface>>
        +apply(context: any) boolean
        +getDescription() string
    }
    
    class HTMLRecoveryStrategy {
        -type: string
        -tagName: string
        +apply(context: any) boolean
        +getDescription() string
        -skipToTag(context, tagName) boolean
        -closeUnclosedTag(context) boolean
        -removeInvalidAttribute(context) boolean
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
    
    class ValidationAPI {
        -manager: ValidationManager
        +validate(source, options) ValidationResult
        +validateHTML(html, options) ValidationResult
        +validateCSS(css, options) ValidationResult
        +registerRule(rule: ValidationRule) void
        -detectType(source: string) string
    }
    
    %% Results and Data
    class ValidationResult {
        +isValid: boolean
        +errors: ParserError[]
        +warnings: ParserError[]
        +metadata: Record~string, any~
    }
    
    class Position {
        +line: number
        +column: number
        +start: number
        +end: number
    }
    
    %% Relationships - Error Handling
    ParserError <|.. BaseParserError
    BaseParserError <|-- HTMLParserError
    
    ErrorTracker <|.. HTMLErrorTracker
    
    HTMLTokenizer --> ErrorTracker : uses
    HTMLParser --> ErrorTracker : uses
    HTMLAstOptimizer --> ErrorTracker : uses
    
    HTMLParserError --> HTMLRecoveryStrategy : creates
    RecoveryStrategy <|.. HTMLRecoveryStrategy
    
    %% Relationships - DOP Adapter
    ValidationAdapter o-- ValidationDataModel
    ValidationAdapter o-- ValidationBehaviorModel
    ValidationAdapter o-- ValidationStateMachine
    
    ValidationDataModel -- ParserError : contains
    ValidationBehaviorModel -- ValidationRule : processes
    
    %% Relationships - State Machine
    ValidationStateMachine o-- ValidationState
    ValidationStateMachine -- StateMachineMinimizer : uses
    
    %% Relationships - Validation Flow
    ValidationRule <|.. HTMLValidationRule
    ValidationEngine o-- ValidationRule
    ValidationEngine o-- ErrorTracker
    
    ValidationManager o-- ValidationEngine
    ValidationManager o-- ValidationAdapter
    ValidationManager o-- ValidationStateMachine
    
    ValidationAPI -- ValidationManager : uses
    
    %% Processing Pipeline
    HTMLTokenizer --> HTMLParser : provides tokens to
    HTMLParser --> HTMLAstOptimizer : provides AST to
    HTMLAstOptimizer --> ValidationAdapter : optimized AST for validation
    ValidationAdapter --> ValidationEngine : delegates validation to
    
    %% HTML Pipeline Connections
    HTMLErrorTracker -- HTMLParserError : tracks
    HTMLValidationRule -- ValidationResult : produces
    ```