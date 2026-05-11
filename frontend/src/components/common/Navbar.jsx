import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Bell, Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useUiStore from '../../store/uiStore.js';
import { getInitials } from '../../utils/helpers.js';
import { authService } from '../../services/courseService.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUiStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  const dashboardLink = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'instructor' ? '/instructor/dashboard' : '/dashboard';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">LearnHub</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/courses" className={({ isActive }) => clsx('btn-ghost text-sm', isActive && 'text-primary-600')}>Courses</NavLink>
            <NavLink to="/pricing" className={({ isActive }) => clsx('btn-ghost text-sm', isActive && 'text-primary-600')}>Pricing</NavLink>
            <NavLink to="/about" className={({ isActive }) => clsx('btn-ghost text-sm', isActive && 'text-primary-600')}>About</NavLink>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="btn-ghost p-2 rounded-lg">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/notifications" className="btn-ghost p-2 rounded-lg">
                  <Bell className="w-4 h-4" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    {user?.avatar ? (
                      <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" alt={user.name} />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-100 shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link to={dashboardLink} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Dashboard</Link>
                    <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Profile</Link>
                    {user?.role !== 'instructor' && (
                      <Link to="/register?role=instructor" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Become Instructor</Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
              </div>
            )}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn-ghost p-2">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            <form onSubmit={handleSearch} className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </form>
            <NavLink to="/courses" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">Courses</NavLink>
            <NavLink to="/pricing" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">Pricing</NavLink>
            <NavLink to="/about" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">About</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
