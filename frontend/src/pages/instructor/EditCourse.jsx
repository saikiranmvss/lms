import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { courseService, categoryService } from '../../services/courseService.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => courseService.getMyCourses().then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then(r => r.data.data),
  });

  const course = (courses || []).find(c => c.id === id);

  useEffect(() => {
    if (course && !form) {
      setForm({
        title: course.title || '', description: course.description || '',
        short_description: course.short_description || '', category_id: course.category_id || '',
        level: course.level || 'beginner', language: course.language || 'English',
        price: course.price || 0, discount_price: course.discount_price || '',
        thumbnail: course.thumbnail || '', preview_video: course.preview_video || '',
        requirements: course.requirements || [''], what_you_learn: course.what_you_learn || [''],
      });
    }
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: (data) => courseService.update(id, data),
    onSuccess: () => { toast.success('Course updated!'); queryClient.invalidateQueries(['my-courses']); },
    onError: () => toast.error('Failed to update'),
  });

  if (isLoading || !form) return <PageLoader />;
  if (!course) return <div className="text-center py-20 text-red-500">Course not found</div>;

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, price: parseFloat(form.price) || 0 });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-slate-900">Edit Course</h1>
      </div>

      <div className="flex gap-3">
        <Link to={`/instructor/courses/${id}/curriculum`} className="btn-secondary text-sm flex items-center gap-2">
          <Eye className="w-4 h-4" /> Curriculum
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Title *</label>
          <input value={form.title} onChange={update('title')} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description</label>
          <input value={form.short_description} onChange={update('short_description')} className="input" maxLength={200} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Description</label>
          <textarea value={form.description} onChange={update('description')} rows={5} className="input resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <select value={form.category_id} onChange={update('category_id')} className="input">
              <option value="">Select category</option>
              {(categories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Level</label>
            <select value={form.level} onChange={update('level')} className="input">
              {['beginner', 'intermediate', 'advanced', 'all'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (USD)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount Price</label>
            <input type="number" min="0" step="0.01" value={form.discount_price} onChange={update('discount_price')} className="input" placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thumbnail URL</label>
          <input value={form.thumbnail} onChange={update('thumbnail')} className="input" placeholder="https://..." />
        </div>
        <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />{updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
