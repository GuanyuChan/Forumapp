
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
      username: 'Unknown User',
      avatarUrl: DEFAULT_AVATAR_PLACEHOLDER,
      joinedAt: new Date().toISOString(),
      bio: '',
    };
  }
  return {
    id: userResource.id,
    username: userResource.attributes.displayName || userResource.attributes.username || 'Unknown User',
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
    title: attributes.title || 'Untitled Discussion',
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
            let authorName = 'Unknown User';
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
                title: `Last topic in ${tag.attributes.name}`, // Placeholder if discussion details not found
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
  const endpoint = `/tags?filter[slug]=${slug}`; // Removed include for simplicity, can be added back if needed
  const response = await flarumFetch<FlarumApiListResponse<FlarumTag>>(endpoint);

  if (!response || !response.data || response.data.length === 0) {
    console.warn(`Category (tag) with slug "${slug}" not found in Flarum API response or API error prevented fetch.`);
    return null;
  }

  const tag = response.data[0]; 
  let lastTopicDetails;

  // Note: lastPostedDiscussion might not be included here if not requested in the endpoint.
  // The current endpoint does not include it. If you need it, add `&include=lastPostedDiscussion`
  const lastPostedDiscussionData = tag.relationships?.lastPostedDiscussion?.data as FlarumResourceIdentifier;
  if (lastPostedDiscussionData && lastPostedDiscussionData.id) {
      const discussionId = lastPostedDiscussionData.id;
      // To get title/author, you'd need to ensure lastPostedDiscussion and its user are included,
      // or make another fetch. For now, this is simplified.
      lastTopicDetails = {
          id: discussionId,
          title: "View Last Topic", // Generic title as details are not fetched here
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
  // Ensure posts.user is included to get authors for posts
  const endpoint = `/discussions/${discussionIdentifier}?include=posts,posts.user,user,tags,firstPost,firstPost.user`;
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
    // Fallback if relationships.posts.data is not an array (shouldn't happen for discussions with posts)
    // or if we want to be extra sure to grab all posts linked to this discussion from the 'included' array.
    posts = response.included
      .filter((inc): inc is FlarumPostType =>
        inc.type === 'posts' &&
        (inc.relationships?.discussion?.data as FlarumResourceIdentifier)?.id === discussionIdentifier
      )
      .map(postResource => transformFlarumPost(postResource, response.included))
      .filter((post): post is Post => post !== undefined);
  }
  
  // Ensure firstPost is at the beginning of the posts array if it exists
  if (topic.firstPost) {
    const firstPostIndex = posts.findIndex(p => p.id === topic.firstPost?.id);
    if (firstPostIndex > -1) {
      const [fp] = posts.splice(firstPostIndex, 1);
      posts.unshift(fp);
    } else {
      // If firstPost wasn't in the posts relationship for some reason but was included separately
      posts.unshift(topic.firstPost);
    }
  }

  // Sort posts by creation date (oldest first)
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
    
    // Re-transform the post, ensuring the author is the current user.
    // This is important if Flarum's response for creating a post doesn't include the full user details back.
    const newPost = transformFlarumPost(response.data, response.included);
    if (newPost) {
        // Ensure the author is correctly set to the current user,
        // especially if the included data from Flarum API might be minimal for the post author on create.
        if (newPost.author.id === 'unknown' || newPost.author.id !== currentUser.id) {
            newPost.author = currentUser;
        }
        return newPost;
    }
    return null;
}
