// Types for better type safety
export interface NewsArticle {
  title: string;
  url: string;
  description: string;
  publishedAt?: string;
  author?: string;
  source?: string;
  urlToImage?: string;
  content?: string;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string; name: string };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
}

// Cache for rate limiting
const requestCache = new Map<
  string,
  { data: NewsArticle[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches articles from News API for the specified categories
 * Returns articles from the past week, with configurable limits per category
 */
export async function fetchArticles(
  categories: string[],
  articlesPerCategory: number = 5,
  maxConcurrentRequests: number = 3
): Promise<NewsArticle[]> {
  // Validate input
  if (!process.env.NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY environment variable is required");
  }

  if (categories.length === 0) {
    return [];
  }

  // Validate parameters
  if (articlesPerCategory < 1 || articlesPerCategory > 20) {
    throw new Error("articlesPerCategory must be between 1 and 20");
  }

  if (maxConcurrentRequests < 1 || maxConcurrentRequests > 5) {
    throw new Error("maxConcurrentRequests must be between 1 and 5");
  }

  // Get the latest news from last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Process categories in batches to avoid overwhelming the API
  const results: NewsArticle[][] = [];

  for (let i = 0; i < categories.length; i += maxConcurrentRequests) {
    const batch = categories.slice(i, i + maxConcurrentRequests);

    const batchPromises = batch.map(async (category) => {
      // Check cache first
      const cacheKey = `${category}-${articlesPerCategory}`;
      const cached = requestCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached results for category: ${category}`);
        return cached.data;
      }

      try {
        // Add small delay between requests to be respectful to the API
        await delay(100);

        const url = new URL("https://newsapi.org/v2/everything");
        url.searchParams.set("q", category);
        url.searchParams.set("from", since);
        url.searchParams.set("sortBy", "publishedAt");
        url.searchParams.set("language", "en");
        url.searchParams.set("apiKey", process.env.NEWS_API_KEY || "");

        const response = await fetch(url.toString(), {
          headers: {
            "User-Agent": "AI-Newsletter-App/1.0",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Error fetching articles for ${category}:`,
            response.status,
            response.statusText,
            errorText
          );

          // Handle rate limiting
          if (response.status === 429) {
            console.warn(`Rate limited for ${category}, waiting 60 seconds...`);
            await delay(60000);
            return [];
          }

          // Handle other HTTP errors
          if (response.status >= 500) {
            console.error(`Server error for ${category}, skipping...`);
            return [];
          }

          return [];
        }

        const data: NewsApiResponse = await response.json();

        if (data.status !== "ok") {
          console.error(`API error for ${category}:`, data);
          return [];
        }

        // Validate and clean articles
        const articles = data.articles
          .slice(0, articlesPerCategory)
          .map((article) => ({
            title: cleanText(article.title) || "No title",
            url: validateAndCleanUrl(article.url),
            description: cleanText(article.description) || "No description",
            publishedAt: article.publishedAt,
            author: cleanText(article.author),
            source: article.source?.name,
            urlToImage: validateAndCleanUrl(article.urlToImage),
            content: cleanText(article.content),
          }))
          .filter(
            (article) =>
              article.title !== "No title" &&
              article.url !== "#" &&
              article.description !== "No description"
          );

        // Cache the results
        requestCache.set(cacheKey, {
          data: articles,
          timestamp: Date.now(),
        });

        console.log(
          `Fetched ${articles.length} articles for category: ${category}`
        );
        return articles;
      } catch (error) {
        console.error(`Error fetching articles for ${category}:`, error);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const allArticles = results.flat();
  console.log(`Total articles fetched: ${allArticles.length}`);
  return allArticles;
}

// Helper function to get trending topics
export const getTrendingTopics = (): string[] => {
  return [
    "artificial intelligence",
    "machine learning",
    "blockchain",
    "cryptocurrency",
    "climate change",
    "renewable energy",
    "space exploration",
    "biotechnology",
    "quantum computing",
    "cybersecurity",
    "web3",
    "metaverse",
    "autonomous vehicles",
    "robotics",
    "augmented reality",
    "virtual reality",
    "5G technology",
    "edge computing",
    "cloud computing",
    "data science",
  ];
};

// Helper function to clean and validate URLs
export const validateAndCleanUrl = (url: string): string => {
  if (!url || url.trim() === "") {
    return "#";
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return "#";
    }
    return urlObj.toString();
  } catch {
    return "#";
  }
};

// Helper function to truncate text
export const truncateText = (text: string, maxLength: number = 200): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Helper function to clean text content
export const cleanText = (text: string): string => {
  if (!text) return "";

  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Helper function to clear cache
export const clearNewsCache = (): void => {
  requestCache.clear();
  console.log("News cache cleared");
};

// Helper function to get cache stats
export const getCacheStats = (): { size: number; entries: string[] } => {
  return {
    size: requestCache.size,
    entries: Array.from(requestCache.keys()),
  };
};
