import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, X } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatDate, formatPrice, getStatusBadge } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', search, status, page],
    queryFn: () => adminService.getCourses({ search, status, page, limit: 20 }).then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.approveCourse(id, status),
    onSuccess: () => { queryClient.invalidateQueries(['admin-courses']); toast.success('Course status updated'); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Course Moderation</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="input pl-10" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Course', 'Instructor', 'Category', 'Price', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 font-semibold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.courses || []).map(course => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex items-center gap-3">
                        {course.thumbnail && <img src={course.thumbnail} className="w-10 h-7 rounded object-cover flex-shrink-0" />}
                        <span className="font-medium text-slate-900 line-clamp-2">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{course.instructor_name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{course.category_name || '—'}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{formatPrice(course.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('badge capitalize', getStatusBadge(course.status))}>{course.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(course.created_at, 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {course.status === 'pending' && (
                          <>
                            <button onClick={() => approveMutation.mutate({ id: course.id, status: 'published' })}
                              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-all whitespace-nowrap">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => approveMutation.mutate({ id: course.id, status: 'rejected' })}
                              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {course.status === 'published' && (
                          <button onClick={() => approveMutation.mutate({ id: course.id, status: 'draft' })}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                            Unpublish
                          </button>
                        )}
                        {course.status === 'rejected' && (
                          <button onClick={() => approveMutation.mutate({ id: course.id, status: 'published' })}
                            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t text-sm text-slate-500">{data?.total || 0} total courses</div>
        </div>
      )}
    </div>
  );
}
