import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Loader2, Calendar, FileText, Eye, MessageCircle, Heart } from 'lucide-react';
import { blogAPI } from '@/lib/api';
import { BlogCard } from '@/components/blog/BlogCard';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const AuthorProfile = () => {
  const { id, username } = useParams();
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const identifier = username || id;
      if (!identifier) {
        setError('Author identifier missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await blogAPI.getPublishedByAuthor(identifier);
        // backend returns { author, blogs }
        setAuthor(data.author || null);
        setBlogs(Array.isArray(data.blogs) ? data.blogs : []);
      } catch (err: any) {
        console.error('Failed to load author profile', err);
        // Show 'Author not found' only for 404 responses
        if (err && err.status === 404) {
          setError('Author not found');
        } else {
          setError(err.message || 'Failed to load author profile');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, username]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-elegant">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 md:h-32 md:w-32 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-8 bg-muted rounded animate-pulse w-48" />
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-4 bg-muted rounded animate-pulse w-64" />
                    <div className="flex gap-4 mt-4">
                      <div className="h-4 bg-muted rounded animate-pulse w-20" />
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                      <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-elegant">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="font-serif text-2xl font-bold mb-2">Author Not Found</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/explore">
                    <Eye className="h-4 w-4" />
                    Explore Stories
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        {/* Author Profile Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="shadow-elegant">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarImage src={author?.avatar || ''} alt={author?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-semibold">
                    {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{author?.name}</h1>
                      {author?.username && (
                        <p className="text-muted-foreground text-lg mb-2">@{author.username}</p>
                      )}
                      {author?.bio && (
                        <p className="text-muted-foreground mb-4 leading-relaxed">{author.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium text-foreground">{blogs?.length || 0}</span>
                      <span>{blogs?.length === 1 ? 'Blog' : 'Blogs'}</span>
                    </div>

                    {author?.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {format(new Date(author.createdAt), 'MMMM yyyy')}</span>
                      </div>
                    )}

                    {/* Total views across all blogs */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {blogs?.reduce((total, blog) => total + (blog.views || 0), 0).toLocaleString()}
                      </span>
                      <span>Total Views</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Author's Blogs */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Published Stories</h2>
              <p className="text-muted-foreground">Explore {author?.name}'s published work</p>
            </div>
          </div>

          {blogs && blogs.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog._id}
                  id={blog._id}
                  title={blog.title}
                  excerpt={blog.description || blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : ''}
                  slug={blog._id}
                  coverImage={blog.coverImage || ''}
                  author={blog.author}
                  publishedAt={blog.createdAt}
                  viewCount={blog.views || 0}
                  commentCount={blog.commentCount || 0}
                  likeCount={blog.likes ? blog.likes.length : 0}
                />
              ))}
            </div>
          ) : (
            <Card className="shadow-elegant">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">No Stories Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {author?.name} hasn't published any stories yet. Check back later for their upcoming work.
                </p>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/explore">
                    <Eye className="h-4 w-4" />
                    Explore Other Stories
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuthorProfile;
