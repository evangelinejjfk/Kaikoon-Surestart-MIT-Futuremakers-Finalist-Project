import { schema, InputType, OutputType } from "./generate-steps_POST.schema";
import superjson from 'superjson';
import { z } from "zod";
import { getServerUserSession } from "../../helpers/getServerUserSession";

// This schema is used to validate the response from OpenAI
const openAiResponseSchema = z.object({
  steps: z.array(z.object({
    description: z.string(),
    materials: z.string().nullable(),
  })),
});

function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set.");
    throw new Error("Server configuration error: Missing OpenAI API key.");
  }
  return apiKey;
}

function createPrompt(taskTitle: string): string {
  return `
You are an expert in breaking down tasks for neurodivergent teens who struggle with executive function. Your goal is to make tasks feel less overwhelming and more achievable.

A user has given you a task title. Your job is to break it down into 3 to 6 small, clear, and actionable steps. For each step, also list any materials they might need.

The task is: "${taskTitle}"

Please provide your response in a JSON format. The JSON should be an object with a single key "steps", which is an array of objects. Each object in the array should have two keys:
1. "description": A string describing the step in simple, encouraging language. Start with a verb.
2. "materials": A string listing the necessary materials, or null if none are needed.

Example response for "Study for my history test":
{
  "steps": [
    {
      "description": "Find your history textbook and notebook.",
      "materials": "History textbook, notebook"
    },
    {
      "description": "Read through one chapter of your notes.",
      "materials": "Notebook, pen or highlighter"
    },
    {
      "description": "Try to answer 5 practice questions at the end of the chapter.",
      "materials": "Textbook, paper, pen"
    },
    {
      "description": "Take a 5-minute break to stretch or get a snack.",
      "materials": null
    },
    {
      "description": "Review the key terms from the chapter one more time.",
      "materials": "Textbook or notes"
    }
  ]
}

Now, generate the steps for the task: "${taskTitle}"
  `.trim();
}

export async function handle(request: Request) {
  try {
    // Get authenticated user (this endpoint doesn't need to filter by user ID, 
    // but we still require authentication)
    await getServerUserSession(request);

    const apiKey = getOpenAiApiKey();
    const json = superjson.parse(await request.text());
    const { title } = schema.parse(json);

    const prompt = createPrompt(title);

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
    });

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text();
      console.error("OpenAI API error:", errorBody);
      return new Response(superjson.stringify({ error: "Failed to generate steps from AI service." }), { status: 502 });
    }

    const openAiData = await openAiResponse.json();
    const content = openAiData.choices[0]?.message?.content;

    if (!content) {
      console.error("OpenAI response did not contain content:", openAiData);
      return new Response(superjson.stringify({ error: "AI service returned an empty response." }), { status: 500 });
    }

    const parsedContent = JSON.parse(content);
    const validatedData = openAiResponseSchema.parse(parsedContent);
    
    const output: OutputType = validatedData.steps;

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-steps endpoint:", error);
    if (error instanceof z.ZodError) {
      return new Response(superjson.stringify({ error: "Invalid input.", details: error.issues }), { status: 400 });
    }
    if (error instanceof Error) {
      return new Response(superjson.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(superjson.stringify({ error: "An unknown error occurred." }), { status: 500 });
  }
}