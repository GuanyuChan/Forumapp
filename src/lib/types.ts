
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  joinedAt: string; // ISO string date
}

export interface Post {
  id:string;
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
  postCount: number; // Number of posts including the first one
  viewCount: number;
  tags?: CategorySummary[]; // Representing Flarum tags linked to discussion
  firstPost?: Post; // The initial post that starts the topic, can be optional if not always included
  category?: CategorySummary; // The primary category/tag it might belong to
  slug?: string; // Slug for the topic/discussion URL
  lastPostedAt?: string; // ISO string for when the last post was made
  lastPostedUser?: User; // User who made the last post
  participantCount?: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}
export interface Category extends CategorySummary {
  description: string | null;
  topicCount: number; // discussionCount from Flarum
  postCount?: number; // This is harder to get accurately from /api/tags directly for Flarum
  lastTopic?: { // Simplified, Flarum's lastPostedDiscussion is more complex
    id?: string;
    title: string;
    authorName?: string;
    createdAt?: string;
  };
  discussionCount?: number; // Explicitly from Flarum tag attributes
  lastPostedAt?: string | null; // From Flarum tag attributes
}

// --- Flarum Specific API Types ---
export interface FlarumUserAttributes {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinTime?: string; // ISO Date string
  commentCount?: number;
  discussionCount?: number;
  // Add other attributes as needed
}

export interface FlarumPostAttributes {
  contentHtml?: string;
  contentType?: string; // e.g., 'comment'
  createdAt: string; // ISO Date string
  // Add other attributes as needed
}

export interface FlarumDiscussionAttributes {
  title: string;
  slug: string;
  commentCount: number; // Number of replies (first post is not counted here)
  participantCount: number;
  createdAt: string; // ISO Date string
  lastPostedAt: string; // ISO Date string
  viewCount: number;
  // Add other attributes as needed
}

export interface FlarumTagAttributes {
  name: string;
  description: string | null;
  slug: string;
  color: string | null;
  icon: string | null;
  discussionCount: number;
  position: number | null;
  isHidden: boolean;
  lastPostedAt: string | null;
  // attributes for a single tag
  isChild?: boolean;
  parent?: { data: { type: 'tags', id: string } } | null;
}

// Generic Flarum Resource Identifier
export interface FlarumResourceIdentifier {
  type: string;
  id: string;
}

// Generic Flarum Relationship
export interface FlarumRelationship {
  data: FlarumResourceIdentifier | FlarumResourceIdentifier[] | null;
  links?: { related: string; };
}

// Generic Flarum Resource
export interface FlarumResource<TAttributes> {
  type: string;
  id: string;
  attributes: TAttributes;
  relationships?: Record<string, FlarumRelationship>;
}

export type FlarumUser = FlarumResource<FlarumUserAttributes>;
export type FlarumPost = FlarumResource<FlarumPostAttributes>;
export type FlarumDiscussion = FlarumResource<FlarumDiscussionAttributes>;
export type FlarumTag = FlarumResource<FlarumTagAttributes>;


// For included resources in JSON:API responses
export type FlarumIncludedResource = FlarumUser | FlarumPost | FlarumTag; // Add other types as needed

// API Response Structures
export interface FlarumApiListResponse<TResource> {
  data: TResource[];
  included?: FlarumIncludedResource[];
  links?: {
    first?: string;
    next?: string;
    prev?: string;
  };
}

export interface FlarumApiSingleResponse<TResource> {
  data: TResource;
  included?: FlarumIncludedResource[];
}
