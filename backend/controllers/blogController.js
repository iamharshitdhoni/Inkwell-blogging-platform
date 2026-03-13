import Blog from "../models/blogs.js";
import User from "../models/userModel.js";

// Create blog (Author)
export const createBlog = async (req, res) => {
  try {
    // Only authors and admins can create blogs
    if (req.user.role !== 'author' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only authors and admins can create blogs" });
    }

    const { title, content, category, tags, description } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const blog = await Blog.create({
      title,
      content,
      category: category || "General",
      tags: tags || [],
      description: description || "",
      author: req.user._id,
      status: 'draft',
      isApproved: req.user.role === 'admin' // Admin blogs are auto-approved
    });
    
    const populatedBlog = await Blog.findById(blog._id).populate("author", "name email _id avatar username role");
    res.status(201).json(populatedBlog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all published blogs (User/Reader)
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published', isApproved: true })
      .populate("author", "name email _id avatar username")
      .sort({ createdAt: -1 });
    console.log("Fetched blogs count:", blogs.length);
    res.json(blogs);
  } catch (error) {
    console.log("Error fetching blogs:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get single blog
export const getSingleBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email _id avatar username");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update blog (Author can edit own draft/archived blogs, Admin can edit any)
export const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Check authorization
    const isAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this blog" });
    }

    // Authors can only edit draft/archived blogs, not published ones
    if (req.user.role === 'author' && blog.status === 'published') {
      return res.status(403).json({ message: "Cannot edit published blogs" });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("author", "name email _id avatar username");
    
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete blog (Author/Admin)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Check authorization
    const isAuthor = blog.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Publish blog (Author)
export const publishBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    blog.status = 'published';
    blog.isApproved = true; // Auto-approve when author publishes
    await blog.save();

    const populatedBlog = await Blog.findById(blog._id).populate("author", "name email _id avatar username");
    res.json({ message: "Blog published successfully", blog: populatedBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get author's blogs (Author dashboard)
export const getAuthorBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate("author", "name email _id avatar username")
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalBlogs: blogs.length,
      publishedBlogs: blogs.filter(b => b.status === 'published').length,
      draftBlogs: blogs.filter(b => b.status === 'draft').length,
      totalViews: blogs.reduce((sum, blog) => sum + blog.views, 0),
      totalLikes: blogs.reduce((sum, blog) => sum + (blog.likes?.length || 0), 0),
    };

    res.json({ blogs, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike blog (User)
export const toggleLikeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const userId = req.user._id;
    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      blog.likes.push(userId);
    }

    await blog.save();
    const populatedBlog = await Blog.findById(blog._id).populate("author", "name email _id avatar username");

    res.json({ 
      message: isLiked ? "Blog unliked" : "Blog liked",
      blog: populatedBlog,
      isLiked: !isLiked 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Approve blog
export const approveBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate("author", "name email _id avatar username");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.json({ message: "Blog approved successfully", blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Reject blog
export const rejectBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.json({ message: "Blog rejected and deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all blogs (including drafts and unapproved)
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email _id avatar username")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public: Get published blogs for a given author id (for author profile page)
export const getPublishedBlogsByAuthor = async (req, res) => {
  try {
    const identifier = req.params.id;

    // Determine if identifier is a MongoDB ObjectId
    const isObjectId = identifier && identifier.match(/^[0-9a-fA-F]{24}$/);

    let author = null;
    if (isObjectId) {
      author = await User.findById(identifier).select('name username avatar bio role isActive');
      console.log(`Author lookup by _id: ${identifier} -> ${author ? 'found' : 'missing'}`);
    } else {
      // Case-insensitive username search
      author = await User.findOne({ username: { $regex: `^${identifier}$`, $options: 'i' } }).select('name username avatar bio role isActive');
      console.log(`Author lookup by username: ${identifier} -> ${author ? 'found' : 'missing'}`);
    }

    if (!author) return res.status(404).json({ message: 'Author not found' });

    // If the author exists but is inactive, still allow viewing profile unless you want to restrict it
    if (author.isActive === false) {
      console.log(`Author ${author._id} is inactive but profile request allowed`);
    }

    const blogs = await Blog.find({ author: author._id, status: 'published', isApproved: true })
      .populate('author', 'name username _id avatar')
      .sort({ createdAt: -1 });

    res.json({ author, blogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};