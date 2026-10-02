import { NextResponse } from "next/server";
import { addFoodLogEntry } from "../../../../db/queries";
import { getSessionUser } from "../../../_lib/auth";
import type { MealId } from "../../../_lib/mock-data";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    defaultMealType?: MealId;
    autoLog?: boolean;
  };

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Please provide a meal description." }, { status: 400 });
  }

  const apiKey = user.openRouterApiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OpenRouter API key is required. Please add your API key in Profile settings to use AI meal logging.",
        missingApiKey: true,
      },
      { status: 400 }
    );
  }

  const defaultMeal: MealId = body.defaultMealType || "lunch";

  const systemMessage = `You are a nutrition expert AI assistant.
Your task is to parse a user's natural language meal description into individual food items with realistic estimated quantities and macronutrient values.

Rules:
1. Estimate reasonable average portion sizes if not explicitly stated.
2. Provide realistic nutritional estimates (Calories in kcal, Protein in grams, Carbs in grams, Fat in grams).
3. Determine the meal type ("breakfast", "lunch", "dinner", "snacks"). If not specified in the description, use "${defaultMeal}".
4. You MUST respond with ONLY a raw JSON object (no markdown, no backticks, no explanations) in this exact schema:
{
  "mealType": "breakfast" | "lunch" | "dinner" | "snacks",
  "items": [
    {
      "name": "Food name (e.g. Scrambled eggs)",
      "quantity": "Estimated portion (e.g. 2 large eggs)",
      "calories": 140,
      "proteinG": 12.0,
      "carbsG": 1.2,
      "fatG": 9.8
    }
  ]
}`;

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
        // model: "meta-llama/llama-3.3-70b-instruct",
        model: "deepseek/deepseek-v4-flash",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
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
      mealType?: MealId;
      items?: {
        name: string;
        quantity: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
      }[];
    };

    const validMealTypes: MealId[] = ["breakfast", "lunch", "dinner", "snacks"];
    const mealType: MealId = validMealTypes.includes(parsed.mealType as MealId)
      ? (parsed.mealType as MealId)
      : defaultMeal;

    const items = (parsed.items || []).map((item) => ({
      name: String(item.name || "Food item"),
      quantity: String(item.quantity || "1 serving"),
      calories: Math.max(0, Math.round(Number(item.calories) || 0)),
      proteinG: Math.max(0, Math.round(Number(item.proteinG || 0) * 10) / 10),
      carbsG: Math.max(0, Math.round(Number(item.carbsG || 0) * 10) / 10),
      fatG: Math.max(0, Math.round(Number(item.fatG || 0) * 10) / 10),
    }));

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Could not identify any foods in that description. Please try being more specific." },
        { status: 422 }
      );
    }

    // If autoLog requested, insert directly into database
    if (body.autoLog) {
      const loggedEntries = [];
      for (const item of items) {
        const entry = await addFoodLogEntry({
          userId: user.id,
          mealType,
          name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        });
        loggedEntries.push(entry);
      }
      return NextResponse.json({ success: true, mealType, items: loggedEntries });
    }

    return NextResponse.json({ mealType, items });
  } catch (err: unknown) {
    console.error("AI parse error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to parse meal description: " + message },
      { status: 500 }
    );
  }
}
