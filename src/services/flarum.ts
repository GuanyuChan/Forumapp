
'use server';
import type {
  Category,
  Topic,
  User,
  Post,
  FlarumTag,
  FlarumDiscussion,
  FlarumUser,
  FlarumPostType, // Renamed to avoid conflict with Post type
  FlarumIncludedResource,
  FlarumApiListResponse,
  FlarumApiSingleResponse,
  CategorySummary,
  FlarumResourceIdentifier,
} from '@/lib/types';

const FLARUM_API_URL = process.env.FLARUM_API_URL;
const FLARUM_API_KEY = process.env.FLARUM_API_KEY; // This should be a "Secret" or "Token" from Flarum Admin

const DEFAULT_AVATAR = 'https://placehold.co/100x100.png';

async function flarumFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!FLARUM_API_URL) {
    console.error('Flarum API URL is not configured in .env. FLARUM_API_URL:', FLARUM_API_URL);
    return null;
  }

  const url = `${FLARUM_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/vnd.api+json',
    ...(options?.headers),
  };

  if (FLARUM_API_KEY) {
    headers['Authorization'] = `Token ${FLARUM_API_KEY}`;
  } else {
    console.warn(`FLARUM_API_KEY is not set. Some operations might fail if authentication is required for ${url}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: headers,
      next: { revalidate: 600 } // Revalidate every 10 minutes
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch from Flarum API: ${response.status} ${response.statusText} for URL: ${url}. Body: ${errorBody}`);
      return null;
    }
    if (response.status === 204) { // No Content
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
    joinedAt: userResource.attributes.joinTime || new Date().toISOString(),
    // bio: userResource.attributes.bio || undefined, // Flarum user attributes might not have bio by default
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  let author: User | undefined;
  const authorData = postResource.relationships?.user?.data;
  if (authorData && !Array.isArray(authorData)) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }

  let plainContent = postResource.attributes.contentHtml || '';
  if (postResource.attributes.contentType === 'comment') {
      plainContent = plainContent.replace(/<[^>]*>?/gm, '');
  }

  return {
    id: postResource.id,
    content: plainContent,
    createdAt: postResource.attributes.createdAt,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    upvotes: (postResource.attributes as any).votes || 0, // Flarum might not have 'votes' directly, this is an assumption
    isFlagged: (postResource.attributes as any).isFlagged, // Flarum might not have 'isFlagged' directly
    flagReason: (postResource.attributes as any).flagReason, // Flarum might not have 'flagReason' directly
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


function transformFlarumDiscussion(discussion: FlarumDiscussion, included?: FlarumIncludedResource[]): Topic {
  const attributes = discussion.attributes;

  let author: User | undefined;
  const authorData = discussion.relationships?.user?.data;
   if (authorData && !Array.isArray(authorData)) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }


  let firstPost: Post | undefined;
  const firstPostData = discussion.relationships?.firstPost?.data;
  if (firstPostData && !Array.isArray(firstPostData)) {
    const postResource = findIncludedResource<FlarumPostType>(included, 'posts', firstPostData.id);
    firstPost = transformFlarumPost(postResource, included);
  }


  let discussionTags: CategorySummary[] = [];
  const tagsData = discussion.relationships?.tags?.data;
  if (Array.isArray(tagsData)) {
    tagsData.forEach(tagIdentifier => {
      if (tagIdentifier && tagIdentifier.id) {
        const tagResource = findIncludedResource<FlarumTag>(included, 'tags', tagIdentifier.id);
        const categorySummary = transformFlarumTagToCategorySummary(tagResource);
        if (categorySummary) {
          discussionTags.push(categorySummary);
        }
      }
    });
  }

  let lastPostedUser : User | undefined;
  const lastPostedUserData = discussion.relationships?.lastPostedUser?.data;
  if(lastPostedUserData && !Array.isArray(lastPostedUserData)){
    const userResource = findIncludedResource<FlarumUser>(included, 'users', lastPostedUserData.id);
    lastPostedUser = transformFlarumUser(userResource);
  }

  return {
    id: discussion.id,
    title: attributes.title || 'Untitled Discussion',
    slug: attributes.slug,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    createdAt: attributes.createdAt,
    postCount: attributes.commentCount + 1,
    viewCount: attributes.viewCount || 0,
    tags: discussionTags,
    firstPost: firstPost,
    category: discussionTags.find(tag => tag.id === (discussion.relationships?.tags?.data as FlarumResourceIdentifier[])?.[0]?.id) || discussionTags[0],
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
      postCount: (tag.attributes as any).commentCount, // Flarum tag itself doesn't directly have commentCount, discussions do.
      color: tag.attributes.color || undefined,
      icon: tag.attributes.icon || undefined,
      lastPostedAt: tag.attributes.lastPostedAt,
      lastTopic: tag.relationships?.lastPostedDiscussion?.data && !Array.isArray(tag.relationships.lastPostedDiscussion.data) ?
        {
            id: tag.relationships.lastPostedDiscussion.data.id,
            title: `Last topic in ${tag.attributes.name}`, // Placeholder, ideally fetch discussion title
        } : undefined,
      discussionCount: tag.attributes.discussionCount,
    }));
}

export async function fetchCategoryDetailsBySlug(slug: string): Promise<Category | null> {
  // Simplified include parameter. Try with just parent and lastPostedDiscussion.
  // If this still fails, next step would be to remove 'lastPostedDiscussion' or 'parent'.
  const endpoint = `/tags?filter[slug]=${slug}&include=parent,lastPostedDiscussion`;
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(endpoint);

  if (!response || !response.data || response.data.length === 0) {
    console.warn(`Category with slug "${slug}" not found.`);
    return null;
  }

  const tag = response.data[0];
  let lastTopicDetails;

  if (tag.relationships?.lastPostedDiscussion?.data && !Array.isArray(tag.relationships.lastPostedDiscussion.data)) {
      const discussionId = tag.relationships.lastPostedDiscussion.data.id;
      const discussionResource = findIncludedResource<FlarumDiscussion>(response.included, 'discussions', discussionId);
      if (discussionResource) {
          // Author details for last topic might not be available if 'lastPostedDiscussion.user' is not included or fails
          // We'll rely on what's directly available in discussionResource.
          let authorName;
          const authorData = discussionResource.relationships?.user?.data as FlarumResourceIdentifier;
          if(authorData){
             const authorResource = findIncludedResource<FlarumUser>(response.included, 'users', authorData.id);
             authorName = authorResource?.attributes.displayName || authorResource?.attributes.username;
          }

          lastTopicDetails = {
              id: discussionId,
              title: discussionResource.attributes.title,
              authorName: authorName, // This might be undefined if user not included
              createdAt: discussionResource.attributes.createdAt,
          };
      }
  }


  return {
    id: tag.id,
    name: tag.attributes.name,
    slug: tag.attributes.slug,
    description: tag.attributes.description,
    topicCount: tag.attributes.discussionCount,
    postCount: (tag.attributes as any).commentCount, // placeholder
    discussionCount: tag.attributes.discussionCount,
    color: tag.attributes.color || undefined,
    icon: tag.attributes.icon || undefined,
    lastPostedAt: tag.attributes.lastPostedAt,
    lastTopic: lastTopicDetails,
  };
}

export async function fetchDiscussionsByTag(tagSlug: string): Promise<Topic[]> {
  const endpoint = `/discussions?filter[tag]=${tagSlug}&include=user,firstPost,tags,lastPostedUser,firstPost.user&sort=-lastPostedAt`;
  const response = await flarumFetch<FlarumApiListResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    return [];
  }
  return response.data.map(discussion => transformFlarumDiscussion(discussion, response.included));
}

export async function fetchDiscussionDetails(discussionIdentifier: string): Promise<{ topic: Topic; posts: Post[] } | null> {
  // Include posts, user of posts, author of discussion, tags, firstPost and its author.
  const endpoint = `/discussions/${discussionIdentifier}?include=posts,posts.user,user,tags,firstPost,firstPost.user,posts.discussion`;
  const response = await flarumFetch<FlarumApiSingleResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    console.warn(`Discussion with identifier "${discussionIdentifier}" not found or error fetching.`);
    return null;
  }

  const topic = transformFlarumDiscussion(response.data, response.included);
  let posts: Post[] = [];

  const postIdentifiers = response.data.relationships?.posts?.data;
  if (Array.isArray(postIdentifiers)) {
    postIdentifiers.forEach(postIdObj => {
      if (postIdObj && postIdObj.id) {
        const postResource = findIncludedResource<FlarumPostType>(response.included, 'posts', postIdObj.id);
        const post = transformFlarumPost(postResource, response.included);
        if (post) {
          posts.push(post);
        }
      }
    });
  } else if (response.included) {
    // Fallback if relationships.posts.data is not an array (shouldn't happen for discussions)
    // or if posts are only in 'included' but not directly in relationships (less common for primary resource)
    posts = response.included
      .filter((inc): inc is FlarumPostType =>
        inc.type === 'posts' &&
        (inc.relationships?.discussion?.data as FlarumResourceIdentifier)?.id === discussionIdentifier
      )
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined);
  }

  // Ensure firstPost is part of the posts array and at the beginning, without duplicates
  if (topic.firstPost) {
    const firstPostExists = posts.some(p => p.id === topic.firstPost?.id);
    if (!firstPostExists) {
        posts.unshift(topic.firstPost);
    } else {
        // If first post is already in the posts list, ensure it's the first one
        posts = posts.filter(p => p.id !== topic.firstPost?.id);
        posts.unshift(topic.firstPost);
    }
  }

  // Sort posts by creation date
  posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { topic, posts };
}

export async function submitReplyToDiscussion(discussionId: string, content: string, currentUser: User): Promise<Post | null> {
    if (!FLARUM_API_URL || !FLARUM_API_KEY) {
        console.error('Flarum API URL or Key is not configured. Cannot submit reply.');
        return null;
    }

    const endpoint = `/posts`;
    const payload = {
        data: {
            type: 'posts',
            attributes: {
                content: content,
            },
            relationships: {
                discussion: {
                    data: {
                        type: 'discussions',
                        id: discussionId,
                    },
                },
                // Flarum usually infers the user from the API token if a user token is used.
                // If using a master key, you might need to specify user if API allows impersonation (less common for replies)
                // user: { data: { type: 'users', id: currentUser.id } } // This might be needed depending on Flarum setup and token type
            },
        },
    };

    const response = await flarumFetch<FlarumApiSingleResponse<FlarumPostType>>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (!response || !response.data) {
        console.error('Failed to submit reply to Flarum.');
        return null;
    }

    // The response from creating a post might not include all related data like user by default.
    // We transform what we get and explicitly set the author to currentUser.
    const newPost = transformFlarumPost(response.data, response.included);
    if (newPost) {
        // If Flarum doesn't return the author or returns a generic one, override with currentUser
        if (!newPost.author || newPost.author.id === 'unknown') {
            newPost.author = currentUser;
        }
        return newPost;
    }
    return null;
}
