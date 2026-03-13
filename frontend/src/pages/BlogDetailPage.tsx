import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useBlogById, useCommentsByBlog, useAddComment, useDeleteComment } from '@/hooks/useBlogs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { MessageCircle, ArrowLeft, Trash2, Share2, Eye, Heart } from 'lucide-react';
import { useToggleLike } from '@/hooks/useBlogs';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: blog, isLoading } = useBlogById(slug || '');
  const { data: comments } = useCommentsByBlog(blog?._id || '');
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const toggleLike = useToggleLike();
  const [isLiked, setIsLiked] = useState(false);

  // Initialize liked state when blog or user changes
  useEffect(() => {
    if (!blog || !user) {
      setIsLiked(false);
      return;
    }
    const likes = blog.likes || [];
    const liked = likes.some((id: any) => {
      try {
        return id.toString() === user._id;
      } catch {
        return false;
      }
    });
    setIsLiked(liked);
  }, [blog, user]);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to comment.', variant: 'destructive' });
      return;
    }
    if (!commentText.trim() || !blog) return;
    addComment.mutate({ blogId: blog._id, text: commentText.trim() }, {
      onSuccess: () => setCommentText(''),
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'The blog URL has been copied to your clipboard.' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to like posts.', variant: 'destructive' });
      return;
    }

    if (!blog) return;

    try {
      await toggleLike.mutateAsync(blog._id);
      // optimistic UI: toggle local state if likes array exists
      setIsLiked((v) => !v);
    } catch (err) {
      // error handled in hook
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Blog not found</h1>
          <p className="text-muted-foreground mb-6">The blog you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link to="/explore">Explore Blogs</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">{blog.title}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage src={blog.author?.avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {blog.author?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{blog.author?.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(blog.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2"><Eye className="h-5 w-5" />{blog.views || 0} views</div>
            <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-destructive" />{(blog.likes && blog.likes.length) || 0} likes</div>
            <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />{comments?.length || 0} comments</div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none mb-12">
          <p className="whitespace-pre-wrap">{stripHtmlTags(blog.content)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 py-6 border-t border-b border-border mb-12">
          <Button variant={isLiked ? 'default' : 'outline'} onClick={handleToggleLike} className="gap-2">
            <Heart className="h-5 w-5" /> {isLiked ? 'Unlike' : 'Like'}
          </Button>

          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-5 w-5" /> Share
          </Button>
        </div>

        {/* Comments */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Comments ({comments?.length || 0})</h2>
          
          {user && (
            <form onSubmit={handleComment} className="mb-8">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="mb-3 min-h-[100px]"
              />
              <Button type="submit" disabled={!commentText.trim() || addComment.isPending}>
                {addComment.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          )}

          <div className="space-y-6">
            {comments?.map((comment) => (
              <div key={comment._id} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.user?.avatar || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{comment.user?.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {user?._id === comment.user?._id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteComment.mutate(comment._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground/90">{comment.text}</p>
                </div>
              </div>
            ))}
            {(!comments || comments.length === 0) && (
              <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </section>
      </article>
    </Layout>
  );
};

export default BlogDetailPage;
