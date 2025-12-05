import React, { useState, useEffect } from 'react';
import { FileTextIcon, UploadIcon, CheckCircleIcon, XIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { resetUser } from '../lib/posthog';

export function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useClerk();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleLogout = async () => {
    // Clear all auth and config data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('llm_provider');
    localStorage.removeItem('llm_model');
    localStorage.removeItem('llm_api_key');

    // Reset PostHog user
    resetUser();

    // Sign out from Clerk
    await signOut();

    // Redirect to login
    navigate('/login');
  };

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Check for existing resume on component mount
  useEffect(() => {
    const existingContent = localStorage.getItem('user_resume_content');
    const existingFilename = localStorage.getItem('user_resume_filename');
    
    if (existingContent && existingFilename) {
      // Create a mock file object to show in UI
      const mockFile = new File([existingContent], existingFilename, { type: 'text/plain' });
      setFile(mockFile);
      setUploadSuccess(true);
    }
  }, []);
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
      setFile(droppedFile);
      simulateUpload(droppedFile);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      simulateUpload(selectedFile);
    }
  };
  const simulateUpload = (file: File) => {
    // Read the file content and store in localStorage
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      localStorage.setItem('user_resume_content', content);
      localStorage.setItem('user_resume_filename', file.name);
      console.log('Resume file uploaded and stored:', file.name, content.length, 'characters');
      setUploadSuccess(true);
    };
    reader.onerror = (e) => {
      console.error('Error reading file:', e);
      alert('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };
  const resetUpload = () => {
    setFile(null);
    setUploadSuccess(false);
    localStorage.removeItem('user_resume_content');
    localStorage.removeItem('user_resume_filename');
  };
  return <div className="w-full min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 opacity-0 animate-fade-in">
              Dashboard
            </h1>
            <p className="mt-1 text-gray-600 opacity-0 animate-fade-in delay-100">
              Welcome, Test User
            </p>
          </div>
          <div className="flex space-x-4">
            <Link to="/history" className="text-gray-600 hover:text-gray-800 transition-colors">
              History
            </Link>
            <Link to="/llm_settings" className="text-gray-600 hover:text-gray-800 transition-colors">
              LLM Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 opacity-0 animate-fade-in delay-200">
          <div className="text-center mb-8">
            <FileTextIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Your Resume Template
            </h2>
            <p className="mt-2 text-gray-600">
              Upload your LaTeX resume file (.tex) to get started
            </p>
          </div>
          {!file ? <div className={`mt-4 border-2 border-dashed rounded-lg p-12 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-700">
                Drag and drop your .tex file here, or{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  browse
                  <input type="file" className="hidden" accept=".tex" onChange={handleFileInput} />
                </label>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Only .tex files are supported
              </p>
            </div> : <div className="mt-4 border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {uploadSuccess ? <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" /> : <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>}
                  <button onClick={resetUpload} className="ml-4 text-gray-500 hover:text-gray-700">
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {uploadSuccess && <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md">
                  <p className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    File uploaded successfully! Your resume is ready for
                    optimization.
                  </p>
                  <Link to="/optimize">
                    <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Start Optimization
                    </button>
                  </Link>
                </div>}
            </div>}
          <div className="mt-8 bg-blue-50 p-4 rounded-md opacity-0 animate-fade-in delay-300">
            <h3 className="font-medium text-blue-800">
              Why upload a LaTeX file?
            </h3>
            <p className="mt-2 text-sm text-blue-700">
              LaTeX files allow us to precisely analyze your resume structure
              and content. Our AI will optimize your resume formatting, content
              organization, and tailor it to specific job descriptions.
            </p>
          </div>
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-6 opacity-0 animate-fade-in delay-400">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Optimizations
            </h3>
            <p className="text-gray-500 italic">
              No recent optimizations found.
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Optimization Tips
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Include relevant keywords from the job description</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Quantify your achievements with numbers when possible
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Ensure your most relevant experience is highlighted first
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>;
}