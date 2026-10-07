"use client";
import * as React from "react";
import * as Toast from "@radix-ui/react-toast";
import { X } from "lucide-react";
type Notice = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};
const listeners = new Set<(notice: Notice) => void>();
let counter = 0;
export function toast(options: Omit<Notice, "id">) {
  const notice = { ...options, id: ++counter };
  listeners.forEach((fn) => fn(notice));
}
export function Toaster() {
  const [notices, setNotices] = React.useState<Notice[]>([]);
  React.useEffect(() => {
    const listener = (notice: Notice) =>
      setNotices((previous) => [...previous.slice(-3), notice]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return (
    <Toast.Provider duration={7000}>
      {notices.map((notice) => (
        <Toast.Root
          key={notice.id}
          className="toast"
          onOpenChange={(open) => {
            if (!open)
              setNotices((previous) =>
                previous.filter((item) => item.id !== notice.id),
              );
          }}
        >
          <Toast.Title className="toast-title">{notice.title}</Toast.Title>
          {notice.description && (
            <Toast.Description className="toast-description">
              {notice.description}
            </Toast.Description>
          )}
          <Toast.Close
            className="toast-close"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
