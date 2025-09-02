import { HTMLChunk } from "../html/chunkHtml";
import { computeChunks } from "../html/chunkHtml";
import React from "react";

/**
 * React component that receives an ever-growing `fullHTML` string,
 * breaks it into stable chunks for each top-level element,
 * and re-renders only the last chunk if it changes (append-only).
 */
export function StreamingMessage({ fullHTML, className }: { fullHTML: string, className: string }) {
  const [chunks, setChunks] = React.useState<HTMLChunk[]>([]);

  // When `fullHTML` changes, re-chunk
  React.useEffect(() => {
    setChunks((prevChunks) => computeChunks(prevChunks, fullHTML));
  }, [fullHTML]);

  // Render each chunk.
  // Because stable chunks keep the same `id`, React won't re-mount them.
  return (
    <div className={`${className}`}>
        <div className="message-content">
            {chunks.filter(chunk => chunk.htmlString.trim().length > 0).map((chunk) => (
                <div
                    key={chunk.id}
                    dangerouslySetInnerHTML={{ __html: chunk.htmlString }}
                />
            ))}
        </div>
    </div>
  );
}
