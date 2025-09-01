import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, BriefcaseIcon, FileTextIcon, SendIcon, CheckCircleIcon, XIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function Optimize() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      navigate('/login');
      return;
    }

    // Check if user has LLM configuration
    const hasLLMConfig = localStorage.getItem('llm_provider') && 
                       localStorage.getItem('llm_api_key');
    
    if (!hasLLMConfig) {
      navigate('/llm_settings');
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);

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
    localStorage.removeItem('optimize_form_data');
    console.log('Form data cleared');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user has uploaded a resume file
      const userResumeContent = localStorage.getItem('user_resume_content');
      const userResumeFilename = localStorage.getItem('user_resume_filename');
      
      if (!userResumeContent) {
        alert('Please upload your resume file in the Dashboard first!');
        navigate('/dashboard');
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
      const response = await fetch('http://localhost:8001/optimize/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizationRequest)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Optimization result:', result);
        
        setOptimizationId(result.optimization_id);
        setIsSuccess(true);
        
        // Store job details in localStorage for persistence
        const jobDetails = {
          optimization_id: result.optimization_id,
          company_name: companyName,
          job_description: jobDescription,
          custom_instructions: customInstructions,
          timestamp: Date.now()
        };
        localStorage.setItem(`job_details_${result.optimization_id}`, JSON.stringify(jobDetails));
        
        // Auto-redirect to results after 3 seconds, but user can click immediately
        setTimeout(() => {
          navigate(`/results/${result.optimization_id}`);
        }, 3000);
      } else {
        const error = await response.json();
        console.error('Optimization failed:', error);
        alert('Optimization failed: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error calling optimization API:', error);
      alert('Failed to start optimization. Make sure the backend is running.');
    } finally {
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
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
            <ArrowLeftIcon size={16} className="mr-1" />
            Back to Dashboard
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
                
                {isSuccess && optimizationId ? (
                  <button 
                    type="button" 
                    onClick={() => navigate(`/results/${optimizationId}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    View Results
                  </button>
                ) : (
                  <button type="submit" className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`} disabled={isSubmitting}>
                    {isSubmitting ? <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </> : <>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Optimize Resume
                      </>}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
        
        {isSuccess && optimizationId && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 opacity-0 animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-green-800">
                  Resume Optimization Complete!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your resume has been successfully optimized for the job at {companyName}.
                  <br />
                  <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded mt-2 inline-block">
                    ID: {optimizationId}
                  </span>
                </p>
              </div>
              <div className="ml-4">
                <button 
                  onClick={() => navigate(`/results/${optimizationId}`)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  View Results
                </button>
              </div>
            </div>
            <div className="mt-3 text-sm text-green-600">
              <p>🎯 Redirecting to results page automatically in a few seconds...</p>
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