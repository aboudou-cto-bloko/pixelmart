"use client";

interface ChatwayButtonProps {
  className?: string;
  children: React.ReactNode;
}

function openChat() {
  const w = window as typeof window & { Chatway?: (cmd: string) => void };
  w.Chatway?.("open");
}

export function ChatwayButton({ className, children }: ChatwayButtonProps) {
  return (
    <button type="button" className={className} onClick={openChat}>
      {children}
    </button>
  );
}
