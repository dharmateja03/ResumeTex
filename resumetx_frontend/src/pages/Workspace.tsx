import React, { useState, useEffect, useRef } from 'react';
import { FileTextIcon, UploadIcon, CheckCircleIcon, XIcon, SendIcon, DownloadIcon, EditIcon, PlayIcon, AlertCircleIcon, ChevronDownIcon, ServerIcon, KeyIcon, CheckIcon, MailIcon, ClockIcon, BarChart3Icon, User, History, LogOut, Settings, Share2, Moon, Sun, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent, resetUser } from '../lib/posthog';
import { useClerk, useUser, useAuth } from '@clerk/clerk-react';

interface OptimizationResult {
  optimization_id: string;
  status: string;
  optimized_tex?: string;
  original_tex?: string;
  job_description?: string;
  company_name?: string;
  custom_instructions?: string;
  pdf_download_url?: string;
  cold_email?: string;
  cover_letter?: string;
  processing_stats: {
    processing_time_seconds?: number;
    input_chars?: number;
    output_chars?: number;
    provider?: string;
    model?: string;
    cached?: boolean;
  };
}

interface OptimizationStatus {
  optimization_id: string;
  status: string;
  progress: number;
  message?: string;
  result_url?: string;
  error?: string;
  step?: string;
}

// Play notification sound when optimization completes
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant two-tone chime
    oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export function Workspace() {
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken } = useAuth();

  // Auth & Resume state
  const [isDragging, setIsDragging] = useState(false);
  const [resumeTemplates, setResumeTemplates] = useState<{name: string, content: string, size: number}[]>([]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const MAX_TEMPLATES = 4;

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generateColdEmail, setGenerateColdEmail] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);

  // LLM Settings state
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [isLLMConnected, setIsLLMConnected] = useState(false);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [hasLLMUnsavedChanges, setHasLLMUnsavedChanges] = useState(false);

  // Optimization state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [editableLatexCode, setEditableLatexCode] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [originalLatexCode, setOriginalLatexCode] = useState('');
  const [showLatexEditor, setShowLatexEditor] = useState(false);

  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Models by provider
  const providers = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google AI' },
    { id: 'mistral', name: 'Mistral AI' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'custom', name: 'Custom Provider' }
  ];

  const modelsByProvider = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }
    ],
    google: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ],
    mistral: [
      { id: 'mistral-large-latest', name: 'Mistral Large (Latest)' },
      { id: 'mistral-small-latest', name: 'Mistral Small (Latest)' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    openrouter: [
      { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast 1' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (via OpenRouter)' }
    ],
    custom: [{ id: 'custom', name: 'Custom Model' }]
  };

  // Initialize on mount
  useEffect(() => {
    // Apply dark mode
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // Load resume templates
    const savedTemplates = localStorage.getItem('resume_templates');
    const savedSelectedIndex = localStorage.getItem('selected_template_index');
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        setResumeTemplates(templates);
        if (savedSelectedIndex !== null && templates.length > 0) {
          const idx = parseInt(savedSelectedIndex);
          setSelectedTemplateIndex(idx < templates.length ? idx : 0);
        } else if (templates.length > 0) {
          setSelectedTemplateIndex(0);
        }
      } catch (error) {
        console.error('Error loading resume templates:', error);
      }
    }
    // Migration: load old single resume if exists
    const existingContent = localStorage.getItem('user_resume_content');
    const existingFilename = localStorage.getItem('user_resume_filename');
    if (existingContent && existingFilename && !savedTemplates) {
      const migratedTemplates = [{ name: existingFilename, content: existingContent, size: existingContent.length }];
      setResumeTemplates(migratedTemplates);
      setSelectedTemplateIndex(0);
      localStorage.setItem('resume_templates', JSON.stringify(migratedTemplates));
      localStorage.removeItem('user_resume_content');
      localStorage.removeItem('user_resume_filename');
    }

    // Load LLM settings
    const savedProvider = localStorage.getItem('llm_provider');
    const savedModel = localStorage.getItem('llm_model');
    const savedApiKey = localStorage.getItem('llm_api_key');

    // If no saved settings, use defaults from environment
    if (!savedProvider && !savedModel && !savedApiKey) {
      const defaultProvider = import.meta.env.VITE_DEFAULT_LLM_PROVIDER || 'openrouter';
      const defaultModel = import.meta.env.VITE_DEFAULT_LLM_MODEL || 'x-ai/grok-code-fast-1';
      const defaultApiKey = import.meta.env.VITE_DEFAULT_LLM_API_KEY || '';

      setLlmProvider(defaultProvider);
      setLlmModel(defaultModel);
      if (defaultApiKey) {
        setLlmApiKey(defaultApiKey);
        setIsLLMConnected(true);
        // Auto-save defaults to localStorage
        localStorage.setItem('llm_provider', defaultProvider);
        localStorage.setItem('llm_model', defaultModel);
        localStorage.setItem('llm_api_key', defaultApiKey);
      }
    } else {
      // Use saved settings
      if (savedProvider) setLlmProvider(savedProvider);
      if (savedModel) setLlmModel(savedModel);
      if (savedApiKey) {
        setLlmApiKey(savedApiKey);
        setIsLLMConnected(true);
      }
    }

    // Load form data
    const storedFormData = localStorage.getItem('optimize_form_data');
    if (storedFormData) {
      try {
        const formData = JSON.parse(storedFormData);
        if (formData.company_name) setCompanyName(formData.company_name);
        if (formData.job_description) setJobDescription(formData.job_description);
        if (formData.custom_instructions) setCustomInstructions(formData.custom_instructions);
      } catch (error) {
        console.error('Error parsing stored form data:', error);
      }
    }
  }, []);

  // Update default model when provider changes
  useEffect(() => {
    if (modelsByProvider[llmProvider]?.length > 0) {
      setLlmModel(modelsByProvider[llmProvider][0].id);
    }
  }, [llmProvider]);

  // Track unsaved LLM changes
  useEffect(() => {
    const savedProvider = localStorage.getItem('llm_provider');
    const savedModel = localStorage.getItem('llm_model');
    const savedApiKey = localStorage.getItem('llm_api_key');
    
    // Check if ANY setting differs from saved values
    const hasChanges = 
      llmProvider !== savedProvider || 
      llmModel !== savedModel || 
      llmApiKey !== savedApiKey;
    
    setHasLLMUnsavedChanges(hasChanges && isLLMConnected);
  }, [llmProvider, llmModel, llmApiKey, isLLMConnected]);

  // Save form data to localStorage
  const saveFormData = () => {
    localStorage.setItem('optimize_form_data', JSON.stringify({
      company_name: companyName,
      job_description: jobDescription,
      custom_instructions: customInstructions,
      timestamp: Date.now()
    }));
  };

  // Handle resume upload
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.tex')) {
      handleResumeFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeFile(e.target.files[0]);
    }
  };

  const handleResumeFile = (file: File) => {
    if (resumeTemplates.length >= MAX_TEMPLATES) {
      alert(`Maximum ${MAX_TEMPLATES} templates allowed. Please delete one to add more.`);
      return;
    }
    // Check for duplicate filename
    if (resumeTemplates.some(t => t.name === file.name)) {
      alert(`A template with name "${file.name}" already exists.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newTemplate = { name: file.name, content, size: file.size };
      const updatedTemplates = [...resumeTemplates, newTemplate];
      setResumeTemplates(updatedTemplates);
      setSelectedTemplateIndex(updatedTemplates.length - 1); // Select newly added
      localStorage.setItem('resume_templates', JSON.stringify(updatedTemplates));
      localStorage.setItem('selected_template_index', String(updatedTemplates.length - 1));

      // Track resume upload
      trackEvent('resume_uploaded', {
        file_name: file.name,
        file_size: file.size,
        content_length: content.length,
        total_templates: updatedTemplates.length,
      });
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplateIndex(index);
    localStorage.setItem('selected_template_index', String(index));
  };

  const handleDeleteTemplate = (index: number) => {
    const updatedTemplates = resumeTemplates.filter((_, i) => i !== index);
    setResumeTemplates(updatedTemplates);
    localStorage.setItem('resume_templates', JSON.stringify(updatedTemplates));

    // Update selected index
    if (updatedTemplates.length === 0) {
      setSelectedTemplateIndex(null);
      localStorage.removeItem('selected_template_index');
    } else if (selectedTemplateIndex !== null) {
      if (index === selectedTemplateIndex) {
        // Deleted the selected one, select first
        setSelectedTemplateIndex(0);
        localStorage.setItem('selected_template_index', '0');
      } else if (index < selectedTemplateIndex) {
        // Deleted one before selected, adjust index
        setSelectedTemplateIndex(selectedTemplateIndex - 1);
        localStorage.setItem('selected_template_index', String(selectedTemplateIndex - 1));
      }
    }
  };

  // LLM Settings
  const handleLLMConnect = async () => {
    if (!llmApiKey.trim()) {
      alert('Please enter an API key');
      return;
    }
    setIsLLMLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/llm/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmProvider,
          model: llmModel,
          api_key: llmApiKey
        })
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        localStorage.setItem('llm_provider', llmProvider);
        localStorage.setItem('llm_model', llmModel);
        localStorage.setItem('llm_api_key', llmApiKey);
        setIsLLMConnected(true);
        alert('✅ LLM Configuration saved!');
        setShowLLMModal(false);
      } else {
        alert('Connection failed: ' + result.message);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      alert('Connection test failed. Please make sure the backend is running.');
    } finally {
      setIsLLMLoading(false);
    }
  };

  const handleLLMDisconnect = () => {
    localStorage.removeItem('llm_provider');
    localStorage.removeItem('llm_model');
    localStorage.removeItem('llm_api_key');
    setLlmApiKey('');
    setIsLLMConnected(false);
  };

  // Optimization
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplateIndex === null || resumeTemplates.length === 0) {
      alert('Please upload and select a resume template first!');
      return;
    }
    if (!isLLMConnected) {
      setShowLLMModal(true);
      return;
    }
    if (!companyName.trim() || !jobDescription.trim()) {
      alert('Please fill in company name and job description');
      return;
    }

    setIsSubmitting(true);
    saveFormData();

    try {
      const selectedTemplate = resumeTemplates[selectedTemplateIndex];
      const llmProviderStored = localStorage.getItem('llm_provider');
      const llmModelStored = localStorage.getItem('llm_model');
      const llmApiKeyStored = localStorage.getItem('llm_api_key');

      // Get auth token for user tracking
      const token = await getToken();

      const optimizationRequest = {
        tex_content: selectedTemplate.content,
        job_description: jobDescription,
        company_name: companyName,
        target_location: targetLocation || null,
        custom_instructions: customInstructions,
        generate_cold_email: generateColdEmail,
        generate_cover_letter: generateCoverLetter,
        llm_config: {
          provider: llmProviderStored,
          model: llmModelStored,
          api_key: llmApiKeyStored
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(optimizationRequest)
      });

      if (response.ok) {
        const result = await response.json();
        setOptimizationId(result.optimization_id);
      } else {
        const error = await response.json();
        alert('Optimization failed: ' + (error.detail || 'Unknown error'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start optimization.');
      setIsSubmitting(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!optimizationId || !isSubmitting) return;

    const pollStatus = async () => {
      try {
        const statusResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/status`);
        const statusData = await statusResponse.json();
        setStatus(statusData);

        // Fetch result for both completed AND failed statuses
        if ((statusData.status === 'completed' && statusData.result_url) || statusData.status === 'failed') {
          const resultResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/result`);
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            setResult(resultData);
            if (resultData.optimized_tex) setEditableLatexCode(resultData.optimized_tex);
            if (resultData.original_tex) setOriginalLatexCode(resultData.original_tex);
            setIsSubmitting(false);
            setShowResults(true);
            if (statusData.status === 'completed') {
              playNotificationSound();
            }
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          } else if (statusData.status === 'failed') {
            // Even if result fetch fails, show results with error message
            setIsSubmitting(false);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [optimizationId, isSubmitting]);

  // Step stepper data
  const processingSteps = [
    { label: 'Reading Resume', key: 'reading' },
    { label: 'Analyzing Job Description', key: 'analyzing' },
    { label: 'Matching Keywords', key: 'matching' },
    { label: 'Compiling PDF', key: 'compiling' }
  ];

  const getCompletedSteps = () => {
    if (!status) return 0;
    const currentProgress = status.progress || 0;
    return Math.ceil((currentProgress / 100) * processingSteps.length);
  };

  return (
    <div className={`w-full min-h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`shadow sticky top-0 z-40 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>ResumeTex Workspace</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Optimize your resume for any job</p>
          </div>
          <div className="flex items-center space-x-4">
            {isLLMConnected && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">LLM Connected</span>
              </div>
            )}
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <User className="h-6 w-6 text-gray-700" />
              </button>
              {showProfileDropdown && (
                <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border py-2 z-50`}>
                  <button
                    onClick={() => {
                      navigate('/history');
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} flex items-center space-x-2`}
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowLLMModal(true);
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} flex items-center space-x-2`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>{isLLMConnected ? 'LLM Settings' : 'Setup LLM'}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/analytics');
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} flex items-center space-x-2`}
                  >
                    <BarChart3Icon className="h-4 w-4" />
                    <span>Analytics</span>
                  </button>

                  <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                  {/* Refer a Friend */}
                  <button
                    onClick={() => {
                      // Get user identifier for referral tracking
                      const referrerName = user?.username || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'friend';
                      const referrerId = user?.id || 'unknown';
                      const referralLink = `${window.location.origin}?ref=${encodeURIComponent(referrerName)}&ref_id=${referrerId}&utm_source=referral&utm_medium=share`;
                      navigator.clipboard.writeText(referralLink);
                      alert('Referral link copied! Share it with your friends.');
                      trackEvent('referral_link_copied', {
                        referrer_name: referrerName,
                        referrer_id: referrerId,
                        referrer_email: user?.primaryEmailAddress?.emailAddress
                      });
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'} flex items-center space-x-2`}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Refer a Friend</span>
                  </button>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => {
                      const newDarkMode = !darkMode;
                      setDarkMode(newDarkMode);
                      localStorage.setItem('darkMode', newDarkMode.toString());
                      document.documentElement.classList.toggle('dark', newDarkMode);
                      trackEvent('dark_mode_toggled', { enabled: newDarkMode });
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} flex items-center space-x-2`}
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                  <button
                    onClick={async () => {
                      // Clear all local storage items
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('user_info');
                      localStorage.removeItem('llm_provider');
                      localStorage.removeItem('llm_model');
                      localStorage.removeItem('llm_api_key');
                      // Reset PostHog user
                      resetUser();
                      // Sign out from Clerk
                      await signOut();
                      navigate('/login');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {!showResults ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Panel: Resume */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Resume Templates
                </h2>
                <p className="text-sm text-gray-600 mt-1">Upload up to {MAX_TEMPLATES} templates, select one to optimize</p>
              </div>

              {/* Template List */}
              {resumeTemplates.length > 0 && (
                <div className="space-y-2 mb-4">
                  {resumeTemplates.map((template, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition ${
                        selectedTemplateIndex === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectTemplate(index)}
                    >
                      <div className="flex items-center flex-1">
                        <input
                          type="radio"
                          name="resume-template"
                          checked={selectedTemplateIndex === index}
                          onChange={() => handleSelectTemplate(index)}
                          className="h-4 w-4 text-blue-600 mr-3"
                        />
                        <FileTextIcon className="h-6 w-6 text-blue-600 mr-2" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{template.name}</p>
                          <p className="text-xs text-gray-500">{(template.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(index); }}
                        className="text-gray-400 hover:text-red-500 ml-2"
                        title="Delete template"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {resumeTemplates.length < MAX_TEMPLATES && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-700 text-sm">
                    {resumeTemplates.length === 0 ? 'Drag and drop your .tex file or ' : 'Add another template: '}
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                      browse
                      <input type="file" className="hidden" accept=".tex" onChange={handleFileInput} />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {resumeTemplates.length}/{MAX_TEMPLATES} templates • Only .tex files
                  </p>
                </div>
              )}

              {/* Selected template indicator */}
              {selectedTemplateIndex !== null && resumeTemplates.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 text-green-800 rounded text-sm flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Selected: {resumeTemplates[selectedTemplateIndex]?.name}
                </div>
              )}
            </div>

            {/* Right Panel: Job Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Job Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Location (Optional)</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g., San Francisco, CA - replaces your current location"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Instructions (Optional)
                    </label>
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/docs', '_blank');
                      }}
                    >
                      View docs
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Add specific instructions for your resume optimization...&#10;&#10;Examples:&#10;• Highlight leadership and management experience&#10;• Focus on quantifiable achievements&#10;• Emphasize technical skills in Python and AWS&#10;• Use action verbs at the start of each bullet point"
                      rows={4}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-y min-h-[100px]"
                      style={{
                        lineHeight: '1.6',
                        background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
                      }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
                      {customInstructions.length} characters
                    </div>
                  </div>
                </div>

                {/* Optional Add-ons */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Optional Add-ons</p>
                  <label className="flex items-start text-sm cursor-pointer mb-2">
                    <input type="checkbox" checked={generateColdEmail} onChange={(e) => setGenerateColdEmail(e.target.checked)} className="mt-1 mr-2" />
                    <span>Generate Cold Email</span>
                  </label>
                  <label className="flex items-start text-sm cursor-pointer">
                    <input type="checkbox" checked={generateCoverLetter} onChange={(e) => setGenerateCoverLetter(e.target.checked)} className="mt-1 mr-2" />
                    <span>Generate Cover Letter</span>
                  </label>
                </div>

                {/* Floating Optimize Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedTemplateIndex === null}
                  className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center transition ${
                    isSubmitting || selectedTemplateIndex === null
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4 mr-2" />
                      Optimize Resume
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Processing Status with Step Stepper */}
        {isSubmitting && status && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Processing Your Resume</h3>
            <div className="space-y-3">
              {processingSteps.map((step, idx) => {
                const isCompleted = idx < getCompletedSteps();
                const isActive = idx === getCompletedSteps();
                return (
                  <div key={step.key} className="flex items-center">
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 transition ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckIcon className="h-4 w-4" /> : isActive ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : idx + 1}
                    </div>
                    <span className={`text-sm ${isCompleted ? 'text-green-700 font-medium' : isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${status.progress}%` }}></div>
              </div>
              <p className="text-xs text-blue-700 mt-2 text-right">{status.progress}% Complete</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <div ref={resultsRef} className="mt-8 space-y-6">
            {status?.status === 'completed' && result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Optimization Complete!</h3>
                    <p className="text-sm text-green-700">Your resume has been optimized for {companyName}</p>
                  </div>
                </div>
              </div>
            )}

            {status?.status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <AlertCircleIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Optimization Failed</h3>
                    <p className="text-sm text-red-700">{status?.error || 'PDF compilation failed, but LaTeX code is available below'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Editor with 3-pane layout */}
            <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <div className="h-full flex flex-col">
                <div className="bg-gray-100 border-b px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Resume Editor & Preview</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowJobDetails(!showJobDetails)}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        showJobDetails ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Job Details
                    </button>
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className={`px-3 py-1 text-sm rounded border transition ${
                        showDiff ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Show Changes
                    </button>
                    <button
                      onClick={() => setShowLatexEditor(true)}
                      className="px-3 py-1 text-sm rounded border bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                    >
                      Fullscreen Edit
                    </button>
                  </div>
                </div>

                {showJobDetails && (
                  <div className="border-b bg-gray-50 p-3 overflow-y-auto max-h-32">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-medium text-gray-800">Company</p>
                        <p className="text-gray-600 truncate">{companyName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Job Description Preview</p>
                        <p className="text-gray-600 line-clamp-2">{jobDescription}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3-pane layout */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Left: Context */}
                  {showDiff && (
                    <div className="w-1/3 border-r bg-red-50 p-3 overflow-y-auto">
                      <h4 className="text-xs font-semibold text-red-800 mb-2">Original Resume</h4>
                      <pre className="text-xs text-red-900 font-mono whitespace-pre-wrap leading-tight">
                        {originalLatexCode.substring(0, 1000)}...
                      </pre>
                    </div>
                  )}

                  {/* Middle: Code */}
                  <div className={showDiff ? 'w-1/3' : 'w-2/3'} style={{ borderRight: showDiff ? '1px solid #e5e7eb' : 'none' }}>
                    <div className="flex flex-col h-full">
                      <textarea
                        value={editableLatexCode}
                        onChange={(e) => setEditableLatexCode(e.target.value)}
                        className="flex-1 p-3 font-mono text-xs resize-none outline-none"
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  {/* Right: Preview (if not showing diff) */}
                  {!showDiff && (
                    <div className="w-1/3 border-l bg-gray-100 p-3 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-gray-700">PDF Preview</p>
                        <button
                          onClick={async () => {
                            setIsCompiling(true);
                            try {
                              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/compile-latex`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ tex_content: editableLatexCode, optimization_id: optimizationId, company_name: companyName || 'resume' })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.pdf_download_url) {
                                  const viewUrl = data.pdf_download_url + '/view';
                                  setCompiledPdfUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${viewUrl}?t=${Date.now()}`);
                                }
                              }
                            } catch (error) {
                              console.error('Error:', error);
                              alert('Compilation failed');
                            } finally {
                              setIsCompiling(false);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={isCompiling}
                        >
                          {isCompiling ? 'Compiling...' : 'Compile'}
                        </button>
                      </div>
                      {compiledPdfUrl ? (
                        <iframe src={compiledPdfUrl} className="flex-1 border-0 rounded" title="PDF Preview" />
                      ) : (
                        <div className="flex-1 bg-white flex items-center justify-center rounded border">
                          <p className="text-xs text-gray-500 text-center">Click "Compile" to see preview</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right: Diff view */}
                  {showDiff && (
                    <div className="w-1/3 bg-green-50 p-3 overflow-y-auto">
                      <h4 className="text-xs font-semibold text-green-800 mb-2">Optimized Resume (Highlighted)</h4>
                      <pre className="text-xs text-green-900 font-mono whitespace-pre-wrap leading-tight">
                        {editableLatexCode
                          .split('\n')
                          .map((line) => {
                            const inOriginal = originalLatexCode.includes(line);
                            return inOriginal ? line : <mark key={line} style={{ backgroundColor: '#86efac' }}>{line}</mark>;
                          })
                          .reduce((acc, el, i) => [...acc, el, '\n'], [])
                          .slice(0, -1)
                          .join('')}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download & Copy sections */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Download & Share</h3>
              <div className="flex flex-wrap gap-3">
                {result?.pdf_download_url && (
                  <button
                    onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${result.pdf_download_url}`, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editableLatexCode);
                    alert('LaTeX copied!');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Copy LaTeX
                </button>
              </div>
            </div>

            {/* Cold Email & Cover Letter */}
            {result?.cold_email && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MailIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Cold Email
                </h3>
                <div className="bg-gray-50 p-4 rounded border max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">{result.cold_email}</pre>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.cold_email!);
                    alert('Copied!');
                  }}
                  className="mt-3 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Copy Email
                </button>
              </div>
            )}

            {result?.cover_letter && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileTextIcon className="h-5 w-5 mr-2 text-green-600" />
                  Cover Letter
                </h3>
                <div className="bg-gray-50 p-4 rounded border max-h-48 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800">{result.cover_letter}</pre>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.cover_letter!);
                    alert('Copied!');
                  }}
                  className="mt-3 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Copy Letter
                </button>
              </div>
            )}

            {result.processing_stats && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Processing Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {result.processing_stats.processing_time_seconds && (
                    <div>
                      <p className="text-gray-500 font-medium">Time</p>
                      <p className="text-lg font-semibold">{result.processing_stats.processing_time_seconds.toFixed(1)}s</p>
                    </div>
                  )}
                  {result.processing_stats.provider && (
                    <div>
                      <p className="text-gray-500 font-medium">Provider</p>
                      <p className="text-lg font-semibold capitalize">{result.processing_stats.provider}</p>
                    </div>
                  )}
                  {result.processing_stats.model && (
                    <div>
                      <p className="text-gray-500 font-medium">Model</p>
                      <p className="text-lg font-semibold">{result.processing_stats.model}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowResults(false);
                setOptimizationId(null);
                setStatus(null);
                setResult(null);
                setCompanyName('');
                setJobDescription('');
                setCustomInstructions('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Start New Optimization
            </button>
          </div>
        )}
      </main>

      {/* LLM Settings Modal */}
      {showLLMModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">LLM Configuration</h2>

            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left flex items-center justify-between hover:border-gray-400"
                  >
                    <span>{providers.find((p) => p.id === llmProvider)?.name || 'Select'}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  {isProviderDropdownOpen && (
                    <ul className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10">
                      {providers.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => {
                            setLlmProvider(p.id);
                            setIsProviderDropdownOpen(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left flex items-center justify-between hover:border-gray-400"
                  >
                    <span>{modelsByProvider[llmProvider]?.find((m) => m.id === llmModel)?.name || 'Select'}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  {isModelDropdownOpen && (
                    <ul className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-lg bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                      {modelsByProvider[llmProvider]?.map((m) => (
                        <li
                          key={m.id}
                          onClick={() => {
                            setLlmModel(m.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {m.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder="Paste your API key"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Your API key is stored locally in your browser only and never sent to our servers.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLLMModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {isLLMConnected ? (
                <>
                  {hasLLMUnsavedChanges && (
                    <button
                      onClick={handleLLMConnect}
                      disabled={isLLMLoading}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-75"
                    >
                      {isLLMLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                  <button
                    onClick={handleLLMDisconnect}
                    className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLLMConnect}
                  disabled={isLLMLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-75"
                >
                  {isLLMLoading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
