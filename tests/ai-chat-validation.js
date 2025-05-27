#!/usr/bin/env node

/**
 * Comprehensive AI Chat System Validation Tests
 * 
 * This test suite validates the complete Cerebro AI implementation:
 * - API endpoints functionality
 * - Database operations
 * - Token counting and context management
 * - Session management
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

function assert(condition, testName, errorMessage = '') {
  if (condition) {
    passedTests++;
    testResults.push({ test: testName, status: 'PASS' });
    log(`✓ ${testName}`, 'success');
    return true;
  } else {
    failedTests++;
    testResults.push({ test: testName, status: 'FAIL', error: errorMessage });
    log(`✗ ${testName} - ${errorMessage}`, 'error');
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
            data: { raw: body }
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

// Test suites
async function testEnvironmentSetup() {
  log('\n🔧 Testing Environment Setup...', 'info');

  // Test if server is running
  try {
    const response = await makeRequest('GET', BASE_URL);
    assert(
      response.status < 500,
      'Server is running and responding',
      `Server returned status ${response.status}`
    );
  } catch (error) {
    assert(false, 'Server is running and responding', `Server not accessible: ${error.message}`);
    return false;
  }

  return true;
}

async function testSettingsAPI() {
  log('\n⚙️ Testing Settings API...', 'info');

  // Test GET settings (should return defaults)
  try {
    const getResponse = await makeRequest('GET', '/settings');
    assert(
      getResponse.status === 200,
      'GET /api/settings returns 200',
      `Expected 200, got ${getResponse.status}`
    );

    assert(
      getResponse.data.settings && getResponse.data.settings.model,
      'Settings response contains model',
      'Response missing settings.model'
    );

    assert(
      getResponse.data.settings.provider,
      'Settings response contains provider',
      'Response missing settings.provider'
    );

    // Test POST settings (save new settings)
    const testSettings = {
      model: 'anthropic/claude-3.5-sonnet',
      provider: 'openrouter',
      temperature: 0.8,
      max_context_tokens: 15000,
      enabled_tools: ['create_task', 'get_tasks']
    };

    const postResponse = await makeRequest('POST', '/settings', testSettings);
    assert(
      postResponse.status === 200,
      'POST /api/settings saves settings successfully',
      `Expected 200, got ${postResponse.status}`
    );

    assert(
      postResponse.data.settings.temperature === 0.8,
      'Settings are correctly saved and returned',
      'Temperature not saved correctly'
    );

    // Verify settings persist
    const verifyResponse = await makeRequest('GET', '/settings');
    assert(
      verifyResponse.data.settings.temperature === 0.8,
      'Settings persist after save',
      'Settings not persisted correctly'
    );

  } catch (error) {
    assert(false, 'Settings API functionality', `Error: ${error.message}`);
  }
}

async function testSessionsAPI() {
  log('\n💬 Testing Chat Sessions API...', 'info');

  let createdSessionId = null;

  try {
    // Test creating a new session
    const createResponse = await makeRequest('POST', '/chat/sessions', {
      title: 'Test Session',
      maxTokens: 10000
    });

    assert(
      createResponse.status === 200,
      'POST /api/chat/sessions creates session',
      `Expected 200, got ${createResponse.status}`
    );

    assert(
      createResponse.data.session && createResponse.data.session.id,
      'Created session has ID',
      'Session creation response missing ID'
    );

    createdSessionId = createResponse.data.session.id;

    assert(
      createResponse.data.session.title === 'Test Session',
      'Session title is correctly set',
      'Session title not saved correctly'
    );

    // Test listing sessions
    const listResponse = await makeRequest('GET', '/chat/sessions');
    assert(
      listResponse.status === 200,
      'GET /api/chat/sessions lists sessions',
      `Expected 200, got ${listResponse.status}`
    );

    assert(
      Array.isArray(listResponse.data.sessions),
      'Sessions list is an array',
      'Sessions response is not an array'
    );

    const sessionExists = listResponse.data.sessions.some(s => s.id === createdSessionId);
    assert(
      sessionExists,
      'Created session appears in sessions list',
      'Created session not found in list'
    );

    // Test getting specific session
    const getResponse = await makeRequest('GET', `/chat/sessions/${createdSessionId}`);
    assert(
      getResponse.status === 200,
      'GET /api/chat/sessions/:id returns session',
      `Expected 200, got ${getResponse.status}`
    );

    assert(
      getResponse.data.session.id === createdSessionId,
      'Retrieved session has correct ID',
      'Session ID mismatch'
    );

    assert(
      Array.isArray(getResponse.data.messages),
      'Session response includes messages array',
      'Messages array missing from session response'
    );

    // Test updating session
    const updateResponse = await makeRequest('PUT', `/chat/sessions/${createdSessionId}`, {
      title: 'Updated Test Session'
    });

    assert(
      updateResponse.status === 200,
      'PUT /api/chat/sessions/:id updates session',
      `Expected 200, got ${updateResponse.status}`
    );

    assert(
      updateResponse.data.session.title === 'Updated Test Session',
      'Session title is updated correctly',
      'Session title not updated'
    );

    // Test deleting session
    const deleteResponse = await makeRequest('DELETE', `/chat/sessions/${createdSessionId}`);
    assert(
      deleteResponse.status === 200,
      'DELETE /api/chat/sessions/:id deletes session',
      `Expected 200, got ${deleteResponse.status}`
    );

    // Verify session is deleted
    const verifyDeleteResponse = await makeRequest('GET', `/chat/sessions/${createdSessionId}`);
    assert(
      verifyDeleteResponse.status === 404,
      'Deleted session returns 404',
      `Expected 404, got ${verifyDeleteResponse.status}`
    );

  } catch (error) {
    assert(false, 'Sessions API functionality', `Error: ${error.message}`);
  }
}

async function testChatAPI() {
  log('\n🤖 Testing Chat API...', 'info');

  try {
    // First create a session for testing
    const sessionResponse = await makeRequest('POST', '/chat/sessions', {
      title: 'Chat Test Session'
    });

    if (sessionResponse.status !== 200) {
      assert(false, 'Chat API prerequisite (session creation)', 'Failed to create test session');
      return;
    }

    const sessionId = sessionResponse.data.session.id;

    // Test sending a message (this will fail without proper API key, but we test the endpoint structure)
    const chatResponse = await makeRequest('POST', '/chat', {
      sessionId,
      message: 'Hello, this is a test message',
      settings: {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.7,
        max_context_tokens: 10000
      }
    });

    // We expect either success (200) or API key error (500), but not 404 or malformed request (400)
    assert(
      chatResponse.status === 200 || chatResponse.status === 500,
      'POST /api/chat endpoint exists and processes requests',
      `Unexpected status ${chatResponse.status} - endpoint might be malformed`
    );

    if (chatResponse.status === 500) {
      log('ℹ️ Chat API returned 500 (expected without valid API key)', 'warning');
    } else if (chatResponse.status === 200) {
      assert(
        chatResponse.data.message,
        'Chat response contains message',
        'Chat response missing message data'
      );

      assert(
        typeof chatResponse.data.tokenCount === 'number',
        'Chat response contains token count',
        'Chat response missing token count'
      );
    }

    // Test invalid session ID
    const invalidResponse = await makeRequest('POST', '/chat', {
      sessionId: 'invalid-session-id',
      message: 'Test message'
    });

    assert(
      invalidResponse.status === 404,
      'Chat API returns 404 for invalid session',
      `Expected 404, got ${invalidResponse.status}`
    );

    // Test missing message
    const noMessageResponse = await makeRequest('POST', '/chat', {
      sessionId
    });

    assert(
      noMessageResponse.status === 400,
      'Chat API returns 400 for missing message',
      `Expected 400, got ${noMessageResponse.status}`
    );

    // Clean up
    await makeRequest('DELETE', `/chat/sessions/${sessionId}`);

  } catch (error) {
    assert(false, 'Chat API functionality', `Error: ${error.message}`);
  }
}

async function testTokenUtils() {
  log('\n🧮 Testing Token Utilities...', 'info');

  try {
    // Test token counting utility
    const { getTokenCount, getMessagesTokenCount, trimMessagesToTokenLimit } = require('../lib/token-utils');

    // Test basic token counting
    const simpleText = "Hello world";
    const tokenCount = getTokenCount(simpleText);
    
    assert(
      typeof tokenCount === 'number' && tokenCount > 0,
      'getTokenCount returns positive number',
      `Expected positive number, got ${tokenCount}`
    );

    // Test message token counting
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
      'getMessagesTokenCount returns positive number',
      `Expected positive number, got ${totalTokens}`
    );

    // Test message trimming
    const trimmedMessages = trimMessagesToTokenLimit(testMessages, 50);
    assert(
      Array.isArray(trimmedMessages),
      'trimMessagesToTokenLimit returns array',
      'Expected array return value'
    );

    assert(
      trimmedMessages.length <= testMessages.length,
      'Trimmed messages array is same size or smaller',
      'Trimmed array is larger than original'
    );

    log('✓ Token utilities are working correctly', 'success');

  } catch (error) {
    assert(false, 'Token utilities functionality', `Error: ${error.message}`);
  }
}

async function testDatabaseSchema() {
  log('\n🗄️ Testing Database Schema Requirements...', 'info');

  // Test that we can create and retrieve sessions
  try {
    const createResponse = await makeRequest('POST', '/chat/sessions', {
      title: 'Schema Test',
      maxTokens: 20000
    });

    if (createResponse.status === 200) {
      const session = createResponse.data.session;
      
      // Check required fields exist
      const requiredFields = ['id', 'title', 'created_at', 'updated_at', 'token_count', 'max_tokens'];
      for (const field of requiredFields) {
        assert(
          session.hasOwnProperty(field),
          `Session has required field: ${field}`,
          `Missing required field: ${field}`
        );
      }

      // Clean up
      await makeRequest('DELETE', `/chat/sessions/${session.id}`);
    } else {
      assert(false, 'Database schema validation', 'Could not create test session for schema validation');
    }

  } catch (error) {
    assert(false, 'Database schema validation', `Error: ${error.message}`);
  }
}

async function testErrorHandling() {
  log('\n⚠️ Testing Error Handling...', 'info');

  try {
    // Test malformed JSON
    const malformedResponse = await makeRequest('POST', '/chat/sessions', 'not json');
    assert(
      malformedResponse.status >= 400 && malformedResponse.status < 500,
      'API handles malformed JSON gracefully',
      `Expected 4xx error, got ${malformedResponse.status}`
    );

    // Test missing required fields
    const missingFieldsResponse = await makeRequest('POST', '/settings', {});
    assert(
      missingFieldsResponse.status >= 400,
      'API validates required fields',
      `Expected error for missing fields, got ${missingFieldsResponse.status}`
    );

    // Test non-existent endpoints
    const notFoundResponse = await makeRequest('GET', '/nonexistent');
    assert(
      notFoundResponse.status === 404,
      'API returns 404 for non-existent endpoints',
      `Expected 404, got ${notFoundResponse.status}`
    );

  } catch (error) {
    assert(false, 'Error handling', `Error: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  log('🧪 Starting Cerebro AI Chat System Validation Tests\n', 'info');
  
  const testSuites = [
    testEnvironmentSetup,
    testSettingsAPI,
    testSessionsAPI,
    testChatAPI,
    testTokenUtils,
    testDatabaseSchema,
    testErrorHandling
  ];

  for (const testSuite of testSuites) {
    try {
      await testSuite();
    } catch (error) {
      log(`Test suite failed: ${error.message}`, 'error');
    }
  }

  // Print summary
  log('\n📊 Test Results Summary:', 'info');
  log(`Total tests: ${passedTests + failedTests}`);
  log(`Passed: ${passedTests}`, 'success');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');

  if (failedTests > 0) {
    log('\n❌ Failed Tests:', 'error');
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => log(`  • ${r.test}: ${r.error || 'Unknown error'}`, 'error'));
  }

  log(`\n${failedTests === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}`, 
      failedTests === 0 ? 'success' : 'error');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal test error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testEnvironmentSetup,
  testSettingsAPI,
  testSessionsAPI,
  testChatAPI,
  testTokenUtils,
  testDatabaseSchema,
  testErrorHandling
};