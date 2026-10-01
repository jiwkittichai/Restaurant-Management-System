import { platformSettings } from "@/lib/platform";
import PlatformSettingsForm from "./_components/PlatformSettingsForm";

export default async function PlatformSettingsPage() {
  const settings = await platformSettings();
  const emailConfigured = Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim() && process.env.AUTH_PUBLIC_URL?.trim());
  const initialLogoUrl = settings.logoUrl ? `/api/platform/logo?v=${settings.updatedAt.getTime()}` : null;
  return <PlatformSettingsForm initialSettings={{ name: settings.name, registrationOpen: settings.registrationOpen }} initialLogoUrl={initialLogoUrl} emailConfigured={emailConfigured} />;
}
