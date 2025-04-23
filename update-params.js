const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Set to true to log all changes
const VERBOSE = true;

// Find all route.ts files in the app directory
const routeFiles = glob.sync('src/app/**/**/route.ts');
console.log(`Found ${routeFiles.length} route files:`);
for (const file of routeFiles) {
  console.log(` - ${file}`);
}

let modifiedFiles = 0;
let processedFiles = 0;

console.log('\nBeginning to process files...');

routeFiles.forEach((filePath, index) => {
  try {
    processedFiles++;
    console.log(`\n[${index + 1}/${routeFiles.length}] Processing file: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Look for route handler function patterns
    if (content.match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/i)) {
      console.log(`Found route handler in ${filePath}`);

      // Check for dynamic parameter patterns and update them
      
      // 1. Handle TypeScript typed params: { params }: { params: { paramName: string } }
      let newContent = content.replace(
        /(\{\s*params\s*\})\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9]+)\s*:\s*string\s*\}\s*\}/g, 
        '$1: { params: Promise<{ $2: string }> }'
      );
      if (newContent !== content) {
        console.log(` - Updated TypeScript param type in ${filePath}`);
        content = newContent;
      }

      // 2. Handle untyped params
      newContent = content.replace(
        /(export\s+async\s+function\s+(?:GET|POST|PUT|PATCH|DELETE).*?,\s*)\{\s*params\s*\}(?!\s*:)/g, 
        '$1{ params }: { params: Promise<any> }'
      );
      if (newContent !== content) {
        console.log(` - Added type annotation to untyped params in ${filePath}`);
        content = newContent;
      }

      // 3. Add await to params destructuring
      newContent = content.replace(
        /(const\s*\{[^}]*\})\s*=\s*params(\s*;)/g, 
        '$1 = await params$2'
      );
      if (newContent !== content) {
        console.log(` - Added await to params destructuring in ${filePath}`);
        content = newContent;
      }

      // 4. Handle direct property access like params.id
      newContent = content.replace(
        /params\.([a-zA-Z0-9]+)/g, 
        '(await params).$1'
      );
      if (newContent !== content) {
        console.log(` - Updated direct params property access in ${filePath}`);
        content = newContent;
      }

      // Replace { params }: { params: { [key: string]: string } }
      // with { params }: { params: Record<string, string> }
      newContent = newContent.replace(
        /\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*\[key:\s*string\]:\s*string\s*\}\s*\}/g,
        '{ params }: { params: Record<string, string> }'
      );
      
      // Replace { params }: { params: any }
      // with { params }: { params: Record<string, string> }
      newContent = newContent.replace(
        /\{\s*params\s*\}:\s*\{\s*params:\s*any\s*\}/g,
        '{ params }: { params: Record<string, string> }'
      );
      
      // Replace { params } without type annotation
      // with { params }: { params: Record<string, string> }
      newContent = newContent.replace(
        /\(\s*req\s*:\s*Request\s*,\s*\{\s*params\s*\}\s*\)/g,
        '(req: Request, { params }: { params: Record<string, string> })'
      );
      
      // Add specific parameter types when known from route path
      // e.g. [id] in path becomes params: { id: string }
      const pathParts = filePath.split('/');
      const parameterSegments = pathParts
        .filter(part => part.startsWith('[') && part.endsWith(']'))
        .map(part => part.slice(1, -1));
      
      if (parameterSegments.length > 0) {
        const paramTypesString = parameterSegments
          .map(param => `${param}: string`)
          .join(', ');
        
        const specificTypeAnnotation = `{ params }: { params: { ${paramTypesString} } }`;
        const genericTypeAnnotation = '{ params }: { params: Record<string, string> }';
        
        // Replace generic type with specific parameter types
        newContent = newContent.replace(
          genericTypeAnnotation,
          specificTypeAnnotation
        );
        
        // Handle Promise<> wrapped params
        const promiseTypeAnnotation = `{ params }: { params: Promise<{ ${paramTypesString} }> }`;
        newContent = newContent.replace(
          /\{\s*params\s*\}:\s*\{\s*params:\s*Promise<\{\s*\}>\s*\}/g,
          promiseTypeAnnotation
        );
      }
      
      // Replace direct param access params.xyz with destructured { xyz } = params
      const directParamAccessPattern = /params\.([a-zA-Z0-9]+)/g;
      const directParamMatches = [...newContent.matchAll(directParamAccessPattern)];
      
      const uniqueParams = [...new Set(directParamMatches.map(match => match[1]))];
      if (uniqueParams.length > 0 && VERBOSE) {
        console.log(`\nFile ${filePath} has direct param access: ${uniqueParams.join(', ')}`);
      }
      
      // Only try to modify functions that have direct param access
      if (uniqueParams.length > 0) {
        // Find function declaration that contains { params }
        const functionPattern = /const\s+(\w+)\s*=\s*async\s*\(\s*req\s*:\s*Request\s*,\s*\{\s*params\s*\}[^)]*\)\s*=>\s*\{/g;
        const functionMatches = [...newContent.matchAll(functionPattern)];
        
        if (functionMatches.length > 0) {
          const funcMatch = functionMatches[0];
          const funcName = funcMatch[1];
          const fullFuncDeclaration = funcMatch[0];
          
          if (VERBOSE) {
            console.log(`Found function ${funcName} with declaration: ${fullFuncDeclaration}`);
          }
          
          // Create destructuring of params
          const destructuringString = `const { ${uniqueParams.join(', ')} } = params;`;
          
          // Add destructuring after the function opening brace
          const openingBraceIndex = newContent.indexOf('{', newContent.indexOf(fullFuncDeclaration)) + 1;
          const beforeBrace = newContent.substring(0, openingBraceIndex);
          const afterBrace = newContent.substring(openingBraceIndex);
          
          // Check if the destructuring already exists
          if (!afterBrace.includes(destructuringString)) {
            newContent = beforeBrace + '\n  ' + destructuringString + afterBrace;
            if (VERBOSE) {
              console.log(`Added destructuring: ${destructuringString}`);
            }
          }
        }
      }

      // Write the file only if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, newContent);
        modifiedFiles++;
        console.log(`✅ Updated ${filePath}`);
      } else {
        console.log(`⏭️ No changes needed for ${filePath}`);
      }
    } else {
      console.log(`⏭️ Skipping ${filePath} - no route handler found`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\nSummary: Processed ${processedFiles}/${routeFiles.length} files, modified ${modifiedFiles} files.`); 