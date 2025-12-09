import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3Icon, ArrowLeftIcon, FileTextIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

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

type TimePeriod = '7d' | '30d' | '1yr' | 'all';

export function Analytics() {
  const navigate = useNavigate();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');

  const fetchStats = async (period: TimePeriod) => {
    try {
      setLoading(true);

      // Get Clerk session token
      const token = await getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/analytics/resume-stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setStats(data);
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

  const getMaxCount = (data: DailyData[]) => {
    return Math.max(...data.map(d => d.count), 1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { month, day };
  };

  if (!isLoaded || loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <button
              onClick={() => navigate('/workspace')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
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
            <button
              onClick={() => navigate('/workspace')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
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
            <button
              onClick={() => navigate('/workspace')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const maxCount = getMaxCount(stats.daily_data);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/workspace')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Analytics</h1>
              <p className="text-sm text-gray-600">Track your resume generation history</p>
            </div>
          </div>
          <BarChart3Icon className="h-8 w-8 text-blue-600" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Resumes Generated</p>
              <p className="text-4xl font-bold text-blue-900">{stats.total_resumes}</p>
              <p className="text-sm text-blue-600 mt-1">
                {selectedPeriod === '7d' && 'Last 7 days'}
                {selectedPeriod === '30d' && 'Last 30 days'}
                {selectedPeriod === '1yr' && 'Last year'}
                {selectedPeriod === 'all' && 'All time'}
              </p>
            </div>
            <FileTextIcon className="h-16 w-16 text-blue-400 opacity-50" />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3Icon className="h-5 w-5 mr-2 text-blue-600" />
              Resume Generation Over Time
            </h2>

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

          {stats.daily_data.length > 0 ? (
            <div className="flex items-end h-80 gap-1 px-2 overflow-x-auto">
              {stats.daily_data.map((day, idx) => {
                const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const { month, day: dayNum } = formatDate(day.date);

                // Determine bar width and spacing based on period
                let barWidth = '';
                let showLabel = false;

                if (selectedPeriod === '7d') {
                  barWidth = 'min-w-[60px]';
                  showLabel = true; // Show all labels for 7 days
                } else if (selectedPeriod === '30d') {
                  barWidth = 'min-w-[20px]';
                  showLabel = idx % 5 === 0; // Show every 5th label
                } else { // 1yr or all
                  barWidth = 'min-w-[6px]';
                  showLabel = idx % 60 === 0; // Show every 60th label
                }

                return (
                  <div key={idx} className="flex flex-col items-center gap-2" style={{ minWidth: selectedPeriod === '7d' ? '60px' : selectedPeriod === '30d' ? '20px' : '6px' }}>
                    {/* Bar */}
                    <div className={`${barWidth} flex flex-col items-center`}>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-700 hover:to-blue-500 cursor-pointer group relative"
                        style={{ height: `${Math.max(percentage, day.count > 0 ? 5 : 0)}%` }}
                        title={`${day.count} resumes on ${day.date}`}
                      >
                        {day.count > 0 && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {day.count}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date Label - Conditionally show based on period */}
                    {showLabel && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-700">{month}</p>
                        <p className="text-xs text-gray-500">{dayNum}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No resumes generated yet</p>
              <button
                onClick={() => navigate('/workspace')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Resume
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
          <p>📊 This dashboard tracks your resume optimization history. Each bar represents the number of resumes generated on that day.</p>
        </div>
      </main>
    </div>
  );
}
