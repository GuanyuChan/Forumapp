
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
  if (!userResource?.attributes || !userResource.id) { // Ensure ID is also present
    return {
      id: 'unknown',
      username: 'Unknown User',
      avatarUrl: DEFAULT_AVATAR,
      joinedAt: new Date().toISOString(),
      bio: '',
    };
  }
  return {
    id: userResource.id,
    username: userResource.attributes.displayName || userResource.attributes.username || 'Unknown User',
    avatarUrl: userResource.attributes.avatarUrl || DEFAULT_AVATAR,
    joinedAt: userResource.attributes.joinTime || new Date().toISOString(),
    bio: (userResource.attributes as any).bio || '',
  };
}

function transformFlarumPost(postResource?: FlarumPostType, included?: FlarumIncludedResource[]): Post | undefined {
  if (!postResource?.attributes) return undefined;

  let author: User; // Changed from User | undefined
  const authorData = postResource.relationships?.user?.data as FlarumResourceIdentifier;
  if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource); // transformFlarumUser now always returns a User
  } else {
    author = transformFlarumUser(); // Get default unknown user
  }

  let plainContent = postResource.attributes.contentHtml || '';
  if (postResource.attributes.contentType === 'comment' || postResource.attributes.contentType === 'discussionStickied') {
      plainContent = plainContent.replace(/<[^>]*>?/gm, '');
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

  let author: User; // Changed from User | undefined
  const authorData = discussion.relationships?.user?.data as FlarumResourceIdentifier;
   if (authorData && authorData.id) {
    const authorResource = findIncludedResource<FlarumUser>(included, 'users', authorData.id);
    author = transformFlarumUser(authorResource);
  } else {
    author = transformFlarumUser(); // Get default unknown user
  }

  let firstPost: Post | undefined;
  const firstPostData = discussion.relationships?.firstPost?.data as FlarumResourceIdentifier;
  if (firstPostData && firstPostData.id) {
    const postResource = findIncludedResource<FlarumPostType>(included, 'posts', firstPostData.id);
    firstPost = transformFlarumPost(postResource, included);
    // Ensure firstPost's author is also robustly handled if it wasn't fully included
    if (firstPost && firstPost.author.id === 'unknown' && author.id !== 'unknown') {
        // If discussion author is known but first post author isn't, assume discussion author posted first
        // This is a heuristic. A more robust way is to ensure firstPost.user is always properly included by Flarum if possible.
        const firstPostAuthorResource = findIncludedResource<FlarumUser>(included, 'users', authorData?.id);
        if (firstPostAuthorResource) {
            firstPost.author = transformFlarumUser(firstPostAuthorResource);
        } else {
            firstPost.author = author; // Fallback to discussion author
        }
    } else if (firstPost && firstPost.author.id === 'unknown') {
        firstPost.author = transformFlarumUser(); // Ensure it's the default unknown user object
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
    lastPostedUser = transformFlarumUser(); // Default unknown user
  }

  let primaryCategory = discussionTags.find(tag => {
    const flarumTag = findIncludedResource<FlarumTag>(included, 'tags', tag.id);
    return flarumTag && !flarumTag.attributes.isChild && flarumTag.attributes.position !== null; // Prioritize positioned, non-child tags
  }) || discussionTags.find(tag => { // Fallback to any non-child tag
    const flarumTag = findIncludedResource<FlarumTag>(included, 'tags', tag.id);
    return flarumTag && !flarumTag.attributes.isChild;
  }) || discussionTags[0]; // Ultimate fallback to the first tag


  return {
    id: discussion.id,
    title: attributes.title || 'Untitled Discussion',
    slug: attributes.slug,
    author: author,
    createdAt: attributes.createdAt,
    postCount: attributes.commentCount + 1,
    viewCount: attributes.viewCount || 0,
    tags: discussionTags,
    firstPost: firstPost,
    category: primaryCategory,
    lastPostedAt: attributes.lastPostedAt,
    lastPostedUser: lastPostedUser,
    participantCount: attributes.participantCount,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>('/tags?include=lastPostedDiscussion&sort=position');

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
            let authorName = 'Unknown User'; // Default
            const lastDiscussionPosterData = includedDiscussion.relationships?.lastPostedUser?.data as FlarumResourceIdentifier || includedDiscussion.relationships?.user?.data as FlarumResourceIdentifier;

            if(lastDiscussionPosterData && lastDiscussionPosterData.id) {
                const authorResource = findIncludedResource<FlarumUser>(response.included, 'users', lastDiscussionPosterData.id);
                if (authorResource) {
                    const transformedAuthor = transformFlarumUser(authorResource);
                    authorName = transformedAuthor.username;
                }
            }

            lastTopic = {
                id: discussionId,
                title: includedDiscussion.attributes.title || 'Untitled Discussion',
                authorName: authorName,
                createdAt: includedDiscussion.attributes.createdAt,
            };
        } else {
             lastTopic = {
                id: discussionId, 
                title: `Last topic in ${tag.attributes.name}`,
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
          title: "View Last Topic", 
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
  const endpoint = `/discussions/${discussionIdentifier}?include=posts,user,tags,firstPost,posts.user`; // Added posts.user
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
    posts = response.included
      .filter((inc): inc is FlarumPostType =>
        inc.type === 'posts' &&
        (inc.relationships?.discussion?.data as FlarumResourceIdentifier)?.id === discussionIdentifier
      )
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined);
  }
  
  if (topic.firstPost) {
    const firstPostIndex = posts.findIndex(p => p.id === topic.firstPost?.id);
    if (firstPostIndex > -1) {
      const [fp] = posts.splice(firstPostIndex, 1);
      posts.unshift(fp);
    } else {
      posts.unshift(topic.firstPost);
    }
  }

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
        if (newPost.author.id === 'unknown' || newPost.author.id !== currentUser.id) {
            newPost.author = currentUser;
        }
        return newPost;
    }
    return null;
}
