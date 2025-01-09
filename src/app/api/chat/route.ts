import { NextResponse } from "next/server";
import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_AI_API_KEY;

interface AIResponse {
  answer: string;
  page: number | null;
  highlight: string;
}

export async function POST(req: Request) {
  try {
    const { message, context }: { message: string; context: string } =
      await req.json();

    if (!message || !context) {
      return NextResponse.json(
        { error: "Message and PDF text are required." },
        { status: 400 }
      );
    }

    const prompt = `
      The following text is extracted from a PDF document:
      "${context}"

      The user asked: "${message}"

      Respond should be this JSON object format only: '{
      "Answer": ***,
      "Page": ***(Page number(s) from the PDF where relevant information can be found. - number only, for example: 1, not Page 1),
      "Exact text to highlight": ***(Exact text or section to highlight.)
      }'`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an intelligent assistant helping with PDFs.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { error: "Invalid AI response format." },
        { status: 500 }
      );
    }

    const parsedResponse = parseResponse(aiResponse);
    return NextResponse.json({ response: parsedResponse });
  } catch (error: unknown) {
    console.error("Chat API error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}

function parseResponse(response: string): AIResponse {
  try {
    const parsedJson = JSON.parse(response);

    return {
      answer: parsedJson["Answer"] || "",
      page: parsedJson["Page"] ? parseInt(parsedJson["Page"], 10) : null,
      highlight: parsedJson["Exact text to highlight"] || "",
    };
  } catch (error) {
    console.error("Error parsing response:", error);
    return {
      answer: "",
      page: null,
      highlight: "",
    };
  }
}
