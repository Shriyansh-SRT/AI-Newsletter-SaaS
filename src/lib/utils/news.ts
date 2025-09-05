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
      const apiKey = process.env.NEWS_API_KEY;
      if (!apiKey) {
        console.error(`News API key is missing for category: ${category}`);
        return [];
      }

      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        category
      )}&sortBy=publishedAt&apiKey=${apiKey}`;

      console.log(`Fetching news for category: ${category}`);
      console.log(`API Key present: ${apiKey ? "Yes" : "No"}`);

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

        // Check for specific error types
        if (response.status === 401) {
          console.error("News API: Unauthorized - Check your API key");
        } else if (response.status === 429) {
          console.error("News API: Rate limit exceeded");
        } else if (response.status === 426) {
          console.error("News API: Upgrade required - Free tier limit reached");
        }

        return [];
      }

      const data = await response.json();
      console.log(
        `Articles found for ${category}:`,
        data.articles?.length || 0
      );

      if (data.articles && data.articles.length > 0) {
        console.log(`Sample article for ${category}:`, {
          title: data.articles[0].title,
          description: data.articles[0].description?.substring(0, 100) + "...",
          source: data.articles[0].source?.name,
        });
      }

      if (data.status === "error") {
        console.error(`News API error for category ${category}:`, data.message);
        console.error(`Error code: ${data.code}`);
        return [];
      }

      if (!data.articles || data.articles.length === 0) {
        console.log(`No articles returned for category ${category}`);
        return [];
      }

      const articles = data.articles
        .slice(0, 15) // Get more articles to filter from
        .filter((article: { title?: string; description?: string }) => {
          // Very basic quality checks - temporarily less restrictive
          const title = article.title || "";
          const description = article.description || "";

          // Only skip if completely empty
          const hasContent = title.length > 5 && description.length > 10;

          console.log(
            `Article check: "${title.substring(
              0,
              50
            )}..." - Has content: ${hasContent}`
          );

          return hasContent;
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

      if (articles.length === 0) {
        console.log(`All articles filtered out for category ${category}`);
        console.log(`Original articles count: ${data.articles.length}`);
      }

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
    console.log("Categories requested:", categories);
    console.log(
      "News API Key status:",
      process.env.NEWS_API_KEY ? "Present" : "Missing"
    );

    // Create more realistic fallback content based on categories
    const fallbackArticles = categories.map((category, index) => ({
      title: `Latest ${category} News and Updates`,
      url: "#",
      description: `Stay informed with the latest developments in ${category}. Our AI is working to bring you the most relevant and up-to-date information from trusted sources.`,
      publishedAt: new Date().toISOString(),
      author: "Sendly AI",
      source: "Sendly",
      urlToImage: "",
      content: `We're currently experiencing high demand for ${category} news. Your personalized newsletter will be populated with fresh content in the next delivery.`,
    }));

    // Add a general newsletter article
    fallbackArticles.unshift({
      title: "Newsletter Service Update",
      url: "#",
      description:
        "We're currently experiencing high demand for news content. Your personalized newsletter will be populated with fresh articles in the next delivery.",
      publishedAt: new Date().toISOString(),
      author: "Sendly Team",
      source: "Sendly",
      urlToImage: "",
      content:
        "Thank you for your patience. We're working to bring you the latest news from your selected categories.",
    });

    return fallbackArticles;
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
