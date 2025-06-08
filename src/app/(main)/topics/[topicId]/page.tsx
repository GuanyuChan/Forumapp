
import { notFound as nextNotFound } from 'next/navigation';
import type { Topic, Post as PostType, User } from '@/lib/types';
import { fetchDiscussionDetails /*, submitReplyToDiscussion */ } from '@/services/flarum'; // submitReplyToDiscussion might be part of a Server Action later
import { placeholderUser } from '@/lib/placeholder-data';

import { PostCard } from '@/components/PostCard';
import { CreatePostForm } from '@/components/CreatePostForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Skeleton } from '@/components/ui/skeleton'; // Not used in current version
import { UserCircle2, Clock, Tag } from 'lucide-react'; // Removed unused icons
import Link from 'next/link';
// import { useToast } from '@/hooks/use-toast'; // Cannot use in Server Components
import { format, formatDistanceToNow } from 'date-fns';

// Helper function to simulate fetching current user details - This should ideally come from server session.
const getCurrentUser = (): User => {
  return placeholderUser;
};

export default async function TopicPage({ params }: { params: { topicId: string } }) {
  const topicIdFromParam = params.topicId;
  const currentUser = getCurrentUser();

  const fetchedTopicAndPosts = await fetchDiscussionDetails(topicIdFromParam);

  if (!fetchedTopicAndPosts) {
    nextNotFound();
  }

  const { topic, posts: initialPosts } = fetchedTopicAndPosts;

  // Placeholder for reply handling - this will need to be a Server Action
  const handleCreateReply = async (content: string, parentPostId?: string) => {
    if (!topic) return;
    console.log('Replying (Server Action needed):', { topicId: topic.id, content, parentPostId, userId: currentUser.id });
    // const newReplyData = await submitReplyToDiscussion(topic.id, content, currentUser.id);
    // if (newReplyData) {
    //   // Revalidate path or use client-side state management in a child component for optimistic updates
    //   // toast({ title: "Reply posted!", description: "Your reply has been added." });
    // } else {
    //   // toast({ title: "Error", description: "Failed to post reply.", variant: "destructive" });
    // }
  };

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
                <AvatarImage src={topic.author.avatarUrl} alt={topic.author.username} data-ai-hint="user avatar small"/>
                <AvatarFallback><UserCircle2 className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <span>{topic.author.username}</span>
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
                        style={tag.color ? { backgroundColor: tag.color, color: 'white'} : {}} // Basic contrast for tag color
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
            onReply={handleCreateReply} // This will need to trigger a server action
            topicId={topic.id}
            currentUserId={currentUser.id}
          />
        ))}
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-3 text-foreground font-headline">Join the Conversation</h2>
        <CreatePostForm
          onSubmit={(content) => handleCreateReply(content)} // This form will eventually use a Server Action
          placeholder="Write your reply..."
          submitButtonText="Post Reply"
          isReplyForm={true}
        />
      </div>
    </div>
  );
}

// Optional: Generate metadata if this remains a server component or for build time
export async function generateMetadata({ params }: { params: { topicId: string }}) {
  const { topicId } = params;
  const fetchedData = await fetchDiscussionDetails(topicId);

  if (!fetchedData?.topic) {
    return {
      title: 'Topic Not Found',
    };
  }
  return {
    title: `${fetchedData.topic.title} - Zenith Forums`,
    description: fetchedData.topic.firstPost?.content.substring(0, 150) || `View the discussion on ${fetchedData.topic.title}.`,
  };
}
