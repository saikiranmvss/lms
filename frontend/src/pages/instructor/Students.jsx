import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import { courseService } from '../../services/courseService.js';
import { formatDate, getInitials } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function InstructorStudents() {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [search, setSearch] = useState('');

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => courseService.getMyCourses().then(r => r.data.data),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['course-students', selectedCourse],
    queryFn: () => courseService.getStudents(selectedCourse).then(r => r.data.data),
    enabled: !!selectedCourse,
  });

  const filtered = (students || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (coursesLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input sm:w-72">
          <option value="">Select a course</option>
          {(courses || []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {selectedCourse && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="input pl-10" />
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <EmptyState icon={Users} title="Select a course" description="Choose a course to view its enrolled students" />
      ) : studentsLoading ? (
        <PageLoader />
      ) : !filtered.length ? (
        <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search' : 'No students enrolled yet'} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Student', 'Email', 'Enrolled', 'Progress'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 font-semibold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold overflow-hidden flex-shrink-0">
                          {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : getInitials(student.name)}
                        </div>
                        <span className="font-medium text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{student.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(student.enrolled_at, 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-24">
                          <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${student.completion_percentage}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 w-10">{student.completion_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-500">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} enrolled
          </div>
        </div>
      )}
    </div>
  );
}
