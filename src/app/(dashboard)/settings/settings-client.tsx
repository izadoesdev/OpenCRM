"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PageHeader } from "@/components/page-header";
import {
  SettingsDivider,
  SettingsNavItem,
} from "./_components/settings-layout";
import { ApiKeysSection } from "./_sections/api-keys-section";
import { ArchivedLeadsSection } from "./_sections/archived-leads-section";
import { DataManagementSection } from "./_sections/data-management-section";
import { EmailTemplatesSection } from "./_sections/email-templates-section";
import { GeneralSection } from "./_sections/general-section";
import { GoogleIntegrationSection } from "./_sections/google-integration-section";
import { NotificationPreferencesSection } from "./_sections/notification-preferences-section";
import { ProfileSection } from "./_sections/profile-section";
import { WebhooksSection } from "./_sections/webhooks-section";

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ id: string; label: string }>;
}> = [
  {
    label: "Account",
    items: [
      { id: "profile", label: "Profile" },
      { id: "google-integration", label: "Google" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    label: "CRM",
    items: [
      { id: "email-templates", label: "Email Templates" },
      { id: "general", label: "General" },
    ],
  },
  {
    label: "Developer",
    items: [
      { id: "api-keys", label: "API Keys" },
      { id: "webhooks", label: "Webhooks" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "data-export", label: "Export" },
      { id: "archived-leads", label: "Archived Leads" },
    ],
  },
];

const ALL_SECTION_IDS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));

function Divider() {
  return (
    <div className="my-10">
      <SettingsDivider />
    </div>
  );
}

const SECTION_COMPONENTS: Record<string, () => ReactNode> = {
  profile: () => <ProfileSection />,
  "google-integration": () => <GoogleIntegrationSection />,
  notifications: () => <NotificationPreferencesSection />,
  "email-templates": () => <EmailTemplatesSection />,
  general: () => <GeneralSection />,
  "api-keys": () => <ApiKeysSection />,
  webhooks: () => <WebhooksSection />,
  "data-export": () => <DataManagementSection />,
  "archived-leads": () => <ArchivedLeadsSection />,
};

export function SettingsClient() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(ALL_SECTION_IDS[0]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            ALL_SECTION_IDS.includes(entry.target.id)
          ) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        root: container,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    for (const id of ALL_SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <h1 className="font-semibold text-lg tracking-tight">Settings</h1>
      </PageHeader>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-52 shrink-0 border-r md:block">
          <div className="sticky top-0 space-y-4 p-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-2.5 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SettingsNavItem
                      active={activeSection === item.id}
                      key={item.id}
                      label={item.label}
                      onClick={scrollTo}
                      sectionId={item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="mx-auto max-w-2xl px-6 py-8">
            {ALL_SECTION_IDS.map((id, i) => (
              <div key={id}>
                {i > 0 && <Divider />}
                {SECTION_COMPONENTS[id]?.()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
