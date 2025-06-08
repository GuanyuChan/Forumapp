
'use client';
import type { Post as PostType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquare, Flag, UserCircle2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
        title: "Reply Posted!",
        description: "Your reply has been added to the discussion.",
        variant: "default",
      });
    } else {
      toast({
        title: "Error Posting Reply",
        description: result.error || "Could not post your reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isOwnPost = currentUserId && post.author.id === currentUserId;
  // post.author is now guaranteed to be a User object by transformFlarumUser
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
              {authorDisplayName !== 'Unknown User' && authorAvatarUrl !== DEFAULT_AVATAR_PLACEHOLDER ? (
                <span className="text-sm font-semibold">{authorInitials}</span>
              ) : (
                <UserCircle2 className="h-full w-full text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{authorDisplayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
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
              <Flag className="mr-2 h-4 w-4" /> Report
            </DropdownMenuItem>
            {isOwnPost && (
              <>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-foreground/90">
        {/* Using dangerouslySetInnerHTML for Flarum content is risky without proper sanitization.
            For now, assuming 'post.content' is plain text due to stripping in transformFlarumPost.
            If HTML content is intended, ensure it's sanitized on the server or use a safe HTML renderer. */}
        <p>{post.content}</p>
        {post.isFlagged && (
            <div className="mt-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-destructive text-sm">
                <strong>Flagged:</strong> {post.flagReason || "This post may violate community guidelines."}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-start space-x-4 p-4 pt-0">
        <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="text-muted-foreground hover:text-primary">
          <MessageSquare className="mr-1.5 h-4 w-4" /> Reply
        </Button>
      </CardFooter>

      {showReplyForm && (
        <div className="p-4 border-t">
          <CreatePostForm
            onSubmit={async (content) => await handleReplySubmit(content)}
            placeholder={`Replying to ${authorDisplayName}...`}
            submitButtonText="Post Reply"
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
