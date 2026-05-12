import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, CheckCircle, Circle, ChevronDown, ChevronRight,
  MessageSquare, FileText, Download, StickyNote, ArrowLeft, HelpCircle, Video, BookOpen, Loader2,
} from 'lucide-react';
import { courseService, enrollmentService, discussionService, noteService } from '../../services/courseService.js';
import { formatDuration, formatDate, getInitials, timeAgo } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import QuizPlayer from '../../components/quiz/QuizPlayer.jsx';
import LessonVideoPlayer from '../../components/student/LessonVideoPlayer.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CourseWatch() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [openSections, setOpenSections] = useState([0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lessonContentScrollRef = useRef(null);

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course-watch', slug],
    queryFn: () => courseService.getBySlug(slug).then(r => r.data.data),
  });

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseData?.course?.id],
    queryFn: () => enrollmentService.getCourseProgress(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id,
  });

  const { data: lessonData, isPending: lessonDetailPending } = useQuery({
    queryKey: ['lesson-detail', currentLesson?.id],
    queryFn: () => courseService.getLesson(currentLesson.id).then(r => r.data.data),
    enabled: !!currentLesson?.id,
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', courseData?.course?.id],
    queryFn: () => noteService.get(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id && activeTab === 'notes',
  });

  useEffect(() => {
    if (courseData?.sections?.length > 0 && !currentLesson) {
      const first = courseData.sections[0]?.lessons?.[0];
      if (first) setCurrentLesson(first);
    }
  }, [courseData]);

  useEffect(() => {
    if (currentLesson?.type !== 'quiz') setActiveTab('overview');
  }, [currentLesson?.id]);

  useEffect(() => {
    lessonContentScrollRef.current?.scrollTo(0, 0);
  }, [currentLesson?.id, activeTab]);

  const progressMutation = useMutation({
    mutationFn: (data) => enrollmentService.updateProgress(data),
    onSuccess: () => { queryClient.invalidateQueries(['progress']); refetchProgress(); },
  });

  const noteMutation = useMutation({
    mutationFn: (data) => noteService.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['notes']); setNoteContent(''); toast.success('Note saved'); },
  });

  const questionMutation = useMutation({
    mutationFn: (data) => discussionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson-detail', currentLesson?.id]);
      setQuestionContent('');
      toast.success('Question posted');
    },
  });

  const markComplete = useCallback((lessonId) => {
    if (!courseData?.course?.id) return;
    progressMutation.mutate({
      lessonId,
      courseId: courseData.course.id,
      isCompleted: true,
      watchTimeSeconds: currentLesson?.duration_seconds || 0,
    });
    toast.success('Lesson marked as complete!');
  }, [courseData, currentLesson]);

  const completedIds = new Set((progressData?.progress || []).filter(p => p.is_completed).map(p => p.lesson_id));
  const isCompleted = (id) => completedIds.has(id);

  const currentSectionMeta = useMemo(() => {
    if (!currentLesson || !courseData?.sections) return { title: null, index: null, total: courseData?.sections?.length ?? 0 };
    const total = courseData.sections.length;
    for (let i = 0; i < courseData.sections.length; i++) {
      const s = courseData.sections[i];
      if ((s.lessons || []).some(l => l.id === currentLesson.id)) {
        return { title: s.title, index: i + 1, total };
      }
    }
    return { title: null, index: null, total };
  }, [currentLesson, courseData?.sections]);

  if (courseLoading) return <PageLoader />;
  if (!courseData) return <div className="text-center py-20 text-red-500">Course not found</div>;

  const { course, sections } = courseData;
  const isQuizLesson = currentLesson?.type === 'quiz';
  const isTextLesson = currentLesson?.type === 'text';

  const fullLesson = lessonData?.lesson || currentLesson;
  const videoUrl = fullLesson?.video_url || currentLesson?.video_url;
  const lessonContent = fullLesson?.content || currentLesson?.content;

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-[#060a12] text-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close course outline"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'flex min-h-0 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#080d18]',
          'fixed inset-y-0 left-0 z-50 w-[min(92vw,20rem)] shadow-[20px_0_50px_-15px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out',
          'lg:relative lg:z-0 lg:translate-x-0 lg:shadow-none lg:transition-[width] lg:duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarOpen ? 'lg:w-80' : 'lg:w-0 lg:overflow-hidden lg:border-r-0',
        )}
      >
        <div className="flex-shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#0c1220] to-[#080d18] p-4">
          <Link
            to={`/courses/${slug}`}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Course overview
          </Link>
          <div className="flex items-start gap-3">
            <div className="relative h-16 w-[5.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-slate-800/80 ring-1 ring-white/10 shadow-lg">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                  <BookOpen className="h-7 w-7 text-slate-600" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Learning</p>
              <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white">{course.title}</h2>
              {progressData?.enrollment && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Your progress</span>
                    <span className="tabular-nums text-slate-300">{progressData.enrollment.completion_percentage}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-800/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-400 to-indigo-400 transition-all duration-500"
                      style={{ width: `${progressData.enrollment.completion_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="lesson-watch-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4">
          {sections.map((section, si) => (
            <div key={section.id} className="mb-4 last:mb-2">
              <button
                type="button"
                onClick={() => setOpenSections(prev => (prev.includes(si) ? prev.filter(x => x !== si) : [...prev, si]))}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-left ring-1 ring-white/[0.05] transition-colors hover:bg-white/[0.06]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Module {si + 1}</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-slate-200">{section.title}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{(section.lessons || []).length} lessons</span>
                </span>
                {openSections.includes(si) ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-500" />
                )}
              </button>
              {openSections.includes(si) && (
                <ul className="mt-2 space-y-1 border-l border-white/[0.08] pl-3 ml-2.5">
                  {(section.lessons || []).map((lesson) => {
                    const active = currentLesson?.id === lesson.id;
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentLesson(lesson);
                            if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={clsx(
                            'group flex w-full items-start gap-2.5 rounded-xl py-2.5 pl-2.5 pr-2 text-left transition-all duration-200',
                            active
                              ? 'bg-gradient-to-r from-primary-600/25 to-indigo-600/10 text-white shadow-[inset_3px_0_0_0] shadow-primary-400 ring-1 ring-primary-500/30'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
                          )}
                        >
                          {isCompleted(lesson.id) ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                          ) : lesson.type === 'quiz' ? (
                            <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
                          ) : lesson.type === 'text' ? (
                            <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                          ) : (
                            <Circle
                              className={clsx(
                                'mt-0.5 h-4 w-4 flex-shrink-0 transition-colors',
                                active ? 'text-primary-300' : 'text-slate-600 group-hover:text-slate-500',
                              )}
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={clsx('block text-[13px] leading-snug', active ? 'font-semibold text-white' : 'font-medium')}>
                              {lesson.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {lesson.type === 'quiz' ? 'Quiz' : lesson.type === 'text' ? 'Article' : formatDuration(lesson.duration_seconds)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f4f6fb]">
        <header className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-md sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            aria-label={sidebarOpen ? 'Hide curriculum' : 'Show curriculum'}
          >
            <ChevronLeft className={clsx('h-5 w-5 transition-transform duration-300', !sidebarOpen && 'rotate-180')} />
          </button>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Current lesson</p>
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{currentLesson?.title}</p>
          </div>
          {!isQuizLesson ? (
            <button
              type="button"
              onClick={() => currentLesson && markComplete(currentLesson.id)}
              disabled={isCompleted(currentLesson?.id) || progressMutation.isPending}
              className={clsx(
                'flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm',
                isCompleted(currentLesson?.id)
                  ? 'cursor-default border-emerald-200/80 bg-emerald-50 text-emerald-800'
                  : 'border-primary-500/30 bg-primary-600 text-white shadow-md shadow-primary-900/15 hover:bg-primary-500 active:scale-[0.98]',
              )}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{isCompleted(currentLesson?.id) ? 'Completed' : 'Mark complete'}</span>
              <span className="sm:hidden">{isCompleted(currentLesson?.id) ? 'Done' : 'Complete'}</span>
            </button>
          ) : (
            <div
              className={clsx(
                'flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold sm:text-sm',
                isCompleted(currentLesson?.id)
                  ? 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                  : 'border-violet-200/80 bg-violet-50 text-violet-900',
              )}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{isCompleted(currentLesson?.id) ? 'Passed' : 'Quiz'}</span>
            </div>
          )}
        </header>

        {isQuizLesson ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f6fb]">
            <QuizPlayer lessonId={currentLesson.id} courseId={course.id} onComplete={() => markComplete(currentLesson.id)} />
          </div>
        ) : (
          <div
            ref={lessonContentScrollRef}
            className="lesson-watch-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth bg-[#f4f6fb] [overflow-anchor:none]"
          >
            {!isTextLesson && (
              <div className="relative z-10 border-b border-white/[0.06] bg-gradient-to-b from-[#0a0f1c] via-[#070b14] to-[#060a12]">
                <div className="mx-auto max-w-5xl px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
                  <div className="mb-6">
                    {currentSectionMeta.index != null && currentSectionMeta.total > 0 && (
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-300/90">
                        Module {currentSectionMeta.index} of {currentSectionMeta.total}
                      </p>
                    )}
                    {currentSectionMeta.title && (
                      <p className="mb-2 text-sm font-medium text-slate-400">{currentSectionMeta.title}</p>
                    )}
                    <h1 className="text-balance text-xl font-bold tracking-tight text-white sm:text-3xl md:text-[2rem] md:leading-tight">
                      {currentLesson?.title}
                    </h1>
                  </div>

                  <div className="relative mx-auto max-w-[min(100%,1100px)]">
                    <div
                      className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-500/25 via-transparent to-indigo-950/40 opacity-90 blur-md"
                      aria-hidden
                    />
                    <div className="relative rounded-2xl p-1 sm:p-1.5">
                      <div className="lesson-video-dynamic lesson-video-hero mx-auto">
                        {videoUrl ? (
                          <LessonVideoPlayer url={videoUrl} lessonTitle={currentLesson?.title} />
                        ) : (
                          <div className="relative flex h-full min-h-[220px] w-full flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 text-center">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover opacity-20 blur-md"
                              />
                            )}
                            <div className="relative z-[1]">
                              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                                <Video className="h-8 w-8 text-slate-500" />
                              </div>
                              <p className="text-base font-semibold text-slate-200">No video for this lesson</p>
                              <p className="mt-1 max-w-sm text-sm text-slate-500">This lesson may use text or resources only. Check the tabs below.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTextLesson && (
              <div className="border-b border-slate-200/90 bg-white px-4 py-6 sm:px-8">
                <div className="mx-auto max-w-5xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Article</p>
                      <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{currentLesson?.title}</h1>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200/80 bg-[#f4f6fb]">
                <div className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#f4f6fb]/95 px-3 py-3 backdrop-blur-xl sm:px-6">
                  <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto rounded-2xl bg-slate-200/40 p-1 ring-1 ring-slate-200/50">
                    {[
                      ['overview', isTextLesson ? 'Article' : 'Overview', isTextLesson ? FileText : FileText],
                      ['notes', 'Notes', StickyNote],
                      ['discussions', 'Q&A', MessageSquare],
                      ['resources', 'Resources', Download],
                    ].map(([id, label, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={clsx(
                          'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all sm:flex-initial sm:px-4',
                          activeTab === id
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                            : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  key={`${fullLesson?.id ?? currentLesson?.id}-${activeTab}`}
                  className="lesson-content-enter mx-auto max-w-4xl px-4 py-8 pb-28 sm:px-6 sm:py-10 sm:pb-32"
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-9">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{currentLesson?.title}</h2>
                        {currentLesson?.description && (
                          <p className="mt-3 text-base leading-relaxed text-slate-600">{currentLesson.description}</p>
                        )}
                        {lessonDetailPending && !lessonContent && (
                          <div className="mt-8 space-y-3" aria-hidden>
                            <div className="skeleton h-4 w-full rounded-md" />
                            <div className="skeleton h-4 w-[92%] rounded-md" />
                            <div className="skeleton h-4 w-[88%] rounded-md" />
                            <div className="skeleton mt-6 h-28 w-full rounded-xl" />
                          </div>
                        )}
                        {lessonContent ? (
                          <div
                            className="prose prose-slate mt-6 max-w-none prose-headings:font-semibold prose-a:text-primary-600 prose-img:rounded-xl prose-pre:bg-slate-900 prose-pre:text-slate-100"
                            dangerouslySetInnerHTML={{ __html: lessonContent }}
                          />
                        ) : (
                          !lessonDetailPending && (
                            <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                              No written content for this lesson.
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7">
                        <textarea
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          placeholder="Capture ideas while you watch…"
                          rows={4}
                          className="input min-h-[120px] resize-y border-slate-200 bg-slate-50/80 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => noteMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: noteContent })}
                          disabled={!noteContent.trim() || noteMutation.isPending}
                          className="btn-primary mt-4 text-sm"
                        >
                          Save note
                        </button>
                      </div>
                      {(notes || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-14 text-center">
                          <StickyNote className="mb-3 h-11 w-11 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">No notes yet</p>
                          <p className="mt-1 max-w-xs text-xs text-slate-500">Notes you add for this course appear here.</p>
                        </div>
                      ) : (
                        (notes || []).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <p className="text-sm leading-relaxed text-slate-700">{note.content}</p>
                            <p className="mt-3 text-xs font-medium text-slate-400">
                              {note.lesson_title} · {formatDate(note.created_at)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'discussions' && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7">
                        <textarea
                          value={questionContent}
                          onChange={e => setQuestionContent(e.target.value)}
                          placeholder="Ask the instructor or peers a question…"
                          rows={4}
                          className="input min-h-[120px] resize-y border-slate-200 bg-slate-50/80 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => questionMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: questionContent })}
                          disabled={!questionContent.trim() || questionMutation.isPending}
                          className="btn-primary mt-4 text-sm"
                        >
                          Post question
                        </button>
                      </div>
                      {lessonDetailPending && !lessonData ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                          <p className="mt-3 text-sm text-slate-500">Loading discussion…</p>
                        </div>
                      ) : (lessonData?.discussions || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-14 text-center">
                          <MessageSquare className="mb-3 h-11 w-11 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">No questions yet</p>
                          <p className="mt-1 max-w-xs text-xs text-slate-500">Start the conversation for this lesson.</p>
                        </div>
                      ) : (
                        (lessonData?.discussions || []).map((d) => (
                          <div
                            key={d.id}
                            className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="flex gap-4">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                                {getInitials(d.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="font-semibold text-slate-900">{d.name}</span>
                                  <span className="text-xs text-slate-400">{timeAgo(d.created_at)}</span>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">{d.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'resources' && (
                    <div className="space-y-3">
                      {lessonDetailPending && !lessonData ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                          <p className="mt-3 text-sm text-slate-500">Loading resources…</p>
                        </div>
                      ) : (lessonData?.resources || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 py-14 text-center">
                          <Download className="mb-3 h-11 w-11 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">No resources</p>
                          <p className="mt-1 max-w-xs text-xs text-slate-500">This lesson has no downloadable files.</p>
                        </div>
                      ) : (
                        (lessonData?.resources || []).map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                          >
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                              <Download className="h-5 w-5" />
                            </div>
                            <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{res.title}</span>
                            <span className="flex-shrink-0 text-xs font-medium uppercase text-slate-400">{res.type}</span>
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
