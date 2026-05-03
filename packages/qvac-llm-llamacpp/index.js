const buildFlags = (prompt) => {
  const flags = [];
  const lower = prompt.toLowerCase();
  if (lower.includes("setauthority")) {
    flags.push("setAuthority detected (ownership change)");
  }
  if (lower.includes("approve")) {
    flags.push("Approve instruction detected");
  }
  if (lower.includes("unknown")) {
    flags.push("Unknown program id detected");
  }
  return flags;
};

export class LlamaCpp {
  constructor(options) {
    this.options = options;
  }

  async load() {
    return;
  }

  async generate({ prompt }) {
    const flags = buildFlags(prompt);
    const risk =
      flags.length >= 2 ? "danger" : flags.length === 1 ? "warning" : "safe";
    const summary =
      risk === "safe"
        ? "No obvious red flags detected. Review details before signing."
        : "Potentially risky instructions found. Confirm intent before signing.";
    return {
      text: JSON.stringify({ summary, risk, flags }),
    };
  }
}
