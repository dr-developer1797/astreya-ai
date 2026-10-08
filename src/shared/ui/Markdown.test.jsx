import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Markdown from "./Markdown";

globalThis.React = React;

describe("Markdown legal numbering", () => {
  it("keeps compound clause numbers as literal text", () => {
    const html = renderToStaticMarkup(
      <Markdown text={"1.1 Definitions\n1.1.1 Confidential Information\n1. First step"} />,
    );

    expect(html).toContain(">1.1 Definitions</p>");
    expect(html).toContain(">1.1.1 Confidential Information</p>");
    expect(html).toContain(">1.</span>");
  });
});
