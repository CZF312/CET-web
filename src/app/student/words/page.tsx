'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  level: number;
}

const LEVEL_TABS = [
  { label: '全部', value: 0 },
  { label: 'Level 1', value: 1 },
  { label: 'Level 2', value: 2 },
  { label: 'Level 3', value: 3 },
];

const WORDS_PER_PAGE = 20;

export default function WordCheckin() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState<Record<string, 'mastered' | 'review' | 'learning'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    async function fetchWords() {
      setLoading(true);
      setCurrentPage(1);
      setStatuses({});
      try {
        const params = new URLSearchParams({ limit: '1000' });
        if (activeLevel > 0) {
          params.set('level', String(activeLevel));
        }
        const res = await fetch(`/api/words?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setWords(data.words || []);
          setMasteredCount(data.masteredCount || 0);
          setTotalWords(data.totalWords || data.total || 0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchWords();
  }, [activeLevel]);

  const handleStatusChange = (wordId: string, status: 'mastered' | 'review' | 'learning') => {
    setStatuses((prev) => ({ ...prev, [wordId]: status }));
  };

  const handleSubmit = async () => {
    const entries = Object.entries(statuses);
    if (entries.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/words/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkins: entries.map(([wordId, status]) => ({ wordId, status })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMasteredCount(data.masteredCount || masteredCount);
        setStatuses({});
        alert('打卡成功！');
      }
    } catch {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWords = words;
  const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE);
  const paginatedWords = filteredWords.slice(
    (currentPage - 1) * WORDS_PER_PAGE,
    currentPage * WORDS_PER_PAGE
  );

  const progressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">单词打卡</h1>
          <p className="text-gray-500 mt-1">每天坚持学习，稳步提升词汇量</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">掌握进度</span>
            <span className="text-sm text-gray-500">{masteredCount} / {totalWords} 单词 ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {LEVEL_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveLevel(tab.value)}
              className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeLevel === tab.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Word Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {paginatedWords.length > 0 ? (
                paginatedWords.map((word) => (
                  <div
                    key={word.id}
                    className={`bg-white rounded-xl p-6 shadow-sm border transition-all ${
                      statuses[word.id] === 'mastered'
                        ? 'border-green-300 bg-green-50/50'
                        : statuses[word.id] === 'review'
                        ? 'border-yellow-300 bg-yellow-50/50'
                        : statuses[word.id] === 'learning'
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{word.word}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{word.phonetic}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                        Level {word.level}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{word.meaning}</p>
                    <p className="text-sm text-gray-400 italic mb-4">{word.example}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(word.id, 'mastered')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          statuses[word.id] === 'mastered'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        认识
                      </button>
                      <button
                        onClick={() => handleStatusChange(word.id, 'review')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          statuses[word.id] === 'review'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                        }`}
                      >
                        模糊
                      </button>
                      <button
                        onClick={() => handleStatusChange(word.id, 'learning')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          statuses[word.id] === 'learning'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        不认识
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center text-gray-400">
                  暂无单词数据
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-sm text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(statuses).length === 0}
                className="px-8 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? '提交中...' : `提交打卡 (${Object.keys(statuses).length} 个单词)`}
              </button>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
