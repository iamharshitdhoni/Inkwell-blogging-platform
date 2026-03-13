import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPageOTP from "./pages/AuthPageOTP";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ExplorePage from "./pages/ExplorePage";
import BlogDetailPage from "./pages/BlogDetailPage";
import WriteBlogPage from "./pages/WriteBlogPage";
import MyBlogsPage from "./pages/MyBlogsPage";
import ProfilePage from "./pages/ProfilePage";
import AuthorProfile from "./pages/AuthorProfile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPageOTP />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              
              {/* Author-only routes */}
              <Route 
                path="/write" 
                element={
                  <ProtectedRoute requiredRole="author">
                    <WriteBlogPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/write/:slug" 
                element={
                  <ProtectedRoute requiredRole="author">
                    <WriteBlogPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-blogs" 
                element={
                  <ProtectedRoute requiredRole="author">
                    <MyBlogsPage />
                  </ProtectedRoute>
                } 
              />

              {/* User routes (all authenticated users) */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />

              {/* Public author profile by id or username */}
              <Route path="/profile/:id" element={<AuthorProfile />} />
              <Route path="/author/:username" element={<AuthorProfile />} />

              {/* Admin-only routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
