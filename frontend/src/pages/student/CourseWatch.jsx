import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, CheckCircle, Circle, ChevronDown, ChevronRight, MessageSquare, FileText, Download, StickyNote, ArrowLeft } from 'lucide-react';
import ReactPlayer from 'react-player';
import { courseService, enrollmentService, discussionService, noteService } from '../../services/courseService.js';
import { formatDuration, formatDate, getInitials, timeAgo } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
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
    queryKey: ['course', slug],
    queryFn: () => courseService.getBySlug(slug).then(r => r.data.data),
  });

  const { data: progressData } = useQuery({
    queryKey: ['progress', courseData?.course?.id],
    queryFn: () => enrollmentService.getCourseProgress(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id,
  });

  const { data: lessonData } = useQuery({
    queryKey: ['lesson', currentLesson?.id],
    queryFn: () => courseService.getLesson(currentLesson.id).then(r => r.data.data),
    enabled: !!currentLesson?.id,
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', courseData?.course?.id],
    queryFn: () => noteService.get(courseData.course.id).then(r => r.data.data),
    enabled: !!courseData?.course?.id && activeTab === 'notes',
  });

  // Set first lesson
  useEffect(() => {
    if (courseData?.sections?.length > 0 && !currentLesson) {
      const first = courseData.sections[0]?.lessons?.[0];
      if (first) setCurrentLesson(first);
    }
  }, [courseData]);

  const progressMutation = useMutation({
    mutationFn: (data) => enrollmentService.updateProgress(data),
    onSuccess: () => queryClient.invalidateQueries(['progress']),
  });

  const noteMutation = useMutation({
    mutationFn: (data) => noteService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
      setNoteContent('');
      toast.success('Note saved');
    },
  });

  const questionMutation = useMutation({
    mutationFn: (data) => discussionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson', currentLesson?.id]);
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

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <div className={clsx('flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300', sidebarOpen ? 'w-80' : 'w-0 overflow-hidden')}>
        {/* Course title */}
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
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${progressData.enrollment.completion_percentage}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section, si) => (
            <div key={section.id}>
              <button onClick={() => setOpenSections(prev => prev.includes(si) ? prev.filter(x => x !== si) : [...prev, si])}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800 transition-colors">
                <span className="text-sm font-semibold text-slate-200 pr-2">{section.title}</span>
                {openSections.includes(si) ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>
              {openSections.includes(si) && (
                <div>
                  {(section.lessons || []).map((lesson) => (
                    <button key={lesson.id} onClick={() => setCurrentLesson(lesson)}
                      className={clsx('w-full flex items-start gap-3 px-4 py-3 text-left border-l-2 transition-all hover:bg-slate-800',
                        currentLesson?.id === lesson.id ? 'border-primary-500 bg-slate-800' : 'border-transparent')}>
                      {isCompleted(lesson.id)
                        ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        : <Circle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className={clsx('text-xs leading-snug', currentLesson?.id === lesson.id ? 'text-white font-medium' : 'text-slate-400')}>{lesson.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDuration(lesson.duration_seconds)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className={clsx('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
          <span className="text-white font-medium text-sm truncate mx-4">{currentLesson?.title}</span>
          <button onClick={() => currentLesson && markComplete(currentLesson.id)}
            disabled={isCompleted(currentLesson?.id) || progressMutation.isPending}
            className={clsx('flex items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-all',
              isCompleted(currentLesson?.id)
                ? 'bg-green-600/20 text-green-400 cursor-default'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95')}>
            <CheckCircle className="w-4 h-4" />
            {isCompleted(currentLesson?.id) ? 'Completed' : 'Mark Complete'}
          </button>
        </div>

        {/* Video */}
        <div className="bg-black flex-shrink-0">
          <div className="video-wrapper" style={{ paddingBottom: '45%' }}>
            {currentLesson?.video_url ? (
              <ReactPlayer url={currentLesson.video_url} width="100%" height="100%" controls playing={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-center text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>{currentLesson?.type === 'text' ? 'Text Lesson' : 'No video available'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          <div className="flex border-b border-slate-200 px-6 overflow-x-auto">
            {[
              ['overview', 'Overview', FileText],
              ['notes', 'Notes', StickyNote],
              ['discussions', 'Q&A', MessageSquare],
              ['resources', 'Resources', Download],
            ].map(([id, label, Icon]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={clsx('flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700')}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{currentLesson?.title}</h2>
                {currentLesson?.description && <p className="text-slate-600 leading-relaxed mb-6">{currentLesson.description}</p>}
                {currentLesson?.content && (
                  <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="max-w-3xl space-y-5">
                <div className="card p-4">
                  <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write a note for this lesson..." rows={3} className="input resize-none" />
                  <button onClick={() => noteMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: noteContent })}
                    disabled={!noteContent.trim() || noteMutation.isPending} className="btn-primary mt-3 text-sm">
                    Save Note
                  </button>
                </div>
                {(notes || []).map((note) => (
                  <div key={note.id} className="card p-4">
                    <p className="text-sm text-slate-700">{note.content}</p>
                    <p className="text-xs text-slate-500 mt-2">{note.lesson_title} • {formatDate(note.created_at)}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="max-w-3xl space-y-5">
                <div className="card p-4">
                  <textarea value={questionContent} onChange={(e) => setQuestionContent(e.target.value)} placeholder="Ask a question..." rows={3} className="input resize-none" />
                  <button onClick={() => questionMutation.mutate({ lessonId: currentLesson?.id, courseId: course.id, content: questionContent })}
                    disabled={!questionContent.trim() || questionMutation.isPending} className="btn-primary mt-3 text-sm">
                    Post Question
                  </button>
                </div>
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

            {activeTab === 'resources' && (
              <div className="max-w-3xl space-y-3">
                {(lessonData?.resources || []).length === 0 ? (
                  <p className="text-slate-500 text-sm">No resources for this lesson.</p>
                ) : lessonData.resources.map((res) => (
                  <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                    className="card p-4 flex items-center gap-3 hover:shadow-card-hover transition-all">
                    <Download className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-slate-900">{res.title}</span>
                    <span className="ml-auto text-xs text-slate-500">{res.type}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
