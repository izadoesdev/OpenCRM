import { hasComponent } from "./registry";
import type {
  ContentSegment,
  ParsedSegments,
  RawComponentInput,
} from "./types";

const COMPONENT_START = '{"type":"';

function isRawComponentInput(obj: unknown): obj is RawComponentInput {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  const record = obj as Record<string, unknown>;
  return typeof record.type === "string" && hasComponent(record.type);
}

/**
 * Parse content into ordered segments of text and components.
 * Components are JSON objects like {"type":"data-table",...} embedded in text.
 */
export function parseContentSegments(content: string): ParsedSegments {
  const segments: ContentSegment[] = [];
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const startIndex = content.indexOf(COMPONENT_START, searchIndex);

    if (startIndex === -1) {
      const remainingText = content.substring(searchIndex).trim();
      if (remainingText) {
        segments.push({ type: "text", content: remainingText });
      }
      break;
    }

    const textBefore = content.substring(searchIndex, startIndex).trim();
    if (textBefore) {
      segments.push({ type: "text", content: textBefore });
    }

    let braceCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < content.length; i++) {
      if (content.at(i) === "{") {
        braceCount++;
      } else if (content.at(i) === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) {
      const remainingText = content.substring(searchIndex).trim();
      if (remainingText) {
        segments.push({ type: "text", content: remainingText });
      }
      break;
    }

    const jsonString = content.substring(startIndex, endIndex + 1);
    try {
      const parsed = JSON.parse(jsonString) as unknown;
      if (isRawComponentInput(parsed)) {
        segments.push({ type: "component", content: parsed });
        searchIndex = endIndex + 1;
        continue;
      }
    } catch {
      // not valid JSON
    }

    searchIndex = startIndex + COMPONENT_START.length;
  }

  return { segments };
}
