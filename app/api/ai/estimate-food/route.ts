import { NextResponse } from "next/server";
import { getSessionUser } from "../../../_lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    servingSize?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Please provide a food name." }, { status: 400 });
  }

  const servingSize = body.servingSize?.trim();

  const apiKey = user.openRouterApiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OpenRouter API key is required. Please add your API key in Profile settings to use AI nutrition estimates.",
        missingApiKey: true,
      },
      { status: 400 }
    );
  }

  const systemMessage = `You are a nutrition expert AI assistant.
Your task is to estimate the macronutrient content for a single food item based on its name.

Rules:
1. Estimate reasonable average portion sizes if no serving size is provided.
2. If a serving size is provided, base the estimate on that portion; otherwise use a realistic standard serving.
3. Provide realistic nutritional estimates (Calories in kcal, Protein in grams, Carbs in grams, Fat in grams).
4. You MUST respond with ONLY a raw JSON object (no markdown, no backticks, no explanations) in this exact schema:
{
  "servingSize": "Estimated portion (e.g. 1 cup (240g))",
  "calories": 140,
  "proteinG": 12.0,
  "carbsG": 1.2,
  "fatG": 9.8
}`;

  const userMessage = servingSize
    ? `Food: ${name}\nServing size: ${servingSize}`
    : `Food: ${name}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Sparkwell Nutrition",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API error:", errText);
      return NextResponse.json(
        { error: "AI service error. Please check your OpenRouter API key and balance." },
        { status: 502 }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Clean any markdown formatting if present
    content = content.trim();
    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    const parsed = JSON.parse(content) as {
      servingSize?: string;
      calories?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
    };

    return NextResponse.json({
      servingSize: String(parsed.servingSize || "").trim() || undefined,
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      proteinG: Math.max(0, Math.round(Number(parsed.proteinG || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round(Number(parsed.carbsG || 0) * 10) / 10),
      fatG: Math.max(0, Math.round(Number(parsed.fatG || 0) * 10) / 10),
    });
  } catch (err: unknown) {
    console.error("AI estimate error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to estimate nutrition: " + message },
      { status: 500 }
    );
  }
}
