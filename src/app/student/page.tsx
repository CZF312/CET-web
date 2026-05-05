'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StudentData {
  name: string;
  todayCheckins: number;
  masteredWords: number;
  streakDays: number;
  recentActivities: {
    id: string;
    action: string;
    time: string;
  }[];
}

export default function StudentHome() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const me = await res.json();
          const res2 = await fetch('/api/students/me');
          if (res2.ok) {
            const studentData = await res2.json();
            setData({
              name: me.user.name,
              todayCheckins: studentData.todayCheckins ?? 0,
              masteredWords: studentData.masteredWords ?? 0,
              streakDays: studentData.streakDays ?? 0,
              recentActivities: studentData.recentActivities ?? [],
            });
          } else {
            setData({
              name: me.user.name,
              todayCheckins: 0,
              masteredWords: 0,
              streakDays: 0,
              recentActivities: [],
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Welcome */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                你好，{data?.name ?? '同学'}！
              </h1>
              <p className="text-gray-500 mt-1">今天也要坚持学习哦</p>
            </div>

            {/* Today Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">今日打卡单词</p>
                    <p className="text-3xl font-bold text-blue-500 mt-1">{data?.todayCheckins ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">累计掌握单词</p>
                    <p className="text-3xl font-bold text-green-500 mt-1">{data?.masteredWords ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">连续打卡天数</p>
                    <p className="text-3xl font-bold text-orange-500 mt-1">{data?.streakDays ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Link href="/student/words" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">开始单词打卡</h3>
                    <p className="text-blue-100 mt-1">每日单词学习与记忆</p>
                  </div>
                  <svg className="w-6 h-6 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              <Link href="/student/quizzes" className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-8 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">开始刷题</h3>
                    <p className="text-green-100 mt-1">四级全题型练习</p>
                  </div>
                  <svg className="w-6 h-6 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {data?.recentActivities && data.recentActivities.length > 0 ? (
                  data.recentActivities.map((activity) => (
                    <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-gray-400">
                    暂无最近活动，快去学习吧！
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
