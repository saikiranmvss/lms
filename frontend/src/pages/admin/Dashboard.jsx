import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, DollarSign, TrendingUp, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatPrice, formatNumber, formatDate, getStatusBadge } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import clsx from 'clsx';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const { stats, recentUsers, recentCourses, monthlyRevenue } = data || {};

  const statCards = [
    { label: 'Total Users', value: formatNumber(stats?.total || 0), sub: `${stats?.students || 0} students, ${stats?.instructors || 0} instructors`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Courses', value: formatNumber(stats?.totalCourses || 0), sub: `${stats?.publishedCourses || 0} published`, icon: BookOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Total Enrollments', value: formatNumber(stats?.totalEnrollments || 0), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
  ];

  const pendingCount = stats?.pendingCourses || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform overview and management</p>
        </div>
        {pendingCount > 0 && (
          <Link to="/admin/courses?status=pending" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
            <Clock className="w-4 h-4" /> {pendingCount} courses pending review
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {monthlyRevenue?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5">Monthly Revenue (Last 6 months)</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyRevenue.slice(-6).map((m, i) => {
              const max = Math.max(...monthlyRevenue.slice(-6).map(x => parseFloat(x.revenue || 0)));
              const height = max > 0 ? (parseFloat(m.revenue || 0) / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700">{formatPrice(m.revenue || 0)}</span>
                  <div className="w-full bg-gradient-to-t from-primary-700 to-primary-400 rounded-t-md transition-all duration-500" style={{ height: `${Math.max(height, 2)}%` }} />
                  <span className="text-xs text-slate-500">{new Date(m.month).toLocaleString('default', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 font-medium flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-3">
            {(recentUsers || []).map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <span className={clsx('badge text-xs capitalize', user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'instructor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">Recent Courses</h2>
            <Link to="/admin/courses" className="text-sm text-primary-600 font-medium flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="space-y-3">
            {(recentCourses || []).map(course => (
              <div key={course.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.instructor_name}</p>
                </div>
                <span className={clsx('badge text-xs', getStatusBadge(course.status))}>{course.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
