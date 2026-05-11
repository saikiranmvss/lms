import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2 } from 'lucide-react';
import { wishlistService } from '../../services/courseService.js';
import CourseCard from '../../components/common/CourseCard.jsx';
import { PageLoader } from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.get().then(r => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (courseId) => wishlistService.remove(courseId),
    onSuccess: () => { queryClient.invalidateQueries(['wishlist']); toast.success('Removed from wishlist'); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
      {!wishlist?.length ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Save courses you're interested in" actionLink="/courses" actionLabel="Browse Courses" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="relative">
              <CourseCard course={{ ...item, id: item.course_id }} />
              <button onClick={() => removeMutation.mutate(item.course_id)}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors z-10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
