/** @type {import('prettier').Config} */
module.exports = {
  // Print width
  printWidth: 100,
  
  // Tab width
  tabWidth: 2,
  
  // Use tabs instead of spaces
  useTabs: false,
  
  // Semicolons at the end of statements
  semi: true,
  
  // Use single quotes
  singleQuote: true,
  
  // Quote props only when required
  quoteProps: 'as-needed',
  
  // JSX uses double quotes
  jsxSingleQuote: false,
  
  // Trailing commas where valid in ES5
  trailingComma: 'es5',
  
  // Spaces between brackets in object literals
  bracketSpacing: true,
  
  // Put the > of multi-line JSX elements at the end of the last line
  bracketSameLine: false,
  
  // Arrow function parentheses
  arrowParens: 'always',
  
  // Range formatting (format entire file)
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // Prose wrap for markdown
  proseWrap: 'preserve',
  
  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',
  
  // End of line
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Single attribute per line in HTML/JSX
  singleAttributePerLine: false,
  
  // Overrides for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
