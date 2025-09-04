import { inngest } from "@/lib/inngest/client";
import { fetchArticles } from "@/lib/utils/news";
import { Resend } from "resend";
import { marked } from "marked";
import { createClient } from "@/lib/supabase/server";

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

      // 2️⃣ Generate newsletter content (template-based, no AI required)
      const newsletterContent = await step.run(
        "generate-newsletter",
        async () => {
          console.log("Generating newsletter using template...");

          const date = new Date().toLocaleDateString();
          const topArticles = allArticles.slice(0, 5);

          return `# Your Personalized Newsletter

## 📰 Top Stories This Week

${topArticles
  .map(
    (article, index) => `
### ${index + 1}. ${article.title}

${article.description}

**Source:** ${article.source}
**Read more:** [${article.title}](${article.url})
`
  )
  .join("\n")}

## 📊 Newsletter Summary

- **Categories:** ${event.data.categories.join(", ")}
- **Articles Analyzed:** ${allArticles.length}
- **Generated:** ${date}
- **Frequency:** ${event.data.frequency}

## 🔗 Quick Links

${topArticles
  .slice(0, 3)
  .map((article, index) => `${index + 1}. [${article.title}](${article.url})`)
  .join("\n")}

---

*This newsletter was automatically generated based on your selected categories. Stay informed with the latest news and insights!*

**Categories:** ${event.data.categories.join(", ")}
**Total Articles:** ${allArticles.length}
**Generated on:** ${date}`;
        }
      );

      if (!newsletterContent) {
        throw new Error("Failed to generate newsletter content");
      }

      // Convert markdown to HTML for email
      const htmlContent = marked(newsletterContent);

      // 3️⃣ Send email using Resend
      await step.run("send-email", async () => {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const subject = `📰 Your ${
          event.data.frequency
        } newsletter: ${event.data.categories.join(", ")}`;

        try {
          console.log("Sending email via Resend...");

          const { data, error } = await resend.emails.send({
            from: "onboarding@resend.dev", // Use this for testing
            to: [event.data.email],
            subject: subject,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${subject}</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
                    .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                    .subtitle { color: #666; font-size: 14px; }
                    .content { background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
                    .stats { background: linear-gradient(135deg, #dbeafe, #eff6ff); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
                    .stats h3 { color: #1e40af; margin: 0 0 10px 0; font-size: 16px; }
                    .stats p { margin: 5px 0; color: #1f2937; font-size: 13px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <div class="logo">📰 AI Newsletter</div>
                    <div class="subtitle">Your personalized news digest</div>
                  </div>
                  
                  <div class="stats">
                    <h3>📊 Newsletter Summary</h3>
                    <p><strong>Categories:</strong> ${event.data.categories.join(
                      ", "
                    )}</p>
                    <p><strong>Articles analyzed:</strong> ${
                      allArticles.length
                    }</p>
                    <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
                  </div>
                  
                  <div class="content">
                    ${htmlContent}
                  </div>
                  
                  <div class="footer">
                    <p>This newsletter was generated just for you using AI technology.</p>
                    <p>Thanks for being part of our community!</p>
                  </div>
                </body>
              </html>
            `,
          });

          if (error) {
            console.error("Resend error:", error);
            throw error;
          }

          console.log("Email sent successfully via Resend:", data);
          return data;
        } catch (error) {
          console.error("Email sending failed:", error);
          throw error;
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
                now.getTime() + 14 * 24 * 60 * 60 * 1000
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
      console.error("Scheduled newsletter generation failed:", error);
      throw error;
    }
  }
);
