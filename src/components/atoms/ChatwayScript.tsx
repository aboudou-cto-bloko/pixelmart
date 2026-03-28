"use client";

import Script from "next/script";

export function ChatwayScript() {
  return (
    <Script
      id="chatway"
      src="https://cdn.chatway.app/widget.js?id=mpPjL88qvGok"
      strategy="afterInteractive"
    />
  );
}
