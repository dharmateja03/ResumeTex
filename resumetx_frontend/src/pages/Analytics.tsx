import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3Icon, ArrowLeftIcon, FileTextIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyData {
  date: string;
  count: number;
}

interface ResumeStats {
  period: string;
  total_resumes: number;
  daily_data: DailyData[];
  start_date: string;
  end_date: string;
}

interface ProviderData {
  name: string;
  value: number;
}

interface LatencyStats {
  avg_ms: number;
  p50_ms: number;
  p99_ms: number;
  min_ms: number;
  max_ms: number;
  sample_count: number;
}

interface DetailedStats {
  period: string;
  total_optimizations: number;
  provider_breakdown: ProviderData[];
  latency_stats: LatencyStats;
  success_count: number;
  failure_count: number;
  success_rate: number;
}

type TimePeriod = '7d' | '30d' | '1yr' | 'all';

// Colors for pie chart
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Analytics() {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');

  const fetchStats = async (period: TimePeriod) => {
    try {
      setLoading(true);

      const token = await getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

      // Fetch both endpoints in parallel
      const [resumeResponse, detailedResponse] = await Promise.all([
        fetch(`${apiUrl}/analytics/resume-stats?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${apiUrl}/analytics/detailed-stats?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (resumeResponse.status === 401 || detailedResponse.status === 401) {
        throw new Error('Authentication failed. Please try logging out and back in.');
      }

      if (!resumeResponse.ok || !detailedResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [resumeData, detailedData] = await Promise.all([
        resumeResponse.json(),
        detailedResponse.json()
      ]);

      setStats(resumeData);
      setDetailedStats(detailedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    fetchStats(selectedPeriod);
  }, [selectedPeriod, navigate, isLoaded, isSignedIn]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  const formatMs = (ms: number) => {
    if (ms >= 60000) {
      return `${(ms / 60000).toFixed(1)}m`;
    } else if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  if (!isLoaded || loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button onClick={() => navigate('/workspace')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Analytics</h1>
              <p className="text-sm text-gray-600">Track your resume generation history</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button onClick={() => navigate('/workspace')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Analytics</h1>
              <p className="text-sm text-gray-600">Track your resume generation history</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => navigate('/workspace')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !detailedStats) {
    return null;
  }

  // Prepare bar chart data
  const barChartData = stats.daily_data.map(d => ({
    date: formatDate(d.date),
    count: d.count
  }));

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/workspace')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Analytics</h1>
              <p className="text-sm text-gray-600">Track your resume generation history</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '1yr', 'all'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === '7d' && '7 Days'}
                {period === '30d' && '30 Days'}
                {period === '1yr' && '1 Year'}
                {period === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Resumes */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Resumes</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total_resumes}</p>
              </div>
              <FileTextIcon className="h-10 w-10 text-blue-400" />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Success Rate</p>
                <p className="text-3xl font-bold text-green-900">{detailedStats.success_rate}%</p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-400" />
            </div>
          </div>

          {/* Avg Processing Time */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Avg Time</p>
                <p className="text-3xl font-bold text-purple-900">{formatMs(detailedStats.latency_stats.avg_ms)}</p>
              </div>
              <ClockIcon className="h-10 w-10 text-purple-400" />
            </div>
          </div>

          {/* Failures */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Failed</p>
                <p className="text-3xl font-bold text-red-900">{detailedStats.failure_count}</p>
              </div>
              <XCircleIcon className="h-10 w-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Resume Generation Over Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3Icon className="h-5 w-5 mr-2 text-blue-600" />
              Resume Generation Over Time
            </h2>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Pie Chart - LLM Provider Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">LLM Provider Usage</h2>
            {detailedStats.provider_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={detailedStats.provider_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {detailedStats.provider_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No provider data available
              </div>
            )}
          </div>
        </div>

        {/* Latency Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
            Processing Time Metrics
          </h2>

          {detailedStats.latency_stats.sample_count > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Average</p>
                <p className="text-2xl font-bold text-gray-900">{formatMs(detailedStats.latency_stats.avg_ms)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">P50 (Median)</p>
                <p className="text-2xl font-bold text-blue-900">{formatMs(detailedStats.latency_stats.p50_ms)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-600 mb-1">P99</p>
                <p className="text-2xl font-bold text-orange-900">{formatMs(detailedStats.latency_stats.p99_ms)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-1">Min</p>
                <p className="text-2xl font-bold text-green-900">{formatMs(detailedStats.latency_stats.min_ms)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600 mb-1">Max</p>
                <p className="text-2xl font-bold text-red-900">{formatMs(detailedStats.latency_stats.max_ms)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No timing data available yet</p>
              <p className="text-sm">Generate some resumes to see processing metrics</p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            Based on {detailedStats.latency_stats.sample_count} optimization{detailedStats.latency_stats.sample_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p>This dashboard tracks your resume optimization history. Data includes LLM provider usage, processing times (P50/P99 percentiles), and success rates.</p>
        </div>
      </main>
    </div>
  );
}
