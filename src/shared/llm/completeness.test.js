import { describe, expect, it } from "vitest";
import { isDraftIncomplete, isReportIncomplete } from "./completeness";

describe("isDraftIncomplete", () => {
  it("flags drafts that stop before a signature block", () => {
    expect(
      isDraftIncomplete("1. Definitions\nConfidential Information means...\n\n4. Protection of Information"),
    ).toBe(true);
  });

  it("accepts drafts that reach an execution block", () => {
    const text = `NON-DISCLOSURE AGREEMENT

1. Definitions
Confidential Information means non-public information.

2. Obligations
The Receiving Party shall keep information confidential.

IN WITNESS WHEREOF the parties have executed this Agreement.

______________________
For ABC

______________________
For XYZ`;
    expect(isDraftIncomplete(text)).toBe(false);
  });
});

describe("isReportIncomplete", () => {
  it("requires the disclaimer marker", () => {
    expect(isReportIncomplete("## Overview\nSome analysis")).toBe(true);
    expect(
      isReportIncomplete("## Overview\nSome analysis\n\n⚠ Strategy output only — consult a qualified advocate."),
    ).toBe(false);
  });
});
