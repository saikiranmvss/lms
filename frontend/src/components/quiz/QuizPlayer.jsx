import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp,
  RotateCcw, Award, Target, Zap, BarChart3, Check, X, Sliders
} from 'lucide-react';
import { quizService } from '../../services/courseService.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ─── Slider Input ─────────────────────────────────────────────────── */
function RangeSlider({ config, value, onChange, disabled }) {
  const { min = 0, max = 100, step = 1, minLabel, maxLabel, unit = '', description } = config;
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-5">
      {description && <p className="text-sm text-slate-500 italic">{description}</p>}

      {/* Live value display */}
      <div className="flex justify-center">
        <div className="bg-primary-600 text-white text-2xl font-bold px-6 py-2 rounded-2xl shadow-lg min-w-[100px] text-center">
          {value}{unit}
        </div>
      </div>

      {/* Slider track */}
      <div className="relative px-2">
        <div className="relative h-3 rounded-full bg-slate-200">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-3 top-0"
          style={{ margin: 0 }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[3px] border-primary-600 shadow-md transition-all pointer-events-none"
          style={{ left: `calc(${percent}% - 12px)` }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
        <span>{minLabel || `${min}${unit}`}</span>
        <span className="text-slate-400">Step: {step}</span>
        <span>{maxLabel || `${max}${unit}`}</span>
      </div>
    </div>
  );
}

/* ─── Score Ring ────────────────────────────────────────────────────── */
function ScoreRing({ score, isPassed }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={isPassed ? '#22c55e' : '#ef4444'}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <p className={clsx('text-3xl font-black', isPassed ? 'text-green-600' : 'text-red-500')}>{Math.round(score)}%</p>
        <p className={clsx('text-xs font-bold uppercase tracking-wide', isPassed ? 'text-green-500' : 'text-red-400')}>
          {isPassed ? 'Passed' : 'Failed'}
        </p>
      </div>
    </div>
  );
}

/* ─── Single Question ───────────────────────────────────────────────── */
function QuestionCard({ q, idx, answer, onChange, reviewMode, questionResult, disabled }) {
  const cfg = q.slider_config || {};
  const sliderVal = answer !== undefined && answer !== null && answer !== '' ? parseFloat(answer) : (cfg.defaultValue ?? Math.round(((cfg.min ?? 0) + (cfg.max ?? 100)) / 2));

  const typeLabels = { mcq: 'Multiple Choice', multiple_answer: 'Multiple Answer', true_false: 'True / False', short_answer: 'Short Answer', range_slider: 'Range Slider' };
  const typeBg = { mcq: 'bg-blue-100 text-blue-700', multiple_answer: 'bg-violet-100 text-violet-700', true_false: 'bg-amber-100 text-amber-700', short_answer: 'bg-green-100 text-green-700', range_slider: 'bg-cyan-100 text-cyan-700' };

  const isCorrect = reviewMode && questionResult?.isCorrect;
  const isWrong = reviewMode && !questionResult?.isCorrect && (answer !== undefined && answer !== null && answer !== '');
  const isUnanswered = reviewMode && (answer === undefined || answer === null || answer === '');

  return (
    <div className={clsx('rounded-2xl border-2 transition-all', {
      'border-green-300 bg-green-50/30': isCorrect,
      'border-red-300 bg-red-50/20': isWrong,
      'border-amber-300 bg-amber-50/20': isUnanswered,
      'border-slate-200 bg-white': !reviewMode,
    })}>
      <div className="p-5">
        {/* Question header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
            isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isUnanswered ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-600')}>
            {reviewMode ? (isCorrect ? <Check className="w-4 h-4" /> : isWrong ? <X className="w-4 h-4" /> : '?') : idx + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', typeBg[q.type])}>{typeLabels[q.type]}</span>
              <span className="text-xs text-slate-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
              {q.type === 'multiple_answer' && <span className="text-xs text-slate-400">— select all that apply</span>}
            </div>
            <p className="text-base font-semibold text-slate-900 leading-snug">{q.question}</p>
          </div>
        </div>

        {/* MCQ */}
        {q.type === 'mcq' && (
          <div className="space-y-2 ml-11">
            {(q.options || []).map((opt, oi) => {
              const selected = answer === opt;
              const correct = reviewMode && q.correct_answers?.includes(opt);
              const wrong = reviewMode && selected && !correct;
              return (
                <button key={oi} type="button" disabled={disabled || reviewMode}
                  onClick={() => onChange(opt)}
                  className={clsx('w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all',
                    correct ? 'border-green-400 bg-green-50 text-green-800 font-medium' :
                    wrong ? 'border-red-400 bg-red-50 text-red-800' :
                    selected ? 'border-primary-400 bg-primary-50 text-primary-800' :
                    'border-slate-200 hover:border-slate-300 text-slate-700')}>
                  <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    correct ? 'border-green-500 bg-green-500' : wrong ? 'border-red-500 bg-red-500' : selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300')}>
                    {(selected || correct) && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {opt}
                  {correct && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                  {wrong && <X className="w-4 h-4 text-red-500 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Multiple Answer */}
        {q.type === 'multiple_answer' && (
          <div className="space-y-2 ml-11">
            {(q.options || []).map((opt, oi) => {
              const selected = Array.isArray(answer) && answer.includes(opt);
              const correct = reviewMode && q.correct_answers?.includes(opt);
              const wrong = reviewMode && selected && !correct;
              const missed = reviewMode && !selected && correct;
              const toggle = () => {
                const cur = Array.isArray(answer) ? answer : [];
                onChange(cur.includes(opt) ? cur.filter(a => a !== opt) : [...cur, opt]);
              };
              return (
                <button key={oi} type="button" disabled={disabled || reviewMode}
                  onClick={toggle}
                  className={clsx('w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all',
                    missed ? 'border-green-300 bg-green-50/50 text-green-800 border-dashed' :
                    correct ? 'border-green-400 bg-green-50 text-green-800 font-medium' :
                    wrong ? 'border-red-400 bg-red-50 text-red-800' :
                    selected ? 'border-primary-400 bg-primary-50 text-primary-800' :
                    'border-slate-200 hover:border-slate-300 text-slate-700')}>
                  <div className={clsx('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                    correct ? 'border-green-500 bg-green-500' : wrong ? 'border-red-500 bg-red-500' : selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300')}>
                    {(selected || correct) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {opt}
                  {missed && <span className="ml-auto text-xs text-green-600 font-semibold">Correct answer</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* True/False */}
        {q.type === 'true_false' && (
          <div className="flex gap-3 ml-11">
            {['True', 'False'].map(val => {
              const selected = answer === val;
              const correct = reviewMode && q.correct_answers?.includes(val);
              const wrong = reviewMode && selected && !correct;
              return (
                <button key={val} type="button" disabled={disabled || reviewMode}
                  onClick={() => onChange(val)}
                  className={clsx('flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2',
                    correct ? 'border-green-400 bg-green-50 text-green-700' :
                    wrong ? 'border-red-400 bg-red-50 text-red-700' :
                    selected ? 'border-primary-400 bg-primary-50 text-primary-700' :
                    'border-slate-200 text-slate-600 hover:border-slate-300')}>
                  {correct && <Check className="w-4 h-4" />}
                  {wrong && <X className="w-4 h-4" />}
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* Short Answer */}
        {q.type === 'short_answer' && (
          <div className="ml-11">
            <textarea
              value={answer || ''}
              onChange={e => onChange(e.target.value)}
              disabled={disabled || reviewMode}
              rows={3}
              placeholder="Type your answer here..."
              className={clsx('w-full px-4 py-3 rounded-xl border-2 text-sm resize-none outline-none transition-all',
                reviewMode ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100')}
            />
            {reviewMode && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                Short answer questions are manually graded by the instructor.
              </div>
            )}
          </div>
        )}

        {/* Range Slider */}
        {q.type === 'range_slider' && (
          <div className="ml-11">
            <RangeSlider
              config={cfg}
              value={sliderVal}
              onChange={v => onChange(v)}
              disabled={disabled || reviewMode}
            />
            {reviewMode && (
              <div className={clsx('mt-4 p-3 rounded-xl border text-sm', isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800')}>
                {isCorrect ? (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Your answer <strong>{sliderVal}{cfg.unit}</strong> is within the accepted range.</span>
                ) : (
                  <div className="space-y-1">
                    <p>Your answer: <strong>{sliderVal}{cfg.unit}</strong></p>
                    <p>Correct answer: <strong>{q.correct_answers?.[0]}{cfg.unit}</strong> ± {cfg.tolerance ?? 0}{cfg.unit}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {reviewMode && q.explanation && (
          <div className="mt-4 ml-11 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 flex gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span><strong>Explanation:</strong> {q.explanation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main QuizPlayer ───────────────────────────────────────────────── */
export default function QuizPlayer({ lessonId, courseId, onComplete }) {
  const [phase, setPhase] = useState('intro'); // intro | taking | results
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz-lesson', lessonId],
    queryFn: () => quizService.getByLesson(lessonId).then(r => r.data.data),
    enabled: !!lessonId,
  });

  const quiz = quizData?.quiz;
  const questions = quizData?.questions || [];
  const attempts = quizData?.userAttempts || [];
  const attemptsUsed = attempts.length;
  const attemptsLeft = quiz ? (quiz.max_attempts - attemptsUsed) : 0;
  const lastAttempt = attempts[0];

  // Init slider defaults when quiz loads
  useEffect(() => {
    if (questions.length && phase === 'intro') {
      const defaults = {};
      questions.forEach(q => {
        if (q.type === 'range_slider') {
          const cfg = q.slider_config || {};
          defaults[q.id] = cfg.defaultValue ?? Math.round(((cfg.min ?? 0) + (cfg.max ?? 100)) / 2);
        }
      });
      setAnswers(prev => ({ ...defaults, ...prev }));
    }
  }, [questions, phase]);

  // Timer
  useEffect(() => {
    if (phase === 'taking' && quiz?.time_limit_minutes) {
      const totalSecs = quiz.time_limit_minutes * 60;
      setTimeLeft(totalSecs);
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        setTimeTaken(Math.round((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else if (phase === 'taking') {
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeTaken(Math.round((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const submitMutation = useMutation({
    mutationFn: (data) => quizService.submit(data),
    onSuccess: (res) => {
      const data = res.data.data;
      setResult(data);
      setPhase('results');
      queryClient.invalidateQueries(['quiz-lesson', lessonId]);
      if (data.isPassed && onComplete) onComplete();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit quiz'),
  });

  const handleStart = () => {
    setAnswers(prev => {
      const defaults = {};
      questions.forEach(q => {
        if (q.type === 'range_slider') {
          const cfg = q.slider_config || {};
          defaults[q.id] = cfg.defaultValue ?? Math.round(((cfg.min ?? 0) + (cfg.max ?? 100)) / 2);
        }
      });
      return { ...defaults, ...prev };
    });
    setPhase('taking');
  };

  const handleAutoSubmit = useCallback(() => {
    if (!quiz) return;
    const elapsed = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
    submitMutation.mutate({ quizId: quiz.id, answers, timeTakenSeconds: elapsed });
  }, [quiz, answers]);

  const handleSubmit = () => {
    if (!quiz) return;
    const required = questions.filter(q => {
      if (q.type === 'range_slider' && q.slider_config?.required === false) return false;
      return true;
    });
    const unanswered = required.filter(q => {
      const a = answers[q.id];
      return a === undefined || a === null || a === '';
    });
    if (unanswered.length > 0 && !confirm(`${unanswered.length} question(s) unanswered. Submit anyway?`)) return;
    submitMutation.mutate({ quizId: quiz.id, answers, timeTakenSeconds: timeTaken });
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setShowReview(false);
    setTimeLeft(null);
    setTimeTaken(0);
    const defaults = {};
    questions.forEach(q => {
      if (q.type === 'range_slider') {
        const cfg = q.slider_config || {};
        defaults[q.id] = cfg.defaultValue ?? Math.round(((cfg.min ?? 0) + (cfg.max ?? 100)) / 2);
      }
    });
    setAnswers(defaults);
    setPhase('intro');
  };

  const setAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
  }).length;

  const totalPoints = questions.reduce((s, q) => s + (q.points || 1), 0);

  const fmtTime = (secs) => {
    if (secs === null) return '';
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full" />
    </div>
  );

  if (!quiz) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
      <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
      <p>Quiz not found or not set up yet.</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
      <AlertCircle className="w-10 h-10 mb-3 text-slate-300" />
      <p>This quiz has no questions yet.</p>
    </div>
  );

  /* ── INTRO ── */
  if (phase === 'intro') return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{quiz.title}</h2>
        {quiz.description && <p className="text-slate-500">{quiz.description}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Questions', value: questions.length, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Points', value: totalPoints, icon: Target, color: 'text-purple-600 bg-purple-50' },
          { label: 'To Pass', value: `${quiz.passing_percentage}%`, icon: Award, color: 'text-green-600 bg-green-50' },
          { label: quiz.time_limit_minutes ? 'Time Limit' : 'Time Limit', value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'Unlimited', icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {attempts.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Your Attempts ({attemptsUsed}/{quiz.max_attempts})</p>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-primary-600 hover:underline">
              {showHistory ? 'Hide' : 'Show'} history
            </button>
          </div>
          {lastAttempt && (
            <div className={clsx('flex items-center gap-3 p-3 rounded-xl', lastAttempt.is_passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')}>
              {lastAttempt.is_passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Last attempt: {parseFloat(lastAttempt.score).toFixed(0)}%</p>
                <p className="text-xs text-slate-500">{new Date(lastAttempt.submitted_at).toLocaleDateString()}</p>
              </div>
              <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full', lastAttempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                {lastAttempt.is_passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          )}
          {showHistory && attempts.slice(1).map((a, i) => (
            <div key={a.id} className="flex items-center justify-between mt-2 px-3 py-2 bg-white rounded-xl border border-slate-100 text-sm">
              <span className="text-slate-600">Attempt {attemptsUsed - i - 1}</span>
              <span className="font-semibold text-slate-800">{parseFloat(a.score).toFixed(0)}%</span>
              <span className={clsx('text-xs font-medium', a.is_passed ? 'text-green-600' : 'text-red-500')}>{a.is_passed ? 'Passed' : 'Failed'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center space-y-3">
        {attemptsLeft > 0 ? (
          <>
            <button onClick={handleStart} className="btn-primary w-full max-w-xs py-3 text-base font-semibold rounded-2xl">
              {attemptsUsed > 0 ? `Retry Quiz (${attemptsLeft} left)` : 'Start Quiz'}
            </button>
            <p className="text-xs text-slate-400">{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining</p>
          </>
        ) : (
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-600 text-sm">
            No more attempts available (max {quiz.max_attempts} reached).
          </div>
        )}
      </div>
    </div>
  );

  /* ── TAKING ── */
  if (phase === 'taking') return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-700">{quiz.title}</div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-28 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
            </div>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className={clsx('flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1 rounded-xl',
              timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700')}>
              <Clock className="w-4 h-4" />
              {fmtTime(timeLeft)}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="btn-primary text-sm px-5 py-2 rounded-xl font-semibold"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-3xl mx-auto w-full">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            idx={i}
            answer={answers[q.id]}
            onChange={v => setAnswer(q.id, v)}
            reviewMode={false}
            disabled={submitMutation.isPending}
          />
        ))}

        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="w-full py-4 btn-primary text-base font-semibold rounded-2xl"
        >
          {submitMutation.isPending ? 'Submitting...' : `Submit Quiz (${answeredCount}/${questions.length} answered)`}
        </button>
      </div>
    </div>
  );

  /* ── RESULTS ── */
  const score = result?.score ?? (lastAttempt ? parseFloat(lastAttempt.score) : 0);
  const isPassed = result?.isPassed ?? lastAttempt?.is_passed ?? false;
  const qResults = result?.questionResults || {};
  const lastAnswers = result ? answers : (lastAttempt?.answers || {});

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Score */}
      <div className="text-center space-y-4">
        <ScoreRing score={score} isPassed={isPassed} />
        <div>
          <p className="text-slate-600 text-sm mt-2">
            {result ? `${result.earnedPoints} / ${result.totalPoints} points` : ''}
          </p>
          <p className={clsx('text-lg font-bold mt-1', isPassed ? 'text-green-600' : 'text-red-500')}>
            {isPassed ? '🎉 Congratulations! You passed!' : `Need ${quiz.passing_percentage}% to pass`}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {result && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Score', value: `${score.toFixed(0)}%` },
            { label: 'Correct', value: `${result.earnedPoints}/${result.totalPoints} pts` },
            { label: 'Time', value: fmtTime(timeTaken) || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review answers */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowReview(!showReview)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <span className="font-semibold text-slate-800">Review Answers</span>
          {showReview ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {showReview && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                idx={i}
                answer={lastAnswers[q.id]}
                onChange={() => {}}
                reviewMode
                questionResult={qResults[q.id]}
                disabled
              />
            ))}
          </div>
        )}
      </div>

      {/* Attempt history */}
      {attempts.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
            <span className="font-semibold text-slate-800">Attempt History</span>
            {showHistory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              {attempts.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-slate-500">Attempt {attempts.length - i}</span>
                  <span className="font-semibold text-slate-800">{parseFloat(a.score).toFixed(0)}%</span>
                  <span className="text-xs text-slate-400">{new Date(a.submitted_at).toLocaleDateString()}</span>
                  <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', a.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500')}>
                    {a.is_passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {attemptsLeft > 0 && (
          <button onClick={handleRetry} className="flex-1 flex items-center justify-center gap-2 py-3 btn-secondary rounded-2xl font-semibold">
            <RotateCcw className="w-4 h-4" /> Retry ({attemptsLeft} left)
          </button>
        )}
        {isPassed && (
          <button onClick={onComplete} className="flex-1 flex items-center justify-center gap-2 py-3 btn-primary rounded-2xl font-semibold">
            <CheckCircle className="w-4 h-4" /> Continue
          </button>
        )}
      </div>
    </div>
  );
}
