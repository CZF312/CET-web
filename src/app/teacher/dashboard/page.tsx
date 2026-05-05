'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StudentProgress {
  id: string;
  name: string;
  username: string;
  wordCheckinCount: number;
  masteredWords: number;
  quizAttemptCount: number;
  averageScore: number;
  lastActive: string;
}

interface DashboardData {
  stats: {
    totalStudents: number;
    activeToday: number;
    totalWords: number;
    totalQuizzes: number;
    totalCheckins: number;
    totalAttempts: number;
    overallAverage: number;
  };
  students: StudentProgress[];
}

function getProgressColor(value: number, thresholds: [number, number] = [60, 80]): string {
  if (value >= thresholds[1]) return 'text-green-600 bg-green-50';
  if (value >= thresholds[0]) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getProgressDot(value: number, thresholds: [number, number] = [60, 80]): string {
  if (value >= thresholds[1]) return 'bg-green-500';
  if (value >= thresholds[0]) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function DataDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
          <p className="text-gray-500 mt-1">查看全班学生学习进度与数据</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: '总学生数', value: data?.stats.totalStudents ?? 0, color: 'text-blue-600' },
                { label: '今日活跃', value: data?.stats.activeToday ?? 0, color: 'text-green-600' },
                { label: '总词汇量', value: data?.stats.totalWords ?? 0, color: 'text-purple-600' },
                { label: '总打卡次数', value: data?.stats.totalCheckins ?? 0, color: 'text-orange-600' },
                { label: '总答题次数', value: data?.stats.totalAttempts ?? 0, color: 'text-pink-600' },
                { label: '平均分', value: data?.stats.overallAverage ?? 0, color: 'text-indigo-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Student Progress Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">学生进度详情</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">打卡次数</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">掌握单词</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">刷题次数</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">平均分</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">最后活跃</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.students && data.students.length > 0 ? (
                      data.students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">{student.name[0]}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                <p className="text-xs text-gray-400">{student.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.wordCheckinCount}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.masteredWords}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.quizAttemptCount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgressColor(student.averageScore)}`}>
                              {student.averageScore}分
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">{student.lastActive}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getProgressDot(student.averageScore)}`} />
                              <span className="text-xs text-gray-500">
                                {student.averageScore >= 80 ? '优秀' : student.averageScore >= 60 ? '良好' : '需努力'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                          暂无学生数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
