"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Settings,
  PlayCircle,
  StopCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeSlot {
  hour: number;
  minute: number;
  enabled: boolean;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface SchedulePreferences {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface NextPost {
  scheduledTime: string;
}

interface SchedulerStatus {
  running: boolean;
  activeJobs: number;
  nextPost: NextPost | null;
}

const SchedulePreferences: React.FC = () => {
  const [schedule, setSchedule] = useState<SchedulePreferences>({
    monday: {
      enabled: true,
      timeSlots: [{ hour: 9, minute: 0, enabled: true }],
    },
    tuesday: {
      enabled: true,
      timeSlots: [{ hour: 9, minute: 0, enabled: true }],
    },
    wednesday: {
      enabled: true,
      timeSlots: [{ hour: 9, minute: 0, enabled: true }],
    },
    thursday: {
      enabled: true,
      timeSlots: [{ hour: 9, minute: 0, enabled: true }],
    },
    friday: {
      enabled: true,
      timeSlots: [{ hour: 9, minute: 0, enabled: true }],
    },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] },
  });

  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    running: false,
    activeJobs: 0,
    nextPost: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  useEffect(() => {
    loadSchedulerStatus();
    checkFacebookConnection();
  }, []);

  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch("/api/scheduler");
      const result = await response.json();
      if (response.ok) {
        setSchedulerStatus({
          running: result.schedulerRunning,
          activeJobs: result.activeJobs || 0,
          nextPost: result.nextPost,
        });
      }
    } catch (error) {
      console.error("Failed to load scheduler status:", error);
    }
  };

  const checkFacebookConnection = async () => {
    try {
      const response = await fetch("/api/facebook/post");
      const result = await response.json();
      setFbConnected(result.connected || false);
    } catch (error) {
      console.error("Failed to check Facebook connection:", error);
    }
  };

  const toggleDay = (day: keyof SchedulePreferences) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const addTimeSlot = (day: keyof SchedulePreferences) => {
    const newSlot: TimeSlot = { hour: 12, minute: 0, enabled: true };
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, newSlot],
      },
    }));
  };

  const removeTimeSlot = (day: keyof SchedulePreferences, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateTimeSlot = (
    day: keyof SchedulePreferences,
    index: number,
    field: keyof TimeSlot,
    value: number | boolean
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const saveSchedule = async () => {
    setIsSaving(true);
    try {
      // Here you would typically save to your API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Schedule saved:", schedule);
      alert("Schedule preferences saved successfully!");
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("Failed to save schedule preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScheduler = async () => {
    setIsLoading(true);
    try {
      const action = schedulerStatus.running ? "stop" : "start";
      const response = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      if (response.ok) {
        await loadSchedulerStatus();
        alert(result.message);
      } else {
        alert("Failed to " + action + " scheduler: " + result.error);
      }
    } catch (error) {
      console.error("Scheduler toggle error:", error);
      alert("Failed to toggle scheduler. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getNextPostTime = () => {
    if (!schedulerStatus.nextPost) return "No posts scheduled";

    const scheduledTime = new Date(schedulerStatus.nextPost.scheduledTime);
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();

    if (diff <= 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Scheduler Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={fbConnected ? "default" : "destructive"}>
                {fbConnected ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Facebook Connected
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Facebook Disconnected
                  </>
                )}
              </Badge>
              <Badge
                variant={schedulerStatus.running ? "default" : "secondary"}
              >
                {schedulerStatus.running ? "Running" : "Stopped"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {schedulerStatus.running ? schedulerStatus.activeJobs : 0}
              </div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-medium text-green-600">
                {getNextPostTime()}
              </div>
              <div className="text-sm text-gray-600">Next Post</div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={toggleScheduler}
                disabled={isLoading}
                variant={schedulerStatus.running ? "destructive" : "default"}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : schedulerStatus.running ? (
                  <StopCircle className="w-4 h-4 mr-2" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                {isLoading
                  ? "Processing..."
                  : schedulerStatus.running
                    ? "Stop Scheduler"
                    : "Start Scheduler"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Posting Schedule
            </CardTitle>
            <Button onClick={saveSchedule} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {days.map((day) => (
              <motion.div
                key={day}
                className="border rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: days.indexOf(day) * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={schedule[day].enabled}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <Label className="text-lg font-medium">
                      {dayLabels[day]}
                    </Label>
                    <Badge variant="outline">
                      {schedule[day].timeSlots.length} slot
                      {schedule[day].timeSlots.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {schedule[day].enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(day)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Time
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {schedule[day].enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      {schedule[day].timeSlots.map((slot, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Switch
                            checked={slot.enabled}
                            onCheckedChange={(checked) =>
                              updateTimeSlot(day, index, "enabled", checked)
                            }
                          />

                          <Clock className="w-4 h-4 text-gray-500" />

                          <Select
                            value={slot.hour.toString()}
                            onValueChange={(value) =>
                              updateTimeSlot(
                                day,
                                index,
                                "hour",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span>:</span>

                          <Select
                            value={slot.minute.toString()}
                            onValueChange={(value) =>
                              updateTimeSlot(
                                day,
                                index,
                                "minute",
                                parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 15, 30, 45].map((minute) => (
                                <SelectItem
                                  key={minute}
                                  value={minute.toString()}
                                >
                                  {minute.toString().padStart(2, "0")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Badge variant="outline" className="ml-auto">
                            {formatTime(slot.hour, slot.minute)}
                          </Badge>

                          {schedule[day].timeSlots.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTimeSlot(day, index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePreferences;
