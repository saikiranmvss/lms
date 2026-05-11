import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { notificationService } from '../../services/courseService.js';
import { timeAgo } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const typeColors = {
  enrollment: 'bg-blue-100 text-blue-600',
  quiz: 'bg-purple-100 text-purple-600',
  review: 'bg-amber-100 text-amber-600',
  info: 'bg-slate-100 text-slate-600',
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll().then(r => r.data.data),
  });

  const readMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['notifications']); toast.success('Notification deleted'); },
  });

  if (isLoading) return <PageLoader />;

  const { notifications = [], unreadCount = 0 } = data || {};

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-primary-600 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => readMutation.mutate('all')} className="btn-ghost text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {!notifications.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={clsx('card p-4 flex items-start gap-4 transition-all', !n.is_read && 'border-primary-200 bg-primary-50/30')}>
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', typeColors[n.type] || typeColors.info)}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-semibold', !n.is_read ? 'text-slate-900' : 'text-slate-700')}>{n.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.created_at)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button onClick={() => readMutation.mutate(n.id)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-primary-600">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteMutation.mutate(n.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
