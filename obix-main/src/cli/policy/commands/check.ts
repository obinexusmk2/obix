// src/core/cli/policy/commands/check.ts
import { Command } from 'commander';
import { EnvironmentManager } from '../../../policy/environment/EnvironmentManager';

export const checkCommand = new Command('check')
  .description('Check the current policy environment')
  .action(() => {
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = envManager.getCurrentEnvironment();
    
    console.log(`Current environment: ${currentEnv}`);
    console.log(`Is Development: ${envManager.isDevelopment()}`);
    console.log(`Is Staging: ${envManager.isStaging()}`);
    console.log(`Is Testing: ${envManager.isTesting()}`);
    console.log(`Is Production: ${envManager.isProduction()}`);
  });