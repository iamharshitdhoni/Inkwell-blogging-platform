import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { BlogCard } from '@/components/blog/BlogCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBlogs } from '@/hooks/useBlogs';
import { Search, TrendingUp, Clock } from 'lucide-react';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};

const ExplorePage = () => {
  const { data: blogs = [], isLoading } = useBlogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedBlogs = [...filteredBlogs].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'trending') {
      return (b.views || 0) - (a.views || 0);
    }
    return 0;
  });

  return (
    <Layout>
      <div className="container py-12">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Explore Stories</h1>
          <p className="text-muted-foreground text-lg">
            Discover inspiring stories from writers around the world
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
                className="gap-2"
              >
                <Clock className="h-4 w-4" /> Recent
              </Button>
              <Button
                variant={sortBy === 'trending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('trending')}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" /> Trending
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {filteredBlogs.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{filteredBlogs.length}</span> {filteredBlogs.length === 1 ? 'story' : 'stories'}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedBlogs && sortedBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBlogs.map((blog) => (
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
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'No stories found matching your search.' : 'No stories published yet.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExplorePage;
