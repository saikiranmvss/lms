import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/courseService.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dashMap = { admin: '/admin/dashboard', instructor: '/instructor/dashboard', student: '/dashboard' };
      navigate(dashMap[user.role] || from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts
  const demos = [
    { label: 'Admin', email: 'admin@learnhub.com', password: 'admin123' },
    { label: 'Instructor', email: 'instructor@learnhub.com', password: 'instructor123' },
    { label: 'Student', email: 'student@learnhub.com', password: 'student123' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl">LearnHub</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">Welcome back to your learning journey</h2>
        <p className="text-primary-300 text-lg leading-relaxed">Continue where you left off and keep building your skills with expert-led courses.</p>
        <div className="mt-12 space-y-4">
          {['50,000+ active learners', '8,500+ courses available', 'Learn from industry experts'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-primary-200">
              <div className="w-2 h-2 rounded-full bg-primary-400" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">LearnHub</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to your account</h1>
          <p className="text-slate-500 mb-8">Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link></p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-3">Quick demo access</p>
            <div className="flex gap-2">
              {demos.map(({ label, email: e, password: p }) => (
                <button key={label} onClick={() => { setEmail(e); setPassword(p); }}
                  className="flex-1 text-xs border border-slate-200 rounded-lg py-2 px-3 text-slate-600 hover:bg-slate-100 hover:border-primary-200 transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
