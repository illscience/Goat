import { NextRequest, NextResponse } from "next/server";

// Use fal.run for synchronous requests
const FAL_API_URL = "https://fal.run";

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      model = "fal-ai/flux/schnell",
      width = 512,
      height = 512
    } = await request.json();

    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "Fal API key not configured" },
        { status: 500 }
      );
    }

    console.log("Generating image with prompt:", prompt.substring(0, 100));

    const response = await fetch(`${FAL_API_URL}/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: { width, height },
        num_images: 1,
      }),
    });

    const responseText = await response.text();
    console.log("Fal API response status:", response.status);
    console.log("Fal API response:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("Fal API error:", responseText);
      return NextResponse.json(
        { error: "Failed to generate image", details: responseText },
        { status: response.status }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Fal response as JSON:", responseText);
      return NextResponse.json(
        { error: "Invalid response from Fal API" },
        { status: 500 }
      );
    }

    // Fal returns images array directly for sync endpoint
    if (result.images && result.images.length > 0) {
      return NextResponse.json({ images: result.images });
    }

    // Some models return 'output' instead
    if (result.output && result.output.length > 0) {
      return NextResponse.json({ images: result.output.map((url: string) => ({ url })) });
    }

    console.error("Unexpected Fal response structure:", result);
    return NextResponse.json(
      { error: "No images in response", result },
      { status: 500 }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
