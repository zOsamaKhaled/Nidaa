import { APP_VERSION, GITHUB_REPO } from "../version";

/**
 * UpdateService — checks GitHub Releases for a newer version. Publish a new
 * release (tag like `v1.2.0`) with the setup .exe attached, and the app will
 * detect it and offer a Download link. No signing/auto-install — the user
 * downloads and runs the new installer.
 */

export interface UpdateResult {
  status: "latest" | "update" | "error";
  /** Latest version string (without leading "v"). */
  version?: string;
  /** Download URL (the setup asset, or the release page). */
  url?: string;
}

/** Compare dotted versions; returns >0 if a>b, <0 if a<b, 0 if equal. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

export const UpdateService = {
  current: APP_VERSION,

  async check(): Promise<UpdateResult> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const tag = String(d.tag_name ?? "").replace(/^v/i, "").trim();
      if (!tag) throw new Error("no tag");
      const assets: any[] = Array.isArray(d.assets) ? d.assets : [];
      const setup =
        assets.find((a) => /setup\.exe$/i.test(a.name)) ||
        assets.find((a) => /\.(exe|msi)$/i.test(a.name));
      const url = setup?.browser_download_url || d.html_url;
      if (compareVersions(tag, APP_VERSION) > 0) {
        return { status: "update", version: tag, url };
      }
      return { status: "latest", version: APP_VERSION };
    } catch {
      return { status: "error" };
    }
  },
};
