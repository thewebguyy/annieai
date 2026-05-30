// Architectural Layer: Component / Utility
// Dependencies: @tiptap/core (JSONContent type)

import type { JSONContent } from "@tiptap/core";

export interface SceneRow {
  id?: string;
  project_id: string;
  type: "scene_heading" | "action" | "character" | "dialogue" | "parenthetical";
  content: string;
  order_index: number;
}

export const EditorSerializer = {
  /**
   * Converts a Tiptap JSON document to a list of database-compatible SceneRow objects.
   */
  serialize(json: JSONContent, projectId: string): SceneRow[] {
    if (!json.content) return [];

    return json.content.map((node, index) => {
      let type: SceneRow["type"] = "action";
      
      switch (node.type) {
        case "sceneHeading":
          type = "scene_heading";
          break;
        case "action":
          type = "action";
          break;
        case "character":
          type = "character";
          break;
        case "dialogue":
          type = "dialogue";
          break;
        case "parenthetical":
          type = "parenthetical";
          break;
        default:
          type = "action";
      }

      const content = node.content
        ? node.content.map((inlineNode) => inlineNode.text || "").join("")
        : "";

      return {
        project_id: projectId,
        type,
        content,
        order_index: index,
      };
    });
  },

  /**
   * Converts a list of SceneRow objects back into a Tiptap JSON structure.
   */
  deserialize(rows: SceneRow[]): JSONContent {
    const sorted = [...rows].sort((a, b) => a.order_index - b.order_index);

    const content = sorted.map((row) => {
      let type = "action";

      switch (row.type) {
        case "scene_heading":
          type = "sceneHeading";
          break;
        case "action":
          type = "action";
          break;
        case "character":
          type = "character";
          break;
        case "dialogue":
          type = "dialogue";
          break;
        case "parenthetical":
          type = "parenthetical";
          break;
        default:
          type = "action";
      }

      const node: JSONContent = { type };

      if (row.content) {
        node.content = [
          {
            type: "text",
            text: row.content,
          },
        ];
      }

      return node;
    });

    return {
      type: "doc",
      content,
    };
  },

  /**
   * Converts a list of SceneRow objects to a Fountain screenplay string.
   */
  toFountain(rows: SceneRow[]): string {
    const sorted = [...rows].sort((a, b) => a.order_index - b.order_index);
    const lines: string[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      let content = (row.content || "").trim();

      switch (row.type) {
        case "scene_heading": {
          const upper = content.toUpperCase();
          if (lines.length > 0) {
            lines.push("");
          }
          lines.push(upper);
          break;
        }
        case "action": {
          if (lines.length > 0) {
            lines.push("");
          }
          lines.push(content);
          break;
        }
        case "character": {
          if (lines.length > 0) {
            lines.push("");
          }
          lines.push(content.toUpperCase());
          break;
        }
        case "parenthetical": {
          if (!content.startsWith("(")) {
            content = "(" + content;
          }
          if (!content.endsWith(")")) {
            content = content + ")";
          }
          lines.push(content);
          break;
        }
        case "dialogue": {
          lines.push(content);
          break;
        }
        default: {
          if (lines.length > 0) {
            lines.push("");
          }
          lines.push(content);
        }
      }
    }

    return lines.join("\n");
  },
};
