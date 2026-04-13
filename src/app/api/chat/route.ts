import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withApi } from "@/lib/infra/withApi";
import { chatSchema } from "@/lib/infra/zodSchemas";
import { callClaudeText } from "@/lib/ai/claude";
import { logger } from "@/lib/infra/logger";

const SYSTEM_PROMPT = `You are a helpful, read-only assistant for international students using the F1 Dream Jobs CRM.
You can ONLY answer questions by using the provided tools. You NEVER invent facts.
If the user asks something outside the tools, say: "I can only help with questions about your applications, job matches, CVs, and interview prep."`;

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export const POST = withApi(
  async ({ body, user, requestId }) => {
    const supabase = createServerClient();
    const { thread_id, message } = body;

    // Resolve student_id from auth user
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user!.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    const studentId = student.id;

    // Get or create thread
    let tid = thread_id;
    if (!tid) {
      const { data: t } = await supabase
        .from("chat_threads")
        .insert({ student_id: studentId, title: "Assistant" })
        .select("id")
        .single();
      tid = t!.id;
    }

    // Append user message
    await supabase.from("chat_messages").insert({
      thread_id: tid,
      role: "user",
      content: message,
      tool_calls: null,
    } as any);

    // Fetch recent history (last 10 messages)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content, tool_calls")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true })
      .limit(20);

    const recent = (history || []).slice(-10);

    // Build conversation for Claude
    const conversation = recent.map((m) => {
      if (m.role === "tool") {
        return { role: "user" as const, content: `Tool result: ${m.content}` };
      }
      return { role: m.role as "user" | "assistant", content: m.content || "" };
    });

    // Tool definitions injected into the user prompt (Claude doesn't support OpenAI-style tool schema in the same way,
    // but we can describe them explicitly and ask for JSON tool calls)
    const toolsDescription = `
Available tools (respond with a JSON object inside a markdown code block):
- get_applications(student_id: string)
- get_job_matches(student_id: string, limit?: number)
- get_evaluation(application_id: string)
- get_interview_prep(application_id: string)
- get_generated_cvs(student_id: string)

If you need to use one or more tools, respond ONLY with a JSON array of tool calls like:
\`\`\`json
[{"id":"1","name":"get_job_matches","arguments":{"student_id":"${studentId}","limit":5}}]
\`\`\`
If no tool is needed, respond normally.`;

    const userPrompt = `${toolsDescription}\n\nUser message: ${message}`;

    let assistantContent = "";
    let toolCalls: ToolCall[] = [];

    try {
      const { text: raw } = await callClaudeText(
        SYSTEM_PROMPT,
        conversation.length > 0
          ? `Conversation so far:\n${conversation.map((c) => `${c.role}: ${c.content}`).join("\n")}\n\n${userPrompt}`
          : userPrompt,
        { feature: "chat", maxTokens: 4096, userId: user!.id }
      );
      assistantContent = raw;

      // Try to parse tool calls
      const match = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          toolCalls = parsed as ToolCall[];
        }
      }
    } catch (err) {
      logger.error({ requestId, error: String(err) }, "Chat AI call failed");
      assistantContent = "Sorry, I had trouble processing that. Please try again.";
    }

    // Execute tool calls
    const toolResults: { id: string; content: string }[] = [];
    for (const tc of toolCalls) {
      const result = await executeTool(supabase, tc, studentId);
      toolResults.push({ id: tc.id, content: JSON.stringify(result) });
    }

    // Store assistant message
    await supabase.from("chat_messages").insert({
      thread_id: tid,
      role: "assistant",
      content: assistantContent,
      tool_calls: toolCalls.length > 0 ? (toolCalls as any) : null,
    } as any);

    // Store tool result messages
    for (const tr of toolResults) {
      await supabase.from("chat_messages").insert({
        thread_id: tid,
        role: "tool",
        content: tr.content,
        tool_calls: null,
      } as any);
    }

    // If there were tool calls, make a follow-up call to Claude with the results
    if (toolResults.length > 0) {
      const followUpHistory = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("thread_id", tid)
        .order("created_at", { ascending: true })
        .limit(30);

      const followUpConversation = (followUpHistory.data || []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content || "",
      }));

      try {
        const { text: followUpRaw } = await callClaudeText(
          SYSTEM_PROMPT,
          `Use the tool results to answer the user's question. Do not call additional tools.\n\n${followUpConversation
            .map((c) => `${c.role}: ${c.content}`)
            .join("\n")}`,
          { feature: "chat", maxTokens: 4096, userId: user!.id }
        );

        await supabase.from("chat_messages").insert({
          thread_id: tid,
          role: "assistant",
          content: followUpRaw,
          tool_calls: null,
        } as any);
      } catch (err) {
        logger.error({ requestId, error: String(err) }, "Chat follow-up failed");
      }
    }

    // Return latest messages
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, role, content, tool_calls, created_at")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    return NextResponse.json({ thread_id: tid, messages: messages || [] });
  },
  { method: "POST", allowedRoles: ["student"], bodySchema: chatSchema, rateLimit: "chat" }
);

async function executeTool(
  supabase: ReturnType<typeof createServerClient>,
  tool: ToolCall,
  fallbackStudentId: string
): Promise<unknown> {
  switch (tool.name) {
    case "get_applications": {
      const sid = (tool.arguments.student_id as string) || fallbackStudentId;
      const { data } = await supabase
        .from("applications")
        .select("id, company_name, job_role, status, applied_at")
        .eq("student_id", sid)
        .order("applied_at", { ascending: false })
        .limit(20);
      return { applications: data || [] };
    }
    case "get_job_matches": {
      const sid = (tool.arguments.student_id as string) || fallbackStudentId;
      const limit = (tool.arguments.limit as number) || 10;
      const { data } = await supabase
        .from("job_matches")
        .select("id, company_name, job_role, overall_score, grade, match_status")
        .eq("student_id", sid)
        .order("overall_score", { ascending: false })
        .limit(limit);
      return { matches: data || [] };
    }
    case "get_evaluation": {
      const appId = tool.arguments.application_id as string;
      const { data } = await supabase
        .from("evaluation_scores")
        .select("overall_score, grade, archetype, recommendation, keywords")
        .eq("application_id", appId)
        .single();
      return { evaluation: data || null };
    }
    case "get_interview_prep": {
      const appId = tool.arguments.application_id as string;
      const { data } = await supabase
        .from("interview_prep")
        .select("company_name, job_role, prep_data")
        .eq("application_id", appId)
        .single();
      return { prep: data || null };
    }
    case "get_generated_cvs": {
      const sid = (tool.arguments.student_id as string) || fallbackStudentId;
      const { data } = await supabase
        .from("generated_cvs")
        .select("id, company_name, job_role, pdf_url, keyword_coverage")
        .eq("student_id", sid)
        .order("created_at", { ascending: false })
        .limit(20);
      return { cvs: data || [] };
    }
    default:
      return { error: "Unknown tool" };
  }
}
