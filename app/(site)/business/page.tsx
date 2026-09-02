import { permanentRedirect } from "next/navigation";

/**
 * `/business` was a marketing page that ended in a link to `/business/register`,
 * which then repeated the same pitch and the same prices above its form. Two
 * screens saying one thing is a leak: people read the argument, then have to
 * read it again to act on it, and some of them stop in between.
 *
 * The argument now lives in the first two steps of the funnel it belongs to,
 * so this URL keeps working and goes where it always meant to.
 */
export default function BusinessPage() {
  permanentRedirect("/business/register");
}
