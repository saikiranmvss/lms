import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { formatPrice, formatDuration, formatNumber, getLevelBadge } from '../../utils/helpers.js';
import clsx from 'clsx';

export default function CourseCard({ course, compact = false }) {
  if (!course) return null;
  const price = course.discount_price || course.price;

  return (
    <Link to={`/courses/${course.slug}`} className="card hover:shadow-card-hover transition-all duration-200 group flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-200 overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <BookOpen className="w-12 h-12 text-primary-400" />
          </div>
        )}
        <span className={clsx('badge absolute top-2 left-2', getLevelBadge(course.level))}>
          {course.level}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {course.category_name && (
          <span className="text-xs text-primary-600 font-medium">{course.category_name}</span>
        )}
        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {course.title}
        </h3>

        {!compact && course.instructor_name && (
          <p className="text-xs text-slate-500">{course.instructor_name}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-amber-600">{parseFloat(course.avg_rating || 0).toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={clsx('w-3 h-3', s <= Math.round(course.avg_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
            ))}
          </div>
          <span className="text-xs text-slate-500">({formatNumber(course.total_reviews || 0)})</span>
        </div>

        {!compact && (
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-auto pt-1">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(course.duration_seconds)}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.total_lessons} lessons</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatNumber(course.total_enrollments)}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{formatPrice(price)}</span>
            {course.discount_price && course.price > course.discount_price && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(course.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
