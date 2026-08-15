"use client";

import { useState, useEffect } from "react";

export type SystemConfig = {
  COLLEGE_NAME?: string;
  COLLEGE_LOGO?: string;
  COLLEGE_TAGLINE?: string;
  COLLEGE_ADDRESS?: string;
  CHALLAN_BANK_ACCOUNT?: string;
  CHALLAN_BANK_NAME?: string;
  CHALLAN_BRANCH_CODE?: string;
  CHALLAN_ACCOUNT_TITLE?: string;
  CHALLAN_SEQUENCE_START?: string;
  CHALLAN_SEQUENCE_CURRENT?: string;
  ROLL_NUMBER_PATTERN?: string;
  ROLL_SEQUENCE_CURRENT?: string;
  DEFAULT_FACULTY_PASSWORD?: string;
  FACULTY_EMAIL_DOMAIN?: string;
  [key: string]: string | undefined;
};

export function useSettings() {
  const [settings, setSettings] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings(data);
        }
      })
      .catch((err) => console.error("Error loading system settings:", err))
      .finally(() => setLoading(false));
  }, []);

  return {
    settings,
    loading,
    collegeName: settings.COLLEGE_NAME || "Government Post Graduate College Quetta",
    collegeLogo: settings.COLLEGE_LOGO || "",
    collegeTagline: settings.COLLEGE_TAGLINE || "College of Higher Education & Research",
    collegeAddress: settings.COLLEGE_ADDRESS || "Quetta, Balochistan, Pakistan",
  };
}
