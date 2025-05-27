#!/usr/bin/env node

/**
 * Basic validation tests for Cerebro AI implementation
 * Tests core functionality without requiring full server setup
 */

console.log('🧪 Running Basic Cerebro AI Validation Tests\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
    return true;
  } else {
    failedTests++;
    console.log(`✗ ${testName} - ${errorMessage}`);
    return false;
  }
}

// Test 1: Configuration Files Exist
try {
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'lib/ai-config.ts',
    'lib/token-utils.ts',
    'hooks/use-ai-settings.tsx',
    'hooks/use-chat-sessions.tsx',
    'app/api/chat/route.ts',
    'app/api/chat/sessions/route.ts',
    'app/api/settings/route.ts',
    'components/chat-bot.tsx',
    'types/index.ts',
    '.env'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Missing: ${file}`);
      allFilesExist = false;
    }
  }
  
  assert(allFilesExist, 'All required files exist', 'Some files are missing');
} catch (error) {
  assert(false, 'All required files exist', error.message);
}

// Test 2: Environment Variables
try {
  require('dotenv').config();
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasOpenRouterKey = process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';
  
  assert(hasSupabaseUrl, 'Supabase URL is configured', 'NEXT_PUBLIC_SUPABASE_URL not found');
  assert(hasSupabaseKey, 'Supabase key is configured', 'NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  assert(hasOpenRouterKey, 'OpenRouter API key is configured', 'OPENROUTER_API_KEY not properly set');
} catch (error) {
  console.log('⚠️ Environment validation skipped (dotenv not available)');
}

// Test 3: Type Definitions
try {
  const fs = require('fs');
  const typesContent = fs.readFileSync('types/index.ts', 'utf8');
  
  const requiredTypes = [
    'ChatSession',
    'ChatMessage',
    'ToolCall',
    'ToolResult',
    'AISettings',
    'AIProvider'
  ];
  
  let allTypesExist = true;
  for (const type of requiredTypes) {
    if (!typesContent.includes(`interface ${type}`)) {
      console.log(`  Missing type: ${type}`);
      allTypesExist = false;
    }
  }
  
  assert(allTypesExist, 'All TypeScript interfaces are defined', 'Some types are missing');
} catch (error) {
  assert(false, 'All TypeScript interfaces are defined', error.message);
}

// Test 4: AI Configuration Structure
try {
  const fs = require('fs');
  const configContent = fs.readFileSync('lib/ai-config.ts', 'utf8');
  
  const requiredExports = [
    'AI_PROVIDERS',
    'DEFAULT_AI_SETTINGS',
    'AVAILABLE_TOOLS'
  ];
  
  let allExportsExist = true;
  for (const exportItem of requiredExports) {
    if (!configContent.includes(`export const ${exportItem}`)) {
      console.log(`  Missing export: ${exportItem}`);
      allExportsExist = false;
    }
  }
  
  assert(allExportsExist, 'AI configuration exports are complete', 'Some exports are missing');
} catch (error) {
  assert(false, 'AI configuration exports are complete', error.message);
}

// Test 5: API Route Structure
try {
  const fs = require('fs');
  
  // Check main chat route
  const chatRouteContent = fs.readFileSync('app/api/chat/route.ts', 'utf8');
  const hasPostMethod = chatRouteContent.includes('export async function POST');
  const hasToolHandling = chatRouteContent.includes('handleToolCalls');
  
  assert(hasPostMethod, 'Chat API has POST method', 'POST method not found');
  assert(hasToolHandling, 'Chat API has tool handling', 'Tool handling not implemented');
  
  // Check sessions route
  const sessionsRouteContent = fs.readFileSync('app/api/chat/sessions/route.ts', 'utf8');
  const hasGetMethod = sessionsRouteContent.includes('export async function GET');
  const hasPostSessionMethod = sessionsRouteContent.includes('export async function POST');
  
  assert(hasGetMethod, 'Sessions API has GET method', 'GET method not found');
  assert(hasPostSessionMethod, 'Sessions API has POST method', 'POST method not found');
} catch (error) {
  assert(false, 'API routes are properly structured', error.message);
}

// Test 6: Hook Implementation
try {
  const fs = require('fs');
  
  // Check AI settings hook
  const settingsHookContent = fs.readFileSync('hooks/use-ai-settings.tsx', 'utf8');
  const hasSettingsProvider = settingsHookContent.includes('AISettingsProvider');
  const hasUseAISettings = settingsHookContent.includes('useAISettings');
  
  assert(hasSettingsProvider, 'AI settings provider is implemented', 'Provider not found');
  assert(hasUseAISettings, 'useAISettings hook is implemented', 'Hook not found');
  
  // Check chat sessions hook
  const sessionsHookContent = fs.readFileSync('hooks/use-chat-sessions.tsx', 'utf8');
  const hasSessionsProvider = sessionsHookContent.includes('ChatSessionsProvider');
  const hasUseChatSessions = sessionsHookContent.includes('useChatSessions');
  
  assert(hasSessionsProvider, 'Chat sessions provider is implemented', 'Provider not found');
  assert(hasUseChatSessions, 'useChatSessions hook is implemented', 'Hook not found');
} catch (error) {
  assert(false, 'React hooks are properly implemented', error.message);
}

// Test 7: Component Updates
try {
  const fs = require('fs');
  
  // Check updated chat component
  const chatBotContent = fs.readFileSync('components/chat-bot.tsx', 'utf8');
  const hasNewImports = chatBotContent.includes('useChatSessions') && chatBotContent.includes('useAISettings');
  const hasSettingsUI = chatBotContent.includes('Settings') && chatBotContent.includes('Dialog');
  const hasSessionManagement = chatBotContent.includes('createSession') && chatBotContent.includes('selectSession');
  
  assert(hasNewImports, 'Chat component uses new hooks', 'New hooks not imported');
  assert(hasSettingsUI, 'Chat component has settings UI', 'Settings UI not found');
  assert(hasSessionManagement, 'Chat component has session management', 'Session management not implemented');
  
  // Check layout updates
  const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
  const hasNewProviders = layoutContent.includes('AISettingsProvider') && layoutContent.includes('ChatSessionsProvider');
  
  assert(hasNewProviders, 'Layout includes new providers', 'New providers not added to layout');
} catch (error) {
  assert(false, 'Components are properly updated', error.message);
}

// Test 8: Database Schema
try {
  const fs = require('fs');
  const schemaContent = fs.readFileSync('database-setup.sql', 'utf8');
  
  const requiredTables = [
    'chat_sessions',
    'chat_messages',
    'ai_settings'
  ];
  
  let allTablesExist = true;
  for (const table of requiredTables) {
    if (!schemaContent.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
      console.log(`  Missing table: ${table}`);
      allTablesExist = false;
    }
  }
  
  assert(allTablesExist, 'Database schema includes all required tables', 'Some tables are missing');
  
  const hasIndexes = schemaContent.includes('CREATE INDEX');
  const hasTriggers = schemaContent.includes('CREATE TRIGGER');
  const hasRLS = schemaContent.includes('ROW LEVEL SECURITY');
  
  assert(hasIndexes, 'Database schema has performance indexes', 'Indexes not found');
  assert(hasTriggers, 'Database schema has update triggers', 'Triggers not found');
  assert(hasRLS, 'Database schema has security policies', 'RLS not enabled');
} catch (error) {
  assert(false, 'Database schema is complete', error.message);
}

// Test 9: Package Dependencies
try {
  const fs = require('fs');
  const packageContent = fs.readFileSync('package.json', 'utf8');
  const packageData = JSON.parse(packageContent);
  
  const requiredDeps = [
    'openai',
    'tiktoken'
  ];
  
  let allDepsInstalled = true;
  for (const dep of requiredDeps) {
    if (!packageData.dependencies[dep]) {
      console.log(`  Missing dependency: ${dep}`);
      allDepsInstalled = false;
    }
  }
  
  assert(allDepsInstalled, 'All required dependencies are installed', 'Some dependencies are missing');
} catch (error) {
  assert(false, 'All required dependencies are installed', error.message);
}

// Test 10: Token Utilities
try {
  // Simple module loading test
  const path = require('path');
  const tokenUtilsPath = path.join(process.cwd(), 'lib', 'token-utils.ts');
  const fs = require('fs');
  const content = fs.readFileSync(tokenUtilsPath, 'utf8');
  
  const hasGetTokenCount = content.includes('export function getTokenCount');
  const hasGetMessagesTokenCount = content.includes('export function getMessagesTokenCount');
  const hasTrimMessages = content.includes('export function trimMessagesToTokenLimit');
  
  assert(hasGetTokenCount, 'Token count function is implemented', 'getTokenCount not found');
  assert(hasGetMessagesTokenCount, 'Messages token count function is implemented', 'getMessagesTokenCount not found');
  assert(hasTrimMessages, 'Trim messages function is implemented', 'trimMessagesToTokenLimit not found');
} catch (error) {
  assert(false, 'Token utilities are implemented', error.message);
}

// Summary
console.log('\n📊 Basic Validation Results:');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All basic validation tests passed!');
  console.log('📝 Next steps:');
  console.log('   1. Run the database-setup.sql in your Supabase dashboard');
  console.log('   2. Add your OpenRouter API key to .env');
  console.log('   3. Start the development server and test the chat');
} else {
  console.log('\n⚠️  Some validation tests failed. Please review the implementation.');
}

process.exit(failedTests > 0 ? 1 : 0);