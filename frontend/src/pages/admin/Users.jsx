import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, Ban, CheckCircle, ChevronDown } from 'lucide-react';
import { adminService } from '../../services/courseService.js';
import { formatDate, getInitials } from '../../utils/helpers.js';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => adminService.getUsers({ search, role, page, limit: 20 }).then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-users']); toast.success('User updated'); },
    onError: () => toast.error('Failed to update user'),
  });

  const handleSuspend = (user) => {
    if (confirm(`${user.is_suspended ? 'Unsuspend' : 'Suspend'} ${user.name}?`)) {
      updateMutation.mutate({ id: user.id, is_suspended: !user.is_suspended });
    }
  };

  const handleApproveInstructor = (user) => {
    updateMutation.mutate({ id: user.id, is_instructor_approved: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input pl-10" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="input w-auto">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 font-semibold text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.users || []).map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold flex-shrink-0 overflow-hidden">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx('badge capitalize', user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'instructor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.is_suspended ? (
                        <span className="badge bg-red-100 text-red-700">Suspended</span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(user.created_at, 'MMM dd, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => handleSuspend(user)}
                          className={clsx('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
                            user.is_suspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100')}>
                          {user.is_suspended ? <><CheckCircle className="w-3.5 h-3.5" />Activate</> : <><Ban className="w-3.5 h-3.5" />Suspend</>}
                        </button>
                        {user.role === 'instructor' && !user.is_instructor_approved && (
                          <button onClick={() => handleApproveInstructor(user)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                            <Shield className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t text-sm text-slate-500">
            {data?.total || 0} total users
          </div>
        </div>
      )}
    </div>
  );
}
