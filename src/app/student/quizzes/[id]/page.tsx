'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
}

interface QuizDetail {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  content: string;
}

interface QuizResult {
  score: number;
  total: number;
  duration: number;
  answers: Record<string, string>;
  correctAnswers: Record<string, string>;
}

export default function QuizTaking() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, result]);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        try {
          const parsed = JSON.parse(data.quiz.content);
          setQuestions(Array.isArray(parsed) ? parsed : parsed.questions || []);
        } catch {
          setQuestions([]);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    try {
      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          answers,
          duration,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
      } else {
        alert('提交失败，请重试');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isObjectiveQuestion = (q: Question) => {
    return q.type !== 'writing' && q.type !== 'translation' && q.options && q.options.length > 0;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <Navbar />
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  // Result View
  if (result) {
    const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">答题结果</h2>
            <p className="text-gray-500 mb-6">{quiz?.title}</p>
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-blue-500 mb-6">
              <div>
                <p className="text-3xl font-bold text-blue-500">{percentage}%</p>
                <p className="text-xs text-gray-400">正确率</p>
              </div>
            </div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-bold text-green-500">{result.score}</p>
                <p className="text-gray-500">正确</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{result.total - result.score}</p>
                <p className="text-gray-500">错误</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700">{formatTime(result.duration)}</p>
                <p className="text-gray-500">用时</p>
              </div>
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">答案回顾</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {questions.map((q, idx) => {
                const userAnswer = result.answers[q.id] || '';
                const correctAnswer = result.correctAnswers[q.id] || '';
                const isCorrect = userAnswer === correctAnswer;

                return (
                  <div key={q.id} className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {isCorrect ? 'O' : 'X'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        {isObjectiveQuestion(q) && q.options && (
                          <div className="space-y-1.5 mb-2">
                            {q.options.map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isUserChoice = userAnswer === letter;
                              const isCorrectOption = correctAnswer === letter;
                              return (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-2 rounded-lg text-sm ${
                                    isCorrectOption
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : isUserChoice && !isCorrect
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-gray-50 text-gray-500'
                                  }`}
                                >
                                  {letter}. {opt}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {!isObjectiveQuestion(q) && (
                          <div className="space-y-2 mb-2">
                            <div className="px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600">
                              你的答案：{userAnswer || '(未作答)'}
                            </div>
                            <div className="px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
                              参考答案：{correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => { setResult(null); setAnswers({}); setStartTime(Date.now()); setElapsed(0); }}
              className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              重新答题
            </button>
            <button
              onClick={() => router.push('/student/quizzes')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回题库
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  // Quiz Taking View
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                共 {questions.length} 题 · {formatTime(elapsed)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-600">{formatTime(elapsed)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600">
                  已答 {Object.keys(answers).length} / {questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 mb-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {idx + 1}. {q.question}
              </h3>

              {isObjectiveQuestion(q) && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[q.id] === letter;
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={letter}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(q.id, letter)}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium mr-1">{letter}.</span>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {!isObjectiveQuestion(q) && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="请输入你的答案..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 resize-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? '提交中...' : '提交答案'}
          </button>
        </div>
      </main>
    </ProtectedRoute>
  );
}
