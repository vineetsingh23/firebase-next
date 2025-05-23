"use client";

import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Chapter, Textbook, ChapterProgress as ChapterProgressType } from '@/lib/data';
import { CheckCircle2, Circle, Loader2, AlertTriangle, X } from 'lucide-react';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Textbook | null;
  selectedChapter: Chapter | null;
  onSelectChapter: (chapter: Chapter, bookSlug: string) => void;
  chapterProgress: ChapterProgressType;
  onMarkAsRead: (bookSlug: string, chapterSlug: string) => Promise<void>;
  onNextChapter: () => Promise<void>;
  onPrevChapter: () => void;
  content: string;
  title: string;
  isLoading: boolean;
  error: string | null;
  subjectName?: string;
  subjectProgress?: number;
}

const ChapterModal: React.FC<ChapterModalProps> = ({
  isOpen,
  onClose,
  book,
  selectedChapter,
  onSelectChapter,
  chapterProgress,
  onMarkAsRead,
  onNextChapter,
  onPrevChapter,
  content,
  title,
  isLoading,
  error,
  subjectName,
  subjectProgress,
}) => {
  if (!book) return null;

  const currentChapterIndex = selectedChapter ? book.chapters.findIndex(c => c.slug === selectedChapter.slug) : -1;
  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === book.chapters.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-11/12 h-[90vh] p-0 flex flex-col sm:flex-row" aria-describedby={undefined} aria-labelledby={undefined}>
        {/* Sidebar for Chapters */}
        <div className="w-full sm:w-1/3 flex-shrink-0 bg-muted/50 p-4 flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-primary truncate pr-8">{book.bookName}</DialogTitle>
          </DialogHeader>
          {subjectName && subjectProgress !== undefined && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {subjectName} Progress: {subjectProgress}%
              </h4>
              <Progress value={subjectProgress} className="w-full h-2" />
            </div>
          )}
          <ScrollArea className="flex-grow">
            <ul className="space-y-1 pr-2">
              {book.chapters.map((chapter) => (
                <li key={chapter.slug}>
                  <Button
                    variant={selectedChapter?.slug === chapter.slug ? 'secondary' : 'ghost'}
                    onClick={() => onSelectChapter(chapter, book.slug)}
                    className="w-full justify-start text-left h-auto py-2 px-2 normal-case"
                  >
                    {chapterProgress[book.slug]?.[chapter.slug] ? (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{chapter.chapterTitle}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="w-full sm:w-2/3 flex-grow p-6 flex flex-col">
          <DialogHeader className="border-b pb-2 mb-4 relative">
            <DialogTitle className="text-2xl font-bold text-primary pr-10 truncate">{title || "Select a Chapter"}</DialogTitle>
            <DialogClose asChild className="absolute top-0 right-0">
               <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <ScrollArea className="flex-grow mb-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-4 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive text-center font-medium">Error Loading Content</p>
                <p className="text-destructive/80 text-sm text-center mt-1">{error}</p>
              </div>
            )}

            {!isLoading && !error && content && (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            {!isLoading && !error && !content && (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground">No content loaded or file is empty. Select a chapter from the sidebar.</p>
              </div>
            )}
          </ScrollArea>

          {selectedChapter && book && !isLoading && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-auto pt-4 border-t gap-2">
              <Button
                onClick={onPrevChapter}
                variant="outline"
                disabled={isFirstChapter}
              >
                Previous
              </Button>
              <Button
                onClick={() => onMarkAsRead(book.slug, selectedChapter.slug)}
                variant={chapterProgress[book.slug]?.[selectedChapter.slug] ? "secondary" : "default"}
                className={chapterProgress[book.slug]?.[selectedChapter.slug] ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary hover:bg-primary/90"}
                disabled={chapterProgress[book.slug]?.[selectedChapter.slug]}
              >
                {chapterProgress[book.slug]?.[selectedChapter.slug] ? 'Chapter Read' : 'Mark as Read'}
              </Button>
              <Button
                onClick={onNextChapter}
                variant="outline"
                disabled={isLastChapter}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChapterModal;
