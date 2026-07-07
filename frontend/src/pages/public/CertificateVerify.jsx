import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, ExternalLink, ArrowLeft, Printer, ShieldAlert } from 'lucide-react';
import { certificateService } from '../../services/courseService.js';
import { formatDate } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';

export default function CertificateVerify() {
  const { id } = useParams();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['verified-certificate', id],
    queryFn: () => certificateService.get(id).then(r => r.data.data),
    retry: false
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <PageLoader />;

  if (error || !cert) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-lg">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Certificate</h1>
        <p className="text-slate-500 mb-6">
          The certificate ID provided does not match any certificate in our records. Please verify the URL.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 sm:px-6">
      {/* Back button (hidden during print) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to LearnHub
        </Link>
        <button
          onClick={handlePrint}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Main Certificate / Page container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Verification status card (hidden during print) */}
        <div className="lg:col-span-1 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Status</p>
              <h3 className="text-sm font-bold text-emerald-800">Verified Authentic</h3>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Credential ID</span>
              <span className="text-xs font-mono break-all text-slate-800 font-medium">{cert.id}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Student</span>
              <span className="text-sm font-semibold text-slate-800">{cert.student_name}</span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Issued on</span>
              <span className="text-sm font-semibold text-slate-800">{formatDate(cert.issued_at)}</span>
            </div>
          </div>
        </div>

        {/* Certificate Display */}
        <div className="lg:col-span-2 bg-white border-8 border-slate-950 p-8 sm:p-12 relative shadow-xl rounded-sm overflow-hidden select-none print:shadow-none print:border-8 print:border-black">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-600/30 m-4 pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-600/30 m-4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-600/30 m-4 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-600/30 m-4 pointer-events-none" />

          {/* Certificate Content */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-2">
              <Award className="w-16 h-16 text-amber-600 animate-pulse" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-wide uppercase">
              Certificate of Completion
            </h1>
            <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">
              This credentials certifies that
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 underline underline-offset-8 decoration-amber-600 decoration-2">
              {cert.student_name}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              has successfully completed all requirements and exams for the course
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug px-4">
              {cert.course_title}
            </h3>
            <p className="text-slate-500 text-xs tracking-wider uppercase font-semibold">
              Taught by {cert.instructor_name}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8 mt-12 max-w-lg mx-auto">
              <div className="text-center">
                <span className="block text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Issued Date</span>
                <span className="text-xs font-bold text-slate-800">{formatDate(cert.issued_at)}</span>
              </div>
              <div className="text-center">
                <span className="block text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Verification Key</span>
                <span className="text-[10px] font-mono font-bold text-slate-800">{cert.id.slice(0, 18)}...</span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 tracking-wider uppercase pt-6">
              LearnHub Verification Portal · verify.learnhub.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
