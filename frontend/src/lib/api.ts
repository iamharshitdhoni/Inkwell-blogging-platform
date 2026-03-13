const API_URL = "http://localhost:5000/api";

interface LoginRequest {
  email: string;
  password: string;
}

interface UserSignupRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthorSignupRequest {
  name: string;
  email: string;
  password: string;
}

interface AdminSignupRequest {
  name: string;
  email: string;
  password: string;
}

interface BlogRequest {
  title: string;
  content: string;
}

interface CommentRequest {
  text: string;
  blogId: string;
}

// ============================================
// AUTHENTICATION API CALLS (Role-Based)
// ============================================
export const authAPI = {
  // Login - Same for all roles, backend identifies role from database
  login: async (data: LoginRequest) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      const error: any = new Error(result.message || "Login failed");
      error.status = response.status;
      error.isEmailVerified = result.isEmailVerified;
      throw error;
    }
    return result;
  },

  // Sign up as Regular User (Reader)
  signupUser: async (data: UserSignupRequest) => {
    const response = await fetch(`${API_URL}/users/signup/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "User signup failed");
    }
    return result;
  },

  // Sign up as Author (Writer)
  signupAuthor: async (data: AuthorSignupRequest) => {
    const response = await fetch(`${API_URL}/users/signup/author`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Author signup failed");
    }
    return result;
  },

  // Legacy - Kept for backward compatibility
  register: async (data: UserSignupRequest) => {
    return authAPI.signupUser(data);
  },

  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getUserById: async (userId: string) => {
    const response = await fetch(`${API_URL}/users/${userId}`);
    return response.json();
  },

  searchUsers: async (query: string) => {
    const response = await fetch(`${API_URL}/users/search/query?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },

  updateProfile: async (userId: string, data: { name?: string; username?: string; avatar?: string }, token: string) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Profile update failed");
    }
    return result;
  },

  // Email verification
  verifyEmail: async (token: string) => {
    const response = await fetch(`${API_URL}/users/verify-email?token=${encodeURIComponent(token)}`);
    const result = await response.json();
    if (!response.ok) {
      const error: any = new Error(result.message || "Email verification failed");
      error.isExpired = result.isExpired || false;
      throw error;
    }
    return result;
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    const response = await fetch(`${API_URL}/users/resend-verification-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to resend verification email");
    }
    return result;
  },

  // ============================================
  // OTP-BASED AUTHENTICATION API
  // ============================================
  
  // Send OTP for signup
  sendSignupOTP: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/otp/send-signup-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      const error: any = new Error(result.message || "Failed to send signup OTP");
      error.code = result.code;
      error.status = response.status;
      throw error;
    }
    return result;
  },

  // Verify OTP for signup
  verifySignupOTP: async (email: string, otp: string, name: string, username?: string, role?: string) => {
    const response = await fetch(`${API_URL}/auth/otp/verify-signup-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name, username, role }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to verify OTP");
    }
    return result;
  },

  // Send OTP for login
  sendLoginOTP: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/otp/send-login-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      const error: any = new Error(result.message || "Failed to send login OTP");
      error.code = result.code;
      error.status = response.status;
      throw error;
    }
    return result;
  },

  // Verify OTP for login
  verifyLoginOTP: async (email: string, otp: string) => {
    const response = await fetch(`${API_URL}/auth/otp/verify-login-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to verify OTP");
    }
    return result;
  },
};

// Blog API calls
export const blogAPI = {
  getAllBlogs: async () => {
    try {
      const response = await fetch(`${API_URL}/blogs`);
      console.log("Blogs API response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      console.log("Blogs fetched:", data);
      return data;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      throw error;
    }
  },

  getBlogById: async (blogId: string) => {
    const response = await fetch(`${API_URL}/blogs/${blogId}`);
    if (!response.ok) throw new Error("Failed to fetch blog");
    return response.json();
  },

  // Get blogs for the authenticated author (protected route)
  getAuthorBlogs: async (token: string) => {
    const response = await fetch(`${API_URL}/blogs/author/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to fetch author blogs");
    return result.blogs || result; // controller returns { blogs, stats }
  },

  createBlog: async (data: BlogRequest, token: string) => {
    const response = await fetch(`${API_URL}/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to create blog");
    return result;
  },

  updateBlog: async (blogId: string, data: BlogRequest, token: string) => {
    const response = await fetch(`${API_URL}/blogs/${blogId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to update blog");
    return result;
  },

  deleteBlog: async (blogId: string, token: string) => {
    const response = await fetch(`${API_URL}/blogs/${blogId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Failed to delete blog");
    return result;
  },

  // Publish a drafted blog (protected)
  publishBlog: async (blogId: string, token: string) => {
    const response = await fetch(`${API_URL}/blogs/${blogId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to publish blog');
    return result;
  },

  // Toggle like/unlike for a blog (requires auth)
  toggleLike: async (blogId: string, token: string) => {
    const response = await fetch(`${API_URL}/blogs/${blogId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to toggle like' }));
      throw new Error(err.message || 'Failed to toggle like');
    }
    return response.json();
  },

  // Get published blogs for a specific author (public)
  getPublishedByAuthor: async (authorId: string) => {
    const response = await fetch(`${API_URL}/blogs/author/${encodeURIComponent(authorId)}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err: any = new Error(result.message || 'Failed to fetch author blogs');
      err.status = response.status;
      throw err;
    }
    return result;
  },
};

// Comment API calls
export const commentAPI = {
  getCommentsByBlog: async (blogId: string) => {
    const response = await fetch(`${API_URL}/comments/blog/${blogId}`);
    if (!response.ok) throw new Error("Failed to fetch comments");
    return response.json();
  },

  addComment: async (data: CommentRequest, token: string) => {
    const response = await fetch(`${API_URL}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to add comment" }));
      throw new Error(errorData.message || "Failed to add comment");
    }
    return response.json();
  },

  deleteComment: async (commentId: string, token: string) => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to delete comment" }));
      throw new Error(errorData.message || "Failed to delete comment");
    }
    return response.json();
  },
};
