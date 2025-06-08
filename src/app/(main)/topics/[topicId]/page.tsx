
import { notFound as nextNotFound } from 'next/navigation';
import type { Topic, Post as PostType, User } from '@/lib/types';
import { fetchDiscussionDetails, submitReplyToDiscussion } from '@/services/flarum';
import { placeholderUser } from '@/lib/placeholder-data'; 

import { PostCard } from '@/components/PostCard';
import { RootReplyFormWrapper } from '@/components/RootReplyFormWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { revalidatePath } from 'next/cache';

const getCurrentUser = (): User => {
  return placeholderUser;
};

export async function handleReplyAction(
  topicId: string,
  content: string,
  parentPostId: string | undefined
): Promise<{ success: boolean; error?: string; post?: PostType }> {
  'use server';

  if (!topicId || !content) {
    return { success: false, error: "Topic ID and content are required." };
  }

  const currentUserForAction = getCurrentUser();
  if (!currentUserForAction || !currentUserForAction.id) {
    console.error('Server Action: Current user ID is missing. Cannot submit reply.');
    return { success: false, error: 'Authentication error. Could not determine current user.' };
  }

  const newPost = await submitReplyToDiscussion(topicId, content, currentUserForAction);

  if (newPost) {
    revalidatePath(`/topics/${topicId}`);
    // Revalidate tag pages if the topic has tags
    if (newPost.author?.id) { // Ensure author exists to prevent error on newPost creation
        const fetchedTopicData = await fetchDiscussionDetails(topicId); // Renamed to avoid conflict
        fetchedTopicData?.topic.tags?.forEach(tag => {
            if (tag.slug) {
                revalidatePath(`/t/${tag.slug}`);
            }
        });
    }
    return { success: true, post: newPost };
  } else {
    return { success: false, error: "Failed to post reply." };
  }
}


export default async function TopicPage({ params }: { params: { topicId: string } }) {
  const topicIdFromParam = params.topicId;
  const currentUser = getCurrentUser(); // This should be a server-side way to get user

  const fetchedTopicAndPosts = await fetchDiscussionDetails(topicIdFromParam);

  if (!fetchedTopicAndPosts) {
    nextNotFound();
  }

  const { topic, posts: initialPosts } = fetchedTopicAndPosts;
  const authorDisplayName = topic.author?.username || 'Unknown User';
  const authorInitials = authorDisplayName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-headline mb-2">
          {topic.title}
        </h1>
        <div className="flex items-center text-sm text-muted-foreground space-x-3 flex-wrap gap-y-1">
          {topic.author && (
            <Link href={`/profile/${topic.author.username}`} className="flex items-center hover:underline">
              <Avatar className="h-6 w-6 mr-1.5">
                <AvatarImage src={topic.author.avatarUrl} alt={authorDisplayName} data-ai-hint="user avatar small"/>
                <AvatarFallback className="text-xs font-semibold">
                   {topic.author.avatarUrl ? authorInitials : <UserCircle2 className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <span>{authorDisplayName}</span>
            </Link>
          )}
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4"/>
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
          </span>
           {topic.category && (
            <>
              <span>&bull;</span>
              <Link href={`/t/${topic.category.slug}`} className="hover:underline flex items-center" style={topic.category.color ? { color: topic.category.color } : {}}>
                {topic.category.icon && <i className={`${topic.category.icon} mr-1.5`}></i>}
                <span>{topic.category.name}</span>
              </Link>
            </>
          )}
        </div>
        {topic.tags && topic.tags.filter(t => t.id !== topic.category?.id).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {topic.tags.filter(t => t.id !== topic.category?.id).map(tag => (
                  <Link key={tag.id} href={`/t/${tag.slug}`}>
                    <span
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium hover:bg-secondary/80 transition-colors"
                        style={tag.color ? { backgroundColor: tag.color, color: 'white'} : {}}
                    >
                        {tag.name}
                    </span>
                  </Link>
                ))}
            </div>
        )}
      </header>

      <div className="space-y-6">
        {initialPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onReply={handleReplyAction} 
            topicId={topic.id}
            currentUserId={currentUser.id}
          />
        ))}
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-3 text-foreground font-headline">Join the Conversation</h2>
        <RootReplyFormWrapper topicId={topic.id} onReplyAction={handleReplyAction} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { topicId: string }}) {
  const { topicId } = params;
  const fetchedData = await fetchDiscussionDetails(topicId);

  if (!fetchedData?.topic) {
    return {
      title: 'Topic Not Found - Zenith Forums',
    };
  }
  return {
    title: `${fetchedData.topic.title} - Zenith Forums`,
    description: fetchedData.topic.firstPost?.content.substring(0, 160) || `View the discussion on ${fetchedData.topic.title}.`,
  };
}
