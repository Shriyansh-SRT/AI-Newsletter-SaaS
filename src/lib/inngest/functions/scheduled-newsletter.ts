import { fetchArticles, NewsArticle } from "@/lib/utils/news";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "../client";
import { marked } from "marked";
import emailjs from "@emailjs/nodejs";

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

      const newsletterContent = summary.choices[0].message.content;

      if (!newsletterContent) {
        throw new Error("No newsletter content generated");
      }

      //convert markdown to html for email
      const htmlContent = marked(newsletterContent);

      //send email using emailjs
      await step.run("send-email", async () => {
        const templateParams = {
          to_email: event.data.email,
          newsletter_content: htmlContent,
          categories: event.data.categories.join(", "),
          article_count: allArticles.length,
          current_date: new Date().toLocaleDateString(),
        };

        // setup emailjs with your serviceid, templateid and public key
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          throw new Error("EmailJS credentials not found");
        }

        try {
          const response = await emailjs.send(
            serviceId,
            templateId,
            templateParams,
            {
              publicKey: publicKey,
            }
          );
          console.log("Email sent successfully:", response);
          return response;
        } catch (error) {
          console.error("Error sending email:", error);
        }
      });

      if (!event.data.isTest) {
        // 4️⃣ Schedule the next newsletter based on frequency
        await step.run("schedule-next", async () => {
          const now = new Date();
          let nextScheduleTime: Date;

          switch (event.data.frequency) {
            case "daily":
              nextScheduleTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case "weekly":
              nextScheduleTime = new Date(
                now.getTime() + 7 * 24 * 60 * 60 * 1000
              );
              break;
            case "biweekly":
              nextScheduleTime = new Date(
                now.getTime() + 3 * 24 * 60 * 60 * 1000
              );
              break;
            default:
              nextScheduleTime = new Date(
                now.getTime() + 7 * 24 * 60 * 60 * 1000
              );
          }
          nextScheduleTime.setHours(9, 0, 0, 0);

          // Schedule the next newsletter
          await inngest.send({
            name: "newsletter.schedule",
            data: {
              userId: event.data.userId,
              email: event.data.email,
              categories: event.data.categories,
              frequency: event.data.frequency,
              scheduledFor: nextScheduleTime.toISOString(),
            },
            ts: nextScheduleTime.getTime(),
          });

          console.log(
            `Next newsletter scheduled for: ${nextScheduleTime.toISOString()}`
          );
        });
      }
      const result = {
        newsletter: newsletterContent,
        articleCount: allArticles.length,
        categories: event.data.categories,
        emailSent: true,
        nextScheduled: true,
        success: true,
        runId: runId,
      };
      return result;
    } catch (error) {
      console.error("Error in newsletter generation:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
        runId: runId,
      };
    }
  }
);
