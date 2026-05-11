import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, TrendingUp, ArrowRight, Play } from 'lucide-react';
import { enrollmentService, certificateService } from '../../services/courseService.js';
import useAuthStore from '../../store/authStore.js';
import { formatDuration, formatDate } from '../../utils/helpers.js';
import { PageLoader, StatSkeleton } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import clsx from 'clsx';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentService.getMyEnrollments().then(r => r.data.data),
  });

  const { data: certs } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateService.getMy().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const inProgress = (enrollments || []).filter(e => e.completion_percentage < 100);
  const completed = (enrollments || []).filter(e => e.completion_percentage === 100);
  const recentCourses = (enrollments || []).slice(0, 3);

  const stats = [
    { label: 'Enrolled Courses', value: enrollments?.length || 0, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { label: 'In Progress', value: inProgress.length, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Completed', value: completed.length, icon: Award, color: 'bg-green-50 text-green-600' },
    { label: 'Certificates', value: certs?.length || 0, icon: Award, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 mt-1">Keep learning and reach your goals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Continue Learning</h2>
          <Link to="/my-courses" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentCourses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet" description="Start learning by browsing our course library" actionLink="/courses" actionLabel="Browse Courses" />
        ) : (
          <div className="space-y-3">
            {recentCourses.map((enrollment) => (
              <Link key={enrollment.id} to={`/learn/${enrollment.slug}`}
                className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 group">
                <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                  {enrollment.thumbnail ? (
                    <img src={enrollment.thumbnail} className="w-full h-full object-cover" alt={enrollment.title} />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{enrollment.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{enrollment.instructor_name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${enrollment.completion_percentage}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">{enrollment.completion_percentage}%</span>
                  </div>
                </div>
                <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition-colors flex-shrink-0">
                  <Play className="w-4 h-4 text-primary-600 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Certificates */}
      {certs?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Recent Certificates</h2>
            <Link to="/certificates" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.slice(0, 2).map((cert) => (
              <div key={cert.id} className="card p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{cert.course_title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Issued {formatDate(cert.issued_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
