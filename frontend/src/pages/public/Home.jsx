import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Star, ArrowRight, CheckCircle, Play, TrendingUp, Globe, Clock } from 'lucide-react';
import { courseService, categoryService } from '../../services/courseService.js';
import CourseCard from '../../components/common/CourseCard.jsx';
import { CardSkeleton } from '../../components/common/LoadingSpinner.jsx';
import { formatNumber } from '../../utils/helpers.js';

const stats = [
  { label: 'Active Students', value: '50,000+', icon: Users },
  { label: 'Expert Instructors', value: '1,200+', icon: Award },
  { label: 'Courses Available', value: '8,500+', icon: BookOpen },
  { label: 'Countries Reached', value: '150+', icon: Globe },
];

const features = [
  { icon: Play, title: 'HD Video Lessons', desc: 'Professional quality videos with subtitles and playback controls' },
  { icon: Clock, title: 'Learn at Your Pace', desc: 'Access courses anytime, resume exactly where you left off' },
  { icon: Award, title: 'Earn Certificates', desc: 'Get recognized with completion certificates for every course' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your learning journey with detailed progress tracking' },
  { icon: Users, title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience' },
  { icon: Globe, title: 'Global Community', desc: 'Connect with millions of learners around the world' },
];

export default function Home() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => courseService.getFeatured().then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then(r => r.data.data),
  });

  const { data: newCoursesData, isLoading: newLoading } = useQuery({
    queryKey: ['new-courses'],
    queryFn: () => courseService.getAll({ limit: 8, sort: 'newest' }).then(r => r.data.data),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #6370f5 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f97316 0%, transparent 40%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Trusted by 50,000+ learners worldwide</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Learn Without <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Limits</span>
            </h1>
            <p className="text-xl text-primary-200 mb-10 leading-relaxed max-w-2xl">
              Access world-class courses from industry experts. Build real skills, earn certificates, and advance your career — at your own pace.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-primary-900 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all duration-200 active:scale-95 shadow-lg">
                Browse Courses <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register?role=instructor" className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200">
                Start Teaching
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10 text-sm text-primary-300">
              {['Free courses available', 'Cancel anytime', 'Certificate of completion'].map((item) => (
                <span key={item} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 mb-1">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories?.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-primary-600 font-semibold text-sm mb-1">Browse by topic</p>
                <h2 className="text-3xl font-bold text-slate-900">Top Categories</h2>
              </div>
              <Link to="/courses" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
                All courses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map((cat) => (
                <Link key={cat.id} to={`/courses?category=${cat.slug}`}
                  className="card p-4 text-center hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="text-3xl mb-3">{cat.icon || '📚'}</div>
                  <p className="font-semibold text-sm text-slate-900 group-hover:text-primary-700 transition-colors mb-1">{cat.name}</p>
                  <p className="text-xs text-slate-500">{formatNumber(cat.course_count)} courses</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-1">Curated for you</p>
              <h2 className="text-3xl font-bold text-slate-900">Featured Courses</h2>
            </div>
            <Link to="/courses" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : (featuredData || []).map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      </section>

      {/* New Courses */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm mb-1">Just added</p>
              <h2 className="text-3xl font-bold text-slate-900">New Courses</h2>
            </div>
            <Link to="/courses?sort=newest" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : (newCoursesData?.courses || []).map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary-600 font-semibold text-sm mb-2">Why LearnHub?</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to succeed</h2>
            <p className="text-slate-500 max-w-xl mx-auto">A complete learning platform with all the tools to help you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-primary-200 text-lg mb-8">Join thousands of students already learning on LearnHub.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all duration-200 active:scale-95">
              Get Started Free
            </Link>
            <Link to="/courses" className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
