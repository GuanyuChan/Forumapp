import type { User, Post, Topic, Category } from './types';

const users: User[] = [
  { id: 'user1', username: 'Alice', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Loves coding and cats.', joinedAt: '2023-01-15T10:00:00Z' },
  { id: 'user2', username: 'Bob', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Hiking enthusiast and photographer.', joinedAt: '2023-02-20T14:30:00Z' },
  { id: 'user3', username: 'Charlie', avatarUrl: 'https://placehold.co/100x100.png', bio: 'Gamer and tech reviewer.', joinedAt: '2023-03-10T08:45:00Z' },
];

const posts: Post[] = [
  {
    id: 'post1',
    author: users[0],
    content: 'This is the first post in the "Getting Started" topic. Welcome everyone!',
    createdAt: '2023-05-01T12:00:00Z',
    upvotes: 15,
    replies: [
      {
        id: 'post1_reply1',
        author: users[1],
        content: 'Thanks for the welcome, Alice! Glad to be here.',
        createdAt: '2023-05-01T12:05:00Z',
        upvotes: 8,
        replies: [
          {
            id: 'post1_reply1_reply1',
            author: users[0],
            content: 'You are welcome, Bob!',
            createdAt: '2023-05-01T12:10:00Z',
            upvotes: 3,
          }
        ]
      },
      {
        id: 'post1_reply2',
        author: users[2],
        content: 'Hello all! Looking forward to great discussions.',
        createdAt: '2023-05-01T12:15:00Z',
        upvotes: 5,
      },
    ],
  },
  {
    id: 'post2',
    author: users[1],
    content: 'I have a question about the new Next.js features. Can anyone help?',
    createdAt: '2023-05-02T10:30:00Z',
    upvotes: 10,
    replies: [
      {
        id: 'post2_reply1',
        author: users[0],
        content: 'Sure, Bob. What specifically are you wondering about?',
        createdAt: '2023-05-02T10:35:00Z',
        upvotes: 4,
      },
    ],
  },
  {
    id: 'post3',
    author: users[2],
    content: 'Just wanted to share this cool open-source project I found!',
    createdAt: '2023-05-03T15:00:00Z',
    upvotes: 25,
    replies: [],
  },
  {
    id: 'post4',
    author: users[0],
    content: 'Let\'s discuss our favorite design patterns. Mine is the Singleton pattern, though controversial!',
    createdAt: '2023-05-04T09:00:00Z',
    upvotes: 12,
    replies: [
        {
            id: 'post4_reply1',
            author: users[1],
            content: 'I prefer Dependency Injection for testability.',
            createdAt: '2023-05-04T09:05:00Z',
            upvotes: 6,
        }
    ]
  },
];

export const placeholderTopics: Topic[] = [
  {
    id: 'topic1',
    title: 'Getting Started with Zenith Forums',
    author: users[0],
    createdAt: '2023-05-01T12:00:00Z',
    postCount: 4, // Includes initial post and replies
    viewCount: 120,
    tags: ['welcome', 'introduction'],
    firstPost: posts[0],
    category: { id: 'cat1', name: 'General Discussion', slug: 'general-discussion' },
  },
  {
    id: 'topic2',
    title: 'Questions about Next.js 14',
    author: users[1],
    createdAt: '2023-05-02T10:30:00Z',
    postCount: 2,
    viewCount: 85,
    tags: ['nextjs', 'javascript', 'webdev'],
    firstPost: posts[1],
    category: { id: 'cat2', name: 'Web Development', slug: 'web-development' },
  },
  {
    id: 'topic3',
    title: 'Cool Open Source Projects',
    author: users[2],
    createdAt: '2023-05-03T15:00:00Z',
    postCount: 1,
    viewCount: 250,
    tags: ['opensource', 'projects', 'share'],
    firstPost: posts[2],
    category: { id: 'cat3', name: 'Showcase', slug: 'showcase' },
  },
  {
    id: 'topic4',
    title: 'Favorite Design Patterns Discussion',
    author: users[0],
    createdAt: '2023-05-04T09:00:00Z',
    postCount: 2,
    viewCount: 95,
    tags: ['software-design', 'programming', 'best-practices'],
    firstPost: posts[3],
    category: { id: 'cat2', name: 'Web Development', slug: 'web-development' },
  },
];

export const placeholderCategories: Category[] = [
    { 
        id: 'cat1', 
        name: 'General Discussion', 
        slug: 'general-discussion',
        description: 'Talk about anything and everything.', 
        topicCount: 1, 
        postCount: 4,
        lastTopic: { id: 'topic1', title: 'Getting Started with Zenith Forums', createdAt: '2023-05-01T12:00:00Z', author: users[0] }
    },
    { 
        id: 'cat2', 
        name: 'Web Development', 
        slug: 'web-development',
        description: 'Discuss frameworks, libraries, and best practices.', 
        topicCount: 2, 
        postCount: 4,
        lastTopic: { id: 'topic4', title: 'Favorite Design Patterns Discussion', createdAt: '2023-05-04T09:00:00Z', author: users[0] }
    },
    { 
        id: 'cat3', 
        name: 'Showcase', 
        slug: 'showcase',
        description: 'Show off your projects and get feedback.', 
        topicCount: 1, 
        postCount: 1,
        lastTopic: { id: 'topic3', title: 'Cool Open Source Projects', createdAt: '2023-05-03T15:00:00Z', author: users[2] }
    },
];

export const getPlaceholderTopicById = (id: string): Topic | undefined => placeholderTopics.find(topic => topic.id === id);
export const getPlaceholderUserById = (id: string): User | undefined => users.find(user => user.id === id);
export const placeholderUser = users[0]; // Default user for profile page etc.
