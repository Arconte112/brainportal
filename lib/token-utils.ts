import { encoding_for_model, TiktokenModel, get_encoding } from 'tiktoken';
import { ChatMessage } from '@/types';
import { logger } from '@/lib/logger';

// Mapping de modelos a tiktoken models
const MODEL_MAPPING: Record<string, TiktokenModel | string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'anthropic/claude-3.5-sonnet': 'cl100k_base',
  'anthropic/claude-3-haiku': 'cl100k_base',
  'openai/gpt-4o': 'gpt-4o',
  'openai/gpt-4o-mini': 'gpt-4o-mini',
};

export function getTokenCount(text: string, model: string = 'gpt-4o'): number {
  try {
    const modelKey = MODEL_MAPPING[model] || 'cl100k_base';
    
    let encoding;
    try {
      encoding = encoding_for_model(modelKey as TiktokenModel);
    } catch {
      encoding = get_encoding('cl100k_base');
    }
    
    const tokens = encoding.encode(text);
    encoding.free();
    return tokens.length;
  } catch (error) {
    logger.error('Error counting tokens', error, 'TokenUtils');
    // Fallback: rough estimation (1 token ≈ 4 characters)
    return Math.ceil(text.length / 4);
  }
}

export function getMessagesTokenCount(messages: ChatMessage[], model: string = 'gpt-4o'): number {
  return messages.reduce((total, message) => {
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

export function trimMessagesToTokenLimit(
  messages: ChatMessage[],
  maxTokens: number,
  model: string = 'gpt-4o'
): ChatMessage[] {
  if (messages.length === 0) return messages;
  
  // Always keep the system message if it exists
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  let totalTokens = systemMessage ? getTokenCount(systemMessage.content, model) : 0;
  const result: ChatMessage[] = systemMessage ? [systemMessage] : [];
  const keptMessages: ChatMessage[] = [];
  
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

export function updateMessageTokenCounts(messages: ChatMessage[], model: string = 'gpt-4o'): ChatMessage[] {
  return messages.map(message => ({
    ...message,
    token_count: getTokenCount(message.content, model),
  }));
}