import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async () => {
  return Response.json({
    ran: true,
    tasks: ["mark-overdue-invoices", "queue-ai-analytics", "send-attendance-alerts"],
    timestamp: new Date().toISOString()
  });
});
