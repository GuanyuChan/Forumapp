'use client';
import { CreatePostForm } from '@/components/CreatePostForm';
import { useToast } from '@/hooks/use-toast';

export default function NewTopicPage() {
  const { toast } = useToast();

  const handleCreateTopic = async (content: string, title?: string, tags?: string) => {
    console.log('创建新主题:', { title, content, tags });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "主题已创建!",
      description: `您的新主题“${title}”已成功创建。`,
      variant: "default",
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <CreatePostForm
        onSubmit={handleCreateTopic}
        submitButtonText="创建主题"
        isNewTopic={true}
      />
    </div>
  );
}
