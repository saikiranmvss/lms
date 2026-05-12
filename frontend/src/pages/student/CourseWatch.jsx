import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, CheckCircle, Circle, ChevronDown, ChevronRight,
  MessageSquare, FileText, Download, StickyNote, ArrowLeft, HelpCircle, Video
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { courseService, enrollmentService, discussionService, noteService } from '../../services/courseService.js';
import { formatDuration, formatDate, getInitials, timeAgo } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import QuizPlayer from '../../components/quiz/QuizPlayer.jsx';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CourseWatch() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [openSections, setOpenSections] = useState([0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course-watch', slug],
    queryFn: () => courseService.getBySlug(slug).then(r => r.data.data),
  });

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', courseData?.course?.id],
    queryFn: () => enrollmentService.getCourseProgress(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id,
  });

  // Detailed lesson data (video_url, content, resources, discussions)
  const { data: lessonData } = useQuery({
    queryKey: ['lesson-detail', currentLesson?.id],
    queryFn: () => courseService.getLesson(currentLesson.id).then(r => r.data.data),
    enabled: !!currentLesson?.id,
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', courseData?.course?.id],
    queryFn: () => noteService.get(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id && activeTab === 'notes',
  });

  // Set first lesson on load
  useEffect(() => {
    if (courseData?.sections?.length > 0 && !currentLesson) {
      const first = courseData.sections[0]?.lessons?.[0];
      if (first) setCurrentLesson(first);
    }
  }, [courseData]);

  // Reset tab when switching between non-quiz lessons
  useEffect(() => {
    if (currentLesson?.type !== 'quiz') setActiveTab('overview');
  }, [currentLesson?.id]);

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

  if (courseLoading) return <PageLoader />;
  if (!courseData) return <div className="text-center py-20 text-red-500">Course not found</div>;

  const { course, sections } = courseData;
  const isQuizLesson = currentLesson?.type === 'quiz';
  const isTextLesson = currentLesson?.type === 'text';

  // Use the full lesson detail for content (video_url, content, etc.)
  const fullLesson = lessonData?.lesson || currentLesson;
  const videoUrl = fullLesson?.video_url || currentLesson?.video_url;
  const lessonContent = fullLesson?.content || currentLesson?.content;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Sidebar ── */}
      <div className={clsx(
        'flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300',
        sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
      )}>
        <div className="p-4 border-b border-slate-800">
          <Link to={`/courses/${slug}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <h2 className="font-semibold text-white text-sm line-clamp-2">{course.title}</h2>
          {progressData?.enrollment && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{progressData.enrollment.completion_percentage}%</span>
              </div>
              <div className="bg-slate-700 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progressData.enrollment.completion_percentage}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={section.id}>
              <button
                onClick={() => setOpenSections(prev => prev.includes(si) ? prev.filter(x => x !== si) : [...prev, si])}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-200 pr-2">{section.title}</span>
                {openSections.includes(si)
                  ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
              {openSections.includes(si) && (
                <div>
                  {(section.lessons || []).map((lesson) => (
                    <button key={lesson.id} onClick={() => setCurrentLesson(lesson)}
                      className={clsx(
                        'w-full flex items-start gap-3 px-4 py-3 text-left border-l-2 transition-all hover:bg-slate-800',
                        currentLesson?.id === lesson.id ? 'border-primary-500 bg-slate-800' : 'border-transparent'
                      )}>
                      {isCompleted(lesson.id)
                        ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        : lesson.type === 'quiz'
                          ? <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          : lesson.type === 'text'
                            ? <FileText className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            : <Circle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className={clsx('text-xs leading-snug', currentLesson?.id === lesson.id ? 'text-white font-medium' : 'text-slate-400')}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                          {lesson.type === 'quiz' ? 'Quiz' : lesson.type === 'text' ? 'Article' : formatDuration(lesson.duration_seconds)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className={clsx('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
          <span className="text-white font-medium text-sm truncate mx-4">{currentLesson?.title}</span>
          {!isQuizLesson && (
            <button
              onClick={() => currentLesson && markComplete(currentLesson.id)}
              disabled={isCompleted(currentLesson?.id) || progressMutation.isPending}
              className={clsx(
                'flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all',
                isCompleted(currentLesson?.id)
                  ? 'bg-green-600/20 text-green-400 cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
              )}>
              <CheckCircle className="w-4 h-4" />
              {isCompleted(currentLesson?.id) ? 'Completed' : 'Mark Complete'}
            </button>
          )}
          {isQuizLesson && (
            <div className={clsx('flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg',
              isCompleted(currentLesson?.id) ? 'bg-green-600/20 text-green-400' : 'bg-purple-600/20 text-purple-300')}>
              <HelpCircle className="w-4 h-4" />
              {isCompleted(currentLesson?.id) ? 'Passed' : 'Quiz'}
            </div>
          )}
        </div>

        {/* ── Quiz lesson ── */}
        {isQuizLesson ? (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <QuizPlayer
              lessonId={currentLesson.id}
              courseId={course.id}
              onComplete={() => markComplete(currentLesson.id)}
            />
          </div>
        ) : (
          <>
            {/* ── Video area (only for video lessons) ── */}
            {!isTextLesson && (
              <div className="bg-black flex-shrink-0">
                <div className="video-wrapper">
                  {videoUrl ? (
                    <ReactPlayer
                      key={videoUrl}
                      url={videoUrl}
                      width="100%"
                      height="100%"
                      controls
                      playing={false}
                      config={{
                        youtube: { playerVars: { modestbranding: 1, rel: 0 } },
                        file: { attributes: { controlsList: 'nodownload' } },
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <div className="text-center text-slate-500">
                        <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No video attached to this lesson</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Text/Article header ── */}
            {isTextLesson && (
              <div className="bg-slate-800 px-6 py-4 flex-shrink-0 border-b border-slate-700">
                <div className="flex items-center gap-3 text-slate-300">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium">Article</span>
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              <div className="flex border-b border-slate-200 px-6 overflow-x-auto flex-shrink-0">
                {[
                  ['overview', isTextLesson ? 'Article' : 'Overview', isTextLesson ? FileText : FileText],
                  ['notes', 'Notes', StickyNote],
                  ['discussions', 'Q&A', MessageSquare],
                  ['resources', 'Resources', Download],
                ].map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                      activeTab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Overview / Article tab */}
                {activeTab === 'overview' && (
                  <div className="max-w-3xl">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{currentLesson?.title}</h2>
                    {currentLesson?.description && (
                      <p className="text-slate-600 leading-relaxed mb-6">{currentLesson.description}</p>
                    )}
                    {lessonContent ? (
                      <div
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: lessonContent }}
                      />
                    ) : (
                      !lessonData && (
                        <p className="text-slate-400 text-sm italic">Loading content...</p>
                      )
                    )}
                  </div>
                )}

                {/* Notes tab */}
                {activeTab === 'notes' && (
                  <div className="max-w-3xl space-y-5">
                    <div className="card p-4">
                      <textarea
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                        placeholder="Write a note for this lesson..."
                        rows={3}
                        className="input resize-none"
                      />
                      <button
                        onClick={() => noteMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: noteContent })}
                        disabled={!noteContent.trim() || noteMutation.isPending}
                        className="btn-primary mt-3 text-sm"
                      >
                        Save Note
                      </button>
                    </div>
                    {(notes || []).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">No notes yet for this course.</p>
                    )}
                    {(notes || []).map((note) => (
                      <div key={note.id} className="card p-4">
                        <p className="text-sm text-slate-700">{note.content}</p>
                        <p className="text-xs text-slate-500 mt-2">{note.lesson_title} • {formatDate(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Q&A tab */}
                {activeTab === 'discussions' && (
                  <div className="max-w-3xl space-y-5">
                    <div className="card p-4">
                      <textarea
                        value={questionContent}
                        onChange={e => setQuestionContent(e.target.value)}
                        placeholder="Ask a question about this lesson..."
                        rows={3}
                        className="input resize-none"
                      />
                      <button
                        onClick={() => questionMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: questionContent })}
                        disabled={!questionContent.trim() || questionMutation.isPending}
                        className="btn-primary mt-3 text-sm"
                      >
                        Post Question
                      </button>
                    </div>
                    {(lessonData?.discussions || []).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-6">No questions yet. Be the first to ask!</p>
                    )}
                    {(lessonData?.discussions || []).map((d) => (
                      <div key={d.id} className="card p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold flex-shrink-0">
                            {getInitials(d.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900">{d.name}</span>
                              <span className="text-xs text-slate-500">{timeAgo(d.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{d.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resources tab */}
                {activeTab === 'resources' && (
                  <div className="max-w-3xl space-y-3">
                    {(lessonData?.resources || []).length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">No downloadable resources for this lesson.</p>
                    ) : (
                      lessonData.resources.map((res) => (
                        <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                          className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all">
                          <Download className="w-5 h-5 text-primary-600" />
                          <span className="text-sm font-medium text-slate-900">{res.title}</span>
                          <span className="ml-auto text-xs text-slate-500">{res.type}</span>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
