import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthorBlogs, useDeleteBlog, usePublishBlog } from '@/hooks/useBlogs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { PenLine, Trash2, Edit, Plus, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyBlogsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: authorBlogs, isLoading } = useAuthorBlogs();
  const deleteBlog = useDeleteBlog();
  const publishBlog = usePublishBlog();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Author's blogs come from protected endpoint
  const blogs = authorBlogs || [];

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">My Blogs</h1>
            <p className="text-muted-foreground">Manage your published blogs</p>
          </div>
          <Button asChild className="gap-2 btn-glow">
            <Link to="/write"><Plus className="h-4 w-4" /> New Blog</Link>
          </Button>
        </div>

        {blogs && blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <Card key={blog._id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                      </span>
                      <h3 className="font-serif text-xl font-semibold mb-2 truncate">{blog.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{stripHtmlTags(blog.content).substring(0, 150)}...</p>
                    </div>
                      <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/blog/${blog._id}`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                      {blog.status !== 'published' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => publishBlog.mutate(blog._id)}
                          disabled={publishBlog.isLoading}
                        >
                          Publish
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{blog.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBlog.mutate(blog._id)} className="bg-destructive text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-xl">
            <PenLine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-semibold mb-2">No blogs yet</h3>
            <p className="text-muted-foreground mb-6">Start writing and share your stories with the world!</p>
            <Button asChild className="btn-glow"><Link to="/write">Write Your First Blog</Link></Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBlogsPage;
