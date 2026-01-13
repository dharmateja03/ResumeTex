import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  HistoryIcon,
  DownloadIcon,
  TrashIcon,
  FileTextIcon,
  FileIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  AlertCircleIcon
} from 'lucide-react';

interface Optimization {
  optimization_id: string;
  company_name: string;
  job_description: string;
  original_latex: string;
  optimized_latex: string;
  pdf_path: string | null;
  latex_path: string | null;
  llm_provider: string;
  llm_model: string;
  created_at: string;
  status: 'completed' | 'failed';
  error_message: string | null;
  cold_email: string | null;
  cover_letter: string | null;
}

interface HistoryResponse {
  optimizations: Optimization[];
  total: number;
  limit: number;
  offset: number;
}

export function History() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/history/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch optimization history');
      }

      const data: HistoryResponse = await response.json();
      setOptimizations(data.optimizations);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (optimizationId: string, companyName: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/history/${optimizationId}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleDownloadLatex = async (optimizationId: string, companyName: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/history/${optimizationId}/latex`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to download LaTeX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName}_resume.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading LaTeX:', err);
      alert('Failed to download LaTeX file');
    }
  };

  const handleDelete = async (optimizationId: string) => {
    if (!confirm('Are you sure you want to delete this optimization? This cannot be undone.')) {
      return;
    }

    try {
      setDeleting(optimizationId);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/history/${optimizationId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to delete optimization');
      }

      // Remove from local state
      setOptimizations(optimizations.filter(opt => opt.optimization_id !== optimizationId));
      setTotal(total - 1);
    } catch (err) {
      console.error('Error deleting optimization:', err);
      alert('Failed to delete optimization');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/workspace"
                className="mr-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <HistoryIcon className="h-8 w-8 mr-3" />
                  Optimization History
                </h1>
                <p className="mt-1 text-gray-600">
                  View and download your past resume optimizations
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center">
            <AlertCircleIcon className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="font-medium text-red-800">Error loading history</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : optimizations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <HistoryIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No optimization history yet</h2>
            <p className="text-gray-600 mb-6">
              Start optimizing resumes to see them appear here
            </p>
            <Link to="/optimize">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Create Optimization
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg mb-4 px-6 py-4">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">{total}</span> total optimization
                {total !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {optimizations.map((optimization) => (
                <div
                  key={optimization.optimization_id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {optimization.company_name}
                        </h3>
                        {optimization.status === 'completed' ? (
                          <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Failed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(optimization.created_at)}
                        <span className="mx-2">•</span>
                        {optimization.llm_provider} - {optimization.llm_model}
                      </div>

                      <div className="text-gray-700 mb-3 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm">{optimization.job_description}</pre>
                      </div>

                      {optimization.cold_email && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-blue-900 flex items-center">
                              <MailIcon className="h-4 w-4 mr-1" />
                              Cold Email
                            </h4>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(optimization.cold_email!);
                                alert('Cold email copied!');
                              }}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs text-blue-800 whitespace-pre-wrap font-sans">
                            {optimization.cold_email}
                          </pre>
                        </div>
                      )}

                      {optimization.cover_letter && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-green-900 flex items-center">
                              <FileTextIcon className="h-4 w-4 mr-1" />
                              Cover Letter
                            </h4>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(optimization.cover_letter!);
                                alert('Cover letter copied!');
                              }}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs text-green-800 whitespace-pre-wrap font-sans">
                            {optimization.cover_letter}
                          </pre>
                        </div>
                      )}

                      {optimization.error_message && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">
                            <strong>Error:</strong> {optimization.error_message}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {optimization.pdf_path && (
                        <button
                          onClick={() => handleDownloadPDF(optimization.optimization_id, optimization.company_name)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <FileIcon className="h-4 w-4 mr-2" />
                          Download PDF
                        </button>
                      )}

                      {optimization.latex_path && (
                        <button
                          onClick={() => handleDownloadLatex(optimization.optimization_id, optimization.company_name)}
                          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Download LaTeX
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(optimization.optimization_id)}
                        disabled={deleting === optimization.optimization_id}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === optimization.optimization_id ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
