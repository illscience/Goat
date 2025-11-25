const FAL_API_URL = "https://queue.fal.run";

export interface ImageGenerationOptions {
  model?: string;
  width?: number;
  height?: number;
  num_images?: number;
}

export interface FalImage {
  url: string;
  width: number;
  height: number;
}

export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<FalImage[]> {
  const {
    model = "fal-ai/flux/schnell", // Fast, good quality
    width = 1024,
    height = 1024,
    num_images = 1,
  } = options;

  // Submit the request
  const submitResponse = await fetch(`${FAL_API_URL}/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.FAL_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: { width, height },
      num_images,
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.text();
    throw new Error(`Fal API error: ${error}`);
  }

  const result = await submitResponse.json();

  // For queue API, we get the result directly if using sync endpoint
  // or need to poll if using async
  if (result.images) {
    return result.images;
  }

  // If queued, poll for result
  const requestId = result.request_id;
  if (!requestId) {
    throw new Error("No request_id or images in response");
  }

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds max

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const statusResponse = await fetch(
      `${FAL_API_URL}/${model}/requests/${requestId}/status`,
      {
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
        },
      }
    );

    const status = await statusResponse.json();

    if (status.status === "COMPLETED") {
      // Fetch the result
      const resultResponse = await fetch(
        `${FAL_API_URL}/${model}/requests/${requestId}`,
        {
          headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
          },
        }
      );
      const finalResult = await resultResponse.json();
      return finalResult.images;
    }

    if (status.status === "FAILED") {
      throw new Error(`Image generation failed: ${status.error}`);
    }

    attempts++;
  }

  throw new Error("Image generation timed out");
}
