import type { Provider } from "./types";

export interface ParsedPr {
  provider: Provider;
  host: string;
  repo: string;
  number: number;
  url: string;
}

/**
 * Accepts GitHub pull request URLs and GitLab merge request URLs
 * (gitlab.com or self-managed, any group depth).
 */
export function parsePrUrl(input: string): ParsedPr | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const path = u.pathname.replace(/\/+$/, "");

  const gh = path.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/);
  if (u.hostname === "github.com" && gh) {
    const repo = `${gh[1]}/${gh[2]}`;
    const number = Number(gh[3]);
    return { provider: "github", host: u.host, repo, number, url: `https://github.com/${repo}/pull/${number}` };
  }

  const gl = path.match(/^\/(.+?)\/-\/merge_requests\/(\d+)(?:\/.*)?$/);
  if (gl) {
    const repo = gl[1];
    const number = Number(gl[2]);
    return { provider: "gitlab", host: u.host, repo, number, url: `${u.protocol}//${u.host}/${repo}/-/merge_requests/${number}` };
  }
  return null;
}
