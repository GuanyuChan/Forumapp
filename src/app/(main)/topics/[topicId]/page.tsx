
import { notFound as nextNotFound } from 'next/navigation';
import type { Topic, Post as PostType, User } from '@/lib/types';
import { fetchDiscussionDetails, submitReplyToDiscussion } from '@/services/flarum';
import { placeholderUser } from '@/lib/placeholder-data';

import { PostCard } from '@/components/PostCard';
import { RootReplyFormWrapper } from '@/components/RootReplyFormWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle2, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { revalidatePath } from 'next/cache';

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

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
    return { success: false, error: "主题ID和内容不能为空。" };
  }

  const currentUserForAction = getCurrentUser();
  if (!currentUserForAction || currentUserForAction.id === 'unknown') {
    console.error('服务器操作：当前用户ID缺失或无效。无法提交回复。');
    return { success: false, error: '认证错误。无法确定当前用户。' };
  }

  const newPost = await submitReplyToDiscussion(topicId, content, currentUserForAction);

  if (newPost) {
    revalidatePath(`/topics/${topicId}`);
    if (newPost.author?.id) {
        const fetchedTopicData = await fetchDiscussionDetails(topicId);
        if (fetchedTopicData?.topic.tags) {
            fetchedTopicData.topic.tags.forEach(tag => {
                if (tag.slug) {
                    revalidatePath(`/t/${tag.slug}`);
                }
            });
        }
    }
    return { success: true, post: newPost };
  } else {
    return { success: false, error: "回复失败。" };
  }
}


export default async function TopicPage({ params }: { params: { topicId: string } }) {
  const topicIdFromParam = params.topicId;
  const currentUser = getCurrentUser();

  const fetchedTopicAndPosts = await fetchDiscussionDetails(topicIdFromParam);

  if (!fetchedTopicAndPosts) {
    nextNotFound();
  }

  const { topic, posts: initialPosts } = fetchedTopicAndPosts;

  const authorDisplayName = topic.author.username;
  const authorAvatarUrl = topic.author.avatarUrl;
  const authorInitials = authorDisplayName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/" passHref>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回论坛
          </Button>
        </Link>
      </div>

      <header className="pb-4 border-b">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-headline mb-2">
          {topic.title}
        </h1>

        <div className="flex items-center text-sm text-muted-foreground space-x-3 flex-wrap gap-y-1">
          <Link href={`/profile/${topic.author.username}`} className="flex items-center hover:underline">
            <Avatar className="h-6 w-6 mr-1.5">
              <AvatarImage src={authorAvatarUrl === DEFAULT_AVATAR_PLACEHOLDER ? undefined : authorAvatarUrl} alt={authorDisplayName} data-ai-hint="user avatar small"/>
              <AvatarFallback className="flex items-center justify-center">
                 {authorDisplayName !== '未知用户' && authorAvatarUrl !== DEFAULT_AVATAR_PLACEHOLDER ? (
                    <span className="text-xs font-semibold">{authorInitials}</span>
                 ) : (
                    <UserCircle2 className="h-full w-full" />
                 )}
              </AvatarFallback>
            </Avatar>
            <span>{authorDisplayName}</span>
          </Link>
          <span className="flex items-center">
            <Clock className="mr-1 h-4 w-4"/>
            {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: zhCN })}
          </span>
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
        <h2 className="text-xl font-semibold mb-3 text-foreground font-headline">参与讨论</h2>
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
      title: '主题未找到 - 11A4008深论坛',
    };
  }
  return {
    title: `${fetchedData.topic.title} - 11A4008深论坛`,
    description: fetchedData.topic.firstPost?.content.substring(0, 160) || `查看关于“${fetchedData.topic.title}”的讨论。`,
  };
}
