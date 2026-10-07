import { createResearchAdapter } from "@/features/research/createResearchAdapter";

/** Shared mutable bridge between ResearchView UI and the LocalRuntime adapter. */
export const researchBridge = {
  handlers: {},
  demoText: null,
  takeDemoText() {
    const text = this.demoText;
    this.demoText = null;
    return text;
  },
};

export const researchAdapter = createResearchAdapter({
  getHandlers: () => researchBridge.handlers,
  getDemoText: () => researchBridge.takeDemoText(),
});
