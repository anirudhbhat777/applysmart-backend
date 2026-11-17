const FLAG_REASON = "Contains a number not in your original resume. Verify before using.";

function removeNumericPlaceholders(text) {
  return text.replace(/\[[^\]]*\]/g, (placeholder) => {
    const value = placeholder.slice(1, -1).trim();
    return /^(?:x|n|number|metric|value|amount|percentage)\b/i.test(value)
      ? " "
      : placeholder;
  });
}

function extractNumbers(text) {
  const source = removeNumericPlaceholders(text);
  const numberPattern = /(?<![\p{L}\d_])[+-]?\s*(?:[$€£₹]\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:%|percent(?:age)?|[kmb](?![\p{L}])|thousand|million|billion)?/giu;
  const values = new Set();

  for (const match of source.matchAll(numberPattern)) {
    const token = match[0].trim().replace(/^([$€£₹]\s*)/, "");
    const parts = token.match(/^([+-]?\s*[\d,]+(?:\.\d+)?)(?:\s*(%|percent(?:age)?|[kmb]|thousand|million|billion))?$/i);
    if (!parts) continue;

    let value = Number(parts[1].replace(/[ ,]/g, ""));
    const suffix = (parts[2] || "").toLowerCase();
    const multipliers = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9 };
    if (multipliers[suffix]) value *= multipliers[suffix];

    const isPercentage = suffix === "%" || suffix.startsWith("percent");
    values.add(`${value}:${isPercentage ? "percent" : "number"}`);
  }

  return values;
}

function detectFabricatedNumbers(bullet) {
  const originalNumbers = extractNumbers(bullet.original);
  const rewrittenNumbers = extractNumbers(bullet.rewritten);
  const flagged = [...rewrittenNumbers].some((number) => !originalNumbers.has(number));

  return {
    ...bullet,
    flagged,
    flagReason: flagged ? FLAG_REASON : "",
  };
}

module.exports = { detectFabricatedNumbers, extractNumbers, FLAG_REASON };
