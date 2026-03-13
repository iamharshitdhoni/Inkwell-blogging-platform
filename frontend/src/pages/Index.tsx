import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { Button } from '@/components/ui/button';
import { useBlogs } from '@/hooks/useBlogs';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PenLine, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};

const Index = () => {
  const { data: blogs, isLoading } = useBlogs();
  const { user, hasRole } = useAuth();
  const canWrite = user && (hasRole('author') || hasRole('admin'));
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const prevIdsRef = useRef<string>('');

  useEffect(() => {
    if (!blogs) return;
    const currentIds = blogs.map(b => b._id).join(',');
    if (prevIdsRef.current && prevIdsRef.current !== currentIds) {
      // New or changed blogs detected — refresh and notify
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast({ title: 'Latest stories updated', description: 'New stories are available.', action: {
        label: 'View',
        onClick: () => queryClient.invalidateQueries({ queryKey: ['blogs'] })
      }});
    }
    prevIdsRef.current = currentIds;
  }, [blogs, queryClient, toast]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Where stories come to life
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Discover Stories That
              <span className="gradient-text block">Inspire & Connect</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A beautiful space for writers and readers. Share your thoughts, discover new perspectives, and be part of a vibrant community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                canWrite ? (
                  <Button asChild size="lg" className="gap-2 btn-glow">
                    <Link to="/write">
                      <PenLine className="h-5 w-5" />
                      Start Writing
                    </Link>
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      You're reading as a {hasRole('admin') ? 'Admin' : 'Reader'}. Only Authors can write blogs.
                    </p>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/explore">Explore Blogs</Link>
                    </Button>
                  </div>
                )
              ) : (
                <Button asChild size="lg" className="gap-2 btn-glow">
                  <Link to="/auth?mode=signup">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              {(!user || !canWrite) && (
                <Button asChild variant="outline" size="lg">
                  <Link to="/explore">Explore Blogs</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">Latest Stories</h2>
              <p className="text-muted-foreground">Fresh perspectives from our community</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex gap-2">
              <Link to="/explore">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : blogs && blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.slice(0, 6).map((blog) => (
                <BlogCard
                  key={blog._id}
                  id={blog._id}
                  title={blog.title}
                  excerpt={stripHtmlTags(blog.content).substring(0, 120) + (stripHtmlTags(blog.content).length > 120 ? '...' : '')}
                  slug={blog._id}
                  author={blog.author}
                  publishedAt={blog.createdAt}
                  viewCount={blog.views || 0}
                  commentCount={blog.commentCount || 0}
                  likeCount={blog.likeCount || (blog.likes ? blog.likes.length : 0)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No blogs yet. Be the first to write!</p>
              {user && canWrite && (
                <Button asChild>
                  <Link to="/write">Write Your First Blog</Link>
                </Button>
              )}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/explore">View All Stories</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
