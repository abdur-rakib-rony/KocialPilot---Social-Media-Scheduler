"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Wand2, Calendar, Loader2, Image, RefreshCw } from "lucide-react";

interface UploadedImage {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  isUsed: boolean;
}

interface CaptionData {
  caption: string;
  variations: string[];
}

const CreatePostDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"mode" | "select" | "caption" | "schedule">(
    "mode"
  );
  const [mode, setMode] = useState<"manual" | "automatic">("manual");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(
    null
  );
  const [captionData, setCaptionData] = useState<CaptionData | null>(null);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [customCaption, setCustomCaption] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/upload/images");
      const result = await response.json();
      if (response.ok) {
        setImages(result.images);
        if (mode === "automatic" && result.images.length > 0) {
          const randomImage =
            result.images[Math.floor(Math.random() * result.images.length)];
          setSelectedImage(randomImage);
          generateCaption(randomImage);
        }
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    }
  };

  const generateCaption = async (image: UploadedImage) => {
    setIsGeneratingCaption(true);
    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath: image.url,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setCaptionData(result);
        setSelectedVariation(result.variations[0]);
      } else {
        console.error("Caption generation failed:", result.error);
      }
    } catch (error) {
      console.error("Caption generation error:", error);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleModeNext = () => {
    if (mode === "automatic") {
      fetchImages();
      setStep("caption");
    } else {
      fetchImages();
      setStep("select");
    }
  };

  const handleImageSelect = (image: UploadedImage) => {
    setSelectedImage(image);
    generateCaption(image);
    setStep("caption");
  };

  const handleCaptionNext = () => {
    setStep("schedule");
  };

  const createPost = async () => {
    if (!selectedImage || !captionData) return;

    setIsLoading(true);
    try {
      const finalCaption =
        customCaption || selectedVariation || captionData.caption;

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage._id,
          caption: captionData.caption,
          selectedVariation: selectedVariation,
          customCaption: customCaption,
          finalCaption: finalCaption,
          scheduledTime: new Date(scheduledTime).toISOString(),
          platform: platform,
          isAutomatic: mode === "automatic",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        resetDialog();
        setOpen(false);
        toast("Post created successfully!");
      } else {
        console.error("Post creation failed:", result.error);
        toast("Failed to create post: " + result.error);
      }
    } catch (error) {
      console.error("Post creation error:", error);
      toast("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("mode");
    setMode("manual");
    setSelectedImage(null);
    setCaptionData(null);
    setSelectedVariation("");
    setCustomCaption("");
    setScheduledTime("");
    setPlatform("facebook");
  };

  const getDefaultScheduleTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return now.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (step === "schedule" && !scheduledTime) {
      setScheduledTime(getDefaultScheduleTime());
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full cursor-pointer justify-start bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          onClick={resetDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Post
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        {step === "mode" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">
                How would you like to create your post?
              </h3>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as "manual" | "automatic")}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Manual Selection</div>
                      <div className="text-sm text-gray-500">
                        Choose image and customize caption
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="automatic" id="automatic" />
                  <Label htmlFor="automatic" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Automatic</div>
                      <div className="text-sm text-gray-500">
                        AI picks image and generates caption
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={handleModeNext} className="w-full">
              {mode === "automatic" ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Automatic Post
                </>
              ) : (
                <>Continue to Image Selection</>
              )}
            </Button>
          </div>
        )}

        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select an Image</h3>
              <Button variant="outline" size="sm" onClick={fetchImages}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {images.map((image) => (
                <div
                  key={image._id}
                  className="relative cursor-pointer group"
                  onClick={() => handleImageSelect(image)}
                >
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-colors"
                  />
                  {image.isUsed && (
                    <Badge className="absolute top-1 right-1 text-xs">
                      Used
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Image className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No images found. Upload some images first.</p>
              </div>
            )}
          </div>
        )}

        {step === "caption" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Caption & Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedImage && generateCaption(selectedImage)}
                disabled={isGeneratingCaption}
              >
                {isGeneratingCaption ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Regenerate Caption
              </Button>
            </div>

            {selectedImage && (
              <div className="flex gap-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.originalName}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedImage.originalName}
                  </p>
                  <Badge variant="outline">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              </div>
            )}

            {isGeneratingCaption ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Generating caption...</p>
              </div>
            ) : captionData ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Choose a caption variation:
                  </Label>
                  <RadioGroup
                    value={selectedVariation}
                    onValueChange={setSelectedVariation}
                  >
                    {captionData.variations.map((variation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <RadioGroupItem
                          value={variation}
                          id={`variation-${index}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`variation-${index}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {variation}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label
                    htmlFor="custom-caption"
                    className="text-sm font-medium mb-2 block"
                  >
                    Or write your own caption:
                  </Label>
                  <Textarea
                    id="custom-caption"
                    placeholder="Write your custom caption here..."
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleCaptionNext} className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Continue to Scheduling
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Failed to generate caption. Please try again.</p>
              </div>
            )}
          </div>
        )}

        {step === "schedule" && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Schedule Your Post</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="platform"
                  className="text-sm font-medium mb-2 block"
                >
                  Platform
                </Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="scheduled-time"
                  className="text-sm font-medium mb-2 block"
                >
                  Schedule Time
                </Label>
                <Input
                  id="scheduled-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Post Preview</h4>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Platform:</strong>{" "}
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Scheduled:</strong>{" "}
                {new Date(scheduledTime).toLocaleString()}
              </div>
              <div className="border rounded p-2 bg-white">
                <p className="text-sm whitespace-pre-wrap">
                  {customCaption ||
                    selectedVariation ||
                    captionData?.caption ||
                    "No caption"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("caption")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={createPost}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Post</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
