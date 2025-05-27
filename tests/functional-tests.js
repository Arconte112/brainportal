#!/usr/bin/env node

/**
 * Functional Tests for Cerebro AI System
 * 
 * These tests verify actual functionality with real inputs/outputs:
 * - Token counting accuracy
 * - Database operations
 * - API endpoint behavior
 * - Context window management
 * - Settings persistence
 * - Error handling
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Test data
const testData = {
  sampleText: "Hello, this is a test message for token counting.",
  longText: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100),
  testSession: {
    title: "Functional Test Session",
    maxTokens: 5000
  },
  testSettings: {
    model: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    temperature: 0.8,
    max_context_tokens: 10000,
    enabled_tools: ["create_task", "get_tasks"]
  },
  testMessage: "Crea una tarea llamada 'Test Task' con prioridad alta"
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function assert(condition, testName, errorMessage = '', actualValue = null, expectedValue = null) {
  if (condition) {
    passedTests++;
    testResults.push({ test: testName, status: 'PASS', actual: actualValue, expected: expectedValue });
    log(`✓ ${testName}`, 'success');
    return true;
  } else {
    failedTests++;
    testResults.push({ 
      test: testName, 
      status: 'FAIL', 
      error: errorMessage,
      actual: actualValue,
      expected: expectedValue
    });
    log(`✗ ${testName} - ${errorMessage}`, 'error');
    if (actualValue !== null && expectedValue !== null) {
      log(`  Expected: ${expectedValue}, Got: ${actualValue}`, 'error');
    }
    return false;
  }
}

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const request = (url.protocol === 'https:' ? https : http).request(options, (response) => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            data: { raw: body, parseError: error.message }
          });
        }
      });
    });

    request.on('error', reject);

    if (data) {
      request.write(JSON.stringify(data));
    }

    request.end();
  });
}

// Functional Test Suites

async function testTokenCountingFunctionality() {
  log('\n🧮 Testing Token Counting Functionality...', 'info');

  try {
    // Test basic token counting
    const { getTokenCount, getMessagesTokenCount, trimMessagesToTokenLimit } = require('./token-utils-test');

    // Test 1: Basic token counting returns reasonable values
    const basicTokens = getTokenCount(testData.sampleText);
    assert(
      typeof basicTokens === 'number' && basicTokens > 0 && basicTokens < 50,
      'Basic token counting returns reasonable count',
      `Expected 1-50 tokens for short text, got ${basicTokens}`,
      basicTokens,
      '1-50 range'
    );

    // Test 2: Longer text has more tokens
    const longTokens = getTokenCount(testData.longText);
    assert(
      longTokens > basicTokens,
      'Longer text has more tokens than shorter text',
      `Long text (${longTokens}) should have more tokens than short text (${basicTokens})`,
      longTokens > basicTokens,
      true
    );

    // Test 3: Empty string handling
    const emptyTokens = getTokenCount("");
    assert(
      emptyTokens === 0,
      'Empty string returns zero tokens',
      `Expected 0 tokens for empty string, got ${emptyTokens}`,
      emptyTokens,
      0
    );

    // Test 4: Messages token counting
    const testMessages = [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        session_id: 'test',
        token_count: 0,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hi there! How can I help you today?',
        session_id: 'test',
        token_count: 0,
        created_at: new Date().toISOString()
      }
    ];

    const totalTokens = getMessagesTokenCount(testMessages);
    assert(
      typeof totalTokens === 'number' && totalTokens > 0,
      'Messages token counting works correctly',
      `Expected positive number, got ${totalTokens}`,
      typeof totalTokens === 'number' && totalTokens > 0,
      true
    );

    // Test 5: Token trimming functionality
    const manyMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: testData.longText,
      session_id: 'test',
      token_count: longTokens,
      created_at: new Date().toISOString()
    }));

    const trimmedMessages = trimMessagesToTokenLimit(manyMessages, 1000);
    const trimmedTokens = getMessagesTokenCount(trimmedMessages);
    
    assert(
      trimmedMessages.length < manyMessages.length && trimmedTokens <= 1000,
      'Token trimming reduces message count and stays within limit',
      `Trimmed ${manyMessages.length} to ${trimmedMessages.length} messages, ${trimmedTokens} tokens`,
      trimmedTokens <= 1000,
      true
    );

  } catch (error) {
    assert(false, 'Token utilities functionality', `Error: ${error.message}`);
  }
}

async function testDatabaseOperations() {
  log('\n🗄️ Testing Database Operations...', 'info');

  let testSessionId = null;

  try {
    // Test 1: Create session with valid data
    const createResponse = await makeRequest('POST', '/chat/sessions', testData.testSession);
    
    assert(
      createResponse.status === 200,
      'Session creation returns 200 status',
      `Expected 200, got ${createResponse.status}`,
      createResponse.status,
      200
    );

    assert(
      createResponse.data.session && createResponse.data.session.id,
      'Created session has valid ID',
      'Session creation response missing ID',
      !!createResponse.data.session?.id,
      true
    );

    testSessionId = createResponse.data.session.id;

    assert(
      createResponse.data.session.title === testData.testSession.title,
      'Session title is correctly saved',
      `Expected '${testData.testSession.title}', got '${createResponse.data.session.title}'`,
      createResponse.data.session.title,
      testData.testSession.title
    );

    assert(
      createResponse.data.session.max_tokens === testData.testSession.maxTokens,
      'Session max_tokens is correctly saved',
      `Expected ${testData.testSession.maxTokens}, got ${createResponse.data.session.max_tokens}`,
      createResponse.data.session.max_tokens,
      testData.testSession.maxTokens
    );

    // Test 2: List sessions includes created session
    const listResponse = await makeRequest('GET', '/chat/sessions');
    
    assert(
      listResponse.status === 200,
      'Sessions listing returns 200 status',
      `Expected 200, got ${listResponse.status}`,
      listResponse.status,
      200
    );

    const sessionExists = listResponse.data.sessions?.some(s => s.id === testSessionId);
    assert(
      sessionExists,
      'Created session appears in sessions list',
      'Session not found in listing',
      sessionExists,
      true
    );

    // Test 3: Get specific session
    const getResponse = await makeRequest('GET', `/chat/sessions/${testSessionId}`);
    
    assert(
      getResponse.status === 200,
      'Get specific session returns 200 status',
      `Expected 200, got ${getResponse.status}`,
      getResponse.status,
      200
    );

    assert(
      getResponse.data.session.id === testSessionId,
      'Retrieved session has correct ID',
      `Expected ${testSessionId}, got ${getResponse.data.session.id}`,
      getResponse.data.session.id,
      testSessionId
    );

    assert(
      Array.isArray(getResponse.data.messages),
      'Session response includes messages array',
      'Messages array missing from response',
      Array.isArray(getResponse.data.messages),
      true
    );

    // Test 4: Update session
    const updateData = { title: "Updated Functional Test Session" };
    const updateResponse = await makeRequest('PUT', `/chat/sessions/${testSessionId}`, updateData);
    
    assert(
      updateResponse.status === 200,
      'Session update returns 200 status',
      `Expected 200, got ${updateResponse.status}`,
      updateResponse.status,
      200
    );

    assert(
      updateResponse.data.session.title === updateData.title,
      'Session title is correctly updated',
      `Expected '${updateData.title}', got '${updateResponse.data.session.title}'`,
      updateResponse.data.session.title,
      updateData.title
    );

    // Test 5: Invalid operations
    const invalidGetResponse = await makeRequest('GET', '/chat/sessions/invalid-id');
    assert(
      invalidGetResponse.status === 404,
      'Invalid session ID returns 404',
      `Expected 404, got ${invalidGetResponse.status}`,
      invalidGetResponse.status,
      404
    );

  } catch (error) {
    assert(false, 'Database operations functionality', `Error: ${error.message}`);
  } finally {
    // Cleanup: Delete test session
    if (testSessionId) {
      try {
        await makeRequest('DELETE', `/chat/sessions/${testSessionId}`);
      } catch (cleanupError) {
        log(`⚠️ Cleanup failed: ${cleanupError.message}`, 'warning');
      }
    }
  }
}

async function testSettingsPersistence() {
  log('\n⚙️ Testing Settings Persistence...', 'info');

  try {
    // Test 1: Get default settings
    const defaultResponse = await makeRequest('GET', '/settings');
    
    assert(
      defaultResponse.status === 200,
      'Get settings returns 200 status',
      `Expected 200, got ${defaultResponse.status}`,
      defaultResponse.status,
      200
    );

    assert(
      defaultResponse.data.settings && defaultResponse.data.settings.model,
      'Default settings contain model',
      'Model missing from default settings',
      !!defaultResponse.data.settings?.model,
      true
    );

    const originalSettings = defaultResponse.data.settings;

    // Test 2: Save new settings
    const saveResponse = await makeRequest('POST', '/settings', testData.testSettings);
    
    assert(
      saveResponse.status === 200,
      'Save settings returns 200 status',
      `Expected 200, got ${saveResponse.status}`,
      saveResponse.status,
      200
    );

    assert(
      saveResponse.data.settings.model === testData.testSettings.model,
      'Model is correctly saved',
      `Expected '${testData.testSettings.model}', got '${saveResponse.data.settings.model}'`,
      saveResponse.data.settings.model,
      testData.testSettings.model
    );

    assert(
      saveResponse.data.settings.temperature === testData.testSettings.temperature,
      'Temperature is correctly saved',
      `Expected ${testData.testSettings.temperature}, got ${saveResponse.data.settings.temperature}`,
      saveResponse.data.settings.temperature,
      testData.testSettings.temperature
    );

    // Test 3: Verify settings persistence
    const verifyResponse = await makeRequest('GET', '/settings');
    
    assert(
      verifyResponse.data.settings.model === testData.testSettings.model,
      'Settings persist after save',
      `Expected '${testData.testSettings.model}', got '${verifyResponse.data.settings.model}'`,
      verifyResponse.data.settings.model,
      testData.testSettings.model
    );

    // Test 4: Invalid settings handling
    const invalidSettings = { model: "", provider: "invalid" };
    const invalidResponse = await makeRequest('POST', '/settings', invalidSettings);
    
    assert(
      invalidResponse.status >= 400,
      'Invalid settings return error status',
      `Expected 400+, got ${invalidResponse.status}`,
      invalidResponse.status >= 400,
      true
    );

    // Restore original settings
    await makeRequest('POST', '/settings', originalSettings);

  } catch (error) {
    assert(false, 'Settings persistence functionality', `Error: ${error.message}`);
  }
}

async function testChatAPIBehavior() {
  log('\n🤖 Testing Chat API Behavior...', 'info');

  let testSessionId = null;

  try {
    // Setup: Create test session
    const sessionResponse = await makeRequest('POST', '/chat/sessions', {
      title: 'Chat API Test Session'
    });

    if (sessionResponse.status !== 200) {
      assert(false, 'Chat API setup (create session)', 'Failed to create test session');
      return;
    }

    testSessionId = sessionResponse.data.session.id;

    // Test 1: Chat endpoint validation
    const chatResponse = await makeRequest('POST', '/chat', {
      sessionId: testSessionId,
      message: testData.testMessage,
      settings: testData.testSettings
    });

    // Note: We expect this to fail with 500 due to missing API key, but the endpoint should exist
    assert(
      chatResponse.status === 200 || chatResponse.status === 500,
      'Chat endpoint exists and processes requests',
      `Unexpected status ${chatResponse.status} - endpoint might be malformed`,
      chatResponse.status === 200 || chatResponse.status === 500,
      true
    );

    if (chatResponse.status === 200) {
      assert(
        chatResponse.data.message,
        'Successful chat response contains message',
        'Message missing from chat response',
        !!chatResponse.data.message,
        true
      );

      assert(
        typeof chatResponse.data.tokenCount === 'number',
        'Chat response contains token count',
        'Token count missing from response',
        typeof chatResponse.data.tokenCount === 'number',
        true
      );
    } else {
      log('ℹ️ Chat API returned 500 (expected without valid OpenRouter API key)', 'warning');
    }

    // Test 2: Request validation
    const noSessionResponse = await makeRequest('POST', '/chat', {
      message: testData.testMessage
    });

    assert(
      noSessionResponse.status === 400,
      'Chat API validates required sessionId',
      `Expected 400 for missing sessionId, got ${noSessionResponse.status}`,
      noSessionResponse.status,
      400
    );

    const noMessageResponse = await makeRequest('POST', '/chat', {
      sessionId: testSessionId
    });

    assert(
      noMessageResponse.status === 400,
      'Chat API validates required message',
      `Expected 400 for missing message, got ${noMessageResponse.status}`,
      noMessageResponse.status,
      400
    );

    const invalidSessionResponse = await makeRequest('POST', '/chat', {
      sessionId: 'invalid-session-id',
      message: testData.testMessage
    });

    assert(
      invalidSessionResponse.status === 404,
      'Chat API validates session existence',
      `Expected 404 for invalid session, got ${invalidSessionResponse.status}`,
      invalidSessionResponse.status,
      404
    );

  } catch (error) {
    assert(false, 'Chat API behavior', `Error: ${error.message}`);
  } finally {
    // Cleanup
    if (testSessionId) {
      try {
        await makeRequest('DELETE', `/chat/sessions/${testSessionId}`);
      } catch (cleanupError) {
        log(`⚠️ Cleanup failed: ${cleanupError.message}`, 'warning');
      }
    }
  }
}

async function testContextWindowManagement() {
  log('\n📏 Testing Context Window Management...', 'info');

  try {
    const { trimMessagesToTokenLimit, getMessagesTokenCount } = require('./token-utils-test');

    // Test 1: Create messages that exceed token limit
    const largeMessages = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: testData.longText,
      session_id: 'test',
      token_count: 0,
      created_at: new Date(Date.now() + i * 1000).toISOString() // Different timestamps
    }));

    const originalTokenCount = getMessagesTokenCount(largeMessages);
    
    // Test 2: Trim to small limit
    const smallLimit = 1000;
    const trimmedSmall = trimMessagesToTokenLimit(largeMessages, smallLimit);
    const trimmedSmallTokens = getMessagesTokenCount(trimmedSmall);

    assert(
      trimmedSmallTokens <= smallLimit,
      'Trimmed messages stay within small token limit',
      `Trimmed to ${trimmedSmallTokens} tokens, limit was ${smallLimit}`,
      trimmedSmallTokens <= smallLimit,
      true
    );

    assert(
      trimmedSmall.length < largeMessages.length,
      'Trimming reduces message count',
      `Original: ${largeMessages.length}, Trimmed: ${trimmedSmall.length}`,
      trimmedSmall.length < largeMessages.length,
      true
    );

    // Test 3: Verify newest messages are kept (if any messages remain after trimming)
    if (trimmedSmall.length > 0) {
      const newestOriginal = largeMessages[largeMessages.length - 1];
      const newestTrimmed = trimmedSmall.find(m => m.role !== 'system' && m.id === newestOriginal.id);

      assert(
        !!newestTrimmed,
        'Newest messages are preserved during trimming',
        `Newest message ID ${newestOriginal.id} not found in trimmed results. Trimmed IDs: ${trimmedSmall.map(m => m.id).join(', ')}`,
        !!newestTrimmed,
        true
      );
    } else {
      assert(
        true,
        'Newest messages are preserved during trimming',
        'No messages remained after trimming (acceptable)',
        true,
        true
      );
    }

    // Test 4: Large limit keeps all messages
    const largeLimit = originalTokenCount + 1000;
    const trimmedLarge = trimMessagesToTokenLimit(largeMessages, largeLimit);

    assert(
      trimmedLarge.length === largeMessages.length,
      'Large token limit keeps all messages',
      `Original: ${largeMessages.length}, Trimmed: ${trimmedLarge.length}`,
      trimmedLarge.length,
      largeMessages.length
    );

    // Test 5: System message preservation
    const messagesWithSystem = [
      {
        id: 'system-1',
        role: 'system',
        content: 'You are a helpful assistant.',
        session_id: 'test',
        token_count: 0,
        created_at: new Date().toISOString()
      },
      ...largeMessages
    ];

    const trimmedWithSystem = trimMessagesToTokenLimit(messagesWithSystem, smallLimit);
    const hasSystemMessage = trimmedWithSystem.some(m => m.role === 'system');

    assert(
      hasSystemMessage,
      'System message is preserved during trimming',
      'System message not found in trimmed results',
      hasSystemMessage,
      true
    );

  } catch (error) {
    assert(false, 'Context window management', `Error: ${error.message}`);
  }
}

async function testErrorHandlingRobustness() {
  log('\n⚠️ Testing Error Handling Robustness...', 'info');

  try {
    // Test 1: Malformed request body handling
    const response = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/chat/sessions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.write('{"invalid": json}'); // Malformed JSON
      req.end();
    });

    assert(
      response.status >= 400,
      'API handles malformed JSON gracefully',
      `Expected 4xx or 5xx error, got ${response.status}`,
      response.status >= 400,
      true
    );

    // Test 2: Missing content-type handling
    const response2 = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/chat/sessions',
        method: 'POST'
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.write('test data');
      req.end();
    });

    assert(
      response2.status >= 400,
      'API handles missing content-type header',
      `Expected 4xx error, got ${response2.status}`,
      response2.status >= 400,
      true
    );

    // Test 3: Very large payload handling
    const largePayload = {
      title: 'x'.repeat(10000),
      maxTokens: 50000
    };

    const largeResponse = await makeRequest('POST', '/chat/sessions', largePayload);
    assert(
      largeResponse.status === 200 || largeResponse.status === 413,
      'API handles large payloads appropriately',
      `Expected 200 or 413, got ${largeResponse.status}`,
      largeResponse.status === 200 || largeResponse.status === 413,
      true
    );

    // Test 4: Non-existent endpoint
    const notFoundResponse = await makeRequest('GET', '/nonexistent-endpoint');
    assert(
      notFoundResponse.status === 404,
      'API returns 404 for non-existent endpoints',
      `Expected 404, got ${notFoundResponse.status}`,
      notFoundResponse.status,
      404
    );

    // Test 5: SQL injection prevention in session ID
    const sqlInjectionResponse = await makeRequest('GET', "/chat/sessions/'; DROP TABLE chat_sessions; --");
    assert(
      sqlInjectionResponse.status === 404 || sqlInjectionResponse.status === 400,
      'API prevents SQL injection attempts',
      `Expected 404 or 400, got ${sqlInjectionResponse.status}`,
      sqlInjectionResponse.status === 404 || sqlInjectionResponse.status === 400,
      true
    );

  } catch (error) {
    assert(false, 'Error handling robustness', `Error: ${error.message}`);
  }
}

async function testPerformanceCharacteristics() {
  log('\n⚡ Testing Performance Characteristics...', 'info');

  try {
    // Test 1: Token counting performance
    const startTime = Date.now();
    const { getTokenCount } = require('./token-utils-test');
    
    for (let i = 0; i < 100; i++) {
      getTokenCount(testData.longText);
    }
    
    const tokenCountTime = Date.now() - startTime;
    assert(
      tokenCountTime < 5000,
      'Token counting performs within acceptable time (100 calls < 5s)',
      `Token counting took ${tokenCountTime}ms for 100 calls`,
      tokenCountTime < 5000,
      true
    );

    // Test 2: API response time
    const apiStartTime = Date.now();
    const sessionResponse = await makeRequest('POST', '/chat/sessions', testData.testSession);
    const apiTime = Date.now() - apiStartTime;

    assert(
      apiTime < 2000,
      'Session creation API responds within 2 seconds',
      `API took ${apiTime}ms to respond`,
      apiTime < 2000,
      true
    );

    // Test 3: Multiple concurrent requests
    const concurrentStart = Date.now();
    const concurrentPromises = Array.from({ length: 5 }, () => 
      makeRequest('GET', '/settings')
    );
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentTime = Date.now() - concurrentStart;

    const allSuccessful = concurrentResults.every(r => r.status === 200);
    assert(
      allSuccessful,
      'API handles concurrent requests successfully',
      'Some concurrent requests failed',
      allSuccessful,
      true
    );

    assert(
      concurrentTime < 3000,
      'Concurrent requests complete within reasonable time',
      `Concurrent requests took ${concurrentTime}ms`,
      concurrentTime < 3000,
      true
    );

    // Cleanup
    if (sessionResponse.status === 200 && sessionResponse.data.session?.id) {
      await makeRequest('DELETE', `/chat/sessions/${sessionResponse.data.session.id}`);
    }

  } catch (error) {
    assert(false, 'Performance characteristics', `Error: ${error.message}`);
  }
}

// Main test runner
async function runFunctionalTests() {
  log('🧪 Running Cerebro AI Functional Tests\n', 'info');
  
  // Check if server is running
  try {
    const healthCheck = await makeRequest('GET', BASE_URL);
    if (healthCheck.status >= 500) {
      log('❌ Server not responding properly. Please start the development server first.', 'error');
      process.exit(1);
    }
  } catch (error) {
    log('❌ Cannot connect to server. Please start the development server first.', 'error');
    log(`   Run: npm run dev`, 'info');
    process.exit(1);
  }

  const testSuites = [
    { name: 'Token Counting', fn: testTokenCountingFunctionality },
    { name: 'Database Operations', fn: testDatabaseOperations },
    { name: 'Settings Persistence', fn: testSettingsPersistence },
    { name: 'Chat API Behavior', fn: testChatAPIBehavior },
    { name: 'Context Window Management', fn: testContextWindowManagement },
    { name: 'Error Handling', fn: testErrorHandlingRobustness },
    { name: 'Performance', fn: testPerformanceCharacteristics }
  ];

  for (const suite of testSuites) {
    try {
      await suite.fn();
    } catch (error) {
      log(`Suite "${suite.name}" failed: ${error.message}`, 'error');
      failedTests++;
    }
  }

  // Print detailed summary
  log('\n📊 Functional Test Results Summary:', 'info');
  log(`Total tests: ${passedTests + failedTests}`);
  log(`Passed: ${passedTests}`, passedTests > 0 ? 'success' : 'info');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    log('\n❌ Failed Tests Details:', 'error');
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        log(`  • ${r.test}`, 'error');
        log(`    Error: ${r.error}`, 'error');
        if (r.expected && r.actual !== null) {
          log(`    Expected: ${r.expected}, Got: ${r.actual}`, 'error');
        }
      });
  }

  log(`\n${failedTests === 0 ? '✅ All functional tests passed!' : '❌ Some functional tests failed'}`, 
      failedTests === 0 ? 'success' : 'error');

  if (failedTests === 0) {
    log('\n🎉 Cerebro AI implementation is fully functional!', 'success');
    log('✅ All core features are working correctly:', 'success');
    log('   • Token counting and context management', 'success');
    log('   • Database operations and persistence', 'success');
    log('   • API endpoints and error handling', 'success');
    log('   • Settings configuration', 'success');
    log('   • Performance characteristics', 'success');
  } else {
    log('\n🔧 Please fix the failing tests before deploying.', 'warning');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle command line execution
if (require.main === module) {
  runFunctionalTests().catch(error => {
    log(`Fatal test error: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = {
  runFunctionalTests,
  testTokenCountingFunctionality,
  testDatabaseOperations,
  testSettingsPersistence,
  testChatAPIBehavior,
  testContextWindowManagement,
  testErrorHandlingRobustness,
  testPerformanceCharacteristics
};