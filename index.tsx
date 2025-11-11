
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const { useState, useCallback, useRef, useMemo } = React;

type RelevanceTag = 'Highly Relevant' | 'Relevant' | 'Moderately Relevant';

interface Paper {
  title: string;
  authors: string[];
  year: number;
  sourceJournal: string;
  citations?: number;
  relevanceScore: number;
  relevanceTag: RelevanceTag;
  reasoning: string;
  url: string;
  pdfAvailable: boolean;
}


// --- From components/Icons.tsx ---
const Icons = {
  Logo: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2zm0 6h2v2h-2z" />
      <path d="M12 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 4c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6zm0 2c1.93 0 3.5 1.57 3.5 3.5H8.5c0-1.93 1.57-3.5 3.5-3.5z" transform="scale(0.6) translate(8, 20)"/>
    </svg>
  ),
  Search: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Spinner: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  ExternalLink: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Clipboard: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-6 4h.01M9 16h.01" />
    </svg>
  ),
  User: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  Calendar: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
  Quote: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 4.75a.75.75 0 10-1.5 0V8.5h-1a.75.75 0 000 1.5h1V12a.75.75 0 001.5 0V9.5h1a.75.75 0 000-1.5h-1V4.75z" />
        <path fillRule="evenodd" d="M5.05 3.273a.75.75 0 00-1.07.03L2.206 5.576A1.75 1.75 0 002.002 8.5v4.5a1.75 1.75 0 001.75 1.75h9.5a1.75 1.75 0 001.75-1.75V8.5a1.75 1.75 0 00-.204-2.924l-1.774-2.273a.75.75 0 00-1.1-.03L10 5.054 8.72 3.303a.75.75 0 00-1.1-.03L6.55 5.054 5.05 3.273zm1.18.916L7.5 5.86l1.28-1.751 1.07 1.371.865-1.107 1.55 1.983a.25.25 0 01.029.418l-3.5 4.5a.75.75 0 01-1.1.082l-3.5-4.5a.25.25 0 01.03-.418l1.55-1.982z" clipRule="evenodd" />
    </svg>
  ),
  Book: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm4 0a1 1 0 00-1 1v1.5a.5.5 0 00.5.5H8a.5.5 0 00.5-.5V6a1 1 0 00-1-1H6zm1.5 3a.5.5 0 00-.5.5v5a.5.5 0 00.5.5h.5a1 1 0 001-1V9a1 1 0 00-1-1h-.5z" clipRule="evenodd" />
    </svg>
  ),
  EmptyState: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Sparkle: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2.5a.75.75 0 01.75.75v1.25a.75.75 0 01-1.5 0V3.25A.75.75 0 0110 2.5zM7.5 5.625a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0V5.625zM4.375 7.5a.75.75 0 01.75-.75h1.25a.75.75 0 010 1.5H5.125a.75.75 0 01-.75-.75zM12.5 5.625a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0V5.625zM15.625 7.5a.75.75 0 01.75-.75h1.25a.75.75 0 010 1.5h-1.25a.75.75 0 01-.75-.75zM10 8.75a.75.75 0 01.75.75v1.25a.75.75 0 01-1.5 0V9.5A.75.75 0 0110 8.75zM7.5 12.5a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0v-1.25zM10 15.625a.75.75 0 01.75.75v1.25a.75.75 0 01-1.5 0v-1.25a.75.75 0 01.75-.75zM12.5 12.5a.75.75 0 00-1.5 0v1.25a.75.75 0 001.5 0v-1.25z" clipRule="evenodd" />
    </svg>
  ),
  Warning: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.031-1.742 3.031H4.42c-1.532 0-2.492-1.697-1.742-3.031l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Check: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Download: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

// --- From components/LoadingSpinner.tsx ---
const LoadingSpinner = ({ progress, message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md bg-gray-200 rounded-full dark:bg-gray-700 mb-4">
        <div
          className="bg-brand-primary text-xs font-medium text-blue-100 text-center p-1 leading-none rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <span className="font-bold">{`${Math.round(progress)}%`}</span>
        </div>
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-400 text-center">{message}</p>
    </div>
  );
};

// --- From components/ResultCard.tsx ---
const getRelevanceStyles = (tag: RelevanceTag) => {
  switch (tag) {
    case 'Highly Relevant':
      return { pill: 'bg-status-high/10 dark:bg-status-high/20', text: 'text-status-high', ring: 'ring-status-high/30' };
    case 'Relevant':
      return { pill: 'bg-status-medium/10 dark:bg-status-medium/20', text: 'text-status-medium', ring: 'ring-status-medium/30' };
    case 'Moderately Relevant':
      return { pill: 'bg-status-low/10 dark:bg-status-low/20', text: 'text-status-low dark:text-orange-400', ring: 'ring-orange-500/30' };
    default:
      return { pill: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', ring: 'ring-gray-500/30' };
  }
};

interface ResultCardProps {
  paper: Paper;
}

const ResultCard: React.FC<ResultCardProps> = ({ paper }) => {
  const relevanceStyles = getRelevanceStyles(paper.relevanceTag);
  const [isCopied, setIsCopied] = useState(false);

  const authorsText = paper.authors?.join(', ') || 'Không có thông tin tác giả';

  const handleCopyCitation = () => {
    const citation = `${authorsText} (${paper.year}). ${paper.title}. ${paper.sourceJournal || 'Nguồn không xác định'}.`;
    navigator.clipboard.writeText(citation).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
          <div className="flex-grow">
            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-brand-dark dark:text-brand-light hover:underline hover:text-brand-primary">
              {paper.title}
            </a>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center"><Icons.User className="w-4 h-4 mr-1.5" /> {authorsText}</span>
              <span className="flex items-center"><Icons.Calendar className="w-4 h-4 mr-1.5" /> {paper.year}</span>
              {paper.citations !== undefined && (
                <span className="flex items-center"><Icons.Quote className="w-4 h-4 mr-1.5" /> {paper.citations} Citations</span>
              )}
              <span className="flex items-center"><Icons.Book className="w-4 h-4 mr-1.5" /> {paper.sourceJournal || 'Nguồn không xác định'}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
             <div className="flex items-center gap-2">
                <div className={`relative w-12 h-12 flex items-center justify-center rounded-full ${relevanceStyles.pill}`}>
                    <span className={`text-lg font-bold ${relevanceStyles.text}`}>{paper.relevanceScore}</span>
                </div>
             </div>
             <span className={`px-3 py-1 text-xs font-semibold rounded-full ${relevanceStyles.pill} ${relevanceStyles.text}`}>
                {paper.relevanceTag}
             </span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-brand-accent">
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            <span className="font-semibold">Lý do liên quan:</span> {paper.reasoning}
          </p>
        </div>

        <div className="mt-6 flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-brand-secondary hover:bg-brand-primary text-white text-sm font-medium rounded-md transition-colors shadow"
            >
              <Icons.ExternalLink className="w-4 h-4 mr-2" />
              {paper.pdfAvailable ? 'Xem nguồn / PDF' : 'Xem nguồn'}
            </a>
            <button
              onClick={handleCopyCitation}
              disabled={isCopied}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                isCopied
                  ? 'bg-status-high text-white'
                  : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
              }`}
            >
              {isCopied ? (
                <>
                  <Icons.Check className="w-4 h-4 mr-2" />
                  Đã sao chép!
                </>
              ) : (
                <>
                  <Icons.Clipboard className="w-4 h-4 mr-2" />
                  Trích dẫn
                </>
              )}
            </button>
          </div>
          {!paper.pdfAvailable && (
            <div className="flex items-center text-sm text-amber-800 dark:text-status-medium bg-amber-100 dark:bg-status-medium/20 p-2 rounded-md">
              <Icons.Warning className="w-4 h-4 mr-2 flex-shrink-0 text-amber-600 dark:text-status-medium" />
              <span>Tài liệu này có thể không cho phép tải file PDF trực tiếp.</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

// --- From components/SearchBar.tsx ---
const SearchBar = ({ searchTerm, setSearchTerm, onSearch, isLoading }) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex items-center w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-accent">
      <div className="pl-5 pr-2 text-gray-400">
        <Icons.Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập chủ đề nghiên cứu, ví dụ: 'ứng dụng máy tính lượng tử'..."
        className="w-full py-3 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
        disabled={isLoading}
      />
      <button
        onClick={onSearch}
        disabled={isLoading}
        className="px-6 py-3 bg-brand-primary hover:bg-brand-dark text-white font-semibold rounded-full m-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out flex items-center"
      >
        {isLoading ? (
          <>
            <Icons.Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Đang tìm...
          </>
        ) : (
          <>
            <Icons.Sparkle className="w-5 h-5 mr-2" />
            Tìm kiếm
          </>
        )}
      </button>
    </div>
  );
};

// --- From components/FilterControls.tsx ---
const FilterControls = ({
    sortOption, setSortOption,
    yearFilter, setYearFilter,
    journalFilter, setJournalFilter,
    onDownload
}) => {
    const inputStyles = "bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block w-full p-2.5";
    return (
        <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg mb-4 flex flex-col md:flex-row items-center gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full flex-grow">
                <div>
                    <label htmlFor="sort-by" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Sắp xếp theo</label>
                    <select id="sort-by" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className={inputStyles}>
                        <option value="relevance_desc">Liên quan (Cao nhất)</option>
                        <option value="year_desc">Năm (Mới nhất)</option>
                        <option value="year_asc">Năm (Cũ nhất)</option>
                        <option value="citations_desc">Trích dẫn (Nhiều nhất)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-year" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Năm xuất bản</label>
                    <select id="filter-year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={inputStyles}>
                        <option value="all">Tất cả</option>
                        <option value="5">5 năm qua</option>
                        <option value="10">10 năm qua</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-journal" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tạp chí</label>
                    <input type="text" id="filter-journal" value={journalFilter} onChange={(e) => setJournalFilter(e.target.value)} placeholder="Tên tạp chí..." className={inputStyles} />
                </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <button
                    onClick={onDownload}
                    className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-md transition-colors shadow"
                >
                    <Icons.Download className="w-4 h-4 mr-2" />
                    Tải danh sách
                </button>
            </div>
        </div>
    );
};


// --- From services/geminiService.ts ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const searchPapers = async (
  query: string,
  onPaperReceived: (paper: Paper) => void
) => {
  const prompt = `
    You are a high-speed academic research assistant. Your goal is to find relevant scientific papers via Google Search and return results as fast as possible.

    For each paper, stream back one single, valid, minified JSON object on its own line.
    - DO NOT use markdown.
    - DO NOT use a JSON array wrapper.
    - Stream each result instantly.
    
    JSON structure:
    {
      "title": "Paper Title",
      "authors": ["Author One", "Author Two"],
      "year": 2024,
      "sourceJournal": "Journal Name",
      "citations": 13,
      "relevanceScore": 95,
      "relevanceTag": "Highly Relevant",
      "reasoning": "A very brief, one-sentence justification for relevance.",
      "url": "Direct URL to paper",
      "pdfAvailable": true
    }

    - Find the top 7 most relevant papers.
    - Prioritize speed above all else. A quick, relevant result is better than a perfect, slow one.
    - If a field like "citations" or "authors" is not found, omit it.
    - If no papers are found, end the stream.

    User Query: "${query}"
  `;
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI research assistant optimized for speed. Your primary goal is to return the requested JSON data as quickly and concisely as possible while maintaining accuracy.",
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    let buffer = '';
    for await (const chunk of responseStream) {
      buffer += chunk.text;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const paper = JSON.parse(line);
            onPaperReceived(paper);
          } catch (e) {
            console.warn('Failed to parse a line of stream:', line, e);
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        const paper = JSON.parse(buffer);
        onPaperReceived(paper);
      } catch (e) {
        console.warn('Failed to parse final buffer content:', buffer, e);
      }
    }

  } catch (error) {
    console.error("Error during streaming or parsing:", error);
    throw new Error(`An API error occurred: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// --- From App.tsx ---
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchProgress, setSearchProgress] = useState(0);

  // State for filtering and sorting
  const [sortOption, setSortOption] = useState('relevance_desc');
  const [yearFilter, setYearFilter] = useState('all');
  const [journalFilter, setJournalFilter] = useState('');

  const cache = useRef<Map<string, { results: Paper[] }>>(new Map());

  const handleSearch = useCallback(async () => {
    const trimmedTerm = searchTerm.trim().toLowerCase();
    if (!trimmedTerm) {
      setError('Vui lòng nhập chủ đề tìm kiếm.');
      return;
    }

    setSortOption('relevance_desc');
    setYearFilter('all');
    setJournalFilter('');

    if (cache.current.has(trimmedTerm)) {
      const cachedData = cache.current.get(trimmedTerm);
      setError(null);
      setSearchResults(cachedData.results);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    setLoadingMessage("Đang tìm kiếm trong thế giới học thuật...");
    setSearchProgress(0);

    const currentSearchPapers: Paper[] = [];

    try {
      await searchPapers(
        searchTerm,
        (paper) => {
          setSearchResults(prev => {
            const newResults = [...prev, paper];
            const progress = (newResults.length / 7) * 100;
            setSearchProgress(progress > 100 ? 100 : progress);
            setLoadingMessage(`Đã tìm thấy ${newResults.length} / 7 kết quả...`);
            return newResults;
          });
          currentSearchPapers.push(paper);
        }
      );
    } catch (err) {
      console.error(err);
      setError('Không thể truy xuất các bài nghiên cứu. AI có thể đang gặp sự cố. Vui lòng thử lại với một truy vấn khác hoặc kiểm tra console.');
    } finally {
      setIsLoading(false);
      if (currentSearchPapers.length > 0) {
        cache.current.set(trimmedTerm, {
          results: currentSearchPapers,
        });
      }
    }
  }, [searchTerm]);

  const displayedResults = useMemo(() => {
    let filtered = [...searchResults];

    if (yearFilter !== 'all') {
      const currentYear = new Date().getFullYear();
      const yearsAgo = parseInt(yearFilter, 10);
      filtered = filtered.filter(paper => paper.year && paper.year >= currentYear - yearsAgo);
    }

    if (journalFilter.trim() !== '') {
      filtered = filtered.filter(paper =>
        paper.sourceJournal?.toLowerCase().includes(journalFilter.trim().toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'year_desc':
          return (b.year || 0) - (a.year || 0);
        case 'year_asc':
          return (a.year || 0) - (b.year || 0);
        case 'citations_desc':
          return (b.citations || 0) - (a.citations || 0);
        case 'relevance_desc':
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
    });

    return filtered;
  }, [searchResults, sortOption, yearFilter, journalFilter]);

  const handleExampleSearch = (exampleTerm) => {
    setSearchTerm(exampleTerm);
  };

  const handleDownload = () => {
    if (displayedResults.length === 0) return;

    const escapeCsvField = (field: any): string => {
        if (field === undefined || field === null) {
            return '';
        }
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const headers = [
        'Title', 'Authors', 'Year', 'Source Journal', 'Citations',
        'Relevance Score', 'Relevance Tag', 'Reasoning', 'URL', 'PDF Available'
    ];

    const csvRows = displayedResults.map(paper => {
        const row = [
            escapeCsvField(paper.title),
            escapeCsvField(paper.authors?.join('; ') || ''),
            escapeCsvField(paper.year),
            escapeCsvField(paper.sourceJournal),
            escapeCsvField(paper.citations),
            escapeCsvField(paper.relevanceScore),
            escapeCsvField(paper.relevanceTag),
            escapeCsvField(paper.reasoning),
            escapeCsvField(paper.url),
            escapeCsvField(paper.pdfAvailable),
        ];
        return row.join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `scholarstream_${searchTerm.trim().replace(/\s+/g, '_') || 'results'}.csv`;
    link.setAttribute('download', fileName);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icons.Logo className="h-8 w-8 text-brand-primary" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">ScholarStream</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
              ScholarStream
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Hệ thống tổng hợp tri thức khoa học thông minh, đánh giá mức độ liên quan bài nghiên cứu và cung cấp truy xuất, tải về tài liệu gốc một cách tiện lợi và chính xác.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto sticky top-[80px] z-10 p-4 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
          <SearchBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-6">
          {error && <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
          
          {isLoading && <LoadingSpinner progress={searchProgress} message={loadingMessage} />}
          
          {!isLoading && searchResults.length > 0 && (
            <div className="mb-4">
              <FilterControls 
                sortOption={sortOption} setSortOption={setSortOption}
                yearFilter={yearFilter} setYearFilter={setYearFilter}
                journalFilter={journalFilter} setJournalFilter={setJournalFilter}
                onDownload={handleDownload}
              />
            </div>
          )}

          {!isLoading && searchResults.length === 0 && !error && (
            <div className="text-center py-16">
              <Icons.EmptyState className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Bắt đầu hành trình nghiên cứu của bạn</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Kết quả sẽ xuất hiện ở đây sau khi bạn bắt đầu tìm kiếm.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button onClick={() => handleExampleSearch('Màng bọc sinh học từ tinh bột hạt bơ')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm px-3 py-1 rounded-full transition">Thử: Màng bọc từ tinh bột bơ</button>
                <button onClick={() => handleExampleSearch('Học máy dự báo biến đổi khí hậu')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm px-3 py-1 rounded-full transition">Thử: Học máy cho biến đổi khí hậu</button>
              </div>
            </div>
          )}
          
          {!isLoading && displayedResults.length === 0 && searchResults.length > 0 && (
              <div className="text-center py-16">
                  <Icons.EmptyState className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" />
                  <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Không tìm thấy kết quả</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Hãy thử điều chỉnh bộ lọc của bạn để xem nhiều kết quả hơn.</p>
              </div>
          )}

          <div className="grid gap-6 md:grid-cols-1">
            {displayedResults.map((paper, index) => (
              <ResultCard key={`${paper.title}-${index}`} paper={paper} />
            ))}
          </div>

        </div>
      </main>

      <footer className="bg-white dark:bg-slate-800 mt-12 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row justify-center items-center gap-4">
          <p>&copy; {new Date().getFullYear()} ScholarStream.</p>
        </div>
      </footer>
    </div>
  );
};

// --- From index.tsx ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);