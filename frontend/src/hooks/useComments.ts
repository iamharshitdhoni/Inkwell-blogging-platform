import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  blog_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

export const useComments = (blogId: string) => {
  return useQuery({
    queryKey: ['comments', blogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`*, profiles(username, avatar_url)`)
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as Comment[];
    },
    enabled: !!blogId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ blogId, content }: { blogId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({ blog_id: blogId, user_id: user.id, content })
        .select(`*, profiles(username, avatar_url)`)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
      toast({ title: 'Comment added', description: 'Your comment has been posted.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, blogId }: { commentId: string; blogId: string }) => {
      const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
      if (error) throw error;
      return blogId;
    },
    onSuccess: (blogId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
      toast({ title: 'Comment deleted', description: 'Your comment has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
