'use client';

import type { FormEvent } from 'react';
import { CreatePostForm } from '@/components/CreatePostForm';
import type { Post as PostType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface RootReplyFormWrapperProps {
  topicId: string;
  onReplyAction: (
    topicId: string,
    content: string,
    parentPostId: string | undefined
  ) => Promise<{ success: boolean; error?: string; post?: PostType }>;
}

export function RootReplyFormWrapper({ topicId, onReplyAction }: RootReplyFormWrapperProps) {
  const { toast } = useToast();

  const handleRootSubmit = async (content: string): Promise<void> => {
    const result = await onReplyAction(topicId, content, undefined); 

    if (result.success) {
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

  return (
    <CreatePostForm
      onSubmit={async (content) => {
        await handleRootSubmit(content);
      }}
      placeholder="写下你的回复..."
      submitButtonText="发布回复"
      isReplyForm={true}
    />
  );
}
