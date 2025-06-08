'use client';
import type { Post as PostType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquare, Flag, UserCircle2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import React, { useState } from 'react';
import { CreatePostForm } from './CreatePostForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: PostType;
  onReply: (
    topicId: string,
    content: string,
    parentPostId: string | undefined
  ) => Promise<{ success: boolean; error?: string; post?: PostType }>;
  topicId: string;
  level?: number;
  currentUserId?: string;
}

const DEFAULT_AVATAR_PLACEHOLDER = 'https://placehold.co/100x100.png';

export function PostCard({ post, onReply, topicId, level = 0, currentUserId }: PostCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { toast } = useToast();

  const handleReplySubmit = async (content: string) => {
    const result = await onReply(topicId, content, post.id);
    if (result.success) {
      setShowReplyForm(false);
      toast({
        title: "回复已发布!",
        description: "您的回复已添加到讨论中。",
        variant: "default",
      });
    } else {
      toast({
        title: "发布回复时出错",
        description: result.error || "无法发布您的回复。请再试一次。",
        variant: "destructive",
      });
    }
  };

  const isOwnPost = currentUserId && post.author.id === currentUserId;
  const authorDisplayName = post.author.username;
  const authorAvatarUrl = post.author.avatarUrl;
  const authorInitials = authorDisplayName.substring(0, 2).toUpperCase();


  return (
    <Card className={`mb-4 ${level > 0 ? 'ml-4 md:ml-8' : ''} shadow-sm bg-card`}>
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatarUrl === DEFAULT_AVATAR_PLACEHOLDER ? undefined : authorAvatarUrl} alt={authorDisplayName} data-ai-hint="user avatar" />
            <AvatarFallback className="flex items-center justify-center">
              {authorDisplayName !== '未知用户' && authorAvatarUrl !== DEFAULT_AVATAR_PLACEHOLDER ? (
                <span className="text-sm font-semibold">{authorInitials}</span>
              ) : (
                <UserCircle2 className="h-full w-full text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{authorDisplayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: zhCN })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" /> 举报
            </DropdownMenuItem>
            {isOwnPost && (
              <>
                <DropdownMenuItem>编辑</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">删除</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-foreground/90">
        <p>{post.content}</p>
        {post.isFlagged && (
            <div className="mt-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-destructive text-sm">
                <strong>已标记:</strong> {post.flagReason || "此帖子可能违反社区准则。"}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-start space-x-4 p-4 pt-0">
        <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="mr-1.5 h-4 w-4" /> 回复
        </Button>
      </CardFooter>

      {showReplyForm && (
        <div className="p-4 border-t">
          <CreatePostForm
            onSubmit={async (content) => await handleReplySubmit(content)}
            placeholder={`回复 ${authorDisplayName}...`}
            submitButtonText="发布回复"
            isReplyForm={true}
          />
        </div>
      )}

      {post.replies && post.replies.length > 0 && (
        <div className={`p-4 ${level === 0 ? 'border-t' : ''}`}>
          {post.replies.map(reply => (
            <PostCard
              key={reply.id}
              post={reply}
              onReply={onReply}
              topicId={topicId}
              level={level + 1}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
