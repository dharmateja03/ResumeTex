// Script to clear LLM settings from localStorage
// Run this in browser console: copy and paste this code

console.log('🧹 Clearing LLM settings from localStorage...');

// Clear LLM settings
localStorage.removeItem('llm_provider');
localStorage.removeItem('llm_model');
localStorage.removeItem('llm_api_key');

console.log('✅ LLM settings cleared!');
console.log('🔄 Reload the page to use new OpenRouter defaults');
console.log('📋 OpenRouter (Grok Code Fast 1) will be set as default');
