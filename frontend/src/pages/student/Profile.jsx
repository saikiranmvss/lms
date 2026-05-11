import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Lock, Camera, Save } from 'lucide-react';
import { authService } from '../../services/courseService.js';
import useAuthStore from '../../store/authStore.js';
import { getInitials } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const profileMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (res) => { setUser(res.data.data); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => { setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); toast.success('Password changed'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[['profile', 'Profile'], ['security', 'Security']].map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === val ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt={user?.name} />
                ) : getInitials(user?.name)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate(profile); }} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={user?.email} className="input pl-10 bg-slate-50 cursor-not-allowed" disabled />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Avatar URL</label>
              <input value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://..." className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
              <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="input resize-none" placeholder="Tell us about yourself..." />
            </div>
            <button type="submit" disabled={profileMutation.isPending} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-5">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword', placeholder: '••••••••' },
              { label: 'New Password', key: 'newPassword', placeholder: 'Min 6 characters' },
              { label: 'Confirm New Password', key: 'confirmPassword', placeholder: '••••••••' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={passwords[key]} onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })} placeholder={placeholder} className="input pl-10" required />
                </div>
              </div>
            ))}
            <button type="submit" disabled={passwordMutation.isPending} className="btn-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
