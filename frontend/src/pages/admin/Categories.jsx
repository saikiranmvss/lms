import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../../services/courseService.js';
import { formatNumber } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({ name: '', description: '', icon: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => categoryService.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category created'); closeModal(); },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category updated'); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); toast.success('Category deleted'); },
  });

  const closeModal = () => { setModal({ open: false, editing: null }); setForm({ name: '', description: '', icon: '' }); };

  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '' });
    setModal({ open: true, editing: cat });
  };

  const handleSubmit = () => {
    if (!form.name) return toast.error('Name is required');
    if (modal.editing) {
      updateMutation.mutate({ id: modal.editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <button onClick={() => setModal({ open: true, editing: null })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {!categories?.length ? (
        <EmptyState icon={Tag} title="No categories" description="Add your first category" action={() => setModal({ open: true, editing: null })} actionLabel="Add Category" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="card p-5 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cat.icon || '📚'}</span>
                <div>
                  <p className="font-semibold text-slate-900">{cat.name}</p>
                  {cat.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{cat.description}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatNumber(cat.course_count)} courses</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-3">
                <button onClick={() => openEdit(cat)} className="btn-ghost p-1.5 text-slate-500 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Delete category?')) deleteMutation.mutate(cat.id); }} className="btn-ghost p-1.5 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g., Web Development" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon (emoji)</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" placeholder="e.g., 💻" maxLength={4} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" placeholder="Brief description..." />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={closeModal} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {modal.editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
