import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Video, FileText, HelpCircle, ArrowLeft } from 'lucide-react';
import { courseService } from '../../services/courseService.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const lessonTypeIcons = { video: Video, text: FileText, quiz: HelpCircle };

export default function CurriculumBuilder() {
  const { id: courseId } = useParams();
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState([]);
  const [sectionModal, setSectionModal] = useState({ open: false, editing: null });
  const [lessonModal, setLessonModal] = useState({ open: false, sectionId: null, editing: null });
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', videoUrl: '', content: '', durationSeconds: 0, isPreview: false });

  const { data: sections, isLoading } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => courseService.getSections(courseId).then(r => r.data.data),
  });

  const { data: courseRes } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => courseService.getMyCourses().then(r => r.data.data),
  });
  const course = (courseRes || []).find(c => c.id === courseId);

  const invalidate = () => queryClient.invalidateQueries(['sections', courseId]);

  const createSectionMutation = useMutation({
    mutationFn: (data) => courseService.createSection(courseId, data),
    onSuccess: () => { invalidate(); toast.success('Section created'); setSectionModal({ open: false, editing: null }); setSectionForm({ title: '', description: '' }); },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => courseService.updateSection(id, data),
    onSuccess: () => { invalidate(); toast.success('Section updated'); setSectionModal({ open: false, editing: null }); },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id) => courseService.deleteSection(id),
    onSuccess: () => { invalidate(); toast.success('Section deleted'); },
  });

  const createLessonMutation = useMutation({
    mutationFn: (data) => courseService.createLesson(data),
    onSuccess: () => { invalidate(); toast.success('Lesson added'); setLessonModal({ open: false, sectionId: null, editing: null }); setLessonForm({ title: '', type: 'video', videoUrl: '', content: '', durationSeconds: 0, isPreview: false }); },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id) => courseService.deleteLesson(id),
    onSuccess: () => { invalidate(); toast.success('Lesson deleted'); },
  });

  const publishMutation = useMutation({
    mutationFn: (status) => courseService.updateStatus(courseId, status),
    onSuccess: () => { toast.success('Course status updated!'); queryClient.invalidateQueries(['my-courses']); },
  });

  if (isLoading) return <PageLoader />;

  const handleSectionSubmit = () => {
    if (!sectionForm.title) return toast.error('Title required');
    if (sectionModal.editing) {
      updateSectionMutation.mutate({ id: sectionModal.editing.id, data: sectionForm });
    } else {
      createSectionMutation.mutate(sectionForm);
    }
  };

  const handleLessonSubmit = () => {
    if (!lessonForm.title) return toast.error('Title required');
    createLessonMutation.mutate({
      sectionId: lessonModal.sectionId,
      courseId,
      ...lessonForm,
      durationSeconds: parseInt(lessonForm.durationSeconds) || 0,
    });
  };

  const openEditSection = (section) => {
    setSectionForm({ title: section.title, description: section.description || '' });
    setSectionModal({ open: true, editing: section });
  };

  const toggleSection = (i) => setOpenSections(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Curriculum Builder</h1>
            {course && <p className="text-slate-500 text-sm mt-0.5">{course.title}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {course?.status === 'draft' && (
            <button onClick={() => publishMutation.mutate('pending')} disabled={publishMutation.isPending} className="btn-primary text-sm">
              Submit for Review
            </button>
          )}
          {course?.status === 'pending' && (
            <span className="badge bg-yellow-100 text-yellow-700 px-3 py-1">Under Review</span>
          )}
          {course?.status === 'published' && (
            <button onClick={() => publishMutation.mutate('draft')} className="btn-secondary text-sm text-red-600">
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {(sections || []).map((section, si) => (
          <div key={section.id} className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-slate-50">
              <GripVertical className="w-5 h-5 text-slate-300 cursor-grab" />
              <button onClick={() => toggleSection(si)} className="flex-1 flex items-center gap-2 text-left">
                {openSections.includes(si) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                <span className="font-semibold text-slate-900">{section.title}</span>
                <span className="text-xs text-slate-500">({section.lessons?.length || 0} lessons)</span>
              </button>
              <button onClick={() => openEditSection(section)} className="btn-ghost p-1.5"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm('Delete section?')) deleteSectionMutation.mutate(section.id); }} className="btn-ghost p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>

            {openSections.includes(si) && (
              <div className="divide-y divide-slate-100">
                {(section.lessons || []).map((lesson) => {
                  const Icon = lessonTypeIcons[lesson.type] || FileText;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-6 py-3">
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="flex-1 text-sm text-slate-700">{lesson.title}</span>
                      {lesson.is_preview && <span className="badge bg-blue-50 text-blue-600 text-xs">Preview</span>}
                      <button onClick={() => { if (confirm('Delete lesson?')) deleteLessonMutation.mutate(lesson.id); }} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <div className="px-6 py-3">
                  <button onClick={() => setLessonModal({ open: true, sectionId: section.id, editing: null })}
                    className="btn-ghost text-sm flex items-center gap-2 text-primary-600 hover:bg-primary-50">
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={() => { setSectionForm({ title: '', description: '' }); setSectionModal({ open: true, editing: null }); }}
          className="w-full card p-4 flex items-center justify-center gap-2 text-primary-600 border-dashed border-primary-200 hover:bg-primary-50 transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* Section Modal */}
      <Modal isOpen={sectionModal.open} onClose={() => setSectionModal({ open: false, editing: null })} title={sectionModal.editing ? 'Edit Section' : 'Add Section'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Title</label>
            <input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} className="input" placeholder="e.g., Getting Started" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (optional)</label>
            <textarea value={sectionForm.description} onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })} className="input resize-none" rows={2} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setSectionModal({ open: false, editing: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleSectionSubmit} disabled={createSectionMutation.isPending || updateSectionMutation.isPending} className="btn-primary">
              {sectionModal.editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={lessonModal.open} onClose={() => setLessonModal({ open: false, sectionId: null, editing: null })} title="Add Lesson" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lesson Title</label>
              <input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="input" placeholder="e.g., Introduction to React" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
              <select value={lessonForm.type} onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })} className="input">
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
          </div>
          {lessonForm.type === 'video' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Video URL</label>
              <input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} className="input" placeholder="YouTube, Vimeo, or direct URL" />
            </div>
          )}
          {lessonForm.type === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Content</label>
              <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} className="input resize-none" rows={5} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (seconds)</label>
              <input type="number" value={lessonForm.durationSeconds} onChange={(e) => setLessonForm({ ...lessonForm, durationSeconds: e.target.value })} className="input" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="preview" checked={lessonForm.isPreview} onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })} className="w-4 h-4 accent-primary-600" />
              <label htmlFor="preview" className="text-sm font-medium text-slate-700">Allow free preview</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setLessonModal({ open: false, sectionId: null, editing: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleLessonSubmit} disabled={createLessonMutation.isPending} className="btn-primary">Add Lesson</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
