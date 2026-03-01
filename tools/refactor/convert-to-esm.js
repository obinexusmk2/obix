#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the root directory
const rootDir = resolve(__dirname, '../..');

// Function to recursively process all TypeScript and JavaScript files
function processDirectory(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('dist')) {
      processDirectory(entryPath);
    } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) && !entry.name.endsWith('.d.ts')) {
      convertFileToESM(entryPath);
    }
  }
}

// Function to convert CommonJS imports/requires to ES modules
function convertFileToESM(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace require statements with import statements
  const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
  content = content.replace(requireRegex, (match, varName, modulePath) => {
    modified = true;
    
    // Handle special cases like path, fs, etc.
    if (modulePath === 'path') {
      return `import * as ${varName} from '${modulePath}';`;
    } else if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      // Add .js extension to relative imports if not present
      if (!modulePath.endsWith('.js') && !modulePath.endsWith('.ts')) {
        const ext = extname(filePath) === '.ts' ? '.js' : extname(filePath);
        modulePath = `${modulePath}${ext}`;
      }
    }
    
    return `import ${varName} from '${modulePath}';`;
  });
  
  // Replace destructured require statements
  const destructuredRequireRegex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
  content = content.replace(destructuredRequireRegex, (match, imports, modulePath) => {
    modified = true;
    
    // Add .js extension to relative imports if not present
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      if (!modulePath.endsWith('.js') && !modulePath.endsWith('.ts')) {
        const ext = extname(filePath) === '.ts' ? '.js' : extname(filePath);
        modulePath = `${modulePath}${ext}`;
      }
    }
    
    return `import { ${imports} } from '${modulePath}';`;
  });
  
  // Replace module.exports with export
  if (content.includes('module.exports')) {
    const moduleExportsRegex = /module\.exports\s*=\s*{([^}]*)}/g;
    content = content.replace(moduleExportsRegex, (match, exports) => {
      modified = true;
      
      // Parse the exports
      const exportList = exports.split(',').map(exp => exp.trim());
      
      // Convert to named exports
      return exportList
        .filter(exp => exp.length > 0)
        .map(exp => {
          const parts = exp.split(':').map(p => p.trim());
          if (parts.length === 1) {
            return `export { ${parts[0]} };`;
          } else {
            return `export const ${parts[0]} = ${parts[1]};`;
          }
        })
        .join('\n');
    });
    
    // Handle direct module.exports = something
    content = content.replace(/module\.exports\s*=\s*(\w+);?/g, (match, exportName) => {
      modified = true;
      return `export default ${exportName};`;
    });
  }
  
  // Add .js extension to imports
  const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  content = content.replace(importRegex, (match, importPath) => {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      if (!importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
        modified = true;
        return match.replace(importPath, `${importPath}.js`);
      }
    }
    return match;
  });
  
  // Save the file if changes were made
  if (modified) {
    writeFileSync(filePath, content);
    console.log(`Converted ${filePath} to use ES modules`);
  }
}

// Start processing from src and tests directories
console.log('Converting files to use ES Module syntax...');
processDirectory(join(rootDir, 'src'));
processDirectory(join(rootDir, 'tests'));
console.log('Conversion complete!');
