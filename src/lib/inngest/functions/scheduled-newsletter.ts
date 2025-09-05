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
          console.log("Total articles available:", allArticles.length);
          console.log(
            "Article titles:",
            allArticles.map((a) => a.title)
          );

          const date = new Date().toLocaleDateString();
          const topArticles = allArticles.slice(0, 5);

          console.log("Top articles selected:", topArticles.length);
          console.log(
            "Top article titles:",
            topArticles.map((a) => a.title)
          );

          return `# Your Personalized Newsletter

## 📰 Top Stories This Week

${topArticles
  .map(
    (article, index) => `
### ${index + 1}. ${article.title}

${article.description || "No description available for this article."}

**Source:** ${article.source || "Unknown"}
**Published:** ${
      article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString()
        : "Unknown date"
    }
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

        const subject = `Your ${event.data.frequency} newsletter from Sendly`;

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
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                      line-height: 1.6; 
                      color: #1a1a1a; 
                      background-color: #f8fafc;
                      margin: 0;
                      padding: 0;
                    }
                    .email-container { 
                      max-width: 680px; 
                      margin: 0 auto; 
                      background-color: #ffffff;
                      border-radius: 12px;
                      overflow: hidden;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                    .header { 
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      padding: 40px 32px;
                      text-align: center;
                      color: white;
                    }
                    .logo { 
                      font-size: 32px; 
                      font-weight: 700; 
                      margin-bottom: 8px;
                      letter-spacing: -0.5px;
                    }
                    .subtitle { 
                      font-size: 16px; 
                      opacity: 0.9;
                      font-weight: 400;
                    }
                    .content-wrapper {
                      padding: 40px 32px;
                    }
                    .stats { 
                      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                      border-radius: 12px; 
                      padding: 24px; 
                      margin-bottom: 32px;
                      border: 1px solid #e2e8f0;
                    }
                    .stats-title { 
                      color: #334155; 
                      margin: 0 0 16px 0; 
                      font-size: 18px; 
                      font-weight: 600;
                    }
                    .stats-grid {
                      display: grid;
                      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                      gap: 16px;
                    }
                    .stat-item {
                      background: white;
                      padding: 16px;
                      border-radius: 8px;
                      border: 1px solid #e2e8f0;
                    }
                    .stat-label {
                      font-size: 12px;
                      color: #64748b;
                      font-weight: 500;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      margin-bottom: 4px;
                    }
                    .stat-value {
                      font-size: 16px;
                      color: #1e293b;
                      font-weight: 600;
                    }
                    .content { 
                      background-color: #ffffff; 
                      border-radius: 12px; 
                      padding: 32px; 
                      margin: 0;
                      border: 1px solid #e2e8f0;
                    }
                    .content h1, .content h2, .content h3 {
                      color: #1e293b;
                      margin-bottom: 16px;
                      font-weight: 600;
                    }
                    .content h1 { font-size: 24px; }
                    .content h2 { font-size: 20px; }
                    .content h3 { font-size: 18px; }
                    .content p {
                      margin-bottom: 16px;
                      color: #475569;
                      line-height: 1.7;
                    }
                    .content ul, .content ol {
                      margin-bottom: 16px;
                      padding-left: 24px;
                    }
                    .content li {
                      margin-bottom: 8px;
                      color: #475569;
                    }
                    .content a {
                      color: #667eea;
                      text-decoration: none;
                      font-weight: 500;
                    }
                    .content a:hover {
                      text-decoration: underline;
                    }
                    .content strong {
                      color: #1e293b;
                      font-weight: 600;
                    }
                    .footer { 
                      background-color: #f8fafc;
                      padding: 32px;
                      text-align: center; 
                      border-top: 1px solid #e2e8f0;
                    }
                    .footer p {
                      color: #64748b; 
                      font-size: 14px;
                      margin-bottom: 8px;
                    }
                    .footer-brand {
                      margin-top: 16px;
                      padding-top: 16px;
                      border-top: 1px solid #e2e8f0;
                    }
                    .footer-brand p {
                      font-size: 12px;
                      color: #94a3b8;
                    }
                    @media (max-width: 600px) {
                      .email-container { margin: 0; border-radius: 0; }
                      .header, .content-wrapper, .footer { padding: 24px 20px; }
                      .stats-grid { grid-template-columns: 1fr; }
                      .logo { font-size: 28px; }
                    }
                  </style>
                </head>
                <body>
                  <div class="email-container">
                    <div class="header">
                      <div class="logo">Sendly</div>
                      <div class="subtitle">Your personalized AI newsletter</div>
                    </div>
                    
                    <div class="content-wrapper">
                      <div class="stats">
                        <h3 class="stats-title">Newsletter Summary</h3>
                        <div class="stats-grid">
                          <div class="stat-item">
                            <div class="stat-label">Categories</div>
                            <div class="stat-value">${event.data.categories.join(
                              ", "
                            )}</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-label">Articles</div>
                            <div class="stat-value">${
                              allArticles.length
                            } analyzed</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-label">Generated</div>
                            <div class="stat-value">${new Date().toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="content">
                        ${htmlContent}
                      </div>
                    </div>
                    
                    <div class="footer">
                      <p>This newsletter was crafted just for you using advanced AI technology.</p>
                      <p>Thank you for being part of the Sendly community!</p>
                      <div class="footer-brand">
                        <p>© 2024 Sendly. All rights reserved.</p>
                      </div>
                    </div>
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
