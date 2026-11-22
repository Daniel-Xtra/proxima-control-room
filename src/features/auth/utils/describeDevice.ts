/** Turns a raw user-agent string into a short, readable "Chrome on Windows" and tells phones from computers. */
export function describeDevice(agent: string): { label: string; mobile: boolean } {
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /OPR\/|Opera/.test(agent)
      ? "Opera"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Chrome\//.test(agent)
          ? "Chrome"
          : /Safari\//.test(agent)
            ? "Safari"
            : "";
  const system = /Windows/.test(agent)
    ? "Windows"
    : /Android/.test(agent)
      ? "Android"
      : /iPhone|iPad|iOS/.test(agent)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "";
  const mobile = /Android|iPhone|iPad|Mobile/.test(agent);
  const label = browser && system ? `${browser} on ${system}` : browser || system || agent;
  return { label, mobile };
}
