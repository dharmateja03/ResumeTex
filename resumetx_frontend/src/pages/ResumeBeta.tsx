import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface Block {
  section: string;
  title: string;
  content: string;
  block_index: number;
}

interface Suggestion {
  block_id: string;
  suggestion: string;
  improvement_focus: string;
}

type FileType = 'pdf' | 'latex' | null;

export function ResumeBeta() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // State management
  const [fileType, setFileType] = useState<FileType>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [suggestions, setSuggestions] = useState<Map<string, Suggestion>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // Scroll sync
  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // File type selection modal
  const FileTypeModal = () => {
    if (fileType !== null) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Choose Resume Format
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Select the format of your resume to get started with block-level analysis.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setFileType('pdf')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              📄 Upload PDF Resume
            </button>
            <button
              onClick={() => setFileType('latex')}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              ⚙️ Upload LaTeX Resume
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
            Beta feature • Analyze resume blocks and get AI suggestions
          </p>
        </div>
      </div>
    );
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (fileType === null) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8001/resume_beta/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload resume');
      }

      const data = await response.json();
      setBlocks(data.blocks);

      // Generate suggestions
      await generateSuggestions(data.blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process resume');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI suggestions
  const generateSuggestions = async (blocksList: Block[]) => {
    try {
      const token = await getToken();

      const response = await fetch('http://localhost:8001/resume_beta/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blocks: blocksList,
          job_description: jobDescription,
          custom_instructions: customInstructions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      const suggestionsMap = new Map(
        data.suggestions.map((s: Suggestion) => [s.block_id, s])
      );
      setSuggestions(suggestionsMap);
    } catch (err) {
      console.error('Error generating suggestions:', err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Scroll sync handler
  const handleLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setScrollPosition(element.scrollLeft);

    if (rightSideRef.current) {
      rightSideRef.current.scrollLeft = element.scrollLeft;
    }
  };

  // Reset function
  const handleReset = () => {
    setFileType(null);
    setBlocks([]);
    setSuggestions(new Map());
    setError(null);
    setJobDescription('');
    setCustomInstructions('');
  };

  // Go back to workspace
  const handleBackToWorkspace = () => {
    navigate('/workspace');
  };

  // File input component
  const FileUploadArea = () => {
    if (blocks.length > 0) return null;

    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Drop your {fileType === 'pdf' ? 'PDF' : 'LaTeX'} resume here
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          or click to browse
        </p>
        <input
          type="file"
          accept={fileType === 'pdf' ? '.pdf' : '.tex,.latex'}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition"
        >
          Browse Files
        </label>
      </div>
    );
  };

  // Main content - split screen with blocks
  const SplitScreen = () => {
    if (blocks.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
        {/* Left side - Block stack */}
        <div
          ref={leftSideRef}
          onScroll={handleLeftScroll}
          className="overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
        >
          {blocks.map((block) => (
            <div
              key={`${block.section}_${block.block_index}`}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {block.section}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {block.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {block.content}
              </p>
            </div>
          ))}
        </div>

        {/* Right side - Suggestions */}
        <div
          ref={rightSideRef}
          className="overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
        >
          {blocks.map((block) => {
            const blockId = `${block.section}_${block.block_index}`;
            const suggestion = suggestions.get(blockId);

            return (
              <div
                key={blockId}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Suggestion
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {block.section} • {block.title}
                    </p>
                  </div>
                  {suggestion && (
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                      {suggestion.improvement_focus}
                    </span>
                  )}
                </div>
                {suggestion ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion.suggestion}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Generating suggestion...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <FileTypeModal />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToWorkspace}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title="Back to Workspace"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Resume Analyzer (Beta)
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Upload your resume, analyze blocks, and get AI suggestions
              </p>
            </div>
          </div>
          {blocks.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-300 dark:border-gray-600 transition"
              title="Start over"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Processing your resume...
            </span>
          </div>
        )}

        {/* Context inputs (shown before upload or with blocks) */}
        {fileType && blocks.length === 0 && !loading && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Description (optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description to get tailored suggestions..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Instructions (optional)
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Focus on quantifiable metrics, add more action verbs..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* File upload area */}
        {fileType && blocks.length === 0 && !loading && <FileUploadArea />}

        {/* Split screen */}
        {blocks.length > 0 && <SplitScreen />}

        {/* Info section */}
        {blocks.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">
              ✨ Analyzing {blocks.length} blocks across {new Set(blocks.map((b) => b.section)).size} sections
            </p>
            <p className="mt-1">Scroll the left side to see corresponding suggestions on the right.</p>
          </div>
        )}
      </div>
    </div>
  );
}
