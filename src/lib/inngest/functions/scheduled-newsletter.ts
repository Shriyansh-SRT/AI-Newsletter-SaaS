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
      // 0️⃣ Check if user's newsletter is still active
      const isUserActive = await step.run("check-user-status", async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("user_preferences")
          .select("is_active")
          .eq("user_id", event.data.userId)
          .single();

        if (error) {
          console.error("Error checking user status:", error);
          return false;
        }

        return data?.is_active || false;
      });

      // If user has paused their newsletter, exit early
      if (!isUserActive) {
        console.log(
          `User ${event.data.userId} has paused their newsletter. Skipping processing.`
        );
        return {
          skipped: true,
          reason: "User newsletter is paused",
          userId: event.data.userId,
          runId: runId,
        };
      }

      // 1️⃣ Fetch articles per category
      const allArticles = await step.run("fetch-news", async () => {
        console.log(
          `Fetching articles for categories: ${event.data.categories.join(
            ", "
          )}`
        );
        return fetchArticles(event.data.categories);
      });

      // 2️⃣ Generate AI summary with improved prompt
      const summary = await step.run("summarize-news", async () => {
        try {
          return await step.ai.infer("ai-summary", {
            model: step.ai.models.openai({ model: "gpt-3.5-turbo" }),
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
        } catch (error) {
          console.error("OpenAI API error:", error);

          // Check if it's a quota error
          const errorObj = error as { error?: { code?: string } };
          if (errorObj?.error?.code === "insufficient_quota") {
            throw new Error(
              "OpenAI quota exceeded. Please check your billing or try again later."
            );
          }

          // For other AI errors, throw the original error
          throw error;
        }
      });

      return {
        summary,
        userId: event.data.userId,
        runId: runId,
      };
    } catch (error) {
      console.error("Error in newsletter generation:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
