import type { Metadata } from "next";
import SettingsScreen from "@/components/profile/SettingsScreen";

export const metadata: Metadata = {
  title: "Settings",
  description: "Location preference and the data Tembera keeps on this device.",
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
