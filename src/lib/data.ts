// Define the type for a chapter
export interface Chapter {
  chapterTitle: string;
  slug: string; // Unique slug for the chapter
  filePath: string; // Path to the markdown file for the chapter
}

// Define the type for a textbook, now including chapters
export interface Textbook {
  bookName: string;
  slug: string; // Unique slug for the book
  chapters: Chapter[]; // Array of chapters
}

// Define the type for a subject, now containing textbooks with chapters
export interface Subject {
  subjectName: string;
  recommendedTextbooks: Textbook[];
}

// Define the type for the entire data structure
export interface UpscData {
  "UPSC Subjects": Subject[];
}

// Type for chapter progress: { bookSlug: { chapterSlug: boolean } }
export interface ChapterProgress {
  [bookSlug: string]: {
    [chapterSlug: string]: boolean;
  };
}

// The JSON data with nested chapters
export const upscSubjectsData: UpscData = {
  "UPSC Subjects": [
    {
      "subjectName": "Indian History (Ancient, Medieval, Modern)",
      "recommendedTextbooks": [
        {
          "bookName": "History of Medieval India by Satish Chandra",
          "slug": "history-of-medieval-india-by-satish-chandra",
          "chapters": [
            { "chapterTitle": "Introduction to Medieval India", "slug": "intro-medieval-india", "filePath": "/markdown/history-medieval-ch1.md" },
            { "chapterTitle": "The Delhi Sultanate", "slug": "delhi-sultanate", "filePath": "/markdown/history-medieval-ch2.md" },
            { "chapterTitle": "Mughal Empire: Foundation", "slug": "mughal-empire-foundation", "filePath": "/markdown/history-medieval-ch3.md" },
            { "chapterTitle": "Mughal Empire: Zenith and Decline", "slug": "mughal-empire-zenith-decline", "filePath": "/markdown/history-medieval-ch4.md" },
          ]
        },
        {
          "bookName": "India's Struggle for Independence by Bipan Chandra",
          "slug": "indias-struggle-for-independence-by-bipan-chandra",
          "chapters": [
            { "chapterTitle": "Advent of Europeans", "slug": "advent-europeans", "filePath": "/markdown/struggle-independence-ch1.md" },
            { "chapterTitle": "Revolt of 1857", "slug": "revolt-1857", "filePath": "/markdown/struggle-independence-ch2.md" },
            { "chapterTitle": "Rise of Nationalism", "slug": "rise-nationalism", "filePath": "/markdown/struggle-independence-ch3.md" },
          ]
        }
      ]
    },
    {
      "subjectName": "Indian Polity",
      "recommendedTextbooks": [
        {
          "bookName": "Indian Polity by M. Laxmikanth",
          "slug": "indian-polity-by-m-laxmikanth",
          "chapters": [
            { "chapterTitle": "Historical Background", "slug": "polity-historical-background", "filePath": "/markdown/indian-polity-ch1.md" },
            { "chapterTitle": "Making of the Constitution", "slug": "polity-making-constitution", "filePath": "/markdown/indian-polity-ch2.md" },
            { "chapterTitle": "Preamble of the Constitution", "slug": "polity-preamble", "filePath": "/markdown/indian-polity-ch3.md" },
          ]
        }
      ]
    }
  ]
};

// Helper function to convert text into a URL-friendly slug
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-');          // Replace multiple - with single -
};
