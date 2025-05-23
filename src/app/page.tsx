
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, Firestore, Auth } from 'firebase/firestore';

import { upscSubjectsData, Subject, Textbook, Chapter, ChapterProgress } from '@/lib/data';
import { 
  db as firestoreDbInstance, 
  auth as firebaseAuthInstance, 
  appId, 
  initialAuthToken,
  isFirebaseActuallyConfigured // Import the flag
} from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ChapterModal from '@/components/ChapterModal';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { useToast } from "@/hooks/use-toast";
import { Download, AlertTriangle, CheckCircle, Info, BookOpen } from 'lucide-react';

const UPSCNavigatorPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedBook, setSelectedBook] = useState<Textbook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress>({});

  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseActuallyConfigured) {
      setAppError("Firebase is not configured correctly. Key features like authentication and data storage will be unavailable. Please check your Firebase project setup and environment variables.");
      setIsAuthReady(false);
      setDb(null);
      setAuth(null);
      return;
    }
    // Use instances from firebase.ts if configured
    setDb(firestoreDbInstance);
    setAuth(firebaseAuthInstance);
  }, []); // Runs once on mount
  
  useEffect(() => {
    // Primary guard: if Firebase is not configured, or auth service isn't available, bail out.
    if (!isFirebaseActuallyConfigured) {
      // The first useEffect already handles setting appError and ensuring auth/db are null.
      // We just ensure auth readiness is false and exit.
      setIsAuthReady(false);
      return;
    }

    if (!auth) {
      // This case means isFirebaseActuallyConfigured is true, but auth instance is still null.
      // This might indicate an issue in firebase.ts logic or an unexpected state.
      if (!appError) { // Avoid overwriting a more specific error.
        setAppError("Authentication service could not be initialized. Please check Firebase setup.");
      }
      setIsAuthReady(false);
      return;
    }

    // At this point, isFirebaseActuallyConfigured is true, and auth is a valid Auth instance.
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        // No user currently. Try to sign in.
        // appError check here is to prevent repeated sign-in attempts if a previous one failed critically.
        if (!appError) { 
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
            // onAuthStateChanged will be called again by Firebase if sign-in is successful.
          } catch (e: any) {
            console.error("Firebase sign-in attempt failed:", e);
            setAppError(`Sign-in failed: ${e.message}. Please refresh or check configuration.`);
            setIsAuthReady(false);
          }
        } else {
          // If there's an existing appError, don't attempt sign-in.
          setIsAuthReady(false);
        }
      }
    });

    return () => unsubscribe();
  }, [auth, appError, initialAuthToken]);

  useEffect(() => {
    if (!isFirebaseActuallyConfigured || !db || !userId || !isAuthReady) return; 
    const userProgressDocRef = doc(db, `artifacts/${appId}/users/${userId}/upsc_progress`, 'userProgress');
    const unsubscribe = onSnapshot(userProgressDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setChapterProgress(docSnap.data() as ChapterProgress);
      } else {
        setChapterProgress({});
      }
    }, (err) => {
      console.error("Error fetching real-time progress:", err);
      setAppError("Failed to load your progress. Please try again.");
    });
    return () => unsubscribe();
  }, [db, userId, isAuthReady, appId]);

  const saveProgress = useCallback(async (updatedProgress: ChapterProgress) => {
    if (!isFirebaseActuallyConfigured) {
      setAppError("Cannot save progress: Firebase is not configured correctly.");
      toast({ variant: "destructive", title: "Configuration Error", description: "Cannot save progress: Firebase not configured."});
      return;
    }
    if (!db || !userId || !isAuthReady) {
      console.error("Firestore not ready to save progress.");
       toast({ variant: "destructive", title: "Error", description: "Cannot save progress: Services not ready."});
      return;
    }
    try {
      const userProgressDocRef = doc(db, `artifacts/${appId}/users/${userId}/upsc_progress`, 'userProgress');
      await setDoc(userProgressDocRef, updatedProgress, { merge: true });
      toast({
        title: "Progress Saved",
        description: "Your reading progress has been successfully saved.",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (e: any) {
      console.error("Error saving progress to Firestore:", e);
      setAppError(`Failed to save progress: ${e.message}.`);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: `Failed to save progress: ${e.message}.`,
      });
    }
  }, [db, userId, isAuthReady, toast, appId]); 

  const exportJson = () => {
    const jsonString = JSON.stringify(upscSubjectsData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'upsc_subjects_and_textbooks.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Data exported as JSON." });
  };

  const fetchAndDisplayMarkdown = async (chapter: Chapter, bookSlug: string) => {
    setIsContentLoading(true);
    setContentError(null);
    setModalTitle(`${selectedBook?.bookName || ''} - ${chapter.chapterTitle}`);
    setModalContent('');
    setSelectedChapter(chapter);

    try {
      const response = await fetch(chapter.filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${chapter.filePath}`);
      }
      const text = await response.text();
      setModalContent(text);
    } catch (err: any) {
      console.error("Failed to fetch markdown:", err);
      setContentError(`Could not load content for "${chapter.chapterTitle}". Ensure the file exists at ${chapter.filePath}. Error: ${err.message}`);
      setModalContent('');
    } finally {
      setIsContentLoading(false);
    }
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedChapter(null);
    setModalContent('');
    setModalTitle('');
    setContentError(null);
  };


  const handleBookClick = (subject: Subject, book: Textbook) => {
    setSelectedSubject(subject);
    setSelectedBook(book);
    setShowModal(true);
    if (book.chapters && book.chapters.length > 0) {
      fetchAndDisplayMarkdown(book.chapters[0], book.slug);
    } else {
      setModalTitle(book.bookName);
      setModalContent("No chapters available for this book.");
      setSelectedChapter(null);
      setIsContentLoading(false);
      setContentError(null);
    }
  };
  
  const markChapterAsRead = useCallback(async (bookSlug: string, chapterSlug: string) => {
    if (!isFirebaseActuallyConfigured) return; 
    const newProgress = {
      ...chapterProgress,
      [bookSlug]: {
        ...(chapterProgress[bookSlug] || {}),
        [chapterSlug]: true,
      },
    };
    setChapterProgress(newProgress);
    await saveProgress(newProgress);
  }, [chapterProgress, saveProgress]); 

  const goToNextChapter = useCallback(async () => {
    if (!selectedBook || !selectedChapter) return;
    if (isFirebaseActuallyConfigured) {
        await markChapterAsRead(selectedBook.slug, selectedChapter.slug);
    }
    const currentChapterIndex = selectedBook.chapters.findIndex(c => c.slug === selectedChapter.slug);
    if (currentChapterIndex < selectedBook.chapters.length - 1) {
      const nextChapter = selectedBook.chapters[currentChapterIndex + 1];
      fetchAndDisplayMarkdown(nextChapter, selectedBook.slug);
    } else {
      closeModal();
      toast({
        title: "Book Completed!",
        description: `You've completed all chapters in "${selectedBook.bookName}"!`,
        action: <CheckCircle className="text-green-500" />,
      });
    }
  }, [selectedBook, selectedChapter, markChapterAsRead, toast]); 

  const goToPreviousChapter = useCallback(() => {
    if (!selectedBook || !selectedChapter) return;
    const currentChapterIndex = selectedBook.chapters.findIndex(c => c.slug === selectedChapter.slug);
    if (currentChapterIndex > 0) {
      const prevChapter = selectedBook.chapters[currentChapterIndex - 1];
      fetchAndDisplayMarkdown(prevChapter, selectedBook.slug);
    }
  }, [selectedBook, selectedChapter]);

  const calculateBookProgress = useCallback((book: Textbook) => {
    if (!isFirebaseActuallyConfigured || !book.chapters || book.chapters.length === 0) return 0;
    const completedChapters = book.chapters.filter(chapter =>
      chapterProgress[book.slug]?.[chapter.slug]
    ).length;
    return Math.round((completedChapters / book.chapters.length) * 100);
  }, [chapterProgress]); 

  const calculateSubjectProgress = useCallback(() => {
    if (!isFirebaseActuallyConfigured || !selectedSubject) return 0;
    let totalChapters = 0;
    let totalCompletedChapters = 0;
    selectedSubject.recommendedTextbooks.forEach(book => {
      if (book.chapters) {
        totalChapters += book.chapters.length;
        totalCompletedChapters += book.chapters.filter(chapter =>
          chapterProgress[book.slug]?.[chapter.slug]
        ).length;
      }
    });
    if (totalChapters === 0) return 0;
    return Math.round((totalCompletedChapters / totalChapters) * 100);
  }, [selectedSubject, chapterProgress]);


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <main className="w-full max-w-6xl bg-card rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary text-center">
            UPSC Navigator
          </h1>
          <p className="text-center text-muted-foreground mt-2">Your guide to mastering UPSC subjects.</p>
        </header>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <Button onClick={exportJson} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Syllabus
          </Button>
          <ThemeToggleButton />
        </div>
        
        {appError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Application Error</AlertTitle>
            <AlertDescription>{appError}</AlertDescription>
          </Alert>
        )}

        {isFirebaseActuallyConfigured && userId && isAuthReady && !appError && (
          <div className="text-center text-xs text-muted-foreground mb-4 p-2 bg-muted rounded-md">
            <Info className="inline h-4 w-4 mr-1" />
            Logged in as: <span className="font-mono">{userId}</span>
          </div>
        )}

         {isFirebaseActuallyConfigured && !isAuthReady && !appError && (
            <Alert variant="default" className="mb-4 bg-blue-500/10 border-blue-500/50">
              <Info className="h-5 w-5 text-blue-500" />
              <AlertTitle className="text-blue-700 dark:text-blue-300">Initializing</AlertTitle>
              <AlertDescription className="text-blue-600 dark:text-blue-400">
                Connecting to services. Please wait...
              </AlertDescription>
            </Alert>
          )}


        <div className="space-y-8">
          {upscSubjectsData["UPSC Subjects"].map((subject, sIndex) => (
            <Card key={sIndex} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl sm:text-2xl text-primary-foreground-on-muted">{subject.subjectName}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Recommended Textbooks:</h3>
                <ul className="space-y-4">
                  {subject.recommendedTextbooks.map((book, bIndex) => (
                    <li key={bIndex} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-background hover:bg-muted/20">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <button
                          onClick={() => handleBookClick(subject, book)}
                          className="text-left text-lg font-medium text-accent-foreground-on-card hover:text-accent transition-colors flex-grow group"
                          title={`View chapters for "${book.bookName}"`}
                        >
                         <BookOpen className="inline h-5 w-5 mr-2 text-primary group-hover:text-accent transition-colors" />
                          {book.bookName}
                        </button>
                        <div className="w-full sm:w-48 mt-2 sm:mt-0">
                           <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Progress:</span>
                            <span className="font-semibold text-foreground">
                              {isFirebaseActuallyConfigured ? calculateBookProgress(book) : 0}%
                            </span>
                           </div>
                          <Progress value={isFirebaseActuallyConfigured ? calculateBookProgress(book) : 0} className="h-2 mt-1" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {selectedBook && (
        <ChapterModal
          isOpen={showModal}
          onClose={closeModal}
          book={selectedBook}
          selectedChapter={selectedChapter}
          onSelectChapter={fetchAndDisplayMarkdown}
          chapterProgress={isFirebaseActuallyConfigured ? chapterProgress : {}}
          onMarkAsRead={markChapterAsRead}
          onNextChapter={goToNextChapter}
          onPrevChapter={goToPreviousChapter}
          content={modalContent}
          title={modalTitle}
          isLoading={isContentLoading}
          error={contentError}
          subjectName={selectedSubject?.subjectName}
          subjectProgress={isFirebaseActuallyConfigured ? calculateSubjectProgress() : 0}
        />
      )}
    </div>
  );
};

export default UPSCNavigatorPage;


