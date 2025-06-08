
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
    // title and tags from CreatePostForm's onSubmit are ignored here as it's a reply
    const result = await onReplyAction(topicId, content, undefined); // parentPostId is undefined for root reply

    if (result.success) {
      toast({
        title: "Reply Posted!",
        description: "Your reply has been added to the discussion.",
        variant: "default",
      });
      // CreatePostForm will clear its own content input on successful submission handled by its internal state.
    } else {
      toast({
        title: "Error Posting Reply",
        description: result.error || "Could not post your reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <CreatePostForm
      onSubmit={async (content) => {
        // This async function is defined in the Client Component, so it's fine.
        // It calls handleRootSubmit, which in turn calls the Server Action.
        await handleRootSubmit(content);
      }}
      placeholder="Write your reply..."
      submitButtonText="Post Reply"
      isReplyForm={true}
    />
  );
}
