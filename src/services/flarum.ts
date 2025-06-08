
'use server';
import type {
  Category,
  Topic,
  User,
  Post,
  FlarumTag,
  FlarumDiscussion,
  FlarumUser,
  FlarumPost as FlarumPostType,
  FlarumIncludedResource,
  FlarumApiListResponse,
  FlarumApiSingleResponse,
  CategorySummary,
} from '@/lib/types';

const FLARUM_API_URL = process.env.FLARUM_API_URL;
const FLARUM_API_KEY = process.env.FLARUM_API_KEY;

const DEFAULT_AVATAR = 'https://placehold.co/100x100.png';

async function flarumFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!FLARUM_API_URL || !FLARUM_API_KEY) {
    console.error('Flarum API URL or Key is not configured in .env');
    return null;
  }

  const url = `${FLARUM_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${FLARUM_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        ...(options?.headers),
      },
      next: { revalidate: 3600 } // Revalidate every hour, adjust as needed
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch from Flarum API: ${response.status} ${response.statusText} for URL: ${url}. Body: ${errorBody}`);
      return null;
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching from Flarum API URL: ${url}:`, error);
    return null;
  }
}

function findIncludedResource<T extends FlarumIncludedResource>(
  included: FlarumIncludedResource[] | undefined,
  type: T['type'],
  id: string
): T | undefined {
  return included?.find(res => res.type === type && res.id === id) as T | undefined;
}

function transformFlarumUser(userResource?: FlarumUser): User | undefined {
  if (!userResource?.attributes) return undefined;
  return {
    id: userResource.id,
    username: userResource.attributes.displayName || userResource.attributes.username || 'Unknown User',
    avatarUrl: userResource.attributes.avatarUrl || DEFAULT_AVATAR,
    joinedAt: userResource.attributes.joinTime || new Date().toISOString(), // Fallback for joinedAt
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  const authorId = postResource.relationships?.user?.data?.id;
  let author: User | undefined;
  if (authorId) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorId);
    author = transformFlarumUser(authorResource);
  }

  return {
    id: postResource.id,
    content: postResource.attributes.contentHtml || '', // Flarum often provides contentHtml
    createdAt: postResource.attributes.createdAt,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    upvotes: 0, // Flarum handles reactions/votes differently, placeholder for now
    // replies would require more complex fetching logic if not directly embedded
  };
}


function transformFlarumTagToCategorySummary(tagResource?: FlarumTag): CategorySummary | undefined {
  if (!tagResource?.attributes) return undefined;
  return {
    id: tagResource.id,
    name: tagResource.attributes.name,
    slug: tagResource.attributes.slug,
    color: tagResource.attributes.color || undefined,
    icon: tagResource.attributes.icon || undefined,
  };
}

export function transformFlarumDiscussion(discussion: FlarumDiscussion, included?: FlarumIncludedResource[]): Topic {
  const attributes = discussion.attributes;
  
  const authorId = discussion.relationships?.user?.data?.id;
  let author: User | undefined;
  if (authorId) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorId);
    author = transformFlarumUser(authorResource);
  }

  const firstPostId = discussion.relationships?.firstPost?.data?.id;
  let firstPost: Post | undefined;
  if (firstPostId) {
    const postResource = findIncludedResource<FlarumPostType>(included, 'posts', firstPostId);
    // Pass all included resources to transformFlarumPost as it might need to find its own author
    firstPost = transformFlarumPost(postResource, included);
  }

  let discussionTags: CategorySummary[] = [];
  const tagsData = discussion.relationships?.tags?.data;
  if (Array.isArray(tagsData)) {
    tagsData.forEach(tagIdentifier => {
      const tagResource = findIncludedResource<FlarumTag>(included, 'tags', tagIdentifier.id);
      const categorySummary = transformFlarumTagToCategorySummary(tagResource);
      if (categorySummary) {
        discussionTags.push(categorySummary);
      }
    });
  }
  
  const lastPostedUserId = discussion.relationships?.lastPostedUser?.data?.id;
  let lastPostedUser : User | undefined;
  if(lastPostedUserId){
    const userResource = findIncludedResource<FlarumUser>(included, 'users', lastPostedUserId);
    lastPostedUser = transformFlarumUser(userResource);
  }

  return {
    id: discussion.id,
    title: attributes.title || 'Untitled Discussion',
    slug: attributes.slug,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    createdAt: attributes.createdAt,
    postCount: attributes.commentCount + 1, // Flarum's commentCount is replies, so +1 for the first post
    viewCount: attributes.viewCount || 0,
    tags: discussionTags,
    firstPost: firstPost, // May need separate fetching or ensure it's always included
    // Primary category could be the first tag or based on Flarum's primary tag concept if available
    category: discussionTags.length > 0 ? discussionTags[0] : undefined,
    lastPostedAt: attributes.lastPostedAt,
    lastPostedUser: lastPostedUser,
    participantCount: attributes.participantCount,
  };
}


export async function fetchCategories(): Promise<Category[]> {
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>('/tags?sort=position');

  if (!response || !response.data) {
    return [];
  }

  return response.data
    .filter(tag => !tag.attributes.isHidden && tag.attributes.position !== null)
    .map((tag: FlarumTag): Category => ({
      id: tag.id,
      name: tag.attributes.name,
      slug: tag.attributes.slug,
      description: tag.attributes.description,
      topicCount: tag.attributes.discussionCount,
      color: tag.attributes.color || undefined,
      icon: tag.attributes.icon || undefined,
      lastPostedAt: tag.attributes.lastPostedAt,
      // lastTopic requires more complex logic, often from included lastPostedDiscussion
      lastTopic: tag.attributes.lastPostedAt ? { title: `Last activity on ${new Date(tag.attributes.lastPostedAt).toLocaleDateString()}` } : undefined,
    }));
}

export async function fetchCategoryDetailsBySlug(slug: string): Promise<Category | null> {
  // Flarum typically uses /api/tags/{slug} for fetching a single tag by its slug.
  // However, some Flarum versions might only support /api/tags and then client-side filtering,
  // or /api/tags/{id}. Let's assume /api/tags/{slug} works.
  // If not, we might need to fetch all and filter, or use an ID if discoverable.
  // For Flarum, fetching a single tag by slug is done via /api/tags endpoint with a filter.
  // Or, if you know it's a primary tag, Flarum might have a specific endpoint structure,
  // but usually, it's /api/tags and you identify it from the list or by slug.
  // A common pattern is GET /api/tags?filter[slug]=<slug>
  // However, Flarum's core API for single tag is typically by ID: /api/tags/ID
  // But since we have slug, let's try to fetch it from the list or assume /api/tags/{slug} syntax (some extensions might add this)
  // A robust way: fetch all and filter by slug, or use /api/tags?filter[q]=slug:{slug} if supported
  // For simplicity and directness, let's try constructing a direct path, though this may need adjustment based on exact Flarum setup / extensions
  
  // Flarum's API usually refers to tags by ID. To get by slug, you'd typically list them and filter,
  // or use a filter like `/tags?filter[slug]=${slug}`.
  // Let's use the filter approach, as `/tags/${slug}` is not standard.
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(`/tags?filter[slug]=${slug}`);
  
  if (!response || !response.data || response.data.length === 0) {
    console.warn(`Category with slug "${slug}" not found.`);
    return null;
  }

  const tag = response.data[0]; // Assuming slug is unique

  return {
    id: tag.id,
    name: tag.attributes.name,
    slug: tag.attributes.slug,
    description: tag.attributes.description,
    topicCount: tag.attributes.discussionCount,
    discussionCount: tag.attributes.discussionCount, // Flarum uses discussionCount
    color: tag.attributes.color || undefined,
    icon: tag.attributes.icon || undefined,
    lastPostedAt: tag.attributes.lastPostedAt,
  };
}

export async function fetchDiscussionsByTag(tagSlug: string): Promise<Topic[]> {
  const endpoint = `/discussions?filter[tag]=${tagSlug}&include=user,firstPost,tags,lastPostedUser&sort=-lastPostedAt`;
  const response = await flarumFetch<FlarumApiListResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    return [];
  }
  return response.data.map(discussion => transformFlarumDiscussion(discussion, response.included));
}
