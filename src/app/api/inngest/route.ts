import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions/functions";

// Create an API that serves all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
