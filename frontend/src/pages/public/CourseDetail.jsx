import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Clock, Users, Star, Award, Globe, CheckCircle, ChevronDown, ChevronUp, Heart, BookOpen, Lock } from 'lucide-react';
import { courseService, enrollmentService, wishlistService } from '../../services/courseService.js';
import { formatPrice, formatDuration, formatNumber, getLevelBadge, formatDate, getInitials } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import { StarDisplay } from '../../components/common/StarRating.jsx';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CourseDetail() {
  const { slug } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState([0]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => courseService.getBySlug(slug).then(r => r.data.data),
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentService.enroll(data.course.id),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      navigate(`/learn/${slug}`);
      queryClient.invalidateQueries(['course', slug]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Enrollment failed'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistService.add(data.course.id),
    onSuccess: () => toast.success('Added to wishlist'),
    onError: () => toast.error('Failed to add to wishlist'),
  });

  const handleEnroll = () => {
    if (!isAuthenticated) return navigate('/login');
    if (data.isEnrolled) return navigate(`/learn/${slug}`);
    enrollMutation.mutate();
  };

  if (isLoading) return <PageLoader />;
  if (error || !data) return <div className="text-center py-20 text-red-500">Course not found</div>;

  const { course, sections, reviews, isEnrolled } = data;
  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
  const price = course.discount_price || course.price;

  const toggleSection = (i) => setOpenSections((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            {course.category_name && <span className="text-primary-600 text-sm font-semibold">{course.category_name}</span>}
            <h1 className="text-3xl font-bold text-slate-900 mt-2 mb-4">{course.title}</h1>
            <p className="text-slate-600 text-lg leading-relaxed">{course.short_description}</p>

            <div className="flex flex-wrap items-center gap-4 mt-5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-600">{parseFloat(course.avg_rating || 0).toFixed(1)}</span>
                <StarDisplay rating={course.avg_rating || 0} />
                <span className="text-slate-500 text-sm">({formatNumber(course.total_reviews)} reviews)</span>
              </div>
              <span className="flex items-center gap-1 text-sm text-slate-600"><Users className="w-4 h-4" />{formatNumber(course.total_enrollments)} students</span>
              <span className={clsx('badge', getLevelBadge(course.level))}>{course.level}</span>
              <span className="flex items-center gap-1 text-sm text-slate-600"><Globe className="w-4 h-4" />{course.language}</span>
            </div>

            {course.instructor_name && (
              <p className="mt-3 text-sm text-slate-500">Created by <Link to={`/instructor/${course.instructor_id}`} className="text-primary-600 hover:underline">{course.instructor_name}</Link></p>
            )}
          </div>

          {/* What you'll learn */}
          {course.what_you_learn?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-5">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.what_you_learn.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Course Curriculum</h2>
            <div className="space-y-2">
              {sections.map((section, i) => (
                <div key={section.id} className="card overflow-hidden">
                  <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {openSections.includes(i) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      <span className="font-semibold text-slate-900">{section.title}</span>
                    </div>
                    <span className="text-sm text-slate-500">{section.lessons?.length || 0} lessons</span>
                  </button>
                  {openSections.includes(i) && (
                    <div className="border-t border-slate-100">
                      {(section.lessons || []).map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {lesson.is_preview ? <Play className="w-3 h-3 text-primary-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                          </div>
                          <span className="text-sm text-slate-700 flex-1">{lesson.title}</span>
                          {lesson.is_preview && <span className="text-xs text-primary-600 font-medium">Preview</span>}
                          <span className="text-xs text-slate-500">{formatDuration(lesson.duration_seconds)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {course.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructor */}
          {course.instructor_name && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Your Instructor</h2>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0 overflow-hidden">
                  {course.instructor_avatar ? (
                    <img src={course.instructor_avatar} className="w-full h-full object-cover" alt={course.instructor_name} />
                  ) : getInitials(course.instructor_name)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{course.instructor_name}</h3>
                  {course.instructor_bio && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{course.instructor_bio}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-5">Student Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0 overflow-hidden">
                      {review.student_avatar ? <img src={review.student_avatar} className="w-full h-full object-cover" alt={review.student_name} /> : getInitials(review.student_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{review.student_name}</span>
                        <StarDisplay rating={review.rating} size="sm" />
                        <span className="text-xs text-slate-500">{formatDate(review.created_at)}</span>
                      </div>
                      {review.comment && <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            {course.thumbnail && (
              <div className="aspect-video rounded-xl overflow-hidden mb-5 bg-slate-200">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl font-extrabold text-slate-900">{formatPrice(price)}</span>
              {course.discount_price && course.price > course.discount_price && (
                <span className="text-slate-400 line-through text-lg">{formatPrice(course.price)}</span>
              )}
            </div>

            <button onClick={handleEnroll} disabled={enrollMutation.isPending}
              className="btn-primary w-full text-center mb-3 text-base py-3">
              {isEnrolled ? 'Continue Learning' : enrollMutation.isPending ? 'Enrolling...' : price === 0 || price === '0' ? 'Enroll Free' : 'Enroll Now'}
            </button>

            {!isEnrolled && (
              <button onClick={() => { if (!isAuthenticated) return navigate('/login'); wishlistMutation.mutate(); }}
                className="btn-secondary w-full flex items-center justify-center gap-2 mb-5">
                <Heart className="w-4 h-4" /> Add to Wishlist
              </button>
            )}

            <div className="space-y-3 text-sm">
              {[
                { icon: Clock, label: 'Total duration', value: formatDuration(course.duration_seconds) },
                { icon: BookOpen, label: 'Lessons', value: `${totalLessons} lessons` },
                { icon: Users, label: 'Students', value: formatNumber(course.total_enrollments) },
                { icon: Globe, label: 'Language', value: course.language },
                { icon: Award, label: 'Certificate', value: 'On completion' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
