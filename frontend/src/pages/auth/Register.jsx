import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/courseService.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'student';
  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await authService.register(form);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      const dashMap = { admin: '/admin/dashboard', instructor: '/instructor/dashboard', student: '/dashboard' };
      navigate(dashMap[user.role] || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl">LearnHub</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">Start your learning journey today</h2>
        <p className="text-primary-300 text-lg leading-relaxed">Join 50,000+ learners already building their future with LearnHub.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">LearnHub</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h1>
          <p className="text-slate-500 mb-8">Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link></p>

          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            {['student', 'instructor'].map((role) => (
              <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${form.role === role ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {role === 'student' ? 'I want to learn' : 'I want to teach'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={form.name} onChange={update('name')} placeholder="John Doe" className="input pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Min 6 characters" className="input pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">By creating an account, you agree to our <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
}
