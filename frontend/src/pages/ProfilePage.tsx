import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogs, useDeleteBlog } from '@/hooks/useBlogs';
import { authAPI } from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, LogOut, PenLine, Trash2, Edit, X, Check, Camera, AlertCircle } from 'lucide-react';
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

const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
};

// Compress image before converting to base64
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsImage = (file: File) => reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        const maxWidth = 400;
        const maxHeight = 400;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress with quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

const ProfilePage = () => {
  const { user, token, loading: authLoading, signOut } = useAuth();
  const { data: allBlogs, isLoading } = useBlogs();
  const deleteBlog = useDeleteBlog();
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    avatar: user?.avatar || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name || '',
        username: user.username || '',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadError('');
      const compressedImage = await compressImage(file);
      setAvatarPreview(compressedImage);
      setEditFormData(prev => ({ ...prev, avatar: compressedImage }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process image');
    }
  };

  const handleEditSubmit = async () => {
    if (!user || !token) return;
    
    // Clear any previous errors
    setUploadError('');

    // Validate form
    if (!editFormData.name.trim()) {
      setUploadError('Full name is required');
      return;
    }
    
    try {
      setIsUpdatingProfile(true);
      const response = await authAPI.updateProfile(user._id, {
        name: editFormData.name,
        username: editFormData.username || undefined,
        avatar: editFormData.avatar || undefined,
      }, token);
      
      // Update localStorage with new user data
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      // Reload page to update context
      window.location.reload();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Error updating profile:', error);
      setUploadError(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Filter blogs for current user
  const userBlogs = allBlogs?.filter(blog => blog.author?._id === user?._id) || [];

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
        {/* Profile Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="shadow-elegant">
            <CardContent className="p-8">
              {isEditingProfile ? (
                // Edit Profile Form
                <div className="space-y-6">
                  <h2 className="font-serif text-2xl font-bold">Edit Profile</h2>
                  
                  {/* Error Alert */}
                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Avatar Upload */}
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                          {editFormData.name ? editFormData.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-input"
                        />
                        <Label htmlFor="avatar-input" className="cursor-pointer">
                          <Button asChild variant="outline" className="gap-2">
                            <span>
                              <Camera className="h-4 w-4" />
                              Upload Photo
                            </span>
                          </Button>
                        </Label>
                        <p className="text-sm text-muted-foreground">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a unique username"
                    />
                    <p className="text-sm text-muted-foreground">Used for your profile URL</p>
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleEditSubmit}
                      disabled={isUpdatingProfile}
                      className="gap-2 btn-glow"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Profile
                <>
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="font-serif text-3xl font-bold mb-2">{user?.name}</h1>
                        {user?.username && (
                          <p className="text-muted-foreground text-sm mb-1">@{user.username}</p>
                        )}
                        <p className="text-muted-foreground text-lg">{user?.email}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {userBlogs.length} {userBlogs.length === 1 ? 'blog' : 'blogs'} published
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Blogs Section */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2">My Blogs</h2>
              <p className="text-muted-foreground">Manage your published stories</p>
            </div>
            <Button asChild className="gap-2 btn-glow">
              <a href="/write">
                <PenLine className="h-4 w-4" /> Write New Blog
              </a>
            </Button>
          </div>

          {userBlogs && userBlogs.length > 0 ? (
            <div className="space-y-4">
              {userBlogs.map((blog) => (
                <Card key={blog._id} className="card-hover overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {blog.views || 0} views
                          </span>
                        </div>
                        <h3 className="font-serif text-xl font-semibold mb-3 truncate hover:text-primary transition-colors">
                          <a href={`/blog/${blog._id}`}>{blog.title}</a>
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {stripHtmlTags(blog.content).substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>Created: {format(new Date(blog.createdAt), 'dd MMM yyyy')}</span>
                          {blog.updatedAt !== blog.createdAt && (
                            <span>Updated: {format(new Date(blog.updatedAt), 'dd MMM yyyy')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{blog.commentCount || 0} comments</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="icon" asChild>
                          <a href={`/write/${blog._id}`} title="Edit blog">
                            <Edit className="h-4 w-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete blog">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
                              <AlertDialogAction
                                onClick={() => deleteBlog.mutate(blog._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
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
              <Button asChild className="btn-glow">
                <a href="/write">Write Your First Blog</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
