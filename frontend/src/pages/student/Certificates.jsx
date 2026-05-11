import { useQuery } from '@tanstack/react-query';
import { Award, Download, ExternalLink } from 'lucide-react';
import { certificateService } from '../../services/courseService.js';
import { formatDate } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import useAuthStore from '../../store/authStore.js';

export default function Certificates() {
  const { user } = useAuthStore();
  const { data: certs, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateService.getMy().then(r => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
        <p className="text-slate-500 mt-1">{certs?.length || 0} certificates earned</p>
      </div>

      {!certs?.length ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your first certificate" actionLink="/courses" actionLabel="Find Courses" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert) => (
            <div key={cert.id} className="card p-6 bg-gradient-to-br from-amber-50 to-white border-amber-200">
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Award className="w-8 h-8 text-amber-600" />
                </div>
                <span className="text-xs text-amber-700 font-medium bg-amber-100 px-2.5 py-1 rounded-full">Verified</span>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Certificate of Completion</p>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{cert.course_title}</h3>
              <div className="space-y-1.5 text-sm text-slate-600">
                <p>Awarded to: <strong>{user?.name}</strong></p>
                <p>Instructor: <strong>{cert.instructor_name}</strong></p>
                <p>Issued on: <strong>{formatDate(cert.issued_at)}</strong></p>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary text-sm flex items-center gap-2 flex-1 justify-center">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="btn-ghost text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
