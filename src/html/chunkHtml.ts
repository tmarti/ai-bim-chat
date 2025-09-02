import { v4 as uuid } from 'uuid';

// 1) Data type for chunked top-level HTML
export interface HTMLChunk {
  id: string; // stable ID used as React key
  htmlString: string; // the outerHTML of that top-level node
}

/** Just a small utility to generate chunk IDs. You can use uuid() or any unique scheme. */
function generateChunkId(): string {
    return "chunk-" + uuid();
}
  
/**
 * Utility function to parse a raw HTML string into its array of
 * top-level child elements (as DOM Nodes). Returns an array of outerHTML strings.
 */
function parseHTMLToTopLevelElements(html: string): string[] {
  // In the browser, we can do:
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Collect the <body>'s top-level child nodes
  const topLevel = Array.from(doc.body.childNodes);
  // Convert each node to outerHTML.
  return topLevel.map((node) => {
    if (node instanceof HTMLElement) {
      return node.outerHTML;
    } else {
      // If it's a text node or comment node, convert to a string directly
      // (React can handle text, but typically MarkdownIt won't produce raw text nodes as top-level)
      return node.textContent || "";
    }
  });
}

/**
 * Compare existing chunks with the new full HTML (append-only).
 * Reuse the stable (unchanged) chunks from the start.
 *
 * There's exactly one place that can differ: the last chunk.
 *  - If the new HTML has more top-level elements than old, that means we appended new ones.
 *  - If the new HTML has the same number, only the last one might have changed.
 */
export function computeChunks(oldChunks: HTMLChunk[], newHTML: string): HTMLChunk[] {
  // 1) Parse new full HTML to an array of top-level outerHTML strings
  const newTopLevelHTML = parseHTMLToTopLevelElements(newHTML);

  // Prepare a new array of HTMLChunk
  const newChunks: HTMLChunk[] = [];

  const oldCount = oldChunks.length;
  const newCount = newTopLevelHTML.length;

  // 2) Reuse stable chunks from the start
  // We'll move from index 0 upwards, reusing old chunks if they match the new outerHTML.
  let i = 0;
  while (i < oldCount && i < newCount) {
    const oldChunk = oldChunks[i];
    const newOuter = newTopLevelHTML[i];

    if (oldChunk.htmlString === newOuter) {
      // Exactly the same, so we keep the old chunk (and its stable key)
      newChunks.push(oldChunk);
      i++;
    } else {
      // As soon as we see a difference, we stop reusing
      break;
    }
  }

  // Now 'i' is the first index that might differ or we have exhausted old/new
  // 3) If we haven't consumed all new top-level elements, let's build them
  //    Because only the last block can change,
  //    everything from i onward in newTopLevelHTML is effectively new or updated.

  while (i < newCount) {
    const htmlString = newTopLevelHTML[i];

    // We have two sub-cases:

    // A) If we still have an "old chunk" at index i, it means
    //    it's the last chunk that changed. We can REUSE the old chunk's ID
    //    (so React does a minimal update of that DOM node),
    //    or if you prefer, you can generate a new ID each time.
    //    Reusing the ID allows finer DOM diffing within that node.
    if (i < oldCount) {
        if (htmlString.includes('<div class="conclusion-reason">')) {
            console.error('html-conclusion-1!');
            console.error(htmlString);
        }
      // Reuse the old chunk ID so React sees it as the "same" node
      const reusedChunk: HTMLChunk = {
        id: oldChunks[i].id,
        htmlString: htmlString,
      };
      newChunks.push(reusedChunk);
    } else {
        if (htmlString.includes('<div class="conclusion-reason">')) {
            console.error('html-conclusion-2!');
            console.error(htmlString);
        }
      // B) If there's no old chunk at index i, that means
      //    it's a brand new appended top-level element
      const newChunk: HTMLChunk = {
        id: generateChunkId(), // or e.g. `uuid()`
        htmlString: htmlString,
      };
      newChunks.push(newChunk);
    }
    i++;
  }

  // Return the newly built chunk array
  return newChunks;
}
