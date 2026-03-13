import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBlog, useUpdateBlog, useBlogById } from '@/hooks/useBlogs';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WriteBlogPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const isEditing = !!slug;
  const { data: existingBlog, isLoading: loadingBlog } = useBlogById(slug || '');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=signup');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (existingBlog) {
      setTitle(existingBlog.title);
      setContent(existingBlog.content);
    }
  }, [existingBlog]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    const blogData = {
      title: title.trim(),
      content,
    };

    try {
      if (isEditing && existingBlog) {
        await updateBlog.mutateAsync({ blogId: existingBlog._id, data: blogData });
      } else {
        await createBlog.mutateAsync(blogData);
      }
      navigate('/my-blogs');
    } catch (error) {
      console.error('Error saving blog:', error);
    }
  };

  if (authLoading || (isEditing && loadingBlog)) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const isPending = createBlog.isPending || updateBlog.isPending;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={() => handleSave()} disabled={isPending || !title.trim() || !content.trim()} className="btn-glow">
              <Send className="h-4 w-4 mr-2" /> {isEditing ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter your blog title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-serif h-14"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Start writing your story..." />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WriteBlogPage;
