import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useLikeStatus = (blogId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['like-status', blogId, user?.id],
    queryFn: async () => {
      if (!user) return { liked: false, count: 0 };

      const [likeRes, countRes] = await Promise.all([
        supabase
          .from('blog_likes')
          .select('id')
          .eq('blog_id', blogId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('blog_likes')
          .select('id', { count: 'exact' })
          .eq('blog_id', blogId),
      ]);

      return {
        liked: !!likeRes.data,
        count: countRes.count || 0,
      };
    },
    enabled: !!blogId,
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ blogId, isLiked }: { blogId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        await supabase
          .from('blog_likes')
          .delete()
          .eq('blog_id', blogId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('blog_likes')
          .insert({ blog_id: blogId, user_id: user.id });
      }
    },
    onSuccess: (_, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: ['like-status', blogId] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
};
