"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from "@/lib/dayjs";
import { useProfile, useUpdateProfile } from "@/lib/queries";
import { getInitials } from "@/lib/utils";
import {
  SettingsSection,
  SettingsSectionHeader,
  SettingsSkeleton,
} from "../_components/settings-layout";

export function ProfileSection() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const isDirty = name.trim() !== (profile?.name ?? "");

  function handleSave() {
    if (!(name.trim() && isDirty)) {
      return;
    }
    updateProfile.mutate({ name: name.trim() });
  }

  if (isLoading) {
    return (
      <SettingsSection id="profile">
        <SettingsSectionHeader title="Profile" />
        <SettingsSkeleton rows={1} />
      </SettingsSection>
    );
  }

  return (
    <SettingsSection id="profile">
      <SettingsSectionHeader
        description="Your personal information"
        title="Profile"
      />

      <div className="mt-5 rounded-lg border p-5">
        <div className="flex items-start gap-4">
          <Avatar size="lg">
            {profile?.image && (
              <AvatarImage alt={profile.name ?? ""} src={profile.image} />
            )}
            <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]" htmlFor="profile-name">
                Name
              </Label>
              <Input
                id="profile-name"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="Your name"
                value={name}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <Input
                className="bg-muted/40"
                disabled
                value={profile?.email ?? ""}
              />
            </div>
            {profile?.createdAt && (
              <p className="text-muted-foreground text-xs">
                Member since {dayjs(profile.createdAt).format("MMMM YYYY")}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!(isDirty && name.trim()) || updateProfile.isPending}
            onClick={handleSave}
            size="sm"
          >
            {updateProfile.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
