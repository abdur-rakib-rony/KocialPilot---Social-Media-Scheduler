"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Facebook,
  Instagram,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
  _id: string;
  image: {
    _id: string;
    url: string;
    filename: string;
    originalName: string;
    size: number;
  };
  finalCaption: string;
  scheduledTime: string;
  platform: string;
  status: "queued" | "posted" | "failed" | "cancelled";
  isAutomatic: boolean;
  platformPostId?: string;
  errorMessage?: string;
  createdAt: string;
  postedAt?: string;
}

const PostQueue: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editCaption, setEditCaption] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/posts");
      const result = await response.json();

      if (response.ok) {
        setPosts(result.posts);
        setFilteredPosts(result.posts);
      } else {
        console.error("Failed to fetch posts:", result.error);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (platformFilter !== "all") {
      filtered = filtered.filter((post) => post.platform === platformFilter);
    }

    setFilteredPosts(filtered);
  }, [posts, statusFilter, platformFilter]);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setEditCaption(post.finalCaption);
    setEditScheduledTime(
      new Date(post.scheduledTime).toISOString().slice(0, 16)
    );
    setEditPlatform(post.platform);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPost) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingPost._id,
          finalCaption: editCaption,
          scheduledTime: new Date(editScheduledTime).toISOString(),
          platform: editPlatform,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        fetchPosts();
        setEditDialogOpen(false);
        setEditingPost(null);
      } else {
        console.error("Update failed:", result.error);
        alert("Failed to update post: " + result.error);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update post. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts?id=${postId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (response.ok) {
        fetchPosts();
      } else {
        console.error("Delete failed:", result.error);
        alert("Failed to delete post: " + result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued":
        return "bg-blue-100 text-blue-800";
      case "posted":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      default:
        return <Facebook className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeUntilPost = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = scheduled.getTime() - now.getTime();

    if (diff <= 0) return "Past due";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Post Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading posts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Post Queue ({filteredPosts.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPosts}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-4 mt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No posts in queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredPosts.map((post) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <img
                      src={post.image.url}
                      alt={post.image.originalName}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            {getPlatformIcon(post.platform)}
                            <span className="capitalize">{post.platform}</span>
                          </div>
                          {post.isAutomatic && (
                            <Badge variant="outline" className="text-xs">
                              Auto
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {post.status === "queued" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(post)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {post.status !== "posted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(post._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-800 dark:text-foreground mb-2">
                        {post.finalCaption.length > 100
                          ? post.finalCaption.substring(0, 100) + "..."
                          : post.finalCaption}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(post.scheduledTime)}
                        </div>
                        {post.status === "queued" && (
                          <div className="text-blue-600 font-medium">
                            in {getTimeUntilPost(post.scheduledTime)}
                          </div>
                        )}
                        {post.status === "posted" && post.postedAt && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Posted {formatDate(post.postedAt)}
                          </div>
                        )}
                        {post.status === "failed" && post.errorMessage && (
                          <div className="flex items-center text-red-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            {post.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Caption
                </label>
                <Textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Platform
                  </label>
                  <Select value={editPlatform} onValueChange={setEditPlatform}>
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
                  <label className="text-sm font-medium mb-2 block">
                    Scheduled Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Post"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostQueue;
