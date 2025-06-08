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
  description: string;
  topicCount: number;
  postCount: number;
  lastTopic?: Pick<Topic, 'id' | 'title' | 'createdAt' | 'author'>;
}
