import React from 'react';
import { ArrowLeftIcon, BookOpenIcon, CpuIcon, DollarSignIcon, LightbulbIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Docs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeftIcon size={16} className="mr-1" />
              <span>Back to home</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">ResumeTex Documentation</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <BookOpenIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            LLM Usage Guide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to using Large Language Models effectively for resume optimization. 
            Learn how to choose models, calculate tokens, craft prompts, and optimize costs.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <CpuIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Model Selection</h3>
            <p className="text-sm text-gray-600">Choose the right LLM for your resume type and budget</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <LightbulbIcon className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Prompt Engineering</h3>
            <p className="text-sm text-gray-600">Craft effective prompts for optimal results</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-purple-600 font-bold text-sm">123</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Token Calculation</h3>
            <p className="text-sm text-gray-600">Understand and calculate token usage efficiently</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <DollarSignIcon className="h-8 w-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Cost Optimization</h3>
            <p className="text-sm text-gray-600">Minimize costs while maximizing quality</p>
          </div>
        </div>

        {/* Main Documentation Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Table of Contents */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Table of Contents</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <ul className="space-y-2 text-blue-600">
                  <li><a href="#overview" className="hover:underline">1. Overview</a></li>
                  <li><a href="#choosing-model" className="hover:underline">2. Choosing the Right LLM Model</a></li>
                  <li><a href="#token-calculation" className="hover:underline">3. Token Calculation & Management</a></li>
                  <li><a href="#prompt-engineering" className="hover:underline">4. Prompt Engineering Best Practices</a></li>
                </ul>
              </div>
              <div>
                <ul className="space-y-2 text-blue-600">
                  <li><a href="#character-limits" className="hover:underline">5. Character Limits & Optimization</a></li>
                  <li><a href="#model-config" className="hover:underline">6. Model-Specific Configuration</a></li>
                  <li><a href="#cost-optimization" className="hover:underline">7. Cost Optimization</a></li>
                  <li><a href="#troubleshooting" className="hover:underline">8. Troubleshooting</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Overview Section */}
          <section id="overview" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Overview</h3>
            <p className="text-gray-700 mb-4">
              ResumeTex supports multiple Large Language Model (LLM) providers to optimize your resume content. 
              This guide helps you understand how to choose the right model, manage tokens effectively, and craft 
              optimal prompts for the best results.
            </p>
          </section>

          {/* Choosing the Right LLM Model */}
          <section id="choosing-model" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Choosing the Right LLM Model</h3>
            
            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Supported Providers</h4>
              
              <div className="space-y-8">
                {/* OpenAI Models */}
                <div>
                  <h5 className="text-xl font-semibold text-gray-800 mb-4">OpenAI Models</h5>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      <h6 className="font-semibold text-gray-900">GPT-4o (Recommended)</h6>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li><strong>Best for:</strong> High-quality resume optimization, complex formatting</li>
                        <li><strong>Context Window:</strong> 128,000 tokens</li>
                        <li><strong>Cost:</strong> Higher, but best quality</li>
                        <li><strong>Use Case:</strong> Professional resumes requiring detailed analysis</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                      <h6 className="font-semibold text-gray-900">GPT-4o-mini</h6>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li><strong>Best for:</strong> Quick optimizations, cost-effective processing</li>
                        <li><strong>Context Window:</strong> 128,000 tokens</li>
                        <li><strong>Cost:</strong> Lower cost alternative</li>
                        <li><strong>Use Case:</strong> Budget-conscious users, simple resume updates</li>
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h6 className="font-semibold text-gray-900">GPT-3.5-turbo</h6>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li><strong>Best for:</strong> Basic resume improvements</li>
                        <li><strong>Context Window:</strong> 16,385 tokens</li>
                        <li><strong>Cost:</strong> Most economical</li>
                        <li><strong>Use Case:</strong> Simple resume formatting and basic content improvements</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Anthropic Models */}
                <div>
                  <h5 className="text-xl font-semibold text-gray-800 mb-4">Anthropic Models</h5>
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                      <h6 className="font-semibold text-gray-900">Claude-3-5-Sonnet</h6>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li><strong>Best for:</strong> Detailed analysis, professional writing</li>
                        <li><strong>Context Window:</strong> 200,000 tokens</li>
                        <li><strong>Cost:</strong> Premium pricing</li>
                        <li><strong>Use Case:</strong> Executive resumes, detailed technical roles</li>
                      </ul>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
                      <h6 className="font-semibold text-gray-900">Claude-3-Haiku</h6>
                      <ul className="mt-2 space-y-1 text-gray-700">
                        <li><strong>Best for:</strong> Quick processing, basic improvements</li>
                        <li><strong>Context Window:</strong> 200,000 tokens</li>
                        <li><strong>Cost:</strong> Most economical Anthropic option</li>
                        <li><strong>Use Case:</strong> Fast turnaround, simple optimizations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Selection Guidelines Table */}
            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Model Selection Guidelines</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Executive/Senior</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GPT-4o or Claude-3-5-Sonnet</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Complex analysis, professional language</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Technical/Engineering</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GPT-4o</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Strong technical understanding</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Entry-Level</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GPT-4o-mini or Claude-3-Haiku</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Cost-effective, sufficient capability</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Academic/Research</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Claude-3-5-Sonnet</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Excellent at detailed, nuanced content</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Creative Industries</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GPT-4o</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Creative language and formatting</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Token Calculation Section */}
          <section id="token-calculation" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Token Calculation & Management</h3>
            
            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Understanding Tokens</h4>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4"><strong>What are tokens?</strong></p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Tokens are pieces of text that LLMs process</li>
                  <li>Roughly 1 token = 4 characters in English</li>
                  <li>Includes spaces, punctuation, and formatting</li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Token Estimation</h4>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <code className="text-lg font-mono text-gray-800">
                  Approximate Token Count = Character Count ÷ 4
                </code>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Practical Examples</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Character Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Short resume (1 page)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2,000 chars</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">~500 tokens</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Medium resume (2 pages)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">4,000 chars</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">~1,000 tokens</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Long resume (3+ pages)</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">6,000+ chars</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">~1,500+ tokens</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Job description</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1,200 chars</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">~300 tokens</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">System prompt</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">800 chars</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">~200 tokens</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Prompt Engineering Section */}
          <section id="prompt-engineering" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Prompt Engineering Best Practices</h3>
            
            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Effective Resume Optimization Prompts</h4>
              
              <div className="space-y-6">
                <div>
                  <h5 className="text-xl font-semibold text-gray-800 mb-3">Basic Template</h5>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`Optimize this resume for the following job description:

[JOB DESCRIPTION]

Current Resume:
[RESUME CONTENT]

Requirements:
- Maintain original formatting
- Highlight relevant experience
- Use action verbs
- Quantify achievements where possible
- Keep the same length`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xl font-semibold text-gray-800 mb-3">Advanced Template</h5>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-green-400 text-sm">
{`You are a professional resume writer with 10+ years of experience. 

Job Target: [JOB TITLE] at [COMPANY TYPE]
Job Description: [JOB DESCRIPTION]

Current Resume: [RESUME CONTENT]

Please optimize this resume by:
1. Tailoring keywords to match job requirements
2. Quantifying achievements with specific metrics
3. Reordering bullet points by relevance
4. Strengthening action verbs
5. Ensuring ATS compatibility

Maintain:
- Original LaTeX formatting
- Professional tone
- Same overall length
- Contact information unchanged

Focus on: [SPECIFIC AREAS TO EMPHASIZE]`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Prompt Optimization Tips</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <h6 className="font-semibold text-green-800 mb-2">✅ Best Practices</h6>
                    <ul className="space-y-2 text-green-700">
                      <li><strong>Be Specific:</strong> Clear instructions yield better results</li>
                      <li><strong>Set Constraints:</strong> Specify length, format, tone requirements</li>
                      <li><strong>Provide Context:</strong> Include job description and target role</li>
                      <li><strong>Use Examples:</strong> Show desired output format</li>
                      <li><strong>Iterate:</strong> Refine prompts based on results</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <h6 className="font-semibold text-red-800 mb-2">❌ Common Mistakes</h6>
                    <ul className="space-y-2 text-red-700">
                      <li><strong>Too Vague:</strong> "Make my resume better"</li>
                      <li><strong>No Constraints:</strong> No length or format specifications</li>
                      <li><strong>Missing Context:</strong> Only providing resume without job description</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cost Optimization Section */}
          <section id="cost-optimization" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Cost Optimization</h3>
            
            <div className="mb-8">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4">Cost Comparison (Approximate)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Cost (per 1K tokens)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Cost (per 1K tokens)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">GPT-4o</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.005</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.015</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">GPT-4o-mini</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.0001</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.0004</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">GPT-3.5-turbo</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.001</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.002</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Claude-3-5-Sonnet</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.003</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.015</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Claude-3-Haiku</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.00025</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$0.00125</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
              <h5 className="font-semibold text-yellow-800 mb-2">Example Cost for Medium Resume (2,800 total tokens):</h5>
              <ul className="space-y-1 text-yellow-700">
                <li>• GPT-4o: ~$0.056</li>
                <li>• GPT-4o-mini: ~$0.0014</li>
                <li>• Claude-3-Haiku: ~$0.0042</li>
              </ul>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section id="troubleshooting" className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Troubleshooting</h3>
            
            <div className="space-y-6">
              <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                <h5 className="font-semibold text-red-800 mb-2">"Token limit exceeded"</h5>
                <p className="text-red-700 mb-2"><strong>Solution:</strong> Reduce input length or switch to model with larger context window</p>
                <p className="text-red-600"><strong>Prevention:</strong> Calculate tokens before processing</p>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400">
                <h5 className="font-semibold text-orange-800 mb-2">"Poor optimization quality"</h5>
                <p className="text-orange-700 mb-2"><strong>Solution:</strong> Improve prompt specificity, provide more context</p>
                <p className="text-orange-600"><strong>Check:</strong> Model temperature settings (should be 0.1-0.3 for resumes)</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                <h5 className="font-semibold text-blue-800 mb-2">"Formatting lost"</h5>
                <p className="text-blue-700 mb-2"><strong>Solution:</strong> Explicitly mention format preservation in prompt</p>
                <p className="text-blue-600"><strong>Add:</strong> "Maintain exact LaTeX formatting and structure"</p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
                <h5 className="font-semibold text-purple-800 mb-2">"Content too generic"</h5>
                <p className="text-purple-700 mb-2"><strong>Solution:</strong> Include specific job requirements in prompt</p>
                <p className="text-purple-600"><strong>Improve:</strong> Add company research and role-specific keywords</p>
              </div>
            </div>
          </section>

          {/* Quick Reference */}
          <section className="mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Quick Reference</h3>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="text-xl font-semibold text-green-800 mb-4">Best Practices Checklist</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Choose model based on resume complexity and budget
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Calculate tokens before processing
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Include specific job description context
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Set appropriate temperature (0.1-0.3)
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Specify format preservation requirements
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Monitor costs and optimize accordingly
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Test prompts with different resume types
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="text-green-500 mr-2">✅</span>
                    Keep successful prompt templates
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Last updated: September 1, 2025 | ResumeTex Version: 1.0.0</p>
        </div>
      </div>
    </div>
  );
}