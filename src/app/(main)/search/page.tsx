'use client';
import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TopicListItem } from '@/components/TopicListItem';
import { placeholderTopics } from '@/lib/placeholder-data';
import type { Topic } from '@/lib/types';
import { SearchIcon, XCircle } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Topic[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(true);
      return;
    }
    const results = placeholderTopics.filter(topic =>
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.firstPost.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.tags && topic.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">搜索 11A4008深论坛</h1>
      
      <form onSubmit={handleSearch} className="flex items-center gap-3 p-4 border rounded-lg shadow-sm bg-card">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索主题、帖子或标签..."
            className="pl-10 text-base py-3 h-12 bg-background"
          />
          {searchTerm && (
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setSearchTerm('');
                setSearchResults([]);
                setHasSearched(false);
              }}
              aria-label="清除搜索"
            >
              <XCircle className="h-5 w-5 text-muted-foreground"/>
            </Button>
          )}
        </div>
        <Button type="submit" className="h-12 bg-primary hover:bg-primary/90">
          <SearchIcon className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline">搜索</span>
        </Button>
      </form>

      {hasSearched && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground font-headline">
            {searchResults.length > 0 ? `搜索结果 (${searchResults.length})` : '未找到结果'}
          </h2>
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map(topic => (
                <TopicListItem key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              未能找到与 “{searchTerm}” 匹配的主题。请尝试其他查询。
            </p>
          )}
        </section>
      )}
       {!hasSearched && (
        <div className="text-center py-10">
          <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg text-muted-foreground">输入搜索词以查找主题和帖子。</p>
        </div>
      )}
    </div>
  );
}
