import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";
import Blog from "./models/blogs.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Clear existing data
    await User.deleteMany();
    await Blog.deleteMany();

    // Create test users
    const user1 = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password: "password123"
    });

    const user2 = await User.create({
      name: "Jane Smith",
      email: "jane@example.com",
      password: "password123"
    });

    // Create test blogs
    await Blog.create([
      {
        title: "Getting Started with React",
        content: "React is a powerful JavaScript library for building user interfaces with reusable components and efficient rendering. Learn the basics of React including JSX, hooks, and state management.",
        author: user1._id,
        views: 150,
        status: 'published',
        isApproved: true
      },
      {
        title: "Node.js Best Practices",
        content: "Discover the best practices for building scalable and maintainable Node.js applications. From error handling to performance optimization, we cover everything you need to know.",
        author: user2._id,
        views: 200,
        status: 'published',
        isApproved: true
      },
      {
        title: "MongoDB Tutorial",
        content: "MongoDB is a NoSQL database that stores data in JSON-like documents. This tutorial covers collections, documents, queries, and how to integrate MongoDB with your Node.js applications.",
        author: user1._id,
        views: 120,
        status: 'published',
        isApproved: true
      },
      {
        title: "TypeScript for Beginners",
        content: "TypeScript adds static typing to JavaScript, making your code more reliable and easier to maintain. Learn about types, interfaces, classes, and how to use TypeScript in your projects.",
        author: user2._id,
        views: 180,
        status: 'published',
        isApproved: true
      },
      {
        title: "REST API Design Guide",
        content: "Learn how to design RESTful APIs following best practices. Understand HTTP methods, status codes, authentication, and how to create APIs that are intuitive and scalable.",
        author: user1._id,
        views: 210,
        status: 'published',
        isApproved: true
      },
      {
        title: "JavaScript Advanced Concepts",
        content: "Dive deep into advanced JavaScript concepts like closures, prototypes, async/await, and the event loop. These concepts are essential for writing professional-grade JavaScript code.",
        author: user2._id,
        views: 250,
        status: 'published',
        isApproved: true
      }
    ]);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
