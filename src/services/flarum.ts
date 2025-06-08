
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

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

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
    const response = await fetch(url, {
      ...options,
      headers: headers,
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

function transformFlarumUser(userResource?: FlarumUser): User {
  if (!userResource?.attributes || !userResource.id) {
    return {
      id: 'unknown',
      username: '未知用户',
      avatarUrl: DEFAULT_AVATAR_PLACEHOLDER,
      joinedAt: new Date().toISOString(),
      bio: '',
    };
  }
  return {
    id: userResource.id,
    username: userResource.attributes.displayName || userResource.attributes.username || '未知用户',
    avatarUrl: userResource.attributes.avatarUrl || DEFAULT_AVATAR_PLACEHOLDER,
    joinedAt: userResource.attributes.joinTime || new Date().toISOString(),
    bio: (userResource.attributes as any).bio || '',
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  let author: User;
  const authorData = postResource.relationships?.user?.data as FlarumResourceIdentifier;
  if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  } else {
    author = transformFlarumUser(); // Default unknown user
  }

  let plainContent = postResource.attributes.contentHtml || '';
  if (postResource.attributes.contentType === 'comment' || postResource.attributes.contentType === 'discussionStickied') {
      plainContent = plainContent.replace(/<[^>]*>?/gm, ''); // Basic HTML stripping
  }


  return {
    id: postResource.id,
    content: plainContent,
    createdAt: postResource.attributes.createdAt,
    author: author,
    upvotes: (postResource.attributes as any).votes || (postResource.relationships?.likes?.data as FlarumResourceIdentifier[])?.length || 0,
    isFlagged: (postResource.attributes as any).isFlagged,
    flagReason: (postResource.attributes as any).flagReason,
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

  let author: User;
  const authorData = discussion.relationships?.user?.data as FlarumResourceIdentifier;
   if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  } else {
    author = transformFlarumUser();
  }

  let firstPost: Post | undefined;
  const firstPostData = discussion.relationships?.firstPost?.data as FlarumResourceIdentifier;
  if (firstPostData && firstPostData.id) {
    const postResource = findIncludedResource<FlarumPostType>(included, 'posts', firstPostData.id);
    firstPost = transformFlarumPost(postResource, included);
    if (firstPost && firstPost.author.id === 'unknown' && author.id !== 'unknown') {
        const firstPostAuthorResource = findIncludedResource<FlarumUser>(included, 'users', authorData?.id);
        if (firstPostAuthorResource) {
            firstPost.author = transformFlarumUser(firstPostAuthorResource);
        } else {
            firstPost.author = author;
        }
    } else if (firstPost && firstPost.author.id === 'unknown') {
        firstPost.author = transformFlarumUser();
    }
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

  let lastPostedUser : User;
  const lastPostedUserData = discussion.relationships?.lastPostedUser?.data as FlarumResourceIdentifier;
  if(lastPostedUserData && lastPostedUserData.id){
    const userResource = findIncludedResource<FlarumUser>(included, 'users', lastPostedUserData.id);
    lastPostedUser = transformFlarumUser(userResource);
  } else {
    lastPostedUser = transformFlarumUser();
  }

  let primaryCategory: CategorySummary | undefined = undefined;
  if (discussionTags.length > 0) {
    const potentialPrimaryTagResources = discussionTags
      .map(summary => findIncludedResource<FlarumTag>(included, 'tags', summary.id))
      .filter(tag => tag && !tag.attributes.isChild && tag.attributes.position !== null)
      // Sort by position, ascending (lower position = more primary)
      .sort((a, b) => (a!.attributes.position!) - (b!.attributes.position!));

    if (potentialPrimaryTagResources.length > 0 && potentialPrimaryTagResources[0]) {
      primaryCategory = transformFlarumTagToCategorySummary(potentialPrimaryTagResources[0]);
    } else {
      // Fallback 1: first non-child tag (no specific position or all positions are null)
      const firstNonChildTagResource = discussionTags
        .map(summary => findIncludedResource<FlarumTag>(included, 'tags', summary.id))
        .find(tag => tag && !tag.attributes.isChild);
      if (firstNonChildTagResource) {
        primaryCategory = transformFlarumTagToCategorySummary(firstNonChildTagResource);
      } else if (discussionTags.length > 0) {
        // Fallback 2: very first tag associated if all else fails (e.g. all are child tags)
        const firstTagResource = findIncludedResource<FlarumTag>(included, 'tags', discussionTags[0].id);
        if (firstTagResource) {
             primaryCategory = transformFlarumTagToCategorySummary(firstTagResource);
        }
      }
    }
  }


  return {
    id: discussion.id,
    title: attributes.title || '无标题讨论',
    slug: attributes.slug,
    author: author,
    createdAt: attributes.createdAt,
    postCount: attributes.commentCount + 1,
    viewCount: attributes.viewCount || 0,
    tags: discussionTags, // All tags associated with the discussion
    firstPost: firstPost,
    category: primaryCategory, // The determined primary category
    lastPostedAt: attributes.lastPostedAt,
    lastPostedUser: lastPostedUser,
    participantCount: attributes.participantCount,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>('/tags?include=lastPostedDiscussion,lastPostedDiscussion.user&sort=position');

  if (!response || !response.data) {
    return [];
  }

  return response.data
    .filter(tag => !tag.attributes.isHidden && tag.attributes.position !== null && !tag.attributes.isChild) 
    .map((tag: FlarumTag): Category => {
      let lastTopic;
      const lastPostedDiscussionData = tag.relationships?.lastPostedDiscussion?.data as FlarumResourceIdentifier;

      if (lastPostedDiscussionData && lastPostedDiscussionData.id) {
        const discussionId = lastPostedDiscussionData.id;
        const includedDiscussion = findIncludedResource<FlarumDiscussion>(response.included, 'discussions', discussionId);

        if (includedDiscussion) {
            let authorName = '未知用户'; 
            let userToDisplay: FlarumUser | undefined;

            // Try to get the user who made the last post in that discussion
            // This data might not be available if 'lastPostedDiscussion.lastPostedUser' was the problematic include
            const lastPosterRelationship = includedDiscussion.relationships?.lastPostedUser?.data as FlarumResourceIdentifier;
            if (lastPosterRelationship && lastPosterRelationship.id) {
                userToDisplay = findIncludedResource<FlarumUser>(response.included, 'users', lastPosterRelationship.id);
            }
            
            // If last poster isn't found (or their data wasn't included), fallback to the original author of the discussion
            if (!userToDisplay) {
                const originalAuthorRelationship = includedDiscussion.relationships?.user?.data as FlarumResourceIdentifier;
                if (originalAuthorRelationship && originalAuthorRelationship.id) {
                    userToDisplay = findIncludedResource<FlarumUser>(response.included, 'users', originalAuthorRelationship.id);
                }
            }

            if (userToDisplay) {
                authorName = transformFlarumUser(userToDisplay).username;
            }

            lastTopic = {
                id: discussionId,
                title: includedDiscussion.attributes.title || '无标题讨论',
                authorName: authorName,
                createdAt: includedDiscussion.attributes.createdAt,
            };
        } else {
             lastTopic = {
                id: discussionId, 
                title: `分类 ${tag.attributes.name} 中的最新主题`, 
                authorName: '未知用户',
            };
        }
      }

      return {
        id: tag.id,
        name: tag.attributes.name,
        slug: tag.attributes.slug,
        description: tag.attributes.description,
        topicCount: tag.attributes.discussionCount,
        postCount: (tag.attributes as any).commentCount, 
        color: tag.attributes.color || undefined,
        icon: tag.attributes.icon || undefined,
        lastPostedAt: tag.attributes.lastPostedAt,
        lastTopic: lastTopic,
        discussionCount: tag.attributes.discussionCount,
      };
    });
}

export async function fetchCategoryDetailsBySlug(slug: string): Promise<Category | null> {
  const endpoint = `/tags?filter[slug]=${slug}`; 
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(endpoint);

  if (!response || !response.data || response.data.length === 0) {
    console.warn(`Category (tag) with slug "${slug}" not found in Flarum API response or API error prevented fetch.`);
    return null;
  }

  const tag = response.data[0]; 
  let lastTopicDetails;

  const lastPostedDiscussionData = tag.relationships?.lastPostedDiscussion?.data as FlarumResourceIdentifier;
  if (lastPostedDiscussionData && lastPostedDiscussionData.id) {
      const discussionId = lastPostedDiscussionData.id;
      lastTopicDetails = {
          id: discussionId,
          title: "查看最新主题", 
      };
  }

  return {
    id: tag.id,
    name: tag.attributes.name,
    slug: tag.attributes.slug,
    description: tag.attributes.description,
    topicCount: tag.attributes.discussionCount,
    discussionCount: tag.attributes.discussionCount,
    color: tag.attributes.color || undefined,
    icon: tag.attributes.icon || undefined,
    lastPostedAt: tag.attributes.lastPostedAt,
    lastTopic: lastTopicDetails,
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


export async function fetchDiscussionDetails(discussionIdentifier: string): Promise<{ topic: Topic; posts: Post[] } | null> {
  // Simplified include from previous step: user,tags,posts,posts.user
  const endpoint = `/discussions/${discussionIdentifier}?include=user,tags,posts,posts.user`;
  const response = await flarumFetch<FlarumApiSingleResponse<FlarumDiscussion>>(endpoint);

  if (!response || !response.data) {
    console.warn(`Discussion with identifier "${discussionIdentifier}" not found or error fetching from API.`);
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
    // Fallback if posts are not directly in relationships but present in included data
    posts = response.included
      .filter((inc): inc is FlarumPostType =>
        inc.type === 'posts' &&
        (inc.relationships?.discussion?.data as FlarumResourceIdentifier)?.id === discussionIdentifier
      )
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined);
  }
  
  // Ensure firstPost is at the beginning of the posts array if it exists and is part of the posts
  if (topic.firstPost) {
    const firstPostIndex = posts.findIndex(p => p.id === topic.firstPost?.id);
    if (firstPostIndex > -1) {
      const [fp] = posts.splice(firstPostIndex, 1);
      posts.unshift(fp);
    } else {
      // If not found in the fetched posts list (shouldn't happen with correct includes), add it
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
    if (currentUser.id === 'unknown') {
        console.error('Cannot submit reply as an unknown user.');
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
                 user: { data: { type: 'users', id: currentUser.id } } 
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
    
    const newPost = transformFlarumPost(response.data, response.included);
    if (newPost) {
        // Ensure the author of the new post is the current user, as API might return a generic user initially
        if (newPost.author.id === 'unknown' || newPost.author.id !== currentUser.id) {
            newPost.author = currentUser;
        }
        return newPost;
    }
    return null;
}

