"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  SettingsDivider,
  SettingsNavItem,
} from "./_components/settings-layout";
import { ApiKeysSection } from "./_sections/api-keys-section";
import { ArchivedLeadsSection } from "./_sections/archived-leads-section";
import { EmailTemplatesSection } from "./_sections/email-templates-section";

const SECTIONS = [
  { id: "email-templates", label: "Email Templates" },
  { id: "api-keys", label: "API Keys" },
  { id: "archived-leads", label: "Archived Leads" },
] as const;

export function SettingsClient() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
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

    for (const { id } of SECTIONS) {
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
          <div className="sticky top-0 space-y-0.5 p-3">
            <p className="mb-2 px-2.5 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-widest">
              Settings
            </p>
            {SECTIONS.map((s) => (
              <SettingsNavItem
                active={activeSection === s.id}
                key={s.id}
                label={s.label}
                onClick={scrollTo}
                sectionId={s.id}
              />
            ))}
          </div>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="mx-auto max-w-2xl px-6 py-8">
            <EmailTemplatesSection />
            <div className="my-10">
              <SettingsDivider />
            </div>
            <ApiKeysSection />
            <div className="my-10">
              <SettingsDivider />
            </div>
            <ArchivedLeadsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
