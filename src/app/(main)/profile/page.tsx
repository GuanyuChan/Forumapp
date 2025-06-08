'use client';
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { placeholderUser, placeholderTopics } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Mail, CalendarDays, UserCircle2, MessageSquare } from 'lucide-react';
import { TopicListItem } from '@/components/TopicListItem';
import { format } from 'date-fns';

export default function ProfilePage() {
  // In a real app, you'd fetch user data based on ID or session
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(placeholderUser); // Using placeholder for now
  }, []);

  if (!user) {
    return <p>Loading profile...</p>; // Or a skeleton loader
  }

  const userTopics = placeholderTopics.filter(topic => topic.author.id === user.id);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-md">
              <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="profile avatar large"/>
              <AvatarFallback className="text-4xl">
                <UserCircle2 className="h-32 w-32 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center md:text-left">
              <CardTitle className="text-3xl font-bold text-foreground font-headline">{user.username}</CardTitle>
              {user.bio && <CardDescription className="mt-1 text-lg text-muted-foreground">{user.bio}</CardDescription>}
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
                </span>
                {/* Placeholder for email, would typically be private */}
                <span className="flex items-center">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Contact (Placeholder)
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-primary mb-2"/>
                <p className="text-2xl font-semibold">{userTopics.length}</p>
                <p className="text-sm text-muted-foreground">Topics Started</p>
            </div>
             <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <UserCircle2 className="h-8 w-8 text-primary mb-2"/>
                <p className="text-2xl font-semibold">{userTopics.reduce((acc, t) => acc + t.postCount, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
             <div className="flex flex-col items-center p-4 bg-secondary/50 rounded-lg">
                <ThumbsUp className="h-8 w-8 text-primary mb-2"/>
                <p className="text-2xl font-semibold">{(Math.random()*500).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
            </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground font-headline">
          {user.username}'s Topics
        </h2>
        {userTopics.length > 0 ? (
          <div className="space-y-4">
            {userTopics.map(topic => (
              <TopicListItem key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            {user.username} hasn't started any topics yet.
          </p>
        )}
      </section>
    </div>
  );
}
