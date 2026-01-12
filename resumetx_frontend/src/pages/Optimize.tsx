import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, BriefcaseIcon, FileTextIcon, SendIcon, CheckCircleIcon, XIcon, DownloadIcon, MailIcon, ClockIcon, AlertCircleIcon, EyeIcon, EditIcon, PlayIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/posthog';

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

export function Optimize() {
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      navigate('/login');
      return;
    }

    // Restore form data from localStorage if available
    const storedFormData = localStorage.getItem('optimize_form_data');
    if (storedFormData) {
      try {
        const formData = JSON.parse(storedFormData);
        if (formData.company_name) setCompanyName(formData.company_name);
        if (formData.job_description) setJobDescription(formData.job_description);
        if (formData.custom_instructions) setCustomInstructions(formData.custom_instructions);
        console.log('Restored form data from localStorage');
      } catch (error) {
        console.error('Error parsing stored form data:', error);
      }
    }
  }, [navigate]);
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generateColdEmail, setGenerateColdEmail] = useState(false);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showLatex, setShowLatex] = useState(false);
  const [showLatexEditor, setShowLatexEditor] = useState(false);
  const [editableLatexCode, setEditableLatexCode] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [originalLatexCode, setOriginalLatexCode] = useState('');

  // Function to save form data to localStorage
  const saveFormData = (company: string, job: string, instructions: string) => {
    const formData = {
      company_name: company,
      job_description: job,
      custom_instructions: instructions,
      timestamp: Date.now()
    };
    localStorage.setItem('optimize_form_data', JSON.stringify(formData));
  };

  // Enhanced setters that also save to localStorage
  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    saveFormData(value, jobDescription, customInstructions);
  };

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    saveFormData(companyName, value, customInstructions);
  };

  const handleCustomInstructionsChange = (value: string) => {
    setCustomInstructions(value);
    saveFormData(companyName, jobDescription, value);
  };

  // Function to clear all form data
  const clearFormData = () => {
    setCompanyName('');
    setJobDescription('');
    setCustomInstructions('');
    setShowResults(false);
    setResult(null);
    setStatus(null);
    setOptimizationId(null);
    localStorage.removeItem('optimize_form_data');
    console.log('Form data cleared');
  };

  // Poll for optimization status
  useEffect(() => {
    if (!optimizationId || !isSubmitting) return;

    const pollStatus = async () => {
      try {
        const statusResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/status`);
        const statusData = await statusResponse.json();
        setStatus(statusData);

        if (statusData.status === 'completed' && statusData.result_url) {
          const resultResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/result`);
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            setResult(resultData);

            // Set editable and original LaTeX
            if (resultData.optimized_tex) {
              setEditableLatexCode(resultData.optimized_tex);
            }
            if (resultData.original_tex) {
              setOriginalLatexCode(resultData.original_tex);
            }

            setIsSubmitting(false);
            setIsSuccess(true);
            setShowResults(true);
            playNotificationSound();

            // Track optimization count for this user
            const optimizationCount = parseInt(localStorage.getItem('total_optimizations') || '0') + 1;
            localStorage.setItem('total_optimizations', optimizationCount.toString());

            // Track optimization completed
            trackEvent('resume_optimization_completed', {
              optimization_id: optimizationId,
              processing_time: resultData.processing_stats?.processing_time_seconds,
              provider: resultData.processing_stats?.provider,
              model: resultData.processing_stats?.model,
              has_pdf: !!resultData.pdf_download_url,
              has_cold_email: !!resultData.cold_email,
              has_cover_letter: !!resultData.cover_letter,
              total_user_optimizations: optimizationCount,
              is_regeneration: optimizationCount > 1,
            });

            // Scroll to results
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        } else if (statusData.status === 'failed') {
          setIsSubmitting(false);
          setShowResults(true);

          // Track optimization failed
          trackEvent('resume_optimization_failed', {
            optimization_id: optimizationId,
            error: statusData.error,
          });
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    // Poll immediately and then every 3 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [optimizationId, isSubmitting]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleEditLatex = () => {
    if (!editableLatexCode && result?.optimized_tex) {
      setEditableLatexCode(result.optimized_tex);
    }

    if (!compiledPdfUrl && result?.pdf_download_url) {
      const viewUrl = result.pdf_download_url + '/view';
      setCompiledPdfUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${viewUrl}`);
    }

    setShowLatexEditor(true);
  };

  const handleCloseEditor = () => {
    setShowLatexEditor(false);
    if (result?.optimized_tex) {
      setEditableLatexCode(result.optimized_tex);
    }
    setCompiledPdfUrl(null);
  };

  const handleCompileLatex = async () => {
    try {
      setIsCompiling(true);
      console.log('Compiling LaTeX code...');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tex_content: editableLatexCode,
          optimization_id: optimizationId,
          company_name: result?.company_name || companyName || 'resume'
        })
      });

      if (response.ok) {
        const compileResult = await response.json();
        console.log('Compilation successful:', compileResult);

        if (compileResult.pdf_download_url) {
          const timestamp = Date.now();
          const viewUrl = compileResult.pdf_download_url.replace('/download/', '/download/') + '/view';
          setCompiledPdfUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${viewUrl}?t=${timestamp}`);
          console.log('PDF preview updated:', viewUrl);
        }
      } else {
        const error = await response.json();
        console.error('Compilation failed:', error);
        alert('Compilation failed: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error compiling LaTeX:', error);
      alert('Failed to compile LaTeX. Please check the code and try again.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPDF = () => {
    if (result?.pdf_download_url) {
      trackEvent('resume_pdf_downloaded', {
        optimization_id: result.optimization_id,
        company_name: result.company_name,
      });
      window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${result.pdf_download_url}`, '_blank');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user has uploaded a resume file
      const userResumeContent = localStorage.getItem('user_resume_content');
      const userResumeFilename = localStorage.getItem('user_resume_filename');
      
      if (!userResumeContent) {
        alert('Please upload your resume file in the Workspace first!');
        navigate('/workspace');
        return;
      }
      
      console.log('Using uploaded resume:', userResumeFilename, userResumeContent.length, 'characters');
      const texContentToOptimize = userResumeContent;

      // Get LLM configuration from localStorage
      const llmProvider = localStorage.getItem('llm_provider');
      const llmModel = localStorage.getItem('llm_model');
      const llmApiKey = localStorage.getItem('llm_api_key');

      if (!llmProvider || !llmModel || !llmApiKey) {
        alert('Please configure your LLM settings first');
        setIsSubmitting(false);
        return;
      }

      // Prepare the optimization request
      const optimizationRequest = {
        tex_content: texContentToOptimize,
        job_description: jobDescription,
        company_name: companyName,
        custom_instructions: customInstructions,
        generate_cold_email: generateColdEmail,
        generate_cover_letter: generateCoverLetter,
        llm_config: {
          provider: llmProvider,
          model: llmModel,
          api_key: llmApiKey
        }
      };

      console.log('Sending optimization request:', {
        tex_content: `${optimizationRequest.tex_content.substring(0, 100)}...`,
        job_description: `${optimizationRequest.job_description.substring(0, 100)}...`,
        company_name: optimizationRequest.company_name,
        custom_instructions: optimizationRequest.custom_instructions,
        llm_config: {
          provider: optimizationRequest.llm_config.provider,
          model: optimizationRequest.llm_config.model,
          api_key: '***REDACTED***'
        }
      });

      // Call the backend optimization API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizationRequest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Optimization started:', result);

        // Extract potential job title from job description
        const extractJobTitle = (description: string): string => {
          const lines = description.split('\n');
          const titlePatterns = [
            /(?:position|role|title):\s*([^\n]+)/i,
            /(?:job title|position title):\s*([^\n]+)/i,
            /^([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Lead|Director|Coordinator|Specialist|Consultant|Architect|Administrator|Associate|Assistant))$/im
          ];

          for (const line of lines.slice(0, 10)) {
            for (const pattern of titlePatterns) {
              const match = line.match(pattern);
              if (match && match[1]) {
                return match[1].trim();
              }
            }
          }
          return 'Unknown';
        };

        const jobTitle = extractJobTitle(jobDescription);

        // Track optimization started with job title
        trackEvent('resume_optimization_started', {
          company_name: companyName,
          job_title: jobTitle,
          llm_provider: llmProvider,
          llm_model: llmModel,
          has_custom_instructions: !!customInstructions,
          generate_cold_email: generateColdEmail,
          generate_cover_letter: generateCoverLetter,
          job_description_length: jobDescription.length,
          timestamp: new Date().toISOString(),
        });

        setOptimizationId(result.optimization_id);

        // Store job details in localStorage for persistence
        const jobDetails = {
          optimization_id: result.optimization_id,
          company_name: companyName,
          job_description: jobDescription,
          custom_instructions: customInstructions,
          timestamp: Date.now()
        };
        localStorage.setItem(`job_details_${result.optimization_id}`, JSON.stringify(jobDetails));

        // Polling will handle the rest
      } else {
        const error = await response.json();
        console.error('Optimization failed:', error);
        alert('Optimization failed: ' + (error.detail || 'Unknown error'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error calling optimization API:', error);
      alert('Failed to start optimization. Make sure the backend is running.');
      setIsSubmitting(false);
    }
  };
  return <div className="w-full min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 opacity-0 animate-fade-in">
              Optimize Resume
            </h1>
            <p className="mt-1 text-gray-600 opacity-0 animate-fade-in delay-100">
              Tailor your resume for a specific job
            </p>
            <p className="mt-1 text-xs text-green-600 opacity-0 animate-fade-in delay-200">
              💾 Your form data is automatically saved as you type
            </p>
          </div>
          <Link to="/workspace" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
            <ArrowLeftIcon size={16} className="mr-1" />
            Back to Workspace
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 opacity-0 animate-fade-in delay-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
              <BriefcaseIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Job-Specific Optimization
              </h2>
              <p className="text-sm text-gray-500">
                Provide details about the job you're applying for
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input type="text" id="company" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Acme Corporation" value={companyName} onChange={e => handleCompanyNameChange(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <textarea id="jobDescription" rows={6} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Paste the full job description here..." value={jobDescription} onChange={e => handleJobDescriptionChange(e.target.value)} required></textarea>
                <p className="mt-1 text-sm text-gray-500">
                  Paste the full job description to help our AI identify key
                  requirements and skills
                </p>
              </div>
              <div>
                <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700">
                  Custom AI Instructions (Optional)
                </label>
                <textarea id="customInstructions" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Any specific instructions for our AI? E.g., 'Focus on my technical projects' or 'Highlight leadership experience'" value={customInstructions} onChange={e => handleCustomInstructionsChange(e.target.value)}></textarea>
              </div>

              {/* Optional Add-ons */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Optional Add-ons</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      id="generateColdEmail"
                      type="checkbox"
                      checked={generateColdEmail}
                      onChange={(e) => setGenerateColdEmail(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="generateColdEmail" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        Generate Cold Email (max 250 words)
                      </span>
                      <span className="block text-xs text-gray-500">
                        Get a personalized cold email to reach out to recruiters
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="generateCoverLetter"
                      type="checkbox"
                      checked={generateCoverLetter}
                      onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="generateCoverLetter" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">
                        Generate Cover Letter
                      </span>
                      <span className="block text-xs text-gray-500">
                        Get a professional cover letter tailored to the job (250-400 words)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FileTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Using your uploaded resume
                    </h3>
                    <p className="text-xs text-gray-500">
                      File: {localStorage.getItem('user_resume_filename') || 'No file uploaded'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {localStorage.getItem('user_resume_content')?.length || 0} characters
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={clearFormData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Clear Form
                </button>
                
                <button type="submit" className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`} disabled={isSubmitting}>
                  {isSubmitting ? <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </> : <>
                      <SendIcon className="h-4 w-4 mr-2" />
                      Optimize Resume
                    </>}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {/* Processing Status */}
        {isSubmitting && status && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 opacity-0 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-800">
                    {status.status === 'processing' ? 'Optimizing Your Resume...' : 'Processing...'}
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">{status.message}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">{status.progress}%</div>
                <div className="w-32 bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {showResults && result && (
          <div ref={resultsRef} className="mt-8 space-y-6 opacity-0 animate-fade-in">
            {/* Success Header */}
            {result.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-green-800">
                      Resume Optimization Complete!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Your resume has been successfully optimized for {companyName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Options */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Download Options</h3>
              <div className="flex space-x-4">
                {result.pdf_download_url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                )}
                <button
                  onClick={() => setShowLatex(!showLatex)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {showLatex ? 'Hide' : 'Show'} LaTeX Code
                </button>
                <button
                  onClick={handleEditLatex}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit LaTeX
                </button>
              </div>
            </div>

            {/* Processing Stats */}
            {result.processing_stats && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.processing_stats.processing_time_seconds && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Processing Time</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.processing_stats.processing_time_seconds.toFixed(1)}s
                      </p>
                    </div>
                  )}
                  {result.processing_stats.provider && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">AI Provider</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {result.processing_stats.provider}
                      </p>
                    </div>
                  )}
                  {result.processing_stats.model && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Model Used</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.processing_stats.model}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cold Email */}
            {result.cold_email && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <MailIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Cold Email</h3>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.cold_email!);
                      alert('Cold email copied to clipboard!');
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {result.cold_email}
                  </pre>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Personalize this email further with specific details about the company or hiring manager before sending.
                </p>
              </div>
            )}

            {/* Cover Letter */}
            {result.cover_letter && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <FileTextIcon className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Cover Letter</h3>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.cover_letter!);
                      alert('Cover letter copied to clipboard!');
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                    {result.cover_letter}
                  </pre>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Review and customize the cover letter to match your personal writing style and add any specific examples.
                </p>
              </div>
            )}

            {/* LaTeX Code Display */}
            {showLatex && result.optimized_tex && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Optimized LaTeX Code</h3>
                  <button
                    onClick={() => copyToClipboard(result.optimized_tex!)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-green-400 font-mono">
                    <code>{result.optimized_tex}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LaTeX Editor Modal */}
        {showLatexEditor && result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg w-[90%] h-[90%] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-semibold">Edit LaTeX Resume</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowJobDetails(!showJobDetails)}
                      className={`px-3 py-1 text-sm rounded-md border ${showJobDetails ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Job Details
                    </button>
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className={`px-3 py-1 text-sm rounded-md border ${showDiff ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Show Diff
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditor}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XIcon size={20} />
                </button>
              </div>

              {/* Job Details Panel */}
              {showJobDetails && (
                <div className="border-b bg-gray-50 p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Company</h4>
                      <p className="text-gray-600">{result.company_name || companyName || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-gray-800 mb-2">Job Description</h4>
                      <div className="bg-white p-3 rounded border text-gray-600 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                          {result.job_description || jobDescription || 'No job description provided'}
                        </pre>
                      </div>
                    </div>
                    {result.custom_instructions && (
                      <div className="md:col-span-3">
                        <h4 className="font-medium text-gray-800 mb-2">Custom AI Instructions</h4>
                        <div className="bg-white p-3 rounded border text-gray-600">
                          <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                            {result.custom_instructions}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-1 overflow-hidden">
                {/* Left side - LaTeX Code Editor or Diff */}
                <div className="w-1/2 border-r flex flex-col">
                  <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                    <h4 className="font-medium">
                      {showDiff ? 'LaTeX Changes (Original → Optimized)' : 'LaTeX Code'}
                    </h4>
                    {!showDiff && (
                      <button
                        onClick={handleCompileLatex}
                        disabled={isCompiling}
                        className={`inline-flex items-center px-3 py-1 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isCompiling ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {isCompiling ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            Compiling...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Compile
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {showDiff ? (
                    <div className="flex-1 overflow-auto">
                      <div className="grid grid-cols-2 h-full">
                        <div className="border-r">
                          <div className="bg-red-50 border-b px-3 py-2 text-sm font-medium text-red-800">
                            Original
                          </div>
                          <pre className="p-4 font-mono text-xs leading-relaxed h-full overflow-auto bg-red-25">
                            <code className="text-red-900">{originalLatexCode}</code>
                          </pre>
                        </div>
                        <div>
                          <div className="bg-green-50 border-b px-3 py-2 text-sm font-medium text-green-800">
                            Optimized
                          </div>
                          <pre className="p-4 font-mono text-xs leading-relaxed h-full overflow-auto bg-green-25">
                            <code className="text-green-900">{result.optimized_tex || editableLatexCode}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      className="flex-1 p-4 font-mono text-sm resize-none w-full outline-none border-none"
                      value={editableLatexCode}
                      onChange={(e) => setEditableLatexCode(e.target.value)}
                      spellCheck="false"
                    ></textarea>
                  )}
                </div>

                {/* Right side - PDF Preview */}
                <div className="w-1/2 flex flex-col">
                  <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                    <h4 className="font-medium">PDF Preview</h4>
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      Download PDF
                    </button>
                  </div>
                  <div className="flex-1 bg-gray-200 p-4 overflow-auto relative">
                    {isCompiling && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-lg font-medium text-blue-600">Compiling PDF...</p>
                          <p className="text-sm text-gray-600 mt-2">Please wait while we generate your resume</p>
                        </div>
                      </div>
                    )}

                    {compiledPdfUrl ? (
                      <div className="h-full">
                        <iframe
                          key={compiledPdfUrl}
                          src={`${compiledPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="w-full h-full border-0 rounded shadow-lg"
                          title="PDF Preview"
                          onLoad={() => console.log('PDF loaded:', compiledPdfUrl)}
                          onError={() => console.error('Failed to load PDF:', compiledPdfUrl)}
                          style={{ display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div className="bg-white shadow-md rounded mx-auto max-w-[612px] min-h-[792px] p-8 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <p className="text-6xl mb-4">📄</p>
                          <p className="text-lg font-medium mb-2">PDF Preview</p>
                          <p className="text-sm mb-4">Click "Compile" to generate the PDF from your LaTeX code</p>

                          {result.pdf_download_url && !compiledPdfUrl && (
                            <div className="mt-4">
                              <p className="text-sm text-green-600 mb-2">✅ Original PDF available</p>
                              <button
                                onClick={handleDownloadPDF}
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                Download Original PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-white shadow rounded-lg p-6 opacity-0 animate-fade-in delay-300">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            How This Works
          </h3>
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">
                  Analysis
                </h4>
                <p className="text-sm text-gray-500">
                  Our AI analyzes both your resume and the job description
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">
                  Keyword Matching
                </h4>
                <p className="text-sm text-gray-500">
                  We identify key skills and requirements from the job
                  description
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">
                  Content Optimization
                </h4>
                <p className="text-sm text-gray-500">
                  Your resume is restructured to highlight relevant experience
                  and skills
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">4</span>
              </div>
              <div className="ml-4">
                <h4 className="text-base font-medium text-gray-900">
                  Download Ready
                </h4>
                <p className="text-sm text-gray-500">
                  Receive your optimized LaTeX resume, ready to compile and send
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>;
}