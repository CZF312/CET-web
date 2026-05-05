'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Quiz {
  id: string;
  type: string;
  title: string;
  difficulty: number;
  createdAt: string;
}

const TYPE_TABS = [
  { label: '全部', value: 'all' },
  { label: '词汇语法', value: 'vocabulary' },
  { label: '听力', value: 'listening' },
  { label: '阅读', value: 'reading' },
  { label: '写作', value: 'writing' },
  { label: '翻译', value: 'translation' },
];

const TYPE_LABELS: Record<string, string> = {
  vocabulary: '词汇语法',
  listening: '听力',
  reading: '阅读',
  writing: '写作',
  translation: '翻译',
};

const TYPE_COLORS: Record<string, string> = {
  vocabulary: 'bg-blue-100 text-blue-700',
  listening: 'bg-green-100 text-green-700',
  reading: 'bg-purple-100 text-purple-700',
  writing: 'bg-orange-100 text-orange-700',
  translation: 'bg-pink-100 text-pink-700',
};

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= level ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    fetchQuizzes();
  }, [activeType]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params = activeType !== 'all' ? `?type=${activeType}` : '';
      const res = await fetch(`/api/quizzes${params}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">四级刷题</h1>
          <p className="text-gray-500 mt-1">选择题型，开始练习</p>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveType(tab.value)}
              className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeType === tab.value
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[quiz.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[quiz.type] || quiz.type}
                    </span>
                    <DifficultyStars level={quiz.difficulty} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{quiz.title}</h3>
                  <Link
                    href={`/student/quizzes/${quiz.id}`}
                    className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    开始答题
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400">
                暂无题目数据
              </div>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
