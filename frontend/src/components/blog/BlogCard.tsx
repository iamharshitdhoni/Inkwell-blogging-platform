import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, MessageCircle, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};

interface BlogCardProps {
  id: string;
  title: string;
  excerpt?: string;
  slug: string;
  coverImage?: string;
  author?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string | null;
    username?: string;
  };
  publishedAt?: string;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  featured?: boolean;
}

export const BlogCard = ({
  title,
  excerpt,
  slug,
  coverImage,
  author,
  publishedAt,
  viewCount = 0,
  commentCount = 0,
  likeCount = 0,
  featured = false,
}: BlogCardProps) => {
  return (
    <Link to={`/blog/${slug}`} className="block group">
      <Card className={`overflow-hidden border-border/50 transition-all duration-300 hover:shadow-xl hover:border-primary/30 ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}>
        {coverImage && (
          <div className={`overflow-hidden bg-muted ${featured ? 'aspect-[2/1]' : 'aspect-video'}`}>
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className={`p-6 ${featured ? 'p-8' : ''}`}>
          {/* Author and Date */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={author?.avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {(author?.name || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{author?.name || 'Anonymous'}</span>
              {publishedAt && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time>{format(new Date(publishedAt), 'MMM d, yyyy')}</time>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className={`font-serif font-bold mb-3 line-clamp-2 text-foreground group-hover:text-primary transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>
            {title}
          </h3>
          
          {/* Excerpt */}
          {excerpt && (
            <p className={`text-muted-foreground line-clamp-3 mb-4 ${featured ? 'text-base' : 'text-sm'}`}>
              {stripHtmlTags(excerpt)}
            </p>
          )}

          {/* Stats Footer */}
          <div className="flex items-center gap-4 pt-4 border-t border-border/30 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-destructive" />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
