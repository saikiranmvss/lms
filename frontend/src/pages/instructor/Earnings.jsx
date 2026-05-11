import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, ShoppingCart, ArrowUpRight } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatPrice, formatDate } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import clsx from 'clsx';

export default function Earnings() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['instructor-analytics'],
    queryFn: () => adminService.getInstructorAnalytics().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const total = parseFloat(analytics?.revenueStats?.total || 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Total Earnings</span>
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatPrice(total)}</p>
        </div>
        <div className="card p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Total Students</span>
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{analytics?.enrollmentStats?.total || 0}</p>
        </div>
        <div className="card p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500 font-medium">Avg per Student</span>
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {analytics?.enrollmentStats?.total > 0 ? formatPrice(total / analytics.enrollmentStats.total) : '$0'}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      {analytics?.monthlyEnrollments?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-5">Monthly Student Growth</h2>
          <div className="flex items-end gap-3 h-48">
            {analytics.monthlyEnrollments.map((m, i) => {
              const max = Math.max(...analytics.monthlyEnrollments.map(x => parseInt(x.enrollments)));
              const height = max > 0 ? (parseInt(m.enrollments) / max) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700">{m.enrollments}</span>
                  <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md" style={{ height: `${Math.max(height, 2)}%` }} />
                  <span className="text-xs text-slate-500">{new Date(m.month).toLocaleString('default', { month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payout info */}
      <div className="card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Available for payout</p>
            <p className="text-4xl font-bold">{formatPrice(total * 0.7)}</p>
            <p className="text-slate-400 text-sm mt-2">After 30% platform fee</p>
          </div>
          <button className="bg-white text-slate-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-sm flex items-center gap-2">
            Request Payout <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
