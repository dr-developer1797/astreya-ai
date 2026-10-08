import { describe, expect, it } from "vitest";
import { toWordDoc } from "./word";

describe("toWordDoc legal numbering", () => {
  it("preserves simple and compound clause numbers verbatim", () => {
    const html = toWordDoc(
      "1. First step\n\n3. Third step\n1.1 Definitions\n1.1.1 Confidential Information\n2(a) Payment",
      "Agreement",
    );

    expect(html).toContain('<p class="numbered">1. First step</p>');
    expect(html).toContain('<p class="numbered">3. Third step</p>');
    expect(html).toContain("<p>1.1 Definitions</p>");
    expect(html).toContain("<p>1.1.1 Confidential Information</p>");
    expect(html).toContain("<p>2(a) Payment</p>");
    expect(html).not.toContain("<ol>");
  });
});
