# News API Module

A comprehensive news fetching and processing module for the AI Newsletter App.

## Features

- 🔄 **Concurrent fetching** with rate limiting
- 💾 **Intelligent caching** (5-minute cache duration)
- 🛡️ **Error handling** with graceful fallbacks
- 🧹 **Data cleaning** and validation
- 📊 **Multiple endpoints** (everything, top headlines)
- ⚡ **Performance optimized** with batching

## Configuration

The module uses a centralized configuration object:

```typescript
const API_CONFIG = {
  BASE_URL: "https://newsapi.org/v2/everything",
  TIMEOUT: 10000, // 10 seconds
  RATE_LIMIT_DELAY: 100, // 100ms between requests
  RATE_LIMIT_WAIT: 60000, // 60 seconds when rate limited
  MAX_CONCURRENT: 3,
  DEFAULT_ARTICLES_PER_CATEGORY: 5,
  LOOKBACK_DAYS: 7,
};
```

## Main Functions

### `fetchArticles(categories, articlesPerCategory, maxConcurrentRequests)`

Fetches articles from multiple categories concurrently.

```typescript
const articles = await fetchArticles(
  ["artificial intelligence", "blockchain"], // categories
  3, // articles per category
  2 // max concurrent requests
);
```

**Parameters:**

- `categories`: Array of search terms
- `articlesPerCategory`: Number of articles per category (1-20)
- `maxConcurrentRequests`: Max concurrent API calls (1-5)

**Returns:** Array of `NewsArticle` objects

### `fetchTopHeadlines(country, category, pageSize)`

Fetches top headlines from a specific country and category.

```typescript
const headlines = await fetchTopHeadlines("us", "technology", 10);
```

**Parameters:**

- `country`: Country code (e.g., "us", "gb")
- `category`: News category (optional)
- `pageSize`: Number of headlines (default: 10)

## Helper Functions

### Data Cleaning

- `cleanText(text)`: Removes control characters and normalizes whitespace
- `validateAndCleanUrl(url)`: Validates and cleans URLs
- `truncateText(text, maxLength)`: Truncates text to specified length

### Content Management

- `getTrendingTopics()`: Returns array of trending tech topics
- `clearNewsCache()`: Clears the internal cache
- `getCacheStats()`: Returns cache statistics

## Data Types

### `NewsArticle`

```typescript
interface NewsArticle {
  title: string;
  url: string;
  description: string;
  publishedAt?: string;
  author?: string;
  source?: string;
  urlToImage?: string;
  content?: string;
}
```

### `NewsApiResponse`

```typescript
interface NewsApiResponse {
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
```

## Error Handling

The module handles various error scenarios:

- **Rate limiting (429)**: Waits 60 seconds and retries
- **Server errors (5xx)**: Skips the request and continues
- **Invalid URLs**: Replaces with "#"
- **Missing data**: Uses fallback values
- **API errors**: Logs and returns empty array

## Caching

- **Duration**: 5 minutes
- **Key format**: `${category}-${articlesPerCategory}`
- **Automatic**: No manual intervention required
- **Clearable**: Use `clearNewsCache()` to clear

## Rate Limiting

- **Between requests**: 100ms delay
- **When rate limited**: 60-second wait
- **Concurrent limit**: Configurable (default: 3)

## Usage Examples

### Basic Usage

```typescript
import { fetchArticles, getTrendingTopics } from "@/lib/utils/news";

// Get articles for trending topics
const topics = getTrendingTopics().slice(0, 3);
const articles = await fetchArticles(topics, 5);
```

### Advanced Usage

```typescript
import {
  fetchArticles,
  fetchTopHeadlines,
  clearNewsCache,
  getCacheStats,
} from "@/lib/utils/news";

// Custom categories with specific settings
const customCategories = ["quantum computing", "AI ethics"];
const articles = await fetchArticles(customCategories, 3, 2);

// Get top headlines
const headlines = await fetchTopHeadlines("us", "technology", 5);

// Cache management
console.log("Cache stats:", getCacheStats());
clearNewsCache();
```

### Error Handling

```typescript
try {
  const articles = await fetchArticles(["ai"], 5);
  if (articles.length === 0) {
    console.log("No articles found");
  }
} catch (error) {
  console.error("Failed to fetch articles:", error);
}
```

## Environment Variables

Required:

- `NEWS_API_KEY`: Your NewsAPI.org API key

## Performance Tips

1. **Use caching**: The module automatically caches results
2. **Limit concurrent requests**: Don't exceed 5 concurrent requests
3. **Batch categories**: Group related categories together
4. **Monitor rate limits**: Check logs for 429 errors

## Monitoring

The module provides comprehensive logging:

- Cache hits/misses
- API response times
- Error details
- Rate limiting events

## Testing

Run the test suite:

```typescript
import { testNewsAPI } from "@/lib/utils/news.test";

// Uncomment to run tests
// testNewsAPI();
```

## Integration with Newsletter System

This module is designed to work seamlessly with the newsletter system:

```typescript
// In scheduled-newsletter.ts
const articles = await fetchArticles(
  event.data.categories,
  isUserActive.frequency === "daily" ? 2 : 3,
  Math.min(event.data.categories.length, 3)
);
```
