"use client";
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface ImageUploaderProps {
  onImagesUploaded?: (images: UploadedImage[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUploaded }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/upload/images");
      const result = await response.json();

      if (response.ok) {
        setUploadedImages(result.images);
        onImagesUploaded?.(result.images);
      } else {
        console.error("Failed to fetch images:", result.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onImagesUploaded]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append("images", file);
      });

      try {
        const response = await fetch("/api/upload/images", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          const newImages = [...uploadedImages, ...result.images];
          setUploadedImages(newImages);
          onImagesUploaded?.(newImages);
        } else {
          console.error("Upload failed:", result.error);
          alert("Upload failed: " + result.error);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedImages, onImagesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  const removeImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/upload/images?id=${imageId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const newImages = uploadedImages.filter((img) => img._id !== imageId);
        setUploadedImages(newImages);
        onImagesUploaded?.(newImages);
      } else {
        alert(result.error || "Failed to delete image.");
      }
    } catch (error) {
      alert("Delete failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          <Upload
            className={`w-12 h-12 ${isDragActive ? "text-blue-500" : "text-gray-400"}`}
          />

          {isUploading ? (
            <div className="text-blue-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Uploading images...</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragActive ? "Drop images here" : "Drag & drop images here"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                or <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports: JPEG, PNG, GIF, WebP (Max 10MB each)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Image className="w-5 h-5 mr-2" />
          Uploaded Images ({uploadedImages.length})
        </h3>
        <motion.button
          onClick={fetchImages}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </motion.button>
      </div>

      {uploadedImages.length > 0 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {uploadedImages.map((image) => (
                <motion.div
                  key={image._id}
                  className="relative group rounded-lg overflow-hidden shadow-md bg-white"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="w-full h-32 object-cover"
                  />

                  <motion.button
                    onClick={() => removeImage(image._id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>

                  {image.isUsed && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Used
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-xs font-medium truncate mb-1">
                      {image.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {uploadedImages.length === 0 && !isLoading && (
        <div className="mt-8 text-center text-gray-500">
          <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
