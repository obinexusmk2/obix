import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { ServiceContainer } from '@core/ioc/ServiceContainer';
import { PolicyProvider } from '@core/ioc/providers/PolicyProvider';
import { EnvironmentManager } from '@core/policy/environment/EnvironmentManager';
import { DynamicPolicyLoader } from '@core/policy/loading/DynamicPolicyLoader';
import { PolicyRuleEngine } from '@core/policy/engine/PolicyRuleEngine';
import { PolicyViolationReporter } from '@core/policy/reporting/PolicyViolationReporter';

describe('Policy IOC Provider', () => {
  let container: ServiceContainer;
  let provider: PolicyProvider;
  
  beforeEach(() => {
    container = new ServiceContainer();
    provider = new PolicyProvider();
  });
  
  it('should register policy services with the container', () => {
    // Register the provider
    provider.register(container);
    
    // Check that services were registered
    expect(container.has('policy.environmentManager')).to.be.true;
    expect(container.has('policy.ruleEngine')).to.be.true;
    expect(container.has('policy.loader')).to.be.true;
    expect(container.has('policy.reporter')).to.be.true;
  });
  
  it('should resolve policy service instances', () => {
    // Register the provider
    provider.register(container);
    
    // Resolve service instances
    const envManager = container.resolve<EnvironmentManager>('policy.environmentManager');
    const ruleEngine = container.resolve<PolicyRuleEngine>('policy.ruleEngine');
    const loader = container.resolve<DynamicPolicyLoader>('policy.loader');
    const reporter = container.resolve<PolicyViolationReporter>('policy.reporter');
    
    // Check instances
    expect(envManager).to.be.instanceOf(EnvironmentManager);
    expect(ruleEngine).to.be.instanceOf(PolicyRuleEngine);
    expect(loader).to.be.instanceOf(DynamicPolicyLoader);
    expect(reporter).to.be.instanceOf(PolicyViolationReporter);
  });
  
  it('should register policy services as singletons', () => {
    // Register the provider
    provider.register(container);
    
    // Resolve service instances twice
    const envManager1 = container.resolve<EnvironmentManager>('policy.environmentManager');
    const envManager2 = container.resolve<EnvironmentManager>('policy.environmentManager');
    
    // Should be the same instance
    expect(envManager1).to.equal(envManager2);
  });
});
