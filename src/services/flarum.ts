
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
  // Note: FLARUM_API_KEY check is removed here as not all read operations might need it,
  // but it will be added to headers if present. For write operations, it's essential.

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
        return null; // Or an appropriate representation for no content
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
    bio: userResource.attributes.bio || undefined, // Assuming bio might come from Flarum user attributes
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  let author: User | undefined;
  const authorData = postResource.relationships?.user?.data;
  if (authorData && !Array.isArray(authorData)) { // Ensure it's a single resource identifier
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }


  // Basic HTML stripping for content preview - can be improved
  let plainContent = postResource.attributes.contentHtml || '';
  if (postResource.attributes.contentType === 'comment') { // Flarum's default post type
      plainContent = plainContent.replace(/<[^>]*>?/gm, ''); // Basic strip
  }


  return {
    id: postResource.id,
    content: plainContent, // Or contentHtml if you plan to render HTML safely
    createdAt: postResource.attributes.createdAt,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    upvotes: postResource.attributes.votes || 0, // Assuming 'votes' attribute exists or similar
    isFlagged: postResource.attributes.isFlagged, // Assuming isFlagged attribute might exist
    flagReason: postResource.attributes.flagReason, // Assuming flagReason attribute might exist
  };
}


function transformFlarumTagToCategorySummary(tagResource?: FlarumTag): CategorySummary | undefined {
  if (!tagResource?.attributes) return undefined;
  return {
    id: tagResource.id,
    name: tagResource.attributes.name,
    slug: tagResource.attributes.slug,
    color: tagResource.attributes.color || undefined,
    icon: tag.attributes.icon || undefined,
  };
}

// NOT EXPORTED - Local helper function
function transformFlarumDiscussion(discussion: FlarumDiscussion, included?: FlarumIncludedResource[]): Topic {
  const attributes = discussion.attributes;
  
  let author: User | undefined;
  const authorData = discussion.relationships?.user?.data;
   if (authorData && !Array.isArray(authorData)) { // Ensure it's a single resource identifier
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }


  let firstPost: Post | undefined;
  const firstPostData = discussion.relationships?.firstPost?.data;
  if (firstPostData && !Array.isArray(firstPostData)) { // Ensure it's a single resource identifier
    const postResource = findIncludedResource<FlarumPostType>(included, 'posts', firstPostData.id);
    firstPost = transformFlarumPost(postResource, included);
  }


  let discussionTags: CategorySummary[] = [];
  const tagsData = discussion.relationships?.tags?.data;
  if (Array.isArray(tagsData)) {
    tagsData.forEach(tagIdentifier => {
      if (tagIdentifier && tagIdentifier.id) { // Check if tagIdentifier is well-formed
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
    category: discussionTags.find(tag => tag.id === discussion.relationships?.tags?.data?.[0]?.id) || discussionTags[0], // Simplified primary category logic
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
      postCount: tag.attributes.commentCount, // Flarum tags can have commentCount
      color: tag.attributes.color || undefined,
      icon: tag.attributes.icon || undefined,
      lastPostedAt: tag.attributes.lastPostedAt,
      // Attempt to get lastPostedDiscussion details if available in Flarum's API for tags (might need include)
      lastTopic: tag.relationships?.lastPostedDiscussion?.data && !Array.isArray(tag.relationships.lastPostedDiscussion.data) ? 
        { 
            id: tag.relationships.lastPostedDiscussion.data.id,
            // Title and author might need to be fetched/included separately or use placeholder
            title: `Last topic in ${tag.attributes.name}`, 
        } : undefined,
      discussionCount: tag.attributes.discussionCount, 
    }));
}

export async function fetchCategoryDetailsBySlug(slug: string): Promise<Category | null> {
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(`/tags?filter[slug]=${slug}&include=parent,lastPostedDiscussion.user`);
  
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
          const authorId = discussionResource.relationships?.user?.data?.id;
          let authorName;
          if (authorId) {
              const authorResource = findIncludedResource<FlarumUser>(response.included, 'users', authorId);
              authorName = authorResource?.attributes.displayName || authorResource?.attributes.username;
          }
          lastTopicDetails = {
              id: discussionId,
              title: discussionResource.attributes.title,
              authorName: authorName,
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
    postCount: tag.attributes.commentCount,
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

// --- Functions for fetching single discussion and posts ---
export async function fetchDiscussionDetails(discussionIdentifier: string): Promise<{ topic: Topic; posts: Post[] } | null> {
  // discussionIdentifier could be an ID or a slug. Flarum API typically uses ID for direct fetch.
  // If it's a slug, you might need to query /discussions?filter[slug]=<slug>
  // For simplicity, assuming ID is passed or slug resolution is handled before this.
  // Example: /api/discussions/{id}?include=posts,posts.user,user,tags,firstPost.user
  const endpoint = `/discussions/${discussionIdentifier}?include=posts,posts.user,user,tags,firstPost,firstPost.user,posts.discussion`;
  const response = await flarumFetch<FlarumApiSingleResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    console.warn(`Discussion with identifier "${discussionIdentifier}" not found or error fetching.`);
    return null;
  }

  const topic = transformFlarumDiscussion(response.data, response.included);
  let posts: Post[] = [];

  // Extract posts from relationships or included data
  const postIds = response.data.relationships?.posts?.data;
  if (Array.isArray(postIds)) {
    postIds.forEach(postIdObj => {
      const postResource = findIncludedResource<FlarumPostType>(response.included, 'posts', postIdObj.id);
      const post = transformFlarumPost(postResource, response.included);
      if (post) {
        posts.push(post);
      }
    });
  } else if (response.included) { // Fallback if posts are not in relationships but in included
    posts = response.included
      .filter((inc): inc is FlarumPostType => inc.type === 'posts' && inc.relationships?.discussion?.data?.id === discussionIdentifier)
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined);
  }
  
  // Ensure firstPost is at the beginning if not already handled by posts extraction logic that way
  // Flarum API usually includes the firstPost separately and also within the posts relationship.
  // We need to be careful not to duplicate it.
  // A simple way is to ensure the 'posts' array doesn't contain the firstPost if 'topic.firstPost' is already set.
  if (topic.firstPost) {
    posts = posts.filter(p => p.id !== topic.firstPost?.id); // Remove if already captured as separate firstPost
    posts.unshift(topic.firstPost); // Add it to the beginning
  }
  
  // Sort posts by creation time - Flarum might already do this, but good to ensure.
  posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());


  return { topic, posts };
}

// --- Function for submitting a reply ---
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
                // Flarum associates the post with the authenticated user via API key
                // If your API key has user impersonation capabilities or is tied to a user,
                // Flarum handles associating the post with that user.
                // Otherwise, if you need to specify the user and the key allows it:
                /*
                user: {
                    data: {
                        type: 'users',
                        id: currentUser.id // This assumes currentUser.id is the Flarum user ID
                    }
                }
                */
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

    // The response from Flarum might not include the user relationship for the new post by default.
    // We'll augment it with the currentUser passed in.
    const newPost = transformFlarumPost(response.data, response.included); // Pass included if any
    if (newPost) {
        newPost.author = currentUser; // Ensure author is set correctly from the current session/user
        return newPost;
    }
    return null;
}
