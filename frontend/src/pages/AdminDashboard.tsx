import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Users, FileText, Eye, Heart, Loader2, Trash2, Check, X, UserPlus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminDashboard = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch all users with profiles
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        data.map(async (profile) => {
          const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', profile.id);
          return { ...profile, roles: roles?.map(r => r.role) || [] };
        })
      );
      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  // Fetch all blogs
  const { data: blogs, isLoading: loadingBlogs } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Delete blog mutation
  const deleteBlog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast({ title: 'Blog deleted' });
    },
  });

  // Update blog status
  const updateBlogStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('blogs').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast({ title: 'Blog status updated' });
    },
  });

  // Add role to user
  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Remove role from user
  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role removed' });
    },
  });

  if (authLoading || loadingUsers || loadingBlogs) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const stats = {
    totalUsers: users?.length || 0,
    totalBlogs: blogs?.length || 0,
    publishedBlogs: blogs?.filter(b => b.status === 'published').length || 0,
    totalViews: blogs?.reduce((sum, b) => sum + (b.view_count || 0), 0) || 0,
  };

  const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
  };

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-serif text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-sm text-muted-foreground">Users</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.totalBlogs}</p><p className="text-sm text-muted-foreground">Total Blogs</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100"><Check className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{stats.publishedBlogs}</p><p className="text-sm text-muted-foreground">Published</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10"><Eye className="h-6 w-6 text-primary" /></div>
              <div><p className="text-2xl font-bold">{stats.totalViews}</p><p className="text-sm text-muted-foreground">Total Views</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users?.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <p className="text-sm text-muted-foreground">{u.full_name || 'No name set'}</p>
                        <div className="flex gap-2 mt-2">
                          {u.roles.map((role: string) => (
                            <Badge key={role} variant="secondary" className="gap-1">
                              {role}
                              {role !== 'reader' && u.id !== user?.id && (
                                <button onClick={() => removeRole.mutate({ userId: u.id, role })} className="ml-1 hover:text-destructive">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Select onValueChange={(role) => addRole.mutate({ userId: u.id, role })}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {!u.roles.includes('author') && <SelectItem value="author">Author</SelectItem>}
                          {!u.roles.includes('admin') && <SelectItem value="admin">Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blogs">
            <Card>
              <CardHeader><CardTitle>Blog Management</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blogs?.map((blog) => (
                    <div key={blog.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge className={statusColors[blog.status] || ''}>{blog.status}</Badge>
                          <span className="text-sm text-muted-foreground">{format(new Date(blog.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <p className="font-medium truncate">{blog.title}</p>
                        <p className="text-sm text-muted-foreground">by {(blog.profiles as any)?.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={blog.status} onValueChange={(status) => updateBlogStatus.mutate({ id: blog.id, status })}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Blog</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this blog.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBlog.mutate(blog.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
