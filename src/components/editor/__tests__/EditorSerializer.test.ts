import { describe, it, expect } from "vitest";
import { EditorSerializer, type SceneRow } from "../EditorSerializer";

describe("EditorSerializer", () => {
  const mockRows: SceneRow[] = [
    {
      project_id: "project-1",
      type: "scene_heading",
      content: "int. coffee shop - day",
      order_index: 0,
    },
    {
      project_id: "project-1",
      type: "action",
      content: "John sits by the window, sipping a latte.",
      order_index: 1,
    },
    {
      project_id: "project-1",
      type: "character",
      content: "john",
      order_index: 2,
    },
    {
      project_id: "project-1",
      type: "parenthetical",
      content: "sighs",
      order_index: 3,
    },
    {
      project_id: "project-1",
      type: "dialogue",
      content: "It's going to be a long day.",
      order_index: 4,
    },
  ];

  it("should deserialize rows back to JSONContent doc structured format", () => {
    const json = EditorSerializer.deserialize(mockRows);
    expect(json.type).toBe("doc");
    expect(json.content).toHaveLength(5);
    expect(json.content?.[0].type).toBe("sceneHeading");
    expect(json.content?.[0].content?.[0].text).toBe("int. coffee shop - day");
  });

  it("should serialize JSONContent back to SceneRow format", () => {
    const json = EditorSerializer.deserialize(mockRows);
    const rows = EditorSerializer.serialize(json, "project-1");
    expect(rows).toHaveLength(5);
    expect(rows[0].type).toBe("scene_heading");
    expect(rows[0].content).toBe("int. coffee shop - day");
  });

  it("should convert scene rows to Fountain formatting with correct spacing and uppercase normalization", () => {
    const fountain = EditorSerializer.toFountain(mockRows);
    const expected = [
      "INT. COFFEE SHOP - DAY",
      "",
      "John sits by the window, sipping a latte.",
      "",
      "JOHN",
      "(sighs)",
      "It's going to be a long day."
    ].join("\n");

    expect(fountain).toBe(expected);
  });
});
