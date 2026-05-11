import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, DollarSign, TrendingUp, Plus, ArrowRight, Star } from 'lucide-react';
import { adminService, courseService } from '../../services/courseService.js';
import { formatPrice, formatNumber, formatDate, getStatusBadge } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import useAuthStore from '../../store/authStore.js';
import clsx from 'clsx';

export default function InstructorDashboard() {
  const { user } = useAuthStore();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['instructor-analytics'],
    queryFn: () => adminService.getInstructorAnalytics().then(r => r.data.data),
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => courseService.getMyCourses().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const stats = [
    { label: 'Total Courses', value: analytics?.courseStats?.total || 0, icon: BookOpen, color: 'bg-blue-50 text-blue-600', sub: `${analytics?.courseStats?.published || 0} published` },
    { label: 'Total Students', value: formatNumber(analytics?.enrollmentStats?.total || 0), icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'Total Revenue', value: formatPrice(analytics?.revenueStats?.total || 0), icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Instructor Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
        </div>
        <Link to="/instructor/courses/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">My Courses</h2>
            <Link to="/instructor/courses/create" className="text-sm text-primary-600 font-medium flex items-center gap-1">
              New <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(courses || []).slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center gap-3">
                <div className="w-12 h-9 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {course.thumbnail && <img src={course.thumbnail} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={clsx('badge text-xs', getStatusBadge(course.status))}>{course.status}</span>
                  </div>
                </div>
                <Link to={`/instructor/courses/${course.id}/curriculum`} className="text-xs text-primary-600 hover:underline flex-shrink-0">Edit</Link>
              </div>
            ))}
            {(!courses || courses.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">No courses yet</p>
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900">Recent Enrollments</h2>
            <Link to="/instructor/students" className="text-sm text-primary-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {(analytics?.recentEnrollments || []).slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold flex-shrink-0">
                  {e.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{e.name}</p>
                  <p className="text-xs text-slate-500 truncate">{e.course_title}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(e.enrolled_at, 'MMM dd')}</span>
              </div>
            ))}
            {!analytics?.recentEnrollments?.length && (
              <p className="text-sm text-slate-500 text-center py-4">No enrollments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
