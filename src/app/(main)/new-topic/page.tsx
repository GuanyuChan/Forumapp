'use client';
import { CreatePostForm } from '@/components/CreatePostForm';
import { useToast } from '@/hooks/use-toast';
// import { useRouter } from 'next/navigation'; // Uncomment if you want to redirect after submission

export default function NewTopicPage() {
  const { toast } = useToast();
  // const router = useRouter(); // Uncomment for redirect

  const handleCreateTopic = async (content: string, title?: string, tags?: string) => {
    // Placeholder for API call to create a new topic
    console.log('Creating new topic:', { title, content, tags });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Topic Created!",
      description: `Your new topic "${title}" has been successfully created.`,
      variant: "default",
    });
    
    // Example: Redirect to the new topic page or homepage
    // router.push('/'); // Or router.push(`/topics/new-topic-id`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <CreatePostForm
        onSubmit={handleCreateTopic}
        submitButtonText="Create Topic"
        isNewTopic={true}
      />
    </div>
  );
}
