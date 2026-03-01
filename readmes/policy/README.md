# OBIX Policy System

A comprehensive policy enforcement system for the OBIX framework that enables environment-specific security restrictions for both functional and OOP components. This system integrates with the DOP (Data-Oriented Programming) adapter pattern and automaton state minimization technology to provide efficient, paradigm-neutral policy enforcement.

## Features

- **Environment-Based Restrictions**: Control component behavior based on execution environment (development, testing, staging, production)
- **Role-Based Access Control**: Restrict operations to specific user roles
- **Data Sensitivity Protection**: Safeguard personally identifiable information (PII) and sensitive data
- **Feature Flag Integration**: Enable/disable features using policy rules
- **Decorator Pattern Support**: Apply policies to both class and functional components
- **DOP Adapter Integration**: Seamless policy enforcement with the OBIX DOP pattern
- **Perfect 1:1 Correspondence**: Maintain equivalent behavior between functional and OOP implementations
- **Performance Optimized**: Leverages automaton state minimization for efficient enforcement
- **Validation Integration**: Works with the existing validation system

## Installation

```bash
npm install @obinexuscomputing/obix-policy
```

## Basic Usage

### OOP Component with Method-Level Policies

```typescript
import { BaseComponent } from '@obinexuscomputing/obix';
import { policy, DEVELOPMENT_ONLY, PII_PROTECTION } from '@obinexuscomputing/obix-policy';

class UserManager extends BaseComponent {
  initialState = { users: [] };

  @policy(DEVELOPMENT_ONLY)
  resetAllPasswords() {
    // This method will only execute in development environments
    console.log("Resetting all passwords");
  }
  
  @policy(PII_PROTECTION)
  getUserPersonalData(userId: string) {
    // This method requires proper PII authorization in production
    console.log("Accessing sensitive user data");
    return this.state.users.find(user => user.id === userId);
  }
}
```

### Functional Component with Component-Level Policy

```typescript
import { component } from '@obinexuscomputing/obix';
import { withPolicy, PRODUCTION_BLOCKED } from '@obinexuscomputing/obix-policy';

// Create a normal functional component
const DevTools = component({
  initialState: { activeTab: 'console' },
  transitions: {
    switchTab: (state, tab) => ({ activeTab: tab }),
    clearConsole: (state) => ({ ...state, cleared: true })
  },
  render: (state, trigger) => (/* JSX or template here */)
});

// Wrap it with policy enforcement
const SecureDevTools = withPolicy(
  DevTools,
  PRODUCTION_BLOCKED,
  { 
    fallbackComponent: () => <div>Dev tools not available in production</div> 
  }
);
```

### DOP Adapter Integration

```typescript
import { component } from '@obinexuscomputing/obix';
import { enhanceAdapterWithPolicy, DEVELOPMENT_ONLY } from '@obinexuscomputing/obix-policy';

// Create a component
const AdminPanel = component({
  initialState: { /* ... */ },
  transitions: {
    deleteUser: (state, userId) => (/* ... */),
    banUser: (state, userId) => (/* ... */)
  }
});

// Get its adapter
const adapter = (AdminPanel as any).adapter;

// Enhance the adapter with policy enforcement
const secureAdapter = enhanceAdapterWithPolicy(
  adapter,
  DEVELOPMENT_ONLY,
  { throwOnViolation: true }
);

// Now state transitions will be protected
try {
  secureAdapter.applyTransition('deleteUser', '12345');
} catch (error) {
  console.error("Policy violation:", error.message);
}
```

## Predefined Policy Rules

The system comes with several predefined policy rules:

| Rule | Description |
|------|-------------|
| `DEVELOPMENT_ONLY` | Only allows execution in development environment |
| `PRODUCTION_BLOCKED` | Blocks execution in production environment |
| `STAGING_AND_DEV_ONLY` | Only allows execution in development or staging |
| `NON_PRODUCTION_ONLY` | Blocks execution in production only |
| `TESTING_ONLY` | Only allows execution in testing environment |
| `PII_PROTECTION` | Protects personally identifiable information |
| `ADMIN_ONLY` | Only allows execution for admin users |
| `NO_RESTRICTIONS` | Always allows execution (useful as fallback) |

## Creating Custom Policy Rules

You can create custom policy rules for your specific requirements:

```typescript
import { PolicyRule, EnvironmentType, createRoleRule, combineRules } from '@obinexuscomputing/obix-policy';

// Custom rule based on user permissions
const EDITOR_ROLE_REQUIRED: PolicyRule = {
  id: 'editor-role-required',
  description: 'This operation requires editor privileges',
  condition: (env, context) => {
    // Check context for user role
    if (context && context.user && context.user.roles) {
      return context.user.roles.includes('editor');
    }
    return false;
  },
  action: () => console.debug('[Policy] Editor role check enforced')
};

// Using the rule factory
const MANAGER_ROLE = createRoleRule(
  ['manager', 'admin'],
  'manager-role-required',
  'This operation requires manager privileges'
);

// Combining rules with AND logic
const MANAGER_IN_DEV = combineRules(
  [MANAGER_ROLE, DEVELOPMENT_ONLY],
  'manager-in-dev',
  'Requires manager role in development environment'
);
```

## Environment Detection and Override

The system automatically detects the current environment, but you can override it if needed:

```typescript
import { EnvironmentManager, EnvironmentType } from '@obinexuscomputing/obix-policy';

// Get the environment manager
const envManager = EnvironmentManager.getInstance();

// Check current environment
if (envManager.isDevelopment()) {
  console.log("Running in development mode");
}

// Override the environment (useful for testing)
envManager.setEnvironment(EnvironmentType.TESTING);

// Reset to auto-detection
envManager.resetEnvironment();

// Listen for environment changes
const unsubscribe = envManager.addEnvironmentChangeListener((env) => {
  console.log(`Environment changed to: ${env}`);
});

// Later, when done
unsubscribe();
```

## Policy Options

When applying policies, you can specify various options:

```typescript
const options = {
  // Throw an error on policy violation
  throwOnViolation: true,
  
  // Log violations to console
  logViolations: true,
  
  // Strictly enforce all rules
  enforceStrict: true,
  
  // Override the detected environment
  customEnvironment: EnvironmentType.DEVELOPMENT,
  
  // Return this value when policy blocks execution
  fallbackValue: { error: 'Operation not permitted' },
  
  // Render this component when policy blocks rendering
  fallbackComponent: ErrorComponent,
  
  // Cache TTL in milliseconds
  cacheTTL: 60000
};

@policy(ADMIN_ONLY, options)
deleteEverything() {
  // Dangerous operation
}
```

## Advanced: Function Wrappers

For more specialized use cases, the policy system provides function wrappers:

```typescript
import { applyPolicy, protectComponentMethod } from '@obinexuscomputing/obix-policy';

// Protect a regular function
const secureDeleteUser = applyPolicy(
  deleteUser,
  ADMIN_ONLY,
  { throwOnViolation: true }
);

// Protect a specific method on an existing component
const protectedComponent = protectComponentMethod(
  userManager,
  'deleteUser',
  ADMIN_ONLY
);

// Create a policy-enforced component factory
const createSecureComponent = createPolicyEnforcedFactory(
  component,
  PRODUCTION_BLOCKED
);

// Create a component with the secure factory
const SecureCounter = createSecureComponent({
  initialState: { count: 0 },
  transitions: {
    increment: (state) => ({ count: state.count + 1 })
  }
});
```

## Integration Testing

The system includes utilities for testing policy enforcement:

```typescript
import { EnvironmentManager, EnvironmentType } from '@obinexuscomputing/obix-policy';

describe('Component with policies', () => {
  let envManager: EnvironmentManager;
  
  beforeEach(() => {
    envManager = EnvironmentManager.getInstance();
    // Set testing environment
    envManager.setEnvironment(EnvironmentType.TESTING);
  });
  
  afterEach(() => {
    // Reset environment
    envManager.resetEnvironment();
  });
  
  it('should allow operations in testing environment', () => {
    // Your test here
  });
  
  it('should block operations in production environment', () => {
    // Set production for this test
    envManager.setEnvironment(EnvironmentType.PRODUCTION);
    
    // Your test here
  });
});
```

## Contributing

Contributions are welcome! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.