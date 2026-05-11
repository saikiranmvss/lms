import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { courseService, categoryService } from '../../services/courseService.js';
import toast from 'react-hot-toast';

const steps = ['Basic Info', 'Details', 'Pricing'];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '', description: '', short_description: '', category_id: '',
    level: 'beginner', language: 'English', price: 0,
    thumbnail: '', requirements: [''], what_you_learn: [''], tags: []
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => courseService.create(data),
    onSuccess: (res) => {
      toast.success('Course created! Now add your curriculum.');
      navigate(`/instructor/courses/${res.data.data.id}/curriculum`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create course'),
  });

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updateList = (k, i, v) => {
    const arr = [...form[k]];
    arr[i] = v;
    setForm({ ...form, [k]: arr });
  };
  const addItem = (k) => setForm({ ...form, [k]: [...form[k], ''] });
  const removeItem = (k, i) => setForm({ ...form, [k]: form[k].filter((_, idx) => idx !== i) });

  const handleSubmit = () => {
    if (!form.title) return toast.error('Title is required');
    createMutation.mutate({
      ...form,
      requirements: form.requirements.filter(Boolean),
      what_you_learn: form.what_you_learn.filter(Boolean),
      price: parseFloat(form.price) || 0,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-slate-900">Create New Course</h1>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 py-2 text-center text-sm font-medium rounded-lg border-2 transition-all ${i === step ? 'border-primary-600 bg-primary-50 text-primary-700' : i < step ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-200 text-slate-400'}`}>
            {i < step ? '✓ ' : ''}{s}
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Course Title *</label>
              <input value={form.title} onChange={update('title')} placeholder="e.g., Complete Web Development Bootcamp" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description</label>
              <input value={form.short_description} onChange={update('short_description')} placeholder="One-line course summary" className="input" maxLength={200} />
              <p className="text-xs text-slate-400 mt-1">{form.short_description.length}/200</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Description</label>
              <textarea value={form.description} onChange={update('description')} rows={5} className="input resize-none" placeholder="Describe your course in detail..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thumbnail URL</label>
              <input value={form.thumbnail} onChange={update('thumbnail')} placeholder="https://..." className="input" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Language</label>
                <select value={form.language} onChange={update('language')} className="input">
                  {['English', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Hindi', 'Chinese'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* What you'll learn */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">What students will learn</label>
              {form.what_you_learn.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item} onChange={(e) => updateList('what_you_learn', i, e.target.value)} placeholder={`Learning outcome ${i + 1}`} className="input flex-1" />
                  <button type="button" onClick={() => removeItem('what_you_learn', i)} className="text-slate-400 hover:text-red-500 px-2">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addItem('what_you_learn')} className="text-sm text-primary-600 hover:underline">+ Add outcome</button>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Requirements</label>
              {form.requirements.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item} onChange={(e) => updateList('requirements', i, e.target.value)} placeholder={`Requirement ${i + 1}`} className="input flex-1" />
                  <button type="button" onClick={() => removeItem('requirements', i)} className="text-slate-400 hover:text-red-500 px-2">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addItem('requirements')} className="text-sm text-primary-600 hover:underline">+ Add requirement</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (USD)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} className="input" />
              <p className="text-xs text-slate-500 mt-1">Set to 0 for a free course</p>
            </div>
            <div className="card bg-amber-50 border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Ready to publish?</p>
              <p className="text-sm text-amber-700">After creating your course, you'll be taken to the curriculum builder to add sections and lessons. Once ready, submit for review.</p>
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => setStep(step - 1)} disabled={step === 0} className="btn-secondary flex items-center gap-2 disabled:opacity-40">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary flex items-center gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
