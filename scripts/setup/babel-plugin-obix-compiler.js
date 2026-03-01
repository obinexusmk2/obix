#!/usr/bin/env node

// obix-compiler.js - The OBIX compilation command

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const { StateMachineMinimizer } = require('./lib/StateMachineMinimizer');
const { DOPAdapter } = require('./lib/DOPAdapter');
const { HTMLASTProcessor } = require('./lib/HTMLASTProcessor');
const { CSSASTProcessor } = require('./lib/CSSASTProcessor');

// Command line arguments
const args = process.argv.slice(2);
const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.(jsx|tsx)$/, '.js');

// Read the input file
console.log(`Compiling ${inputFile} to ${outputFile}...`);
const source = fs.readFileSync(inputFile, 'utf8');

// Parse the JSX/TSX code
const ast = parser.parse(source, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
});

// Create DOP Adapter to handle both class and function components
const dopAdapter = new DOPAdapter({
  detectParadigm: true, // Auto-detect class vs function components
  enableOptimization: true
});

// Process the AST
console.log('Analyzing component structure...');
const components = dopAdapter.extractComponents(ast);

// Process each component with single-pass optimization
for (const component of components) {
  console.log(`Processing component: ${component.name}`);
  
  // Extract HTML and CSS from the component
  const { htmlTemplate, cssTemplate } = dopAdapter.extractTemplates(component);
  
  // Process HTML with state minimization
  console.log('Optimizing HTML structure...');
  const htmlProcessor = new HTMLASTProcessor();
  const processedHTML = htmlProcessor.process(htmlTemplate);
  
  // Process CSS with state minimization
  console.log('Optimizing CSS structure...');
  const cssProcessor = new CSSASTProcessor();
  const processedCSS = cssProcessor.process(cssTemplate);
  
  // Apply state machine minimization to the component's state transitions
  console.log('Applying automaton state minimization...');
  const minimizer = new StateMachineMinimizer();
  const stateTransitions = dopAdapter.extractStateTransitions(component);
  const minimizedTransitions = minimizer.minimize(stateTransitions);
  
  // Record optimization metrics
  const metrics = {
    originalStateCount: stateTransitions.length,
    minimizedStateCount: minimizedTransitions.transitions.size,
    htmlNodeReduction: processedHTML.metrics.nodeReduction.ratio,
    cssNodeReduction: processedCSS.metrics.nodeReduction.ratio
  };
  
  console.log('Optimization metrics:', JSON.stringify(metrics, null, 2));
  
  // Apply the optimized structure back to the component
  dopAdapter.applyOptimizedStructure(component, {
    html: processedHTML.ast,
    css: processedCSS.ast,
    stateTransitions: minimizedTransitions
  });
}

// Transform the optimized AST back to JavaScript code
console.log('Generating optimized code...');
const { code } = babel.transformFromAst(ast, source, {
  presets: ['@babel/preset-env'],
  plugins: [
    '@babel/plugin-transform-react-jsx',
    './lib/babel-plugin-obix-runtime.js' // Custom plugin to inject OBIX runtime
  ]
});

// Write the output file
fs.writeFileSync(outputFile, code);
console.log(`Successfully compiled to ${outputFile}`);

// Print optimization summary
console.log('\nOptimization Summary:');
const totalComponents = components.length;
const classComponents = components.filter(c => c.type === 'class').length;
const functionComponents = components.filter(c => c.type === 'function').length;

console.log(`Total components: ${totalComponents}`);
console.log(`Class components: ${classComponents}`);
console.log(`Function components: ${functionComponents}`);
console.log(`Overall state reduction: ${dopAdapter.getOptimizationRatio().toFixed(2)}x`);

// Example of compiled output for Counter component
console.log('\nExample output:\n');
console.log('// Class component compiled to function component under the hood');
console.log('// with equivalent automaton structure and optimized state transitions');