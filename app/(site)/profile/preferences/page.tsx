import { permanentRedirect } from "next/navigation";

/**
 * Preferences moved into Settings.
 *
 * Language, currency, distance and email are settings, and having them on
 * their own screen under Profile meant two places to look for a switch — with
 * the notification toggles duplicated across both. Settings has a category
 * rail now and a section for each, so this URL keeps working and goes there.
 */
export default function PreferencesPage() {
  permanentRedirect("/settings");
}
