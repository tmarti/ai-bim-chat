import {
  ImageReference,
  IReferenceManagerService,
} from "../state/ReferenceManagerService";
import markdownIt from "markdown-it";
import { Message } from "../state/Dto/Message";
import { resolve } from "../ioc/inversify.config";
import * as CRC32 from 'crc-32';
import { Token } from "markdown-it/index.js";
export interface MarkdownItEnv {
  isStreaming: boolean;
  msgIndex: number;
  referenceManager: IReferenceManagerService;
  message: Message;
  tokenIndex: number;
  tokenCacheKey: string;
}
import { v4 as uuid } from 'uuid';

export const cache = {
  tokenCache : {} as {[key: string]: {
    checksum: string;
    html: string;
    isFinished: boolean;
  }},
};

/**
 * Generate a stable checksum for a token's content (and possibly other fields).
 */
function computeTokenChecksum(token: Token) {
  if (token.content.length === 0) {
    return uuid();
  }

  return token.content.length.toString() + "-" + CRC32.str(token.content, 0);
}

const initMarkdownIt = (md: markdownIt) => {
  let tokenCacheKey = 'n/a';

  // Override the table_open renderer rule
  md.renderer.rules.table_open = function (
    tokens,
    idx,
    options,
    env: MarkdownItEnv,
    self
  ) {
    if (!env.isStreaming) {
      // Check if the 'class' attribute already exists
      const classIndex = tokens[idx].attrIndex("class");
      if (classIndex < 0) {
        // If not, add a new 'class' attribute with your classes
        tokens[idx].attrPush(["class", "markdown-table pending"]);
      } else {
        // If it exists, append your classes to the existing ones
        tokens[idx].attrSet("class", "markdown-table pending");
      }
    }
    // Continue with the default rendering
    return self.renderToken(tokens, idx, options);
  };

  // Override code block renderer
  md.renderer.rules.code_block = function (
    tokens,
    idx,
    _options,
    _env: MarkdownItEnv,
    _self
  ) {
    const token = tokens[idx];
    return (
      '<pre class="inline-code">' +
      md.utils.escapeHtml(token.content) +
      "</pre>\n"
    );
  };

  // Override fenced code block renderer
  md.renderer.rules.fence = function (
    tokens,
    idx,
    _options,
    env: MarkdownItEnv,
    _self
  ) {
    const token = tokens[idx];
    const code = token.content.trim();

    const processorRegistry = resolve('FenceBlockProcessorRegistryService');

    if (processorRegistry.has(token.info)) {
      const processor = processorRegistry.get(token.info);

      // Here we have to generate a uid that is consistent with the message and its content.
      // This is, the uid has to be deterministic and unique for the message and its content.
      const tmpUid = `tmp-uid-${env.message.id}-${code.length}-${CRC32.str(code, 0)}`;

      const result = processor.process(token.info, code, md, {...env, tokenIndex: idx, tokenCacheKey: tokenCacheKey });

      if (!result.async) {
        const afterProcessing = result.afterProcessing;

        if (afterProcessing) {
          setTimeout(async () => {  
            console.log("Invoking after processing", token.info, tmpUid);
            await afterProcessing();
          }, 50);
        }

        return result.content;
      }

      result.content.then(async (content: string) => {
        console.log("Async fence block promise resolved!", token.info, tmpUid);

        while (true) {
          const div = document.getElementById(tmpUid);
          if (div) {
            console.log("Setting outerHTML", token.info, tmpUid);
            div.outerHTML = content;
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const afterProcessing = result.afterProcessing;

        if (afterProcessing) {
          setTimeout(async () => {  
            console.log("Invoking after processing", token.info, tmpUid);
            await afterProcessing();
          }, 50);
        }
      });

      console.log("Async fence block promise created!", token.info, tmpUid);

      return `<div id="${tmpUid}"></div>`;
    }

    if (token.info == "info") {
      return `<div class="info-box">${md.render(code)}</div>`;
    }

    return (
      `<pre class="inline-code ${token.info}">` +
      md.utils.escapeHtml(token.content) +
      "</pre>\n"
    );
  };

  // Override inline code renderer
  md.renderer.rules.code_inline = function (
    tokens,
    idx,
    _options,
    env: MarkdownItEnv,
    _self
  ) {
    const token = tokens[idx];
    const code = token.content.trim();


    // Apply custom processing for single backtick blocks
    if (token.markup === "`") {
      // Example: Wrap the content in a <span> with a custom class
      return `<span class="pre-text">${code}</span>`;
    }

    return (
      '<pre class="inline-code">' +
      md.utils.escapeHtml(token.content) +
      "</pre>\n"
    );
  };

  // Override the image renderer
  const defaultImageRender =
    md.renderer.rules.image ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.image = function (
    tokens,
    idx,
    options,
    env: MarkdownItEnv,
    self
  ) {
    // Get the token for the image
    const token = tokens[idx];

    // Modify the token (e.g., add a custom attribute)
    token.attrPush(["class", "custom-image-class"]); // Add custom class
    token.attrPush(["data-custom", "value"]); // Add custom data attribute

    // You could also process the src (e.g., modify the image URL)
    const srcIndex = token.attrIndex("src");
    if (srcIndex >= 0) {
      tokens[idx].attrSet(
        "src",
        env.referenceManager.getImage(
          token.attrGet("src")! as ImageReference
        ) ?? ""
      );
    }

    // Use the default renderer with the modified token
    return defaultImageRender(tokens, idx, options, env, self);
  };

  // Override the renderToken function be able generate a cache key for the token
  const previousFenceRender = md.renderer.rules.fence;

  md.renderer.rules.fence = function (tokens, idx, options, env, _self) {
    tokenCacheKey = `key-${env.message.id}-${idx}`;

    const currentTokenCacheKey = tokenCacheKey;

    const token = tokens[idx];

    const newChecksum = computeTokenChecksum(token);

    // Check if we have an existing cache entry for this path
    const existingEntry = cache.tokenCache[currentTokenCacheKey];

    if (existingEntry) {
      if (existingEntry.isFinished) {
        return existingEntry.html;
      } 

      // If there's a cache entry and the checksums match, use the cached HTML
      if (existingEntry.checksum === newChecksum) {
        const checksum2 = computeTokenChecksum(token);

        console.error('finalize it!');
        // console.error('check: ', existingEntry.checksum, newChecksum);
        // console.log('content: ', token.content);
        const rendered2 = previousFenceRender.bind(this)(tokens, idx, options, {
            ...env,
            isStreaming: false,
        }, _self);

        cache.tokenCache[currentTokenCacheKey] = {
          checksum: checksum2,
          html: rendered2,
          isFinished: true
        };

        return rendered2;
      } else {
        // console.log("re-render it! " + idx + " " + token.content.length);
        // console.log('check: ', existingEntry.checksum, newChecksum);
      }
    }

    // Otherwise, we must render it anew
    const rendered = previousFenceRender.bind(this)(tokens, idx, options, {
      ...env,
      isStreaming: true,
    }, _self);

    // Update the cache with the new checksum & new HTML
    cache.tokenCache[currentTokenCacheKey] = {
      checksum: newChecksum,
      html: rendered,
      isFinished: false,
    };

    // Return the newly rendered HTML
    return rendered;
  }

  // Override the main render function to capture the env
  // This is because `.renderToken` does not get passed the env
  const originalRenderFunction = md.render;

  const envStack: MarkdownItEnv[] = [];

  md.render = function (src, env) {
    envStack.push(env);
    const result = originalRenderFunction.bind(this)(src, env);
    envStack.pop();
    return result;
  }

};

export const createMarkdownIt = () => {
  const md = new markdownIt();
  initMarkdownIt(md);
  return md;
}