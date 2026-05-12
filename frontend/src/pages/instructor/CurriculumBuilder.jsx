import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight,
  Video, FileText, HelpCircle, ArrowLeft, Settings, ListChecks,
  CheckSquare, ToggleLeft, AlignLeft, Check, X, Clock, Target,
  RefreshCw, BookOpen, Sliders, UploadCloud, Link2, AlertCircle
} from 'lucide-react';
import { courseService, quizService, uploadService } from '../../services/courseService.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice', icon: ListChecks, desc: 'One correct answer from options' },
  { value: 'multiple_answer', label: 'Multiple Answer', icon: CheckSquare, desc: 'Multiple correct answers' },
  { value: 'true_false', label: 'True / False', icon: ToggleLeft, desc: 'True or false question' },
  { value: 'short_answer', label: 'Short Answer', icon: AlignLeft, desc: 'Written response, manually graded' },
  { value: 'range_slider', label: 'Range Slider', icon: Sliders, desc: 'Drag a slider to select a value' },
];

const lessonTypeIcons = { video: Video, text: FileText, quiz: HelpCircle };
const lessonTypeColors = { video: 'text-blue-500', text: 'text-green-500', quiz: 'text-purple-500' };

const emptySliderConfig = () => ({
  min: 0, max: 100, defaultValue: 50, step: 1,
  minLabel: '', maxLabel: '', unit: '',
  description: '', tolerance: 5, required: true,
  correctAnswer: 50,
});

const emptyQuestion = () => ({
  type: 'mcq',
  question: '',
  options: ['', '', '', ''],
  correctAnswers: [],
  sliderConfig: emptySliderConfig(),
  explanation: '',
  points: 1,
});

/* ─── Question Type Card ─────────────────────────────────────────── */
function QuestionTypeCard({ type, selected, onSelect }) {
  const { value, label, icon: Icon, desc } = type;
  return (
    <button type="button" onClick={() => onSelect(value)}
      className={clsx('flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all w-full',
        selected === value ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-200 hover:bg-slate-50')}>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
        selected === value ? 'bg-primary-100' : 'bg-slate-100')}>
        <Icon className={clsx('w-4 h-4', selected === value ? 'text-primary-600' : 'text-slate-500')} />
      </div>
      <div>
        <p className={clsx('text-sm font-semibold', selected === value ? 'text-primary-700' : 'text-slate-700')}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

/* ─── Range Slider Preview ───────────────────────────────────────── */
function SliderPreview({ config }) {
  const { min = 0, max = 100, defaultValue = 50, unit = '' } = config;
  const pct = ((defaultValue - min) / (max - min)) * 100;
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</p>
      <div className="flex justify-center">
        <span className="bg-primary-600 text-white text-lg font-bold px-4 py-1 rounded-xl">{defaultValue}{unit}</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-300">
        <div className="absolute top-0 left-0 h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[3px] border-primary-600 shadow" style={{ left: `calc(${pct}% - 10px)` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{config.minLabel || `${min}${unit}`}</span>
        <span>{config.maxLabel || `${max}${unit}`}</span>
      </div>
    </div>
  );
}

/* ─── Question Form ──────────────────────────────────────────────── */
function QuestionForm({ form, onChange }) {
  const setField = (k, v) => onChange({ ...form, [k]: v });
  const setCfg = (k, v) => onChange({ ...form, sliderConfig: { ...form.sliderConfig, [k]: v } });

  const setOption = (i, v) => {
    const opts = [...form.options]; opts[i] = v;
    onChange({ ...form, options: opts });
  };
  const addOption = () => onChange({ ...form, options: [...form.options, ''] });
  const removeOption = (i) => {
    const opts = form.options.filter((_, idx) => idx !== i);
    const correct = form.correctAnswers.filter(a => a !== form.options[i]);
    onChange({ ...form, options: opts, correctAnswers: correct });
  };
  const toggleCorrect = (val) => {
    if (form.type === 'mcq' || form.type === 'true_false') {
      onChange({ ...form, correctAnswers: [val] });
    } else {
      const has = form.correctAnswers.includes(val);
      onChange({ ...form, correctAnswers: has ? form.correctAnswers.filter(a => a !== val) : [...form.correctAnswers, val] });
    }
  };

  const cfg = form.sliderConfig;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Question Text *</label>
        <textarea value={form.question} onChange={e => setField('question', e.target.value)}
          className="input resize-none" rows={3} placeholder="Enter your question here..." />
      </div>

      {/* MCQ options */}
      {(form.type === 'mcq' || form.type === 'multiple_answer') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">
              Answer Options
              <span className="text-xs font-normal text-slate-500 ml-2">
                {form.type === 'mcq' ? '— click circle to mark correct' : '— click to mark all correct'}
              </span>
            </label>
            <button type="button" onClick={addOption} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          </div>
          <div className="space-y-2">
            {form.options.map((opt, i) => {
              const isCorrect = form.correctAnswers.includes(opt) && opt !== '';
              return (
                <div key={i} className={clsx('flex items-center gap-2 p-2 rounded-lg border transition-all',
                  isCorrect ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white')}>
                  <button type="button" onClick={() => opt && toggleCorrect(opt)}
                    className={clsx('w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                      isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400')}>
                    {isCorrect && <Check className="w-3 h-3" />}
                  </button>
                  <input value={opt} onChange={e => setOption(i, e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none placeholder-slate-400" placeholder={`Option ${i + 1}`} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-slate-300 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {form.correctAnswers.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <Target className="w-3 h-3" /> Click the circle next to an option to mark it correct
            </p>
          )}
        </div>
      )}

      {/* True/False */}
      {form.type === 'true_false' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Correct Answer</label>
          <div className="flex gap-3">
            {['True', 'False'].map(val => (
              <button key={val} type="button" onClick={() => toggleCorrect(val)}
                className={clsx('flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all',
                  form.correctAnswers.includes(val)
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300')}>
                {form.correctAnswers.includes(val) && <Check className="w-4 h-4 inline mr-1.5" />}{val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Short answer notice */}
      {form.type === 'short_answer' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 font-medium">Short Answer</p>
          <p className="text-xs text-amber-600 mt-0.5">Students type their answer. Not automatically graded.</p>
        </div>
      )}

      {/* Range Slider Builder */}
      {form.type === 'range_slider' && (
        <div className="space-y-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
          <p className="text-sm font-semibold text-cyan-800 flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Range Slider Configuration
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Slider Description (optional)</label>
            <input value={cfg.description} onChange={e => setCfg('description', e.target.value)}
              className="input text-sm" placeholder="e.g., Drag the slider to indicate your level" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Value</label>
              <input type="number" value={cfg.min} onChange={e => setCfg('min', parseFloat(e.target.value) || 0)}
                className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Value</label>
              <input type="number" value={cfg.max} onChange={e => setCfg('max', parseFloat(e.target.value) || 100)}
                className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Value</label>
              <input type="number" value={cfg.defaultValue}
                onChange={e => setCfg('defaultValue', parseFloat(e.target.value) || 0)}
                min={cfg.min} max={cfg.max} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Step</label>
              <input type="number" value={cfg.step} min={0.1}
                onChange={e => setCfg('step', parseFloat(e.target.value) || 1)}
                className="input text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Label</label>
              <input value={cfg.minLabel} onChange={e => setCfg('minLabel', e.target.value)}
                className="input text-sm" placeholder={`${cfg.min}${cfg.unit}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Label</label>
              <input value={cfg.maxLabel} onChange={e => setCfg('maxLabel', e.target.value)}
                className="input text-sm" placeholder={`${cfg.max}${cfg.unit}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit (%, yrs, pts…)</label>
              <input value={cfg.unit} onChange={e => setCfg('unit', e.target.value)}
                className="input text-sm" placeholder="%" />
            </div>
          </div>

          <div className="border-t border-cyan-200 pt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-green-500" /> Correct Answer
              </label>
              <input type="number" value={cfg.correctAnswer}
                onChange={e => setCfg('correctAnswer', parseFloat(e.target.value) || 0)}
                min={cfg.min} max={cfg.max} step={cfg.step}
                className="input text-sm border-green-300 focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tolerance (±)</label>
              <input type="number" value={cfg.tolerance} min={0}
                onChange={e => setCfg('tolerance', parseFloat(e.target.value) || 0)}
                className="input text-sm" />
              <p className="text-xs text-slate-400 mt-1">Answer accepted if within ±{cfg.tolerance}{cfg.unit} of {cfg.correctAnswer}{cfg.unit}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="slider-required" checked={cfg.required !== false}
              onChange={e => setCfg('required', e.target.checked)} className="w-4 h-4 accent-primary-600" />
            <label htmlFor="slider-required" className="text-sm text-slate-700 font-medium">Required — student must interact with slider</label>
          </div>

          <SliderPreview config={cfg} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Points</label>
          <input type="number" min="1" max="100" value={form.points}
            onChange={e => setField('points', parseInt(e.target.value) || 1)} className="input" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Explanation (optional)</label>
          <input value={form.explanation} onChange={e => setField('explanation', e.target.value)}
            className="input" placeholder="Shown after answering" />
        </div>
      </div>
    </div>
  );
}

/* ─── Quiz Builder Modal ─────────────────────────────────────────── */
function QuizBuilderModal({ lesson, courseId, onClose }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('questions');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState(emptyQuestion());
  const [settings, setSettings] = useState(null);

  const { data: quizData, isLoading, refetch } = useQuery({
    queryKey: ['quiz-lesson', lesson.id],
    queryFn: async () => {
      try {
        const r = await quizService.getByLesson(lesson.id);
        return r.data.data;
      } catch {
        const r = await quizService.create({
          lessonId: lesson.id, courseId, title: lesson.title, passingPercentage: 70, maxAttempts: 3,
        });
        return { quiz: r.data.data, questions: [] };
      }
    },
  });

  const quiz = quizData?.quiz;
  const questions = quizData?.questions || [];

  useEffect(() => {
    if (quiz && !settings) {
      setSettings({
        title: quiz.title || lesson.title,
        passingPercentage: quiz.passing_percentage ?? 70,
        timeLimitMinutes: quiz.time_limit_minutes ?? '',
        maxAttempts: quiz.max_attempts ?? 3,
      });
    }
  }, [quiz]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => quizService.update(quiz.id, data),
    onSuccess: () => { toast.success('Settings saved'); refetch(); },
    onError: () => toast.error('Failed to save settings'),
  });

  const addQuestionMutation = useMutation({
    mutationFn: (data) => quizService.addQuestion(data),
    onSuccess: () => {
      toast.success('Question added');
      setQuestionForm(emptyQuestion());
      setAddingQuestion(false);
      refetch();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add question'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id) => quizService.deleteQuestion(id),
    onSuccess: () => { toast.success('Question deleted'); refetch(); },
    onError: () => toast.error('Failed to delete question'),
  });

  const handleAddQuestion = () => {
    if (!questionForm.question.trim()) return toast.error('Question text is required');

    if (questionForm.type === 'range_slider') {
      const cfg = questionForm.sliderConfig;
      if (cfg.min >= cfg.max) return toast.error('Max must be greater than Min');
      if (cfg.correctAnswer < cfg.min || cfg.correctAnswer > cfg.max) return toast.error('Correct answer must be within min–max range');
      addQuestionMutation.mutate({
        quizId: quiz.id,
        question: questionForm.question.trim(),
        type: 'range_slider',
        sliderConfig: {
          min: cfg.min, max: cfg.max, defaultValue: cfg.defaultValue, step: cfg.step,
          minLabel: cfg.minLabel, maxLabel: cfg.maxLabel, unit: cfg.unit,
          description: cfg.description, tolerance: cfg.tolerance, required: cfg.required,
        },
        correctAnswers: [String(cfg.correctAnswer)],
        explanation: questionForm.explanation || null,
        points: questionForm.points,
      });
      return;
    }

    if ((questionForm.type === 'mcq' || questionForm.type === 'multiple_answer') && questionForm.options.filter(Boolean).length < 2) {
      return toast.error('Add at least 2 options');
    }
    if (questionForm.type !== 'short_answer' && questionForm.correctAnswers.length === 0) {
      return toast.error('Mark at least one correct answer');
    }
    addQuestionMutation.mutate({
      quizId: quiz.id,
      question: questionForm.question.trim(),
      type: questionForm.type,
      options: (questionForm.type === 'mcq' || questionForm.type === 'multiple_answer')
        ? questionForm.options.filter(Boolean)
        : (questionForm.type === 'true_false' ? ['True', 'False'] : null),
      correctAnswers: questionForm.correctAnswers,
      explanation: questionForm.explanation || null,
      points: questionForm.points,
    });
  };

  const handleSaveSettings = () => {
    if (!quiz) return;
    updateSettingsMutation.mutate({
      title: settings.title,
      passingPercentage: parseInt(settings.passingPercentage),
      timeLimitMinutes: settings.timeLimitMinutes ? parseInt(settings.timeLimitMinutes) : null,
      maxAttempts: parseInt(settings.maxAttempts),
    });
  };

  const typeLabel = { mcq: 'MCQ', multiple_answer: 'Multi-Answer', true_false: 'True/False', short_answer: 'Short Answer', range_slider: 'Range Slider' };
  const typeBadge = { mcq: 'bg-blue-50 text-blue-600', multiple_answer: 'bg-violet-50 text-violet-600', true_false: 'bg-amber-50 text-amber-700', short_answer: 'bg-green-50 text-green-700', range_slider: 'bg-cyan-50 text-cyan-700' };

  return (
    <Modal isOpen onClose={onClose} title={`Quiz: ${lesson.title}`} size="xl">
      <div className="flex border-b border-slate-200 -mt-1 mb-5">
        {[
          { key: 'questions', label: 'Questions', icon: ListChecks },
          { key: 'settings', label: 'Settings', icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            <Icon className="w-4 h-4" /> {label}
            {key === 'questions' && questions.length > 0 && (
              <span className="ml-1 bg-primary-100 text-primary-700 text-xs rounded-full px-1.5 py-0.5">{questions.length}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <div className="py-8 text-center text-slate-500 text-sm">Loading quiz...</div>}

      {!isLoading && tab === 'questions' && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {questions.length === 0 && !addingQuestion && (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No questions yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your first question below</p>
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={q.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={clsx('badge text-xs px-2 py-0.5', typeBadge[q.type] || 'bg-slate-100 text-slate-600')}>
                      {typeLabel[q.type] || q.type}
                    </span>
                    <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{q.question}</p>

                  {q.type === 'range_slider' && q.slider_config && (
                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                      <p>Range: {q.slider_config.min}{q.slider_config.unit} → {q.slider_config.max}{q.slider_config.unit} (step {q.slider_config.step})</p>
                      <p>Correct: <strong>{q.correct_answers?.[0]}{q.slider_config.unit}</strong> ± {q.slider_config.tolerance}{q.slider_config.unit}</p>
                    </div>
                  )}

                  {(q.type === 'mcq' || q.type === 'multiple_answer') && q.options?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => {
                        const isCorrect = q.correct_answers?.includes(opt);
                        return (
                          <div key={oi} className={clsx('flex items-center gap-2 text-xs px-2 py-1 rounded-lg',
                            isCorrect ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-500')}>
                            {isCorrect ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" /> : <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="mt-2 flex gap-2">
                      {['True', 'False'].map(v => (
                        <span key={v} className={clsx('text-xs px-2 py-1 rounded-lg',
                          q.correct_answers?.includes(v) ? 'bg-green-50 text-green-700 font-semibold' : 'bg-slate-50 text-slate-400')}>
                          {q.correct_answers?.includes(v) && <Check className="w-3 h-3 inline mr-1" />}{v}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && <p className="mt-1 text-xs text-amber-600 italic">Open-ended — manually graded</p>}

                  {q.explanation && (
                    <p className="mt-2 text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">Explanation: {q.explanation}</p>
                  )}
                </div>
                <button onClick={() => { if (confirm('Delete this question?')) deleteQuestionMutation.mutate(q.id); }}
                  disabled={deleteQuestionMutation.isPending}
                  className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {addingQuestion ? (
            <div className="border-2 border-primary-200 rounded-xl p-5 bg-primary-50/30 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3">Question Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPES.map(t => (
                    <QuestionTypeCard key={t.value} type={t} selected={questionForm.type}
                      onSelect={(v) => setQuestionForm({ ...emptyQuestion(), type: v })} />
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <QuestionForm form={questionForm} onChange={setQuestionForm} />
              </div>
              <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
                <button onClick={() => { setAddingQuestion(false); setQuestionForm(emptyQuestion()); }} className="btn-secondary text-sm">Cancel</button>
                <button onClick={handleAddQuestion} disabled={addQuestionMutation.isPending} className="btn-primary text-sm flex items-center gap-2">
                  {addQuestionMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Question</>}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingQuestion(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-primary-200 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          )}
        </div>
      )}

      {!isLoading && tab === 'settings' && settings && (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quiz Title</label>
            <input value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'passingPercentage', label: 'Passing Score %', icon: Target, hint: 'Min score to pass' },
              { key: 'timeLimitMinutes', label: 'Time Limit (min)', icon: Clock, hint: 'Leave blank = no limit', placeholder: 'No limit' },
              { key: 'maxAttempts', label: 'Max Attempts', icon: RefreshCw, hint: 'Retakes allowed' },
            ].map(({ key, label, icon: Icon, hint, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5 text-primary-500" /> {label}
                </label>
                <input type="number" min="1" value={settings[key]}
                  onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                  className="input" placeholder={placeholder} />
                <p className="text-xs text-slate-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {[
              { label: 'Questions', value: questions.length },
              { label: 'Total Points', value: questions.reduce((s, q) => s + (q.points || 1), 0) },
              { label: 'To Pass', value: `${settings.passingPercentage}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending} className="btn-primary flex items-center gap-2">
              {updateSettingsMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Curriculum Builder ─────────────────────────────────────────── */
export default function CurriculumBuilder() {
  const { id: courseId } = useParams();
  const queryClient = useQueryClient();
  const [openSections, setOpenSections] = useState([]);
  const [sectionModal, setSectionModal] = useState({ open: false, editing: null });
  const [lessonModal, setLessonModal] = useState({ open: false, sectionId: null });
  const [quizModal, setQuizModal] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', videoUrl: '', content: '', durationSeconds: '', isPreview: false });
  const [videoInputMode, setVideoInputMode] = useState('url'); // 'url' | 'upload'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data: sections, isLoading } = useQuery({
    queryKey: ['sections', courseId],
    queryFn: () => courseService.getSections(courseId).then(r => r.data.data),
  });

  const { data: courseRes } = useQuery({
    queryKey: ['instructor-my-courses'],
    queryFn: () => courseService.getMyCourses().then(r => r.data.data),
  });
  const course = (courseRes || []).find(c => c.id === courseId);
  const invalidate = useCallback(() => queryClient.invalidateQueries(['sections', courseId]), [queryClient, courseId]);

  const createSectionMutation = useMutation({
    mutationFn: (data) => courseService.createSection(courseId, data),
    onSuccess: () => { invalidate(); toast.success('Section created'); setSectionModal({ open: false, editing: null }); setSectionForm({ title: '', description: '' }); },
    onError: () => toast.error('Failed to create section'),
  });
  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }) => courseService.updateSection(id, data),
    onSuccess: () => { invalidate(); toast.success('Section updated'); setSectionModal({ open: false, editing: null }); },
    onError: () => toast.error('Failed to update section'),
  });
  const deleteSectionMutation = useMutation({
    mutationFn: (id) => courseService.deleteSection(id),
    onSuccess: () => { invalidate(); toast.success('Section deleted'); },
    onError: () => toast.error('Failed to delete section'),
  });
  const createLessonMutation = useMutation({
    mutationFn: async (data) => {
      const lessonRes = await courseService.createLesson(data);
      const lesson = lessonRes.data.data;
      if (data.type === 'quiz') {
        try { await quizService.create({ lessonId: lesson.id, courseId, title: data.title, passingPercentage: 70, maxAttempts: 3 }); } catch {}
      }
      return lessonRes;
    },
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(vars.type === 'quiz' ? 'Quiz lesson created — click "Edit Quiz" to add questions' : 'Lesson added');
      setLessonModal({ open: false, sectionId: null });
      setLessonForm({ title: '', type: 'video', videoUrl: '', content: '', durationSeconds: '', isPreview: false });
    },
    onError: () => toast.error('Failed to create lesson'),
  });
  const deleteLessonMutation = useMutation({
    mutationFn: (id) => courseService.deleteLesson(id),
    onSuccess: () => { invalidate(); toast.success('Lesson deleted'); },
    onError: () => toast.error('Failed to delete lesson'),
  });
  const publishMutation = useMutation({
    mutationFn: (status) => courseService.updateStatus(courseId, status),
    onSuccess: (_, status) => {
      toast.success(status === 'pending' ? 'Submitted for review!' : 'Course status updated');
      queryClient.invalidateQueries(['instructor-my-courses']);
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <PageLoader />;

  const handleSectionSubmit = () => {
    if (!sectionForm.title.trim()) return toast.error('Title required');
    if (sectionModal.editing) updateSectionMutation.mutate({ id: sectionModal.editing.id, data: sectionForm });
    else createSectionMutation.mutate(sectionForm);
  };

  const handleVideoFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const res = await uploadService.uploadVideo(file, setUploadProgress);
      const url = res.data.data.url;
      setLessonForm(prev => ({ ...prev, videoUrl: url }));
      toast.success('Video uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLessonSubmit = () => {
    if (!lessonForm.title.trim()) return toast.error('Title required');
    createLessonMutation.mutate({ sectionId: lessonModal.sectionId, courseId, ...lessonForm, durationSeconds: parseInt(lessonForm.durationSeconds) || 0 });
  };

  const toggleSection = (i) => setOpenSections(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const totalLessons = (sections || []).reduce((s, sec) => s + (sec.lessons?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
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
            <button onClick={() => publishMutation.mutate('pending')} disabled={publishMutation.isPending} className="btn-primary text-sm flex items-center gap-2">
              {publishMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />} Submit for Review
            </button>
          )}
          {course?.status === 'pending' && <span className="badge bg-yellow-100 text-yellow-700 px-3 py-1.5 text-sm">Under Review</span>}
          {course?.status === 'published' && (
            <button onClick={() => publishMutation.mutate('draft')} className="btn-secondary text-sm text-red-600">Unpublish</button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-600">
        <span><span className="font-semibold text-slate-900">{(sections || []).length}</span> sections</span>
        <span><span className="font-semibold text-slate-900">{totalLessons}</span> lessons</span>
        {course?.status && (
          <span className={clsx('ml-auto badge px-2.5 py-0.5 capitalize text-xs',
            course.status === 'published' ? 'bg-green-50 text-green-700' :
            course.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-100 text-slate-600')}>
            {course.status}
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {(sections || []).length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No sections yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first section to start building</p>
          </div>
        )}

        {(sections || []).map((section, si) => (
          <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-b border-slate-100">
              <GripVertical className="w-5 h-5 text-slate-300 cursor-grab" />
              <button onClick={() => toggleSection(si)} className="flex-1 flex items-center gap-2 text-left">
                {openSections.includes(si) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-900 text-sm">{section.title}</span>
                <span className="text-xs text-slate-400 font-normal">({section.lessons?.length || 0} lessons)</span>
              </button>
              <button onClick={() => { setSectionForm({ title: section.title, description: section.description || '' }); setSectionModal({ open: true, editing: section }); }}
                className="text-slate-400 hover:text-primary-600 transition-colors p-1"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm(`Delete section "${section.title}"?`)) deleteSectionMutation.mutate(section.id); }}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
            </div>

            {openSections.includes(si) && (
              <div>
                {(section.lessons || []).length === 0 && <div className="px-6 py-4 text-sm text-slate-400 italic">No lessons yet</div>}
                {(section.lessons || []).map((lesson) => {
                  const Icon = lessonTypeIcons[lesson.type] || FileText;
                  const iconColor = lessonTypeColors[lesson.type] || 'text-slate-400';
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50 group">
                      <GripVertical className="w-4 h-4 text-slate-200 cursor-grab group-hover:text-slate-300" />
                      <Icon className={clsx('w-4 h-4 flex-shrink-0', iconColor)} />
                      <span className="flex-1 text-sm text-slate-700">{lesson.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={clsx('badge text-xs capitalize', {
                          'bg-blue-50 text-blue-600': lesson.type === 'video',
                          'bg-green-50 text-green-700': lesson.type === 'text',
                          'bg-purple-50 text-purple-700': lesson.type === 'quiz',
                        })}>{lesson.type}</span>
                        {lesson.is_preview && <span className="badge bg-sky-50 text-sky-600 text-xs">Preview</span>}
                        {lesson.type === 'quiz' && (
                          <button onClick={() => setQuizModal(lesson)}
                            className="btn-ghost py-1 px-2 text-xs text-purple-600 hover:bg-purple-50 flex items-center gap-1">
                            <Settings className="w-3.5 h-3.5" /> Edit Quiz
                          </button>
                        )}
                        <button onClick={() => { if (confirm('Delete this lesson?')) deleteLessonMutation.mutate(lesson.id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="px-5 py-3">
                  <button onClick={() => { setLessonForm({ title: '', type: 'video', videoUrl: '', content: '', durationSeconds: '', isPreview: false }); setLessonModal({ open: true, sectionId: section.id }); }}
                    className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={() => { setSectionForm({ title: '', description: '' }); setSectionModal({ open: true, editing: null }); }}
          className="w-full py-3.5 border-2 border-dashed border-primary-200 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-all">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* Section Modal */}
      <Modal isOpen={sectionModal.open} onClose={() => setSectionModal({ open: false, editing: null })} title={sectionModal.editing ? 'Edit Section' : 'New Section'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Title *</label>
            <input value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} className="input" placeholder="e.g., Getting Started" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (optional)</label>
            <textarea value={sectionForm.description} onChange={e => setSectionForm({ ...sectionForm, description: e.target.value })} className="input resize-none" rows={2} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setSectionModal({ open: false, editing: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleSectionSubmit} disabled={createSectionMutation.isPending || updateSectionMutation.isPending} className="btn-primary">
              {sectionModal.editing ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={lessonModal.open} onClose={() => setLessonModal({ open: false, sectionId: null })} title="Add Lesson" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lesson Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'video', label: 'Video', icon: Video, color: 'text-blue-500', bg: 'bg-blue-50' },
                { value: 'text', label: 'Article', icon: FileText, color: 'text-green-500', bg: 'bg-green-50' },
                { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map(({ value, label, icon: Icon, color, bg }) => (
                <button key={value} type="button" onClick={() => setLessonForm({ ...lessonForm, type: value })}
                  className={clsx('flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all',
                    lessonForm.type === value ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300')}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', lessonForm.type === value ? 'bg-primary-100' : bg)}>
                    <Icon className={clsx('w-4 h-4', lessonForm.type === value ? 'text-primary-600' : color)} />
                  </div>
                  <span className={clsx('text-xs font-semibold', lessonForm.type === value ? 'text-primary-700' : 'text-slate-600')}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lesson Title *</label>
            <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="input" placeholder={lessonForm.type === 'quiz' ? 'e.g., Chapter 1 Quiz' : 'e.g., Introduction'} autoFocus />
          </div>
          {lessonForm.type === 'video' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Video Source</label>
              {/* Toggle tabs */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden w-fit">
                <button type="button" onClick={() => setVideoInputMode('url')}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                    videoInputMode === 'url' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                  <Link2 className="w-3.5 h-3.5" /> Paste URL
                </button>
                <button type="button" onClick={() => setVideoInputMode('upload')}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                    videoInputMode === 'upload' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}>
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>

              {videoInputMode === 'url' && (
                <div>
                  <input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    className="input" placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." />
                  <p className="text-xs text-slate-400 mt-1">Supports YouTube, Vimeo, and direct video links (.mp4, .webm)</p>
                </div>
              )}

              {videoInputMode === 'upload' && (
                <div>
                  {isUploading ? (
                    <div className="border-2 border-dashed border-primary-200 rounded-xl p-6 text-center bg-primary-50">
                      <UploadCloud className="w-8 h-8 text-primary-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-medium text-primary-700 mb-2">Uploading... {uploadProgress}%</p>
                      <div className="w-full bg-primary-100 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : lessonForm.videoUrl && videoInputMode === 'upload' ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800">Video uploaded!</p>
                        <p className="text-xs text-green-600 truncate">{lessonForm.videoUrl}</p>
                      </div>
                      <button type="button" onClick={() => setLessonForm({ ...lessonForm, videoUrl: '' })}
                        className="text-green-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-all">
                        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700">Click to select a video file</p>
                        <p className="text-xs text-slate-400 mt-1">MP4, WebM, MOV, AVI — up to 2 GB</p>
                      </div>
                      <input type="file" accept="video/*" className="hidden"
                        onChange={e => handleVideoFileUpload(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              )}

              {lessonForm.videoUrl && !isUploading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">URL set: {lessonForm.videoUrl}</span>
                </div>
              )}
            </div>
          )}
          {lessonForm.type === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Article Content</label>
              <textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                className="input resize-none" rows={5} />
            </div>
          )}
          {lessonForm.type === 'quiz' && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <HelpCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-700">
                After creating the quiz lesson, click <strong>"Edit Quiz"</strong> to add questions including the new <strong>Range Slider</strong> type.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {lessonForm.type !== 'quiz' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (seconds)</label>
                <input type="number" min="0" value={lessonForm.durationSeconds}
                  onChange={e => setLessonForm({ ...lessonForm, durationSeconds: e.target.value })} className="input" placeholder="e.g., 600" />
              </div>
            )}
            <div className={clsx('flex items-center gap-3', lessonForm.type !== 'quiz' ? 'pt-6' : '')}>
              <input type="checkbox" id="is-preview" checked={lessonForm.isPreview}
                onChange={e => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <label htmlFor="is-preview" className="text-sm font-medium text-slate-700 cursor-pointer">Free preview</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setLessonModal({ open: false, sectionId: null })} className="btn-secondary">Cancel</button>
            <button onClick={handleLessonSubmit} disabled={createLessonMutation.isPending} className="btn-primary flex items-center gap-2">
              {createLessonMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> :
                `Add ${lessonForm.type === 'quiz' ? 'Quiz' : lessonForm.type === 'text' ? 'Article' : 'Video'} Lesson`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quiz Builder Modal */}
      {quizModal && <QuizBuilderModal lesson={quizModal} courseId={courseId} onClose={() => setQuizModal(null)} />}
    </div>
  );
}
