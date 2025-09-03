import { fetchArticles, NewsArticle } from "@/lib/utils/news";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "../client";

// Types for better type safety
interface NewsletterEvent {
  userId: string;
  categories: string[];
  frequency?: "daily" | "weekly";
}

interface NewsletterSummary {
  title: string;
  content: string;
  subjectLine: string;
}

export default inngest.createFunction(
  { id: "newsletter/scheduled" },
  { event: "newsletter.schedule" },
  async ({ event, step, runId }) => {
    try {
      // Validate event data
      if (
        !event.data.userId ||
        !event.data.categories ||
        event.data.categories.length === 0
      ) {
        throw new Error(
          "Invalid event data: userId and categories are required"
        );
      }

      // 0️⃣ Check if user's newsletter is still active
      const isUserActive = await step.run("check-user-status", async () => {
        try {
          const supabase = await createClient();
          const { data, error } = await supabase
            .from("user_preferences")
            .select("is_active, newsletter_frequency")
            .eq("user_id", event.data.userId)
            .single();

          if (error) {
            console.error("Error checking user status:", error);
            return { isActive: false, frequency: "weekly" };
          }

          return {
            isActive: data?.is_active || false,
            frequency: data?.newsletter_frequency || "weekly",
          };
        } catch (error) {
          console.error("Failed to check user status:", error);
          return { isActive: false, frequency: "weekly" };
        }
      });

      // If user has paused their newsletter, exit early
      if (!isUserActive.isActive) {
        console.log(
          `User ${event.data.userId} has paused their newsletter. Skipping processing.`
        );
        return {
          skipped: true,
          reason: "User newsletter is paused",
          userId: event.data.userId,
          runId: runId,
          timestamp: new Date().toISOString(),
        };
      }

      // 1️⃣ Fetch articles per category with better error handling
      const allArticles = await step.run("fetch-news", async () => {
        try {
          console.log(
            `Fetching articles for user ${
              event.data.userId
            } with categories: ${event.data.categories.join(", ")}`
          );

          // Use user's preferred frequency to determine article count
          const articlesPerCategory =
            isUserActive.frequency === "daily" ? 2 : 3;
          const maxConcurrent = Math.min(event.data.categories.length, 3); // Cap at 3 concurrent requests

          const articles = await fetchArticles(
            event.data.categories,
            articlesPerCategory,
            maxConcurrent
          );

          // Filter out articles with missing essential data
          const validArticles = articles.filter(
            (article: NewsArticle) =>
              article.title &&
              article.title !== "No title" &&
              article.url &&
              article.url !== "#"
          );

          console.log(
            `Fetched ${validArticles.length} valid articles out of ${articles.length} total for user ${event.data.userId}`
          );

          if (validArticles.length === 0) {
            throw new Error(
              "No valid articles found for the requested categories"
            );
          }

          return validArticles;
        } catch (error) {
          console.error("Failed to fetch articles:", error);
          throw error;
        }
      });

      // 2️⃣ Generate AI summary with improved prompt
      const summary = await step.ai.infer("summarize-news", {
        model: step.ai.models.openai({ model: "gpt-4o" }),
        body: {
          messages: [
            {
              role: "system",
              content: `You are an expert newsletter editor creating a personalized newsletter for a tech-savvy audience. 
              
              Your task is to create an engaging, informative newsletter that:
              - Highlights the most important and interesting stories
              - Provides context and insights that add value
              - Uses a friendly, conversational tone
              - Is well-structured with clear sections
              - Includes a compelling subject line for email
              - Keeps the reader informed and engaged
              
              Format your response as JSON with the following structure:
              {
                "title": "Newsletter Title",
                "subjectLine": "Email Subject Line",
                "content": "Formatted newsletter content with sections, bullet points, and clear organization"
              }
              
              Make the content email-friendly with:
              - Clear section headers
              - Bullet points for key takeaways
              - Brief but informative summaries
              - Call-to-action suggestions where appropriate
              - Professional yet approachable tone`,
            },
            {
              role: "user",
              content: `Create a newsletter summary for these articles from the past week. 
              
              User ID: ${event.data.userId}
              Newsletter Frequency: ${isUserActive.frequency}
              Categories requested: ${event.data.categories.join(", ")}
              
              Articles to summarize:
              ${allArticles
                .map(
                  (article: NewsArticle, index: number) =>
                    `${index + 1}. ${article.title}\n   Description: ${
                      article.description
                    }\n   Source: ${
                      article.source || "Unknown"
                    }\n   Published: ${
                      article.publishedAt || "Unknown"
                    }\n   URL: ${article.url}\n`
                )
                .join("\n")}
              
              Please provide a JSON response with title, subjectLine, and content fields.`,
            },
          ],
          temperature: 0.7,
        },
      });

      // 3️⃣ Parse and validate AI response
      const newsletterData = await step.run("parse-summary", async () => {
        try {
          let parsedSummary: NewsletterSummary;

          // Extract content from AI response
          const aiContent = summary.choices?.[0]?.message?.content;
          if (!aiContent) {
            throw new Error("No content received from AI");
          }

          // Try to parse JSON response
          try {
            parsedSummary = JSON.parse(aiContent);
          } catch (parseError) {
            // If JSON parsing fails, treat as plain text
            parsedSummary = {
              title: `Your ${isUserActive.frequency} Newsletter`,
              subjectLine: `Your ${isUserActive.frequency} news digest is ready`,
              content: aiContent,
            };
          }

          // Validate required fields
          if (
            !parsedSummary.title ||
            !parsedSummary.content ||
            !parsedSummary.subjectLine
          ) {
            throw new Error("Missing required fields in AI summary");
          }

          return {
            ...parsedSummary,
            articleCount: allArticles.length,
            categories: event.data.categories,
            generatedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error("Failed to parse AI summary:", error);
          // Fallback to basic summary
          return {
            title: `Your ${isUserActive.frequency} Newsletter`,
            subjectLine: `Your ${isUserActive.frequency} news digest is ready`,
            content: `Here are the latest articles from your selected categories:\n\n${allArticles
              .map(
                (article: NewsArticle, index: number) =>
                  `${index + 1}. ${article.title}\n   ${
                    article.description
                  }\n   Read more: ${article.url}\n`
              )
              .join("\n")}`,
            articleCount: allArticles.length,
            categories: event.data.categories,
            generatedAt: new Date().toISOString(),
          };
        }
      });

      // 4️⃣ Store newsletter data for email sending
      await step.run("store-newsletter", async () => {
        try {
          const supabase = await createClient();
          const { error } = await supabase.from("newsletter_queue").insert({
            user_id: event.data.userId,
            newsletter_data: newsletterData,
            status: "pending",
            created_at: new Date().toISOString(),
            run_id: runId,
          });

          if (error) {
            console.error("Failed to store newsletter:", error);
            throw error;
          }

          console.log(`Newsletter stored for user ${event.data.userId}`);
        } catch (error) {
          console.error("Failed to store newsletter data:", error);
          throw error;
        }
      });

      // TODO: Add email sending logic here (will be handled by separate function)
      console.log(
        `Newsletter processing completed for user ${event.data.userId}`
      );

      return {
        success: true,
        userId: event.data.userId,
        runId: runId,
        newsletterData: {
          title: newsletterData.title,
          subjectLine: newsletterData.subjectLine,
          articleCount: newsletterData.articleCount,
          categories: newsletterData.categories,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Newsletter processing failed:", error);

      // Store error for monitoring
      await step.run("log-error", async () => {
        try {
          const supabase = await createClient();
          await supabase.from("newsletter_errors").insert({
            user_id: event.data.userId,
            error_message:
              error instanceof Error ? error.message : String(error),
            run_id: runId,
            created_at: new Date().toISOString(),
          });
        } catch (logError) {
          console.error("Failed to log error:", logError);
        }
      });

      throw error;
    }
  }
);
