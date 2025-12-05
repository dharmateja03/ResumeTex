import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, KeyIcon, ServerIcon, CheckIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function LLMSettings() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
  }, [navigate]);
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isButtonAnimating, setIsButtonAnimating] = useState(false);
  const providers = [{
    id: 'openai',
    name: 'OpenAI'
  }, {
    id: 'anthropic',
    name: 'Anthropic'
  }, {
    id: 'google',
    name: 'Google AI'
  }, {
    id: 'mistral',
    name: 'Mistral AI'
  }, {
    id: 'deepseek',
    name: 'DeepSeek'
  }, {
    id: 'openrouter',
    name: 'OpenRouter'
  }, {
    id: 'custom',
    name: 'Custom Provider'
  }];
  const modelsByProvider = {
    openai: [{
      id: 'gpt-4o',
      name: 'GPT-4o'
    }, {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini'
    }, {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo'
    }, {
      id: 'gpt-4',
      name: 'GPT-4'
    }, {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo'
    }],
    anthropic: [{
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Latest)'
    }, {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (June)'
    }, {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku'
    }, {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus'
    }, {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet'
    }, {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku'
    }],
    google: [{
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro'
    }, {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash'
    }, {
      id: 'gemini-1.0-pro',
      name: 'Gemini 1.0 Pro'
    }, {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision'
    }],
    mistral: [{
      id: 'mistral-large-latest',
      name: 'Mistral Large (Latest)'
    }, {
      id: 'mistral-small-latest',
      name: 'Mistral Small (Latest)'
    }, {
      id: 'pixtral-large-latest',
      name: 'Pixtral Large (Latest)'
    }, {
      id: 'open-mistral-7b',
      name: 'Open Mistral 7B'
    }, {
      id: 'open-mixtral-8x7b',
      name: 'Open Mixtral 8x7B'
    }, {
      id: 'open-mixtral-8x22b',
      name: 'Open Mixtral 8x22B'
    }],
    deepseek: [{
      id: 'deepseek-chat',
      name: 'DeepSeek Chat'
    }, {
      id: 'deepseek-coder',
      name: 'DeepSeek Coder'
    }],
    openrouter: [{
      id: 'x-ai/grok-code-fast-1',
      name: 'Grok Code Fast 1'
    }, {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet (via OpenRouter)'
    }, {
      id: 'openai/gpt-4o',
      name: 'GPT-4o (via OpenRouter)'
    }, {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash (Free)'
    }, {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek Chat (via OpenRouter)'
    }],
    custom: [{
      id: 'custom',
      name: 'Custom Model'
    }]
  };
  useEffect(() => {
    // Set default model when provider changes
    if (modelsByProvider[provider]?.length > 0) {
      setModel(modelsByProvider[provider][0].id);
    } else {
      setModel('');
    }
  }, [provider]);
  useEffect(() => {
    // Load saved settings from localStorage
    const savedProvider = localStorage.getItem('llm_provider');
    const savedModel = localStorage.getItem('llm_model');
    const savedApiKey = localStorage.getItem('llm_api_key');

    // If no saved settings, use defaults from environment
    if (!savedProvider && !savedModel && !savedApiKey) {
      const defaultProvider = import.meta.env.VITE_DEFAULT_LLM_PROVIDER || 'openrouter';
      const defaultModel = import.meta.env.VITE_DEFAULT_LLM_MODEL || 'x-ai/grok-code-fast-1';
      const defaultApiKey = import.meta.env.VITE_DEFAULT_LLM_API_KEY || '';

      if (defaultProvider && providers.some(p => p.id === defaultProvider)) {
        setProvider(defaultProvider);
      }
      if (defaultModel) {
        setModel(defaultModel);
      }
      if (defaultApiKey) {
        setApiKey(defaultApiKey);
        // Auto-save defaults to localStorage
        localStorage.setItem('llm_provider', defaultProvider);
        localStorage.setItem('llm_model', defaultModel);
        localStorage.setItem('llm_api_key', defaultApiKey);
        setIsConnected(true);
      }
    } else {
      // Use saved settings
      if (savedProvider && providers.some(p => p.id === savedProvider)) {
        setProvider(savedProvider);
      }
      if (savedModel) {
        setModel(savedModel);
      }
      if (savedApiKey) {
        setApiKey(savedApiKey);
        setIsConnected(true);
      }
    }
  }, []);
  const handleConnect = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }
    setIsButtonAnimating(true);
    setIsLoading(true);

    try {
      // Test connection with backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/llm/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          model: model,
          api_key: apiKey
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Save to localStorage only if connection test passes
        localStorage.setItem('llm_provider', provider);
        localStorage.setItem('llm_model', model);
        localStorage.setItem('llm_api_key', apiKey);
        setIsConnected(true);

        // Show success message and redirect
        alert('LLM Configuration saved successfully!');
        setTimeout(() => {
          window.location.href = '/workspace';
        }, 800);
      } else {
        alert('Connection failed: ' + result.message);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      alert('Connection test failed. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsButtonAnimating(false);
      }, 500);
    }
  };
  const handleDisconnect = () => {
    // Clear localStorage
    localStorage.removeItem('llm_provider');
    localStorage.removeItem('llm_model');
    localStorage.removeItem('llm_api_key');
    setApiKey('');
    setIsConnected(false);
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">
                  ResumeTex
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link to="/workspace" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                Back to Workspace
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg opacity-0 animate-fade-in">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              LLM Settings
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Configure your language model provider and API key
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="space-y-5">
              {/* Provider Dropdown */}
              <div className="relative">
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                  LLM Provider
                </label>
                <div className="mt-1 relative">
                  <button type="button" className="bg-white relative w-full border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)} aria-haspopup="listbox" aria-expanded={isProviderDropdownOpen}>
                    <span className="flex items-center">
                      <ServerIcon className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" aria-hidden="true" />
                      <span className="block truncate">
                        {providers.find(p => p.id === provider)?.name || 'Select provider'}
                      </span>
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </button>
                  {isProviderDropdownOpen && <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm" tabIndex={-1} role="listbox">
                      {providers.map(providerOption => <li key={providerOption.id} className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${provider === providerOption.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`} onClick={() => {
                    setProvider(providerOption.id);
                    setIsProviderDropdownOpen(false);
                  }} role="option" aria-selected={provider === providerOption.id}>
                          <div className="flex items-center">
                            <span className={`block truncate ${provider === providerOption.id ? 'font-medium' : 'font-normal'}`}>
                              {providerOption.name}
                            </span>
                          </div>
                          {provider === providerOption.id && <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>}
                        </li>)}
                    </ul>}
                </div>
              </div>
              {/* Model Dropdown */}
              <div className="relative">
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name
                </label>
                <div className="mt-1 relative">
                  <button type="button" className="bg-white relative w-full border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} aria-haspopup="listbox" aria-expanded={isModelDropdownOpen}>
                    <span className="block truncate">
                      {modelsByProvider[provider]?.find(m => m.id === model)?.name || 'Select model'}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </button>
                  {isModelDropdownOpen && <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm" tabIndex={-1} role="listbox">
                      {modelsByProvider[provider]?.map(modelOption => <li key={modelOption.id} className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${model === modelOption.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`} onClick={() => {
                    setModel(modelOption.id);
                    setIsModelDropdownOpen(false);
                  }} role="option" aria-selected={model === modelOption.id}>
                          <span className={`block truncate ${model === modelOption.id ? 'font-medium' : 'font-normal'}`}>
                            {modelOption.name}
                          </span>
                          {model === modelOption.id && <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>}
                        </li>)}
                    </ul>}
                </div>
              </div>
              {/* API Key Input */}
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input type="password" name="api-key" id="api-key" className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-lg transition-all duration-200" placeholder="Enter your API key" value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={isConnected} />
                </div>
              </div>
              {/* Disclaimer */}
              <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 opacity-0 animate-fade-in delay-100">
                <p>
                  Your API key will be stored locally in your browser and used
                  only for generating documentation. You can also self-host this
                  app by following the instructions in the README.
                </p>
              </div>
            </div>
            <div>
              {!isConnected ? <button type="button" onClick={handleConnect} disabled={isLoading} className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-0 animate-fade-in delay-200 transition-all duration-300 ${isButtonAnimating ? 'scale-95' : 'scale-100'}`}>
                  {isLoading ? <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span> : 'Connect'}
                </button> : <div className="space-y-3 opacity-0 animate-fade-in delay-200">
                  <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 py-2 px-4 rounded-lg">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Connected successfully
                  </div>
                  <button type="button" onClick={handleDisconnect} className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                    Disconnect
                  </button>
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}