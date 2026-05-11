import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Play, CheckCircle, Clock } from 'lucide-react';
import { enrollmentService } from '../../services/courseService.js';
import { formatDuration } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import clsx from 'clsx';

export default function MyCourses() {
  const [filter, setFilter] = useState('all');

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentService.getMyEnrollments().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const filtered = (enrollments || []).filter(e =>
    filter === 'all' ? true : filter === 'in-progress' ? e.completion_percentage < 100 : e.completion_percentage === 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
        <Link to="/courses" className="btn-primary text-sm">Browse More</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[['all', 'All'], ['in-progress', 'In Progress'], ['completed', 'Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', filter === val ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title={filter === 'all' ? 'No courses yet' : `No ${filter} courses`} description="Start learning by exploring our catalog" actionLink="/courses" actionLabel="Browse Courses" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((enrollment) => (
            <div key={enrollment.id} className="card overflow-hidden flex flex-col hover:shadow-card-hover transition-all duration-200">
              <div className="relative aspect-video bg-slate-200 overflow-hidden">
                {enrollment.thumbnail ? (
                  <img src={enrollment.thumbnail} className="w-full h-full object-cover" alt={enrollment.title} />
                ) : (
                  <div className="w-full h-full bg-primary-50 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary-300" />
                  </div>
                )}
                {enrollment.completion_percentage === 100 && (
                  <div className="absolute inset-0 bg-green-600/80 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="font-semibold text-slate-900 mb-1 line-clamp-2">{enrollment.title}</p>
                <p className="text-xs text-slate-500 mb-3">{enrollment.instructor_name}</p>
                <div className="mt-auto space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{enrollment.completion_percentage}% complete</span>
                      <span>{enrollment.total_lessons} lessons</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${enrollment.completion_percentage}%` }} />
                    </div>
                  </div>
                  <Link to={`/learn/${enrollment.slug}`} className="btn-primary w-full text-center text-sm flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    {enrollment.completion_percentage === 100 ? 'Review Course' : enrollment.completion_percentage > 0 ? 'Continue' : 'Start Learning'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
