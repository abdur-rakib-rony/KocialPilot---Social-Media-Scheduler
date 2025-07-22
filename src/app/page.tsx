import ImageUploader from "@/components/features/image-upload/ImageUploader";
import CalendarView from "@/components/features/scheduling/CalendarView";
import PostQueue from "@/components/features/scheduling/PostQueue";
import SchedulePreferences from "@/components/features/scheduling/SchedulePreferences";
import React from "react";

const Page = () => {
  return (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 h-full auto-rows-min">
        <div className="space-y-4 sm:space-y-6 min-h-0 xl:col-span-2">
          <div className="order-1">
            <ImageUploader />
          </div>
          <div className="order-3 xl:order-2 min-h-0">
            <PostQueue />
          </div>
        </div>
        <div className="space-y-4 sm:space-y-6 min-h-0 xl:col-span-3">
          <div className="order-2 xl:order-1 min-h-0">
            <CalendarView />
          </div>
          <div className="order-4 xl:order-2 pb-5">
            <SchedulePreferences />
          </div>
        </div>
      </div>
  );
};

export default Page;
