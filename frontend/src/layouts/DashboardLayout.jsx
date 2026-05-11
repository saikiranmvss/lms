import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Heart, Award, Bell, User, LogOut,
  GraduationCap, PlusCircle, Users, DollarSign, BarChart2,
  Shield, Settings, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useUiStore from '../store/uiStore.js';
import { authService } from '../services/courseService.js';
import { getInitials } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-courses', icon: BookOpen, label: 'My Courses' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/certificates', icon: Award, label: 'Certificates' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const instructorLinks = [
  { to: '/instructor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/instructor/courses/create', icon: PlusCircle, label: 'Create Course' },
  { to: '/instructor/students', icon: Users, label: 'Students' },
  { to: '/instructor/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/instructor/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { to: '/admin/categories', icon: Settings, label: 'Categories' },
  { to: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'instructor' ? instructorLinks : studentLinks;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full bg-white border-r border-slate-100 shadow-sm z-30 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-slate-900 text-lg">LearnHub</span>}
        </div>

        {/* Toggle */}
        <button onClick={toggleSidebar} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-500 hover:text-primary-600 transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* User Info */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {getInitials(user?.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{user?.name}</p>
                <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx('sidebar-link', isActive && 'active', !sidebarOpen && 'justify-center px-2')}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}

          {user?.role !== 'admin' && sidebarOpen && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase px-3 pb-2">Browse</p>
              <NavLink to="/courses" className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}>
                <BookOpen className="w-5 h-5" />
                <span>All Courses</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-slate-100 pt-3">
          <button onClick={handleLogout} className={clsx('sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600', !sidebarOpen && 'justify-center px-2')}>
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={clsx('flex-1 transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 h-16 flex items-center px-6 gap-4">
          <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-700 lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <NavLink to="/notifications" className="relative text-slate-500 hover:text-primary-600 transition-colors">
            <Bell className="w-5 h-5" />
          </NavLink>
          <NavLink to="/profile" className="flex items-center gap-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                {getInitials(user?.name)}
              </div>
            )}
          </NavLink>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
