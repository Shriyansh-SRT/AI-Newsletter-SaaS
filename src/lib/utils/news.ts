/**
 * Fetches articles from News API for the specified categories
 * Returns articles from the past week, limited to 5 per category
 */

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

/**
 * Fetches articles from News API for the specified categories
 * Returns articles from the past week, limited to 5 per category
 */
export async function fetchArticles(
  categories: string[]
): Promise<NewsArticle[]> {
  // Remove date restriction since your NewsAPI plan doesn't support it
  console.log("Fetching articles for categories:", categories);
  console.log(
    "Using NewsAPI key:",
    process.env.NEWS_API_KEY ? "Set" : "Missing"
  );

  const promises = categories.map(async (category) => {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        category
      )}&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;

      console.log(`Fetching news for category: ${category}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`Response status for ${category}:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to fetch news for category ${category}:`,
          response.status,
          response.statusText,
          errorText
        );
        return [];
      }

      const data = await response.json();
      console.log(
        `Articles found for ${category}:`,
        data.articles?.length || 0
      );

      if (data.status === "error") {
        console.error(`News API error for category ${category}:`, data.message);
        return [];
      }

      const articles = data.articles
        .slice(0, 10) // Get more articles to filter from
        .filter((article: any) => {
          // Filter out low-quality articles
          const title = article.title?.toLowerCase() || "";
          const description = article.description?.toLowerCase() || "";

          // Skip package releases, version updates, etc.
          const skipPatterns = [
            /^\d+\.\d+\.\d+/, // Version numbers like 2.21.0
            /^tf-nightly/, // TensorFlow nightly builds
            /^release/, // Release announcements
            /^update/, // Update announcements
            /^version/, // Version announcements
            /^changelog/, // Changelog entries
            /^patch/, // Patch releases
            /^hotfix/, // Hotfix releases
          ];

          return !skipPatterns.some((pattern) => pattern.test(title));
        })
        .slice(0, 5) // Take top 5 after filtering
        .map(
          (article: {
            title?: string;
            url?: string;
            description?: string;
            publishedAt?: string;
            author?: string;
            source?: { name?: string };
            urlToImage?: string;
            content?: string;
          }) => ({
            title: article.title || "No title",
            url: article.url || "#",
            description: article.description || "No description available",
            publishedAt: article.publishedAt || "No published date available",
            author: article.author || "No author available",
            source: article.source?.name || "No source available",
            urlToImage: article.urlToImage || "No image available",
            content: article.content || "No content available",
          })
        );

      console.log(`Processed ${articles.length} articles for ${category}`);
      return articles;
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error);
      return [];
    }
  });

  const results = await Promise.all(promises);
  const allArticles = results.flat();
  console.log(`Total articles fetched: ${allArticles.length}`);

  // If no articles found, return some fallback content
  if (allArticles.length === 0) {
    console.log("No articles found, returning fallback content");
    return [
      {
        title: "AI Newsletter Service",
        url: "#",
        description:
          "Welcome to your personalized AI newsletter! We're currently setting up your news feed.",
        publishedAt: new Date().toISOString(),
        author: "AI Newsletter",
        source: "AI Newsletter",
        urlToImage: "",
        content:
          "Your newsletter is being prepared with the latest news from your selected categories.",
      },
    ];
  }

  return allArticles;
}

// Helper function to get trending topics
// export const getTrendingTopics = (): string[] => {
//   return [
//     "artificial intelligence",
//     "machine learning",
//     "blockchain",
//     "cryptocurrency",
//     "climate change",
//     "renewable energy",
//     "space exploration",
//     "biotechnology",
//     "quantum computing",
//     "cybersecurity",
//     "web3",
//     "metaverse",
//     "autonomous vehicles",
//     "robotics",
//     "augmented reality",
//     "virtual reality",
//     "5G technology",
//     "edge computing",
//     "cloud computing",
//     "data science",
//   ];
// };

// // Helper function to clean and validate URLs
// export const validateAndCleanUrl = (url: string): string => {
//   if (!url || url.trim() === "") {
//     return "#";
//   }

//   try {
//     const urlObj = new URL(url);
//     // Only allow http and https protocols
//     if (!["http:", "https:"].includes(urlObj.protocol)) {
//       return "#";
//     }
//     return urlObj.toString();
//   } catch {
//     return "#";
//   }
// };

// Helper function to truncate text
// export const truncateText = (text: string, maxLength: number = 200): string => {
//   if (!text || text.length <= maxLength) return text;
//   return text.substring(0, maxLength).trim() + "...";
// };

// Helper function to clean text content
// export const cleanText = (text: string): string => {
//   if (!text) return "";

//   return text
//     .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
//     .replace(/\s+/g, " ") // Normalize whitespace
//     .trim();
// };

// Helper function to clear cache
// export const clearNewsCache = (): void => {
//   requestCache.clear();
//   console.log("News cache cleared");
// };

// // Helper function to get cache stats
// export const getCacheStats = (): { size: number; entries: string[] } => {
//   return {
//     size: requestCache.size,
//     entries: Array.from(requestCache.keys()),
//   };
// };
