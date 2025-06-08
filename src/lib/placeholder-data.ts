
import type { User, Post, Topic, Category, CategorySummary } from './types';

// 请注意：以下占位符数据中的大部分文本内容仍为英文。
// 您需要手动将这些内容（如用户名、简介、帖子内容、主题标题、分类描述等）翻译成简体中文，以确保应用完全本地化。
// 我已经翻译了几个示例，以向您展示如何操作。

const users: User[] = [
  { id: 'user1', username: '爱丽丝', avatarUrl: 'https://placehold.co/100x100.png', bio: '喜欢编码和猫。', joinedAt: '2023-01-15T10:00:00Z' },
  { id: 'user2', username: '鲍勃', avatarUrl: 'https://placehold.co/100x100.png', bio: '徒步爱好者和摄影师。', joinedAt: '2023-02-20T14:30:00Z' },
  { id: 'user3', username: '查理', avatarUrl: 'https://placehold.co/100x100.png', bio: '游戏玩家和科技评论员。', joinedAt: '2023-03-10T08:45:00Z' },
];

const posts: Post[] = [
  {
    id: 'post1',
    author: users[0],
    content: '这是“入门指南”主题的第一个帖子。欢迎大家！',
    createdAt: '2023-05-01T12:00:00Z',
    upvotes: 15,
    replies: [
      {
        id: 'post1_reply1',
        author: users[1],
        content: '谢谢爱丽丝的欢迎！很高兴来到这里。',
        createdAt: '2023-05-01T12:05:00Z',
        upvotes: 8,
        replies: [
          {
            id: 'post1_reply1_reply1',
            author: users[0],
            content: '不客气，鲍勃！',
            createdAt: '2023-05-01T12:10:00Z',
            upvotes: 3,
          }
        ]
      },
      {
        id: 'post1_reply2',
        author: users[2],
        content: '大家好！期待精彩的讨论。',
        createdAt: '2023-05-01T12:15:00Z',
        upvotes: 5,
      },
    ],
  },
  {
    id: 'post2',
    author: users[1],
    content: '我有一个关于 Next.js 新特性的问题。有人能帮忙吗？',
    createdAt: '2023-05-02T10:30:00Z',
    upvotes: 10,
    replies: [
      {
        id: 'post2_reply1',
        author: users[0],
        content: '当然，鲍勃。你具体想知道什么？',
        createdAt: '2023-05-02T10:35:00Z',
        upvotes: 4,
      },
    ],
  },
  {
    id: 'post3',
    author: users[2],
    content: '只是想分享一个我发现的很酷的开源项目！',
    createdAt: '2023-05-03T15:00:00Z',
    upvotes: 25,
    replies: [],
  },
  {
    id: 'post4',
    author: users[0],
    content: '我们来讨论一下最喜欢的设计模式吧。我的是单例模式，尽管有争议！',
    createdAt: '2023-05-04T09:00:00Z',
    upvotes: 12,
    replies: [
        {
            id: 'post4_reply1',
            author: users[1],
            content: '我更喜欢依赖注入，因为它具有可测试性。',
            createdAt: '2023-05-04T09:05:00Z',
            upvotes: 6,
        }
    ]
  },
];

export const placeholderTopics: Topic[] = [
  {
    id: 'topic1',
    title: '11A4008深论坛入门指南',
    author: users[0],
    createdAt: '2023-05-01T12:00:00Z',
    postCount: 4, 
    viewCount: 120,
    tags: [
        { id: 'tag-welcome', name: '欢迎', slug: 'welcome' },
        { id: 'tag-introduction', name: '介绍', slug: 'introduction' }
    ],
    firstPost: posts[0],
    category: { id: 'cat1', name: '综合讨论', slug: 'general-discussion' },
  },
  {
    id: 'topic2',
    title: '关于 Next.js 14 的问题',
    author: users[1],
    createdAt: '2023-05-02T10:30:00Z',
    postCount: 2,
    viewCount: 85,
    tags: [
        { id: 'tag-nextjs', name: 'nextjs', slug: 'nextjs' },
        { id: 'tag-javascript', name: 'javascript', slug: 'javascript' },
        { id: 'tag-webdev', name: 'web开发', slug: 'webdev' }
    ],
    firstPost: posts[1],
    category: { id: 'cat2', name: 'Web 开发', slug: 'web-development' },
  },
  {
    id: 'topic3',
    title: '酷炫的开源项目',
    author: users[2],
    createdAt: '2023-05-03T15:00:00Z',
    postCount: 1,
    viewCount: 250,
    tags: [
        { id: 'tag-opensource', name: '开源', slug: 'opensource' },
        { id: 'tag-projects', name: '项目', slug: 'projects' },
        { id: 'tag-share', name: '分享', slug: 'share' }
    ],
    firstPost: posts[2],
    category: { id: 'cat3', name: '作品展示', slug: 'showcase' },
  },
  {
    id: 'topic4',
    title: '最喜欢的设计模式讨论',
    author: users[0],
    createdAt: '2023-05-04T09:00:00Z',
    postCount: 2,
    viewCount: 95,
    tags: [
        { id: 'tag-software-design', name: '软件设计', slug: 'software-design' },
        { id: 'tag-programming', name: '编程', slug: 'programming' },
        { id: 'tag-best-practices', name: '最佳实践', slug: 'best-practices' }
    ],
    firstPost: posts[3],
    category: { id: 'cat2', name: 'Web 开发', slug: 'web-development' },
  },
];

export const placeholderCategories: Category[] = [
    { 
        id: 'cat1', 
        name: '综合讨论', 
        slug: 'general-discussion',
        description: '畅所欲言，谈天说地。', 
        topicCount: 1, 
        postCount: 4,
        lastTopic: { id: 'topic1', title: '11A4008深论坛入门指南', createdAt: '2023-05-01T12:00:00Z', author: users[0] }
    },
    { 
        id: 'cat2', 
        name: 'Web 开发', 
        slug: 'web-development',
        description: '讨论框架、库和最佳实践。', 
        topicCount: 2, 
        postCount: 4,
        lastTopic: { id: 'topic4', title: '最喜欢的设计模式讨论', createdAt: '2023-05-04T09:00:00Z', author: users[0] }
    },
    { 
        id: 'cat3', 
        name: '作品展示', 
        slug: 'showcase',
        description: '展示你的项目并获得反馈。', 
        topicCount: 1, 
        postCount: 1,
        lastTopic: { id: 'topic3', title: '酷炫的开源项目', createdAt: '2023-05-03T15:00:00Z', author: users[2] }
    },
];

export const getPlaceholderTopicById = (id: string): Topic | undefined => placeholderTopics.find(topic => topic.id === id);
export const getPlaceholderUserById = (id: string): User | undefined => users.find(user => user.id === id);
export const placeholderUser = users[0]; 
    
