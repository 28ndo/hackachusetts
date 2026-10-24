import { describe, it, expect } from "vitest";
import { localeLabel, normalizeLocale, parseReportText } from "@/core/language";

describe("parseReportText", () => {
  it("splits Boston's translation tag", () => {
    expect(parseReportText("-- auto translated (en) --\nFalling branches!\n-- original (zh-hans-US) --\n掉落的樹枝！")).toEqual({
      text: "Falling branches!",
      originalText: "掉落的樹枝！",
      preferredLanguage: "zh",
    });
  });

  it("maps other tags and untagged text", () => {
    expect(parseReportText("-- auto translated (en) --\nHi\n-- original (es-US) --\nHola").preferredLanguage).toBe("es");
    expect(parseReportText("-- auto translated (en) -- Hi -- original (fr-FR) -- Salut").preferredLanguage).toBe("en");
    expect(parseReportText("  Pothole  ")).toEqual({ text: "Pothole", preferredLanguage: "en" });
    expect(parseReportText(undefined)).toEqual({ text: undefined, preferredLanguage: "en" });
  });

  it("labels and normalizes locales", () => {
    expect(localeLabel("zh")).toBe("中文 (简体)");
    expect(normalizeLocale("pt")).toBe("en");
  });
});
