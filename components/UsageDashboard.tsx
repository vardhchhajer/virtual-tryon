'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Image,
  Zap,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface UsageStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalInputImages: number;
  totalOutputImages: number;
  totalCost: number;
  averageCostPerImage: number;
  averageTokensPerGeneration: number;
  recentGenerations: {
    id: string;
    timestamp: number;
    inputTokens: number;
    outputTokens: number;
    inputImages: number;
    outputImages: number;
    totalCost: number;
    model: string;
    success: boolean;
  }[];
  sessionStartedAt: number;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Silently fail — dashboard is informational
    } finally {
      setLoading(false);
    }
  }, []);

  const resetStats = useCallback(async () => {
    if (!confirm('Reset all usage statistics?')) return;
    try {
      await fetch('/api/usage', { method: 'DELETE' });
      await fetchStats();
    } catch {
      // ignore
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats) return null;

  const hasData = stats.totalGenerations > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed: compact pill */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors text-sm"
        >
          <BarChart3 size={14} />
          <span className="font-medium">
            {stats.totalOutputImages} img{stats.totalOutputImages !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-emerald-400 font-mono text-xs">
            {formatCost(stats.totalCost)}
          </span>
        </button>
      ) : (
        /* Expanded: full dashboard */
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span className="font-semibold text-sm">Usage Dashboard</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchStats}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              {hasData && (
                <button
                  onClick={resetStats}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Reset stats"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {!hasData ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              No generations yet. Stats will appear here after your first image.
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                {/* Images Generated */}
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <Image size={12} />
                    Images Generated
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {stats.totalOutputImages}
                  </div>
                  <div className="text-xs text-gray-400">
                    {stats.successfulGenerations}/{stats.totalGenerations} successful
                  </div>
                </div>

                {/* Total Cost */}
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <DollarSign size={12} />
                    Total Cost
                  </div>
                  <div className="text-xl font-bold text-emerald-600">
                    {formatCost(stats.totalCost)}
                  </div>
                  <div className="text-xs text-gray-400">
                    ~{formatCost(stats.averageCostPerImage)}/image
                  </div>
                </div>

                {/* Tokens Used */}
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <Zap size={12} />
                    Total Tokens
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatTokens(stats.totalTokens)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTokens(stats.totalInputTokens)} in / {formatTokens(stats.totalOutputTokens)} out
                  </div>
                </div>

                {/* Avg per generation */}
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <BarChart3 size={12} />
                    Avg/Generation
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatTokens(Math.round(stats.averageTokensPerGeneration))}
                  </div>
                  <div className="text-xs text-gray-400">
                    tokens per call
                  </div>
                </div>
              </div>

              {/* History toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-center gap-1 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors border-t"
              >
                {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showHistory ? 'Hide' : 'Show'} Recent History ({stats.recentGenerations.length})
              </button>

              {/* History list */}
              {showHistory && stats.recentGenerations.length > 0 && (
                <div className="max-h-48 overflow-y-auto border-t">
                  {stats.recentGenerations.map((gen) => (
                    <div
                      key={gen.id}
                      className="flex items-center justify-between px-4 py-2 text-xs border-b border-gray-50 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            gen.success ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="text-gray-600">
                          {formatTokens(gen.inputTokens + gen.outputTokens)} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-600">
                          {formatCost(gen.totalCost)}
                        </span>
                        <span className="text-gray-400">
                          {timeAgo(gen.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
