/** Current projectId from a pathname like /projects/{id}/rfis, or null. */
export function projectIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/projects\/([^/]+)/);
  return m ? m[1] : null;
}

/** Same location in another project: /projects/A/rfis + B → /projects/B/rfis.
 *  From anywhere outside a project (e.g. /projects), lands on B's dashboard. */
export function pathForProject(pathname: string, newProjectId: string): string {
  const m = pathname.match(/^\/projects\/[^/]+(\/.*)?$/);
  const rest = m?.[1] ?? "";
  return `/projects/${newProjectId}${rest}`;
}
