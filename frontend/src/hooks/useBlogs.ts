import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogAPI, commentAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Author {
  _id: string;
  name: string;
  email: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  views?: number;
  commentCount?: number;
  likeCount?: number;
  likes?: any[];
}

interface Comment {
  _id: string;
  text: string;
  user: Author;
  blog: string;
  createdAt: string;
}

export const useBlogs = () => {
  return useQuery({
    queryKey: ['blogs'],
    // Keep public blogs fresh: refetch on window focus and poll every 15s
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    queryFn: async () => {
      const blogs = await blogAPI.getAllBlogs();
      
      // Fetch comment counts for all blogs
      const blogsWithComments = await Promise.all(
        blogs.map(async (blog) => {
          try {
            const comments = await commentAPI.getCommentsByBlog(blog._id);
            return {
              ...blog,
              commentCount: comments.length || 0,
              likeCount: (blog.likes && blog.likes.length) || 0,
            };
          } catch {
            return {
              ...blog,
              commentCount: 0,
              likeCount: (blog.likes && blog.likes.length) || 0,
            };
          }
        })
      );
      
      return blogsWithComments as Blog[];
    },
  });
};

export const useBlogById = (blogId: string) => {
  return useQuery({
    queryKey: ['blog', blogId],
    queryFn: async () => {
      if (!blogId) return null;
      const blog = await blogAPI.getBlogById(blogId);
      return blog as Blog;
    },
    enabled: !!blogId,
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      if (!token) throw new Error('Not authenticated');
      return blogAPI.createBlog(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['authorBlogs'] });
      toast({ title: 'Success', description: 'Blog created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      blogId,
      data,
    }: {
      blogId: string;
      data: { title: string; content: string };
    }) => {
      if (!token) throw new Error('Not authenticated');
      return blogAPI.updateBlog(blogId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['authorBlogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', variables.blogId] });
      toast({ title: 'Success', description: 'Blog updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (blogId: string) => {
      if (!token) throw new Error('Not authenticated');
      return blogAPI.deleteBlog(blogId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['authorBlogs'] });
      toast({ title: 'Success', description: 'Blog deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Toggle like/unlike mutation for a blog
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (blogId: string) => {
      if (!token) throw new Error('Not authenticated');
      return blogAPI.toggleLike(blogId, token);
    },
    onSuccess: (_data, blogId) => {
      // Refresh blog and blogs list
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useCommentsByBlog = (blogId: string) => {
  return useQuery({
    queryKey: ['comments', blogId],
    queryFn: async () => {
      if (!blogId) return [];
      const comments = await commentAPI.getCommentsByBlog(blogId);
      return comments as Comment[];
    },
    enabled: !!blogId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      blogId,
      text,
    }: {
      blogId: string;
      text: string;
    }) => {
      if (!token) throw new Error('Not authenticated');
      return commentAPI.addComment({ text, blogId }, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.blogId] });
      toast({ title: 'Success', description: 'Comment added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!token) throw new Error('Not authenticated');
      return commentAPI.deleteComment(commentId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast({ title: 'Success', description: 'Comment deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

// Fetch blogs belonging to the authenticated author (drafts + published)
export const useAuthorBlogs = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['authorBlogs'],
    queryFn: async () => {
      if (!token) return [] as Blog[];
      const blogs = await blogAPI.getAuthorBlogs(token);

      // enrich with comment counts and like counts
      const enriched = await Promise.all(
        blogs.map(async (blog: any) => {
          try {
            const comments = await commentAPI.getCommentsByBlog(blog._id);
            return {
              ...blog,
              commentCount: comments.length || 0,
              likeCount: (blog.likes && blog.likes.length) || 0,
            } as Blog;
          } catch {
            return {
              ...blog,
              commentCount: 0,
              likeCount: (blog.likes && blog.likes.length) || 0,
            } as Blog;
          }
        })
      );

      return enriched as Blog[];
    },
    enabled: !!token,
  });
};

export const usePublishBlog = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (blogId: string) => {
      if (!token) throw new Error('Not authenticated');
      return blogAPI.publishBlog(blogId, token);
    },
    onSuccess: (_data, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['authorBlogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', blogId] });
      toast({ title: 'Success', description: 'Blog published' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
