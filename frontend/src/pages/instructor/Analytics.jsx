import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatPrice, formatNumber, formatDate } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import clsx from 'clsx';

export default function InstructorAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['instructor-analytics'],
    queryFn: () => adminService.getInstructorAnalytics().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const stats = [
    { label: 'Total Courses', value: analytics?.courseStats?.total || 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Students', value: formatNumber(analytics?.enrollmentStats?.total || 0), icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Total Revenue', value: formatPrice(analytics?.revenueStats?.total || 0), icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly enrollments chart */}
      {analytics?.monthlyEnrollments?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5">Monthly Enrollments</h2>
          <div className="flex items-end gap-3 h-40">
            {analytics.monthlyEnrollments.map((m, i) => {
              const max = Math.max(...analytics.monthlyEnrollments.map(x => parseInt(x.enrollments)));
              const height = max > 0 ? (parseInt(m.enrollments) / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-medium">{m.enrollments}</span>
                  <div className="w-full bg-primary-600 rounded-t-md transition-all duration-500" style={{ height: `${height}%`, minHeight: '4px' }} />
                  <span className="text-xs text-slate-500">{new Date(m.month).toLocaleString('default', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Enrollments */}
      <div className="card p-5">
        <h2 className="font-bold text-slate-900 mb-5">Recent Student Activity</h2>
        <div className="space-y-4">
          {(analytics?.recentEnrollments || []).map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold">
                {e.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{e.name}</p>
                <p className="text-xs text-slate-500 truncate">{e.course_title}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{formatDate(e.enrolled_at, 'MMM dd')}</p>
                <p className="text-xs text-primary-600">{e.completion_percentage}%</p>
              </div>
            </div>
          ))}
          {!analytics?.recentEnrollments?.length && (
            <p className="text-sm text-slate-500 text-center py-4">No student activity yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
