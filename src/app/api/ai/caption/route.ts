import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { imageUrl, imagePath, customPrompt } = await request.json();

    if (!imageUrl && !imagePath) {
      return NextResponse.json(
        { error: "Either imageUrl or imagePath is required" },
        { status: 400 }
      );
    }

    let imageName = "image";

    if (imagePath) {
      const fullPath = path.join(
        process.cwd(),
        "public",
        imagePath.replace("/", "")
      );
      if (!fs.existsSync(fullPath)) {
        return NextResponse.json(
          { error: "Image file not found" },
          { status: 404 }
        );
      }
      imageName = path.basename(imagePath, path.extname(imagePath));
    }

    const caption = generateSmartCaption(imageName);
    const finalCaption = customPrompt ? `${customPrompt} ${caption}` : caption;
    const variations = generateCaptionVariations(finalCaption);

    return NextResponse.json({
      success: true,
      caption: finalCaption,
      variations: variations,
      model: "smart-generator",
      timestamp: new Date().toISOString(),
    });
  } catch {
    const fallbackCaption = "Beautiful moment worth sharing ✨";
    return NextResponse.json({
      success: true,
      caption: fallbackCaption,
      variations: generateCaptionVariations(fallbackCaption),
      model: "fallback",
      timestamp: new Date().toISOString(),
    });
  }
}

function generateSmartCaption(imageName: string): string {
  const hour = new Date().getHours();
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const filename = imageName.toLowerCase();

  let timeContext = "";
  let timeEmoji = "";
  if (hour >= 6 && hour < 12) {
    timeContext = "morning";
    timeEmoji = "🌅";
  } else if (hour >= 12 && hour < 17) {
    timeContext = "afternoon";
    timeEmoji = "☀️";
  } else if (hour >= 17 && hour < 21) {
    timeContext = "evening";
    timeEmoji = "🌆";
  } else {
    timeContext = "night";
    timeEmoji = "🌙";
  }

  let contentType = "moment";
  let contentEmoji = "📸";

  if (filename.includes("food") || filename.includes("meal")) {
    contentType = "delicious treat";
    contentEmoji = "🍽️";
  } else if (filename.includes("nature") || filename.includes("landscape")) {
    contentType = "beautiful nature";
    contentEmoji = "🌿";
  } else if (filename.includes("selfie") || filename.includes("portrait")) {
    contentType = "perfect selfie";
    contentEmoji = "🤳";
  } else if (filename.includes("city") || filename.includes("urban")) {
    contentType = "city vibes";
    contentEmoji = "🏙️";
  } else if (filename.includes("travel") || filename.includes("vacation")) {
    contentType = "travel adventure";
    contentEmoji = "✈️";
  } else if (filename.includes("sunset") || filename.includes("sunrise")) {
    contentType = "golden hour magic";
    contentEmoji = "🌅";
  }

  const captions = [
    `Perfect ${timeContext} ${contentType} ${timeEmoji}`,
    `Amazing ${contentType} this ${timeContext} ${contentEmoji}`,
    `Beautiful ${contentType} captured ${timeEmoji}`,
    `Love this ${timeContext} ${contentType} ${contentEmoji}`,
    `Stunning ${contentType} vibes ${timeEmoji}`,
    `${day} ${timeContext} ${contentType} ${contentEmoji}`,
    `This ${contentType} made my ${timeContext} ${timeEmoji}`,
    `Sharing this beautiful ${contentType} ${contentEmoji}`,
  ];

  return captions[Math.floor(Math.random() * captions.length)];
}

function generateCaptionVariations(baseCaption: string): string[] {
  return [
    baseCaption,
    `✨ ${baseCaption} ✨`,
    `${baseCaption} 📸 #photooftheday`,
    `${baseCaption} #beautiful #amazing`,
    `Love this! ${baseCaption} 😍`,
    `${baseCaption}\n\nWhat do you think? 💭`,
    `${baseCaption} 🌟 #picoftheday`,
    `Just had to share: ${baseCaption} ❤️`,
  ];
}
