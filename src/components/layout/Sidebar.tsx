"use client";
import React from "react";
import { Zap, Home, Calendar, Image, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreatePostDialog from "../features/posting/CreatePostDialog";
import { motion } from "framer-motion";

const Sidebar: React.FC = () => {
  return (
    <aside className="flex h-full flex-col border-r border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 sm:h-16 items-center border-b border-border px-4">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">KocialPilot</span>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <div className="mb-6">
          <CreatePostDialog />
        </div>

        <Separator className="mb-4" />

        <nav className="space-y-2 flex-1">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Main
            </p>

            <Button
              variant="ghost"
              className="w-full justify-start h-10 hover:bg-accent"
            >
              <Home className="mr-3 h-4 w-4" />
              Dashboard
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-10 hover:bg-accent"
            >
              <Calendar className="mr-3 h-4 w-4" />
              Calendar
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-10 hover:bg-accent"
            >
              <Image
                className="mr-3 h-4 w-4"
                height={100}
                width={100}
                alt="Media Library"
              />
              Media Library
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Analytics
            </p>

            <Button
              variant="ghost"
              className="w-full justify-start h-10 hover:bg-accent"
            >
              <BarChart3 className="mr-3 h-4 w-4" />
              Reports
            </Button>
          </div>

          <div className="flex-1" />

          <Separator className="my-4" />

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 hover:bg-accent"
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
