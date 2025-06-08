
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  joinedAt: string; // ISO string date
}

export interface Post {
  id: string;
  author: User;
  content: string;
  createdAt: string; // ISO string date
  replies?: Post[];
  upvotes: number;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface Topic {
  id: string;
  title: string;
  author: User;
  createdAt: string; // ISO string date
  postCount: number;
  viewCount: number;
  tags?: string[];
  firstPost: Post; // The initial post that starts the topic
  category?: CategorySummary;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}
export interface Category extends CategorySummary {
  description: string | null; // Flarum descriptions can be null
  topicCount: number;
  postCount?: number; // Not directly available from Flarum's /api/tags, make optional
  // lastTopic details from Flarum's /api/tags might require 'include' or be complex.
  // Simplified for now.
  lastTopic?: {
    title: string;
    authorName?: string; // Username of the author of the last post/topic
    // Full date might require parsing lastPostedAt from tag or lastPostedDiscussion.createdAt
  };
  color?: string; // Flarum tags have a color attribute
  icon?: string; // Flarum tags can have an icon
}
