// JavaScript version of token utils for testing
// This is a simplified version to test the logic without TypeScript compilation

function getTokenCount(text, model = 'gpt-4o') {
  // Simplified token counting logic for testing
  // Real implementation uses tiktoken library
  if (!text || typeof text !== 'string') return 0;
  
  // Rough estimation: 1 token ≈ 4 characters
  // This is a fallback that matches our actual implementation
  return Math.ceil(text.length / 4);
}

function getMessagesTokenCount(messages, model = 'gpt-4o') {
  if (!Array.isArray(messages)) return 0;
  
  return messages.reduce((total, message) => {
    if (!message || !message.content) return total;
    
    let messageTokens = getTokenCount(message.content, model);
    
    // Add tokens for role and structure
    messageTokens += getTokenCount(`role: ${message.role}`, model);
    
    // Add tokens for tool calls if present
    if (message.tool_calls) {
      messageTokens += message.tool_calls.reduce((toolTotal, toolCall) => {
        return toolTotal + getTokenCount(JSON.stringify(toolCall), model);
      }, 0);
    }
    
    // Add tokens for tool results if present
    if (message.tool_results) {
      messageTokens += message.tool_results.reduce((resultTotal, result) => {
        return resultTotal + getTokenCount(JSON.stringify(result), model);
      }, 0);
    }
    
    return total + messageTokens;
  }, 0);
}

function trimMessagesToTokenLimit(messages, maxTokens, model = 'gpt-4o') {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  
  // Always keep the system message if it exists
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  let totalTokens = systemMessage ? getTokenCount(systemMessage.content, model) : 0;
  const result = systemMessage ? [systemMessage] : [];
  const keptMessages = [];
  
  // Add messages from newest to oldest until we hit the token limit
  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const message = nonSystemMessages[i];
    const messageTokens = getTokenCount(message.content, model);
    
    if (totalTokens + messageTokens <= maxTokens) {
      totalTokens += messageTokens;
      keptMessages.unshift(message); // Add to beginning to maintain order
    } else {
      break;
    }
  }
  
  // Combine system message with kept messages
  if (systemMessage) {
    result.push(...keptMessages);
  } else {
    result.push(...keptMessages);
  }
  
  return result;
}

module.exports = {
  getTokenCount,
  getMessagesTokenCount,
  trimMessagesToTokenLimit
};