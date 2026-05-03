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
    try {
      const apiUrl = import.meta.env?.VITE_API_URL ?? 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { text: data.text };
    } catch (e) {
      console.error("Failed to hit local LLM backend:", e);
      // Fallback to basic heuristic if backend is down
      const flags = buildFlags(prompt);
      const risk = flags.length >= 2 ? "danger" : flags.length === 1 ? "warning" : "safe";
      const summary = risk === "safe"
          ? "No obvious red flags detected. Review details before signing."
          : "Potentially risky instructions found. Confirm intent before signing.";
      
      if (prompt.includes("You are a portfolio assistant")) {
        return { text: "Backend is offline. Could not process your request." };
      }
      
      return { text: JSON.stringify({ summary, risk, flags }) };
    }
  }
}
