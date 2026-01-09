import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, DownloadIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon, EyeIcon, RefreshCwIcon, EditIcon, XIcon, PlayIcon, MailIcon, FileTextIcon } from 'lucide-react';

interface OptimizationStatus {
  optimization_id: string;
  status: string;
  progress: number;
  message?: string;
  result_url?: string;
  error?: string;
}

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

export function Results() {
  const { optimizationId } = useParams<{ optimizationId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLatex, setShowLatex] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLatexEditor, setShowLatexEditor] = useState(false);
  const [editableLatexCode, setEditableLatexCode] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [originalLatexCode, setOriginalLatexCode] = useState('');

  const fetchStatus = async () => {
    if (!optimizationId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/status`);
      const statusData = await response.json();
      setStatus(statusData);
      
      if (statusData.status === 'completed' && statusData.result_url) {
        // Fetch the actual result
        const resultResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/${optimizationId}/result`);
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          
          // If backend data is missing job details, try localStorage fallback
          if (!resultData.job_description || !resultData.company_name) {
            const storedJobDetails = localStorage.getItem(`job_details_${optimizationId}`);
            if (storedJobDetails) {
              const jobDetails = JSON.parse(storedJobDetails);
              resultData.job_description = resultData.job_description || jobDetails.job_description;
              resultData.company_name = resultData.company_name || jobDetails.company_name;
              resultData.custom_instructions = resultData.custom_instructions || jobDetails.custom_instructions;
            }
          }
          
          setResult(resultData);
          
          // Set the editable LaTeX code when result is fetched
          if (resultData.optimized_tex) {
            setEditableLatexCode(resultData.optimized_tex);
          }
          // Set original LaTeX code for diff comparison
          if (resultData.original_tex) {
            setOriginalLatexCode(resultData.original_tex);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching optimization status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
  };

  const handleDownloadPDF = () => {
    if (result?.pdf_download_url) {
      window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${result.pdf_download_url}`, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('LaTeX code copied to clipboard!');
  };

  const handleEditLatex = () => {
    // Only set initial values if editor hasn't been opened yet or was reset
    if (!editableLatexCode && result?.optimized_tex) {
      setEditableLatexCode(result.optimized_tex);
    }
    
    // Set initial PDF URL if available and not already set (use /view endpoint for preview)
    if (!compiledPdfUrl && result?.pdf_download_url) {
      const viewUrl = result.pdf_download_url + '/view';
      setCompiledPdfUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${viewUrl}`);
    }
    
    setShowLatexEditor(true);
  };

  const handleCloseEditor = () => {
    setShowLatexEditor(false);
    // Reset the editable code to original when closing
    if (result?.optimized_tex) {
      setEditableLatexCode(result.optimized_tex);
    }
    // Clear the compiled PDF URL
    setCompiledPdfUrl(null);
  };

  const handleCompileLatex = async () => {
    try {
      setIsCompiling(true);
      console.log('Compiling LaTeX code...');
      
      // Call backend to compile the edited LaTeX
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/optimize/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tex_content: editableLatexCode,
          optimization_id: optimizationId,
          company_name: result?.company_name || 'resume'
        })
      });

      if (response.ok) {
        const compileResult = await response.json();
        console.log('Compilation successful:', compileResult);
        
        // Set the compiled PDF URL for preview (use /view endpoint for inline viewing)
        if (compileResult.pdf_download_url) {
          const timestamp = Date.now();
          // Convert download URL to view URL for inline preview
          const viewUrl = compileResult.pdf_download_url.replace('/download/', '/download/') + '/view';
          setCompiledPdfUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}${viewUrl}?t=${timestamp}`);
          console.log('PDF preview updated for inline viewing:', viewUrl);
        }
        
        // Don't show alert - just update preview silently
        // Refresh the results to get the new PDF URL
        await fetchStatus();
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

  useEffect(() => {
    if (!optimizationId) {
      navigate('/optimize');
      return;
    }
    
    fetchStatus();
    
    // Poll for status updates if not completed
    const interval = setInterval(() => {
      if (status?.status === 'processing') {
        fetchStatus();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [optimizationId, navigate, status?.status]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading optimization results...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Optimization Not Found</h2>
          <p className="mt-2 text-gray-600">The optimization ID could not be found.</p>
          <Link to="/optimize" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Start New Optimization
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'processing':
        return <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optimization Results</h1>
            <p className="mt-1 text-gray-600">ID: {optimizationId}</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
            >
              <RefreshCwIcon size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link to="/optimize" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center">
              <ArrowLeftIcon size={16} className="mr-1" />
              Back to Optimize
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon()}
              <div className="ml-4">
                <h2 className={`text-xl font-semibold capitalize ${getStatusColor()}`}>
                  {status.status}
                </h2>
                <p className="text-gray-600">{status.message}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{status.progress}%</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {status.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{status.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Failed PDF Compilation - Show LaTeX Code */}
        {result && status.status === 'failed' && result.optimized_tex && (
          <div className="space-y-6">
            {/* Helpful Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex">
                <AlertCircleIcon className="h-6 w-6 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">PDF Compilation Unavailable</h3>
                  <p className="text-sm text-yellow-700 mt-2">
                    Our compilation resources are currently busy. However, your resume has been successfully optimized!
                    Please use Overleaf to compile your LaTeX code and download the PDF.
                  </p>
                </div>
              </div>
            </div>

            {/* LaTeX Code Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Optimized LaTeX Code</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.optimized_tex!);
                      alert('LaTeX code copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy LaTeX Code
                  </button>
                  <button
                    onClick={() => window.open('https://www.overleaf.com/project', '_blank')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                    Open in Overleaf
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={result.optimized_tex}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-3 text-sm text-gray-600">
                💡 <strong>How to use:</strong> Click "Copy LaTeX Code", then click "Open in Overleaf".
                Create a new project in Overleaf, paste the code, and click "Recompile" to generate your PDF.
              </p>
            </div>
          </div>
        )}

        {/* Results Card */}
        {result && status.status === 'completed' && (
          <div className="space-y-8">
            {/* Download Section */}
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
                {result.processing_stats.cached !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Source</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.processing_stats.cached ? 'Cached' : 'Fresh'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cold Email Section */}
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

            {/* Cover Letter Section */}
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
      </main>

      {/* LaTeX Editor Modal */}
      {showLatexEditor && (
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
                    <p className="text-gray-600">{result?.company_name || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-800 mb-2">Job Description</h4>
                    <div className="bg-white p-3 rounded border text-gray-600 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                        {result?.job_description || 'No job description provided'}
                      </pre>
                    </div>
                  </div>
                  {result?.custom_instructions && (
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
                          <code className="text-green-900">{result?.optimized_tex || editableLatexCode}</code>
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
                        key={compiledPdfUrl} // Force re-render when URL changes
                        src={`${compiledPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full h-full border-0 rounded shadow-lg"
                        title="PDF Preview"
                        onLoad={() => console.log('PDF loaded and displayed in preview:', compiledPdfUrl)}
                        onError={() => console.error('Failed to load PDF preview:', compiledPdfUrl)}
                        style={{ display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white shadow-md rounded mx-auto max-w-[612px] min-h-[792px] p-8 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="text-lg font-medium mb-2">
                          PDF Preview
                        </p>
                        <p className="text-sm mb-4">
                          Click "Compile" to generate the PDF from your LaTeX code
                        </p>
                        
                        {result?.pdf_download_url && !compiledPdfUrl && (
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
    </div>
  );
}