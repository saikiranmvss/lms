import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { courseService, categoryService } from '../../services/courseService.js';
import CourseCard from '../../components/common/CourseCard.jsx';
import { CardSkeleton } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { BookOpen } from 'lucide-react';
import clsx from 'clsx';

const levels = ['all', 'beginner', 'intermediate', 'advanced'];
const sorts = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoryService.getAll().then(r => r.data.data) });

  const params = { page, limit: 12, sort, ...(search && { search }), ...(level && { level }), ...(category && { category }) };
  const { data, isLoading } = useQuery({
    queryKey: ['courses', params],
    queryFn: () => courseService.getAll(params).then(r => r.data.data),
  });

  useEffect(() => {
    const newParams = {};
    if (search) newParams.search = search;
    if (level) newParams.level = level;
    if (category) newParams.category = category;
    if (sort !== 'newest') newParams.sort = sort;
    setSearchParams(newParams, { replace: true });
    setPage(1);
  }, [search, level, category, sort]);

  const clearFilters = () => { setSearch(''); setLevel(''); setCategory(''); setSort('newest'); };
  const hasFilters = search || level || category || sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">All Courses</h1>
        <p className="text-slate-500">Explore our library of expert-led courses</p>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="input pl-10"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto">
          {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setShowFilters(!showFilters)} className={clsx('btn-secondary flex items-center gap-2', showFilters && 'border-primary-300 text-primary-700')}>
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasFilters && <span className="w-5 h-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center">!</span>}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost flex items-center gap-1.5 text-red-600 hover:bg-red-50">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="">All Categories</option>
              {(categories || []).map((cat) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Level</label>
            <div className="flex flex-wrap gap-2">
              {levels.map((l) => (
                <button key={l} onClick={() => setLevel(l === 'all' ? '' : l)}
                  className={clsx('px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    (l === 'all' ? !level : level === l)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-slate-200 text-slate-600 hover:border-primary-300')}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data?.pagination && (
        <p className="text-sm text-slate-500 mb-5">{data.pagination.total} courses found</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !data?.courses?.length ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your filters or search terms" action={clearFilters} actionLabel="Clear Filters" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>

          {/* Pagination */}
          {data.pagination?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx('w-10 h-10 rounded-lg text-sm font-medium transition-all',
                    page === p ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-primary-300')}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
