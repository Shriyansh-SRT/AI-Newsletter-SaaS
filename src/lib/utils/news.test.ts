import {
  fetchArticles,
  getTrendingTopics,
  validateAndCleanUrl,
  truncateText,
  clearNewsCache,
  getCacheStats,
} from "./news";

// Example usage and testing
async function testNewsAPI() {
  try {
    console.log("Testing News API...");

    // Test cache stats before
    console.log("Cache stats before:", getCacheStats());

    // Test with a few categories
    const testCategories = ["artificial intelligence", "blockchain"];
    const articles = await fetchArticles(testCategories, 2, 1);

    console.log(`Fetched ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source || "Unknown"}`);
      console.log(`   Published: ${article.publishedAt || "Unknown"}`);
      console.log(`   URL: ${validateAndCleanUrl(article.url)}`);
      console.log(`   Description: ${truncateText(article.description, 100)}`);
      console.log("---");
    });

    // Test trending topics
    console.log("Trending topics:", getTrendingTopics());

    // Test cache stats after
    console.log("Cache stats after:", getCacheStats());

    // Test cache clearing
    clearNewsCache();
    console.log("Cache stats after clearing:", getCacheStats());
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Uncomment to run test
// testNewsAPI();

export { testNewsAPI };
