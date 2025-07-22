"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Facebook, Instagram } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Post;
}

const PLATFORM_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
};

const PLATFORM_COLORS = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
};

const STATUS_COLORS = {
  queued: "bg-blue-100 text-blue-800 border-blue-200",
  posted: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const CalendarView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    platforms: ["facebook", "instagram"],
    statuses: ["queued", "posted", "failed", "cancelled"],
  });
  const [showFilters, setShowFilters] = useState(false);

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

  const events: CalendarEvent[] = useMemo(() => {
    return posts
      .filter(
        (post) =>
          filters.platforms.includes(post.platform) &&
          filters.statuses.includes(post.status)
      )
      .map((post) => ({
        id: post._id,
        title:
          post.finalCaption.substring(0, 50) +
          (post.finalCaption.length > 50 ? "..." : ""),
        start: new Date(post.scheduledTime),
        end: moment(post.scheduledTime).add(1, "hour").toDate(),
        resource: post,
      }));
  }, [posts, filters]);


  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const PlatformIcon =
      PLATFORM_ICONS[event.resource.platform as keyof typeof PLATFORM_ICONS];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-full w-full p-1 rounded text-xs overflow-hidden cursor-pointer">
              <div className="flex items-center gap-1 mb-1">
                <PlatformIcon className="h-3 w-3 flex-shrink-0" />
                <Badge
                  variant="outline"
                  className={`text-xs px-1 py-0 ${STATUS_COLORS[event.resource.status]}`}
                >
                  {event.resource.status}
                </Badge>
              </div>
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-xs opacity-75 truncate">
                {moment(event.start).format("HH:mm")}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <p className="font-medium">
                {event.resource.finalCaption.substring(0, 100)}...
              </p>
              <p className="text-xs text-muted-foreground">
                {moment(event.start).format("MMM DD, YYYY HH:mm")}
              </p>
              <p className="text-xs">Platform: {event.resource.platform}</p>
              <p className="text-xs">Status: {event.resource.status}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const post = event.resource;

    return {
      style: {
        backgroundColor:
          post.status === "failed"
            ? "#fee2e2"
            : post.status === "posted"
              ? "#dcfce7"
              : post.status === "cancelled"
                ? "#f3f4f6"
                : "#dbeafe",
        border: `2px solid ${
          post.status === "failed"
            ? "#fca5a5"
            : post.status === "posted"
              ? "#86efac"
              : post.status === "cancelled"
                ? "#d1d5db"
                : "#93c5fd"
        }`,
        borderRadius: "6px",
        color: "#1f2937",
        fontSize: "11px",
        padding: "2px",
      },
    };
  };

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedPost(event.resource);
  }, []);

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
        setSelectedPost(null);
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
        setSelectedPost(null);
      } else {
        console.error("Delete failed:", result.error);
        alert("Failed to delete post: " + result.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const togglePlatformFilter = (platform: string) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const getUpcomingPosts = () => {
    return posts
      .filter(
        (post) =>
          moment(post.scheduledTime).isAfter(moment()) &&
          post.status === "queued" &&
          filters.platforms.includes(post.platform)
      )
      .sort((a, b) => moment(a.scheduledTime).diff(moment(b.scheduledTime)))
      .slice(0, 5);
  };

  const getStatusCount = (status: string) => {
    return events.filter((e) => e.resource.status === status).length;
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
      <Card>
        <CardHeader>
          <CardTitle>Content Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading calendar...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Content Calendar</h2>
          <p className="text-muted-foreground">
            View and manage your scheduled posts across all platforms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchPosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Platforms</h4>
                    <div className="space-y-2">
                      {Object.entries(PLATFORM_ICONS).map(
                        ([platform, Icon]) => (
                          <div
                            key={platform}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={platform}
                              checked={filters.platforms.includes(platform)}
                              onCheckedChange={() =>
                                togglePlatformFilter(platform)
                              }
                            />
                            <label
                              htmlFor={platform}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Icon className="h-4 w-4" />
                              {platform.charAt(0).toUpperCase() +
                                platform.slice(1)}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Status</h4>
                    <div className="space-y-2">
                      {["queued", "posted", "failed", "cancelled"].map(
                        (status) => (
                          <div
                            key={status}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={status}
                              checked={filters.statuses.includes(status)}
                              onCheckedChange={() => toggleStatusFilter(status)}
                            />
                            <label htmlFor={status} className="text-sm">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="calendar-container" style={{ height: "600px" }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={currentView}
                  onView={setCurrentView}
                  date={selectedDate}
                  onNavigate={setSelectedDate}
                  onSelectEvent={handleSelectEvent}
                  selectable
                  components={{
                    event: EventComponent,
                  }}
                  eventPropGetter={eventStyleGetter}
                  formats={{
                    timeGutterFormat: "HH:mm",
                    eventTimeRangeFormat: ({ start, end }) =>
                      `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
                  }}
                  step={30}
                  timeslots={2}
                  min={new Date(2025, 1, 1, 6, 0, 0)}
                  max={new Date(2025, 1, 1, 23, 0, 0)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Posts
                  </span>
                  <Badge>{events.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Queued</span>
                  <Badge variant="secondary">{getStatusCount("queued")}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <Badge className="bg-green-100 text-green-800">
                    {getStatusCount("posted")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <Badge variant="destructive">
                    {getStatusCount("failed")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Posts</CardTitle>
              <CardDescription>Next 5 scheduled posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {getUpcomingPosts().map((post) => {
                const PlatformIcon =
                  PLATFORM_ICONS[post.platform as keyof typeof PLATFORM_ICONS];
                return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div
                      className={`p-2 rounded-full ${PLATFORM_COLORS[post.platform as keyof typeof PLATFORM_COLORS]} text-white`}
                    >
                      <PlatformIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.finalCaption.substring(0, 40)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {moment(post.scheduledTime).format("MMM DD, HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {moment(post.scheduledTime).fromNow()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {getUpcomingPosts().length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming posts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              View and manage your scheduled post
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const PlatformIcon =
                    PLATFORM_ICONS[
                      selectedPost.platform as keyof typeof PLATFORM_ICONS
                    ];
                  return <PlatformIcon className="h-5 w-5" />;
                })()}
                <Badge className={STATUS_COLORS[selectedPost.status]}>
                  {selectedPost.status}
                </Badge>
                <Badge variant="outline">
                  {moment(selectedPost.scheduledTime).format(
                    "MMM DD, YYYY HH:mm"
                  )}
                </Badge>
                {selectedPost.isAutomatic && (
                  <Badge variant="outline" className="text-xs">
                    Auto
                  </Badge>
                )}
              </div>

              <div className="flex gap-4">
                <img
                  src={selectedPost.image.url}
                  alt={selectedPost.image.originalName}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedPost.image.originalName}
                  </p>
                  <Badge variant="outline">
                    {formatFileSize(selectedPost.image.size)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Caption</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedPost.finalCaption}
                </p>
              </div>

              {selectedPost.status === "failed" &&
                selectedPost.errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {selectedPost.errorMessage}
                    </p>
                  </div>
                )}

              {selectedPost.status === "posted" && selectedPost.postedAt && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Posted:</strong>{" "}
                    {moment(selectedPost.postedAt).format("MMM DD, YYYY HH:mm")}
                  </p>
                  {selectedPost.platformPostId && (
                    <p className="text-sm text-green-600">
                      Platform ID: {selectedPost.platformPostId}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedPost.status === "queued" && (
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(selectedPost)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {selectedPost.status !== "posted" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedPost._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        .calendar-container .rbc-header {
          padding: 12px;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        .calendar-container .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        .calendar-container .rbc-today {
          background-color: #fef3c7;
        }
        .calendar-container .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 600;
        }
        .calendar-container .rbc-btn-group > button {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          font-weight: 500;
        }
        .calendar-container .rbc-btn-group > button:hover {
          background: #f3f4f6;
        }
        .calendar-container .rbc-btn-group > button.rbc-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
