const { detectFabricatedNumbers } = require("./numberDetection");

function analyze(original, rewritten) {
  return detectFabricatedNumbers({ original, rewritten, reason: "test reason" });
}

describe("detectFabricatedNumbers", () => {
  test("does not flag an unchanged normal number", () => {
    expect(analyze("Managed 12 client accounts", "Managed 12 client accounts").flagged).toBe(false);
  });

  test("does not flag an unchanged percentage", () => {
    expect(analyze("Improved retention by 18%", "Improved retention by 18 percent").flagged).toBe(false);
  });

  test("does not flag an unchanged decimal number", () => {
    expect(analyze("Reduced latency to 2.5 seconds", "Reduced latency to 2.5 seconds").flagged).toBe(false);
  });

  test("handles multiple numbers already present in the original", () => {
    expect(analyze("Supported 4 teams and 20 releases", "Supported 20 releases across 4 teams").flagged).toBe(false);
  });

  test("flags a newly introduced number and uses the required warning", () => {
    const result = analyze("Improved service reliability", "Improved service reliability by 35%");
    expect(result.flagged).toBe(true);
    expect(result.flagReason).toBe("Contains a number not in your original resume. Verify before using.");
  });

  test("flags a newly introduced number even when another number is unchanged", () => {
    expect(analyze("Led 3 engineers", "Led 3 engineers and delivered 8 releases").flagged).toBe(true);
  });

  test("distinguishes negative numbers from positive numbers", () => {
    expect(analyze("Maintained a score of 5", "Improved the score to -5").flagged).toBe(true);
  });

  test("ignores bracketed numeric placeholders", () => {
    expect(analyze("Improved customer outcomes", "Improved outcomes by [X%] for [N users] over [X years]").flagged).toBe(false);
  });

  test("does not flag bullets with no numbers", () => {
    const result = analyze("Built internal tools", "Developed internal tools for teams");
    expect(result.flagged).toBe(false);
    expect(result.flagReason).toBe("");
  });

  test("preserves existing fields and adds false flag metadata", () => {
    expect(analyze("Built a service", "Built a service")).toEqual({
      original: "Built a service",
      rewritten: "Built a service",
      reason: "test reason",
      flagged: false,
      flagReason: "",
    });
  });
});
