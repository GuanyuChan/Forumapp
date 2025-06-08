
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
const FLARUM_API_KEY = process.env.FLARUM_API_KEY;

const DEFAULT_AVATAR = 'https://placehold.co/100x100.png';

async function flarumFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!FLARUM_API_URL) {
    console.error('Flarum API URL is not configured. FLARUM_API_URL:', FLARUM_API_URL);
    return null;
  }

  const url = `${FLARUM_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    ...(options?.headers),
  };

  if (FLARUM_API_KEY) {
    headers['Authorization'] = `Token ${FLARUM_API_KEY}`;
  } else {
    console.warn(`FLARUM_API_KEY is not set. Some operations might fail if authentication is required for ${url}`);
  }

  try {
    // Note: Default cache behavior for fetch in Next.js Route Handlers and Server Components is 'force-cache'.
    // For data that changes often, consider { cache: 'no-store' } or revalidation strategies.
    const response = await fetch(url, {
      ...options,
      headers: headers,
      // Example: cache strategy for data that changes
      // next: { revalidate: 300 } // Revalidate every 5 minutes
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
    // bio and other fields can be added if present in FlarumUserAttributes and needed
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  let author: User | undefined;
  const authorData = postResource.relationships?.user?.data as FlarumResourceIdentifier;
  if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }

  // Basic HTML stripping. For more robust sanitization, a library might be needed if complex HTML is expected.
  let plainContent = postResource.attributes.contentHtml || '';
  if (postResource.attributes.contentType === 'comment' || postResource.attributes.contentType === 'discussionStickied') { // Handle different content types
      plainContent = plainContent.replace(/<[^>]*>?/gm, ''); // Basic HTML stripping
  }


  return {
    id: postResource.id,
    content: plainContent, // Or use contentHtml if you plan to render HTML safely
    createdAt: postResource.attributes.createdAt,
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    upvotes: (postResource.attributes as any).votes || (postResource.relationships?.likes?.data as FlarumResourceIdentifier[])?.length || 0, // Attempt to get likes if available
    isFlagged: (postResource.attributes as any).isFlagged, // Custom attribute, ensure it exists in your Flarum setup
    flagReason: (postResource.attributes as any).flagReason, // Custom attribute
    // replies are typically handled by fetching them as separate post items in a discussion
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
  const authorData = discussion.relationships?.user?.data as FlarumResourceIdentifier;
   if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  }

  let firstPost: Post | undefined;
  const firstPostData = discussion.relationships?.firstPost?.data as FlarumResourceIdentifier;
  if (firstPostData && firstPostData.id) {
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
  const lastPostedUserData = discussion.relationships?.lastPostedUser?.data as FlarumResourceIdentifier;
  if(lastPostedUserData && lastPostedUserData.id){
    const userResource = findIncludedResource<FlarumUser>(included, 'users', lastPostedUserData.id);
    lastPostedUser = transformFlarumUser(userResource);
  }

  // Determine primary category (often the first non-child tag or based on Flarum's logic)
  let primaryCategory = discussionTags.find(tag => {
    const flarumTag = findIncludedResource<FlarumTag>(included, 'tags', tag.id);
    return flarumTag && !flarumTag.attributes.isChild; // Simplistic: picks first non-child tag
  }) || discussionTags[0]; // Fallback to the first tag if no clear primary


  return {
    id: discussion.id,
    title: attributes.title || 'Untitled Discussion',
    slug: attributes.slug, // Ensure slug is part of FlarumDiscussionAttributes if used for linking
    author: author || { id: 'unknown', username: 'Unknown User', avatarUrl: DEFAULT_AVATAR, joinedAt: new Date().toISOString() },
    createdAt: attributes.createdAt,
    postCount: attributes.commentCount + 1, // Flarum's commentCount is replies, so +1 for the first post
    viewCount: attributes.viewCount || 0,
    tags: discussionTags, // All tags
    firstPost: firstPost, // The first post object
    category: primaryCategory, // Primary category derived from tags
    lastPostedAt: attributes.lastPostedAt,
    lastPostedUser: lastPostedUser,
    participantCount: attributes.participantCount,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  // Removed .user from lastPostedDiscussion.user include
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>('/tags?include=lastPostedDiscussion&sort=position');

  if (!response || !response.data) {
    return [];
  }

  return response.data
    .filter(tag => !tag.attributes.isHidden && tag.attributes.position !== null && !tag.attributes.isChild) // Filter for primary, visible tags
    .map((tag: FlarumTag): Category => {
      let lastTopic;
      const lastPostedDiscussionData = tag.relationships?.lastPostedDiscussion?.data as FlarumResourceIdentifier;

      if (lastPostedDiscussionData && lastPostedDiscussionData.id) {
        const discussionId = lastPostedDiscussionData.id;
        // Try to find the discussion in the 'included' resources
        const includedDiscussion = findIncludedResource<FlarumDiscussion>(response.included, 'discussions', discussionId);

        if (includedDiscussion) {
            let authorName;
            // Try to get last poster of the discussion, fallback to discussion author
            const lastDiscussionPosterData = includedDiscussion.relationships?.lastPostedUser?.data as FlarumResourceIdentifier || includedDiscussion.relationships?.user?.data as FlarumResourceIdentifier;

            if(lastDiscussionPosterData && lastDiscussionPosterData.id) {
                const authorResource = findIncludedResource<FlarumUser>(response.included, 'users', lastDiscussionPosterData.id);
                authorName = authorResource?.attributes.displayName || authorResource?.attributes.username;
            }

            lastTopic = {
                id: discussionId,
                title: includedDiscussion.attributes.title || 'Untitled Discussion',
                authorName: authorName,
                createdAt: includedDiscussion.attributes.createdAt,
            };
        } else {
             // Fallback if discussion details aren't included (less likely if 'include' worked for the discussion itself)
             lastTopic = {
                id: discussionId, // Still useful to have the ID
                title: `Last topic in ${tag.attributes.name}`, // Fallback title
            };
        }
      }

      return {
        id: tag.id,
        name: tag.attributes.name,
        slug: tag.attributes.slug,
        description: tag.attributes.description,
        topicCount: tag.attributes.discussionCount,
        postCount: (tag.attributes as any).commentCount, // Flarum tag doesn't usually have commentCount directly for posts, discussionCount is topics
        color: tag.attributes.color || undefined,
        icon: tag.attributes.icon || undefined,
        lastPostedAt: tag.attributes.lastPostedAt,
        lastTopic: lastTopic,
        discussionCount: tag.attributes.discussionCount, // Explicitly from Flarum tag attributes
      };
    });
}

export async function fetchCategoryDetailsBySlug(slug: string): Promise<Category | null> {
  // Removed include parameter entirely to avoid "invalid_parameter" issues.
  // This means lastTopic details will be minimal or potentially unavailable from this call alone.
  const endpoint = `/tags?filter[slug]=${slug}`;
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(endpoint);

  if (!response || !response.data || response.data.length === 0) {
    console.warn(`Category (tag) with slug "${slug}" not found in Flarum API response or API error prevented fetch.`);
    return null;
  }

  const tag = response.data[0]; // Assuming slug is unique
  let lastTopicDetails;

  // With 'include' removed, response.included will be undefined or empty.
  // So, we can't enrich lastTopicDetails here directly.
  // We rely on the relationship data if present.
  const lastPostedDiscussionData = tag.relationships?.lastPostedDiscussion?.data as FlarumResourceIdentifier;
  if (lastPostedDiscussionData && lastPostedDiscussionData.id) {
      const discussionId = lastPostedDiscussionData.id;
      // Since 'included' is likely empty, we can only provide basic info
      lastTopicDetails = {
          id: discussionId,
          title: "View Last Topic", // Generic title as details aren't fetched here
          // authorName and createdAt would not be available without the 'include'
      };
  }

  return {
    id: tag.id,
    name: tag.attributes.name,
    slug: tag.attributes.slug,
    description: tag.attributes.description,
    topicCount: tag.attributes.discussionCount,
    discussionCount: tag.attributes.discussionCount, // Explicitly from Flarum tag attributes
    color: tag.attributes.color || undefined,
    icon: tag.attributes.icon || undefined,
    lastPostedAt: tag.attributes.lastPostedAt,
    lastTopic: lastTopicDetails, // This will be less detailed
  };
}


export async function fetchDiscussionsByTag(tagSlug: string): Promise<Topic[]> {
  // Simplified include: removed firstPost.user
  const endpoint = `/discussions?filter[tag]=${tagSlug}&include=user,firstPost,tags,lastPostedUser&sort=-lastPostedAt`;
  const response = await flarumFetch<FlarumApiListResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    return [];
  }
  return response.data.map(discussion => transformFlarumDiscussion(discussion, response.included));
}


export async function fetchDiscussionDetails(discussionIdentifier: string): Promise<{ topic: Topic; posts: Post[] } | null> {
  // Simplified include parameter significantly
  const endpoint = `/discussions/${discussionIdentifier}?include=posts,user,tags,firstPost`;
  const response = await flarumFetch<FlarumApiSingleResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    console.warn(`Discussion with identifier "${discussionIdentifier}" not found or error fetching from API.`);
    return null;
  }

  const topic = transformFlarumDiscussion(response.data, response.included);
  let posts: Post[] = [];

  // Attempt to extract posts from relationships or included data
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
    // Fallback if relationships.posts.data is not an array but posts are in included
    // This can happen if Flarum decides to include posts related to the discussion directly.
    posts = response.included
      .filter((inc): inc is FlarumPostType =>
        inc.type === 'posts' &&
        (inc.relationships?.discussion?.data as FlarumResourceIdentifier)?.id === discussionIdentifier
      )
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined); // Ensure no undefined posts
  }
  
  // Ensure firstPost is correctly handled and at the beginning of the posts array
  if (topic.firstPost) {
    const firstPostIndex = posts.findIndex(p => p.id === topic.firstPost?.id);
    if (firstPostIndex > -1) {
      // Remove from current position and add to start
      const [fp] = posts.splice(firstPostIndex, 1);
      posts.unshift(fp);
    } else {
      // If not found in the 'posts' relationship array but was included via 'firstPost' include
      posts.unshift(topic.firstPost);
    }
  }


  // Sort posts by creation date to ensure correct order, especially if firstPost was re-added
  posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { topic, posts };
}


// Server Action to submit a reply
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
                 user: { data: { type: 'users', id: currentUser.id } } // Assumes currentUser.id is Flarum user ID
            },
        },
    };

    // Note: No explicit revalidation here, Server Action calling this should handle revalidatePath
    const response = await flarumFetch<FlarumApiSingleResponse<FlarumPostType>>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (!response || !response.data) {
        console.error('Failed to submit reply to Flarum.');
        return null;
    }
    
    // The response from creating a post might not include the user, so we enrich it.
    const newPost = transformFlarumPost(response.data, response.included);
    if (newPost) {
        // If the transformed post's author is unknown or doesn't match currentUser, assign currentUser.
        // This is because Flarum's response might not include the user data for the new post immediately.
        if (!newPost.author || newPost.author.id === 'unknown' || newPost.author.id !== currentUser.id) {
            newPost.author = currentUser;
        }
        return newPost;
    }
    return null;
}
