import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ShoppingCart, BookOpen } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatPrice, formatDate, formatNumber } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import clsx from 'clsx';

export default function AdminRevenue() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => adminService.getRevenue().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const { total, monthly, topCourses } = data || {};

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Revenue Analytics</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-slate-500 font-medium">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatPrice(total?.total || 0)}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-slate-500 font-medium">Total Transactions</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatNumber(total?.transactions || 0)}</p>
        </div>
      </div>

      {/* Monthly chart */}
      {monthly?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5">Monthly Revenue</h2>
          <div className="flex items-end gap-2 h-48">
            {monthly.map((m, i) => {
              const max = Math.max(...monthly.map(x => parseFloat(x.revenue || 0)));
              const height = max > 0 ? (parseFloat(m.revenue || 0) / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700 text-center">{formatPrice(m.revenue || 0)}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-primary-700 to-primary-400 transition-all duration-500" style={{ height: `${Math.max(height, 2)}%` }} />
                  <span className="text-xs text-slate-500">{new Date(m.month).toLocaleString('default', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top courses */}
      {topCourses?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-5">Top Earning Courses</h2>
          <div className="space-y-4">
            {topCourses.map((course, i) => (
              <div key={course.id} className="flex items-center gap-4">
                <span className="w-6 text-center text-sm font-bold text-slate-400">#{i + 1}</span>
                {course.thumbnail && <img src={course.thumbnail} className="w-12 h-8 rounded object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.sales} sales</p>
                </div>
                <span className="font-bold text-slate-900 text-sm">{formatPrice(course.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
