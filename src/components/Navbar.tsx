'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <nav className="bg-blue-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">CET-4 学习平台</div>
        </div>
      </nav>
    );
  }

  const teacherLinks = [
    { label: '首页', href: '/teacher' },
    { label: '学生管理', href: '/teacher/students' },
    { label: '数据看板', href: '/teacher/dashboard' },
  ];

  const studentLinks = [
    { label: '首页', href: '/student' },
    { label: '单词打卡', href: '/student/words' },
    { label: '四级刷题', href: '/student/quizzes' },
  ];

  const navLinks = user?.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <nav className="bg-blue-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/'} className="text-xl font-bold hover:opacity-90 transition-opacity">
            CET-4 学习平台
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                退出登录
              </button>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex items-center">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-blue-500 hover:bg-blue-50 transition-colors"
              >
                登录
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-blue-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-blue-400 mt-2 pt-2">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 transition-colors mt-2"
                >
                  退出登录
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 rounded-lg text-sm font-medium bg-white text-blue-500 hover:bg-blue-50 transition-colors"
              >
                登录
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
