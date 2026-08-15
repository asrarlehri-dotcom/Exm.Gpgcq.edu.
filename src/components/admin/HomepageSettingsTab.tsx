"use client";

import { useEffect, useState } from "react";

type LeadershipMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  show: boolean;
};

type TickerItem = {
  id: string;
  text: string;
  link: string;
  show: boolean;
};

type EventItem = {
  id: string;
  category: string;
  title: string;
  image: string;
  link: string;
  show: boolean;
};

type NoticeItem = {
  id: string;
  date: string;
  title: string;
  link: string;
  show: boolean;
};

type QuickLinkItem = {
  id: string;
  icon: string;
  label: string;
  link: string;
  show: boolean;
};

interface HomepageSettingsTabProps {
  focusedSection?: string;
}

export default function HomepageSettingsTab({ focusedSection }: HomepageSettingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // State for all settings
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Local structured state objects
  const [leadershipItems, setLeadershipItems] = useState<LeadershipMember[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [eventItems, setEventItems] = useState<EventItem[]>([]);
  const [noticeItems, setNoticeItems] = useState<NoticeItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);

  // Upload state
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Unsaved Changes (Dirty State) Tracking
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());

  // Active Single Sub-Section Display State (default: "visibility")
  const [activeSubSection, setActiveSubSection] = useState<string>("visibility");

  useEffect(() => {
    if (focusedSection) {
      setActiveSubSection(focusedSection);
    }
  }, [focusedSection]);

  const markDirty = (sectionId: string) => {
    setDirtySections((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  };

  const clearDirty = (sectionId: string) => {
    setDirtySections((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/homepage");
      if (res.ok) {
        const data = await res.json();
        const cfg = data.settings || {};
        setSettings(cfg);

        // Parse JSON lists safely
        setLeadershipItems(parseJson(cfg.HOMEPAGE_LEADERSHIP_ITEMS, []));
        setTickerItems(parseJson(cfg.HOMEPAGE_TICKER_ITEMS, []));
        setEventItems(parseJson(cfg.HOMEPAGE_EVENTS_ITEMS, []));
        setNoticeItems(parseJson(cfg.HOMEPAGE_NOTICES_ITEMS, []));
        setQuickLinks(parseJson(cfg.HOMEPAGE_QUICK_LINKS_ITEMS, []));
        setDirtySections(new Set());
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Failed to load homepage settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const parseJson = <T,>(jsonString: string | undefined, fallback: T): T => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  };

  const updateKey = (key: string, value: string, sectionId?: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (sectionId) {
      markDirty(sectionId);
    }
  };

  // Image File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: string, sectionId: string, itemId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(itemId ? `${targetField}_${itemId}` : targetField);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url;

        if (targetField === "LEADERSHIP_IMAGE" && itemId) {
          setLeadershipItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, image: uploadedUrl } : item)));
        } else if (targetField === "EVENT_IMAGE" && itemId) {
          setEventItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, image: uploadedUrl } : item)));
        } else {
          updateKey(targetField, uploadedUrl, sectionId);
        }

        markDirty(sectionId);
        setMsg({ type: "success", text: "Picture uploaded successfully!" });
      } else {
        const err = await res.json();
        alert(err.error || "File upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading picture file.");
    } finally {
      setUploadingField(null);
    }
  };

  // Generic Save Function
  const saveSettingsPayload = async (sectionId?: string, sectionName?: string) => {
    if (sectionId) setSavingSection(sectionId);
    else setSavingGlobal(true);

    setMsg({ type: "", text: "" });

    const payload = {
      ...settings,
      HOMEPAGE_LEADERSHIP_ITEMS: JSON.stringify(leadershipItems),
      HOMEPAGE_TICKER_ITEMS: JSON.stringify(tickerItems),
      HOMEPAGE_EVENTS_ITEMS: JSON.stringify(eventItems),
      HOMEPAGE_NOTICES_ITEMS: JSON.stringify(noticeItems),
      HOMEPAGE_QUICK_LINKS_ITEMS: JSON.stringify(quickLinks),
    };

    try {
      const res = await fetch("/api/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const label = sectionName ? `"${sectionName}" settings` : "All Homepage settings";
        setMsg({ type: "success", text: `✅ ${label} saved successfully!` });
        if (sectionId) {
          clearDirty(sectionId);
        } else {
          setDirtySections(new Set());
        }
      } else {
        const err = await res.json();
        setMsg({ type: "error", text: err.error || "Failed to save settings." });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server error occurred while saving settings." });
    } finally {
      if (sectionId) setSavingSection(null);
      else setSavingGlobal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm font-semibold text-gray-500">Loading Homepage CMS Settings...</p>
      </div>
    );
  }

  const subSectionsList = [
    { id: "visibility", label: "Section Visibility", icon: "👁️" },
    { id: "branding", label: "Branding & Logo", icon: "🏛️" },
    { id: "hero", label: "Hero Banner", icon: "🌄" },
    { id: "stats", label: "Stats Counter", icon: "📊" },
    { id: "leadership", label: "Leadership Team", icon: "👨‍💼" },
    { id: "events", label: "Campus Events", icon: "🎉" },
    { id: "ticker", label: "Ticker Notices", icon: "📣" },
    { id: "notices", label: "Official Notices", icon: "📋" },
    { id: "ALL", label: "Show All Sections", icon: "📑" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Alert Banner */}
      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border ${
            msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Main Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span>🌐</span> Homepage Content & Display Controls
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Click any setting tab below to view ONLY that specific section!
          </p>
        </div>

        <div className="flex items-center gap-3">
          {dirtySections.size > 0 && (
            <span className="text-xs font-black bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg animate-pulse shadow">
              ⚠️ {dirtySections.size} Unsaved Section{dirtySections.size > 1 ? "s" : ""}
            </span>
          )}

          <button
            onClick={() => saveSettingsPayload()}
            disabled={savingGlobal}
            className={`font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              dirtySections.size > 0
                ? "bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 ring-2 ring-amber-300 animate-pulse"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
          >
            {savingGlobal ? "Saving All..." : "Save All Settings 💾"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          ISOLATED SUB-SECTION SELECTOR TAB PILLS
      ───────────────────────────────────────────── */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {subSectionsList.map((tab) => {
          const isActive = activeSubSection === tab.id;
          const isDirty = dirtySections.has(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-blue-600 border border-gray-200/80"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block ml-0.5"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────
          ONLY RENDER THE ACTIVELY SELECTED SECTION
      ───────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* SECTION 1: VISIBILITY */}
        {(activeSubSection === "visibility" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("visibility") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">👁️</span>
                <span>Section Visibility (Show / Hide Controls)</span>
                {dirtySections.has("visibility") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("visibility", "Section Visibility")}
                disabled={savingSection === "visibility"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("visibility")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "visibility" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("visibility") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "HOMEPAGE_HERO_SHOW", label: "Hero Banner" },
                  { key: "HOMEPAGE_STATS_SHOW", label: "Stats Counter Grid" },
                  { key: "HOMEPAGE_LEADERSHIP_SHOW", label: "Leadership Section" },
                  { key: "HOMEPAGE_TICKER_SHOW", label: "Notices Ticker Bar" },
                  { key: "HOMEPAGE_EVENTS_SHOW", label: "Campus Life Events" },
                  { key: "HOMEPAGE_NOTICES_SHOW", label: "Official Notices List" },
                  { key: "HOMEPAGE_CHALLAN_WIDGET_SHOW", label: "Fee Challan Widget" },
                  { key: "HOMEPAGE_QUICK_LINKS_SHOW", label: "Quick Links Widget" },
                  { key: "HOMEPAGE_FOOTER_SHOW", label: "Footer Section" },
                ].map((sec) => {
                  const isShown = settings[sec.key] !== "false";
                  return (
                    <div
                      key={sec.key}
                      onClick={() => updateKey(sec.key, isShown ? "false" : "true", "visibility")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isShown ? "bg-blue-50/60 border-blue-200 text-blue-900" : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="text-xs font-bold">{sec.label}</span>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md ${isShown ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                        {isShown ? "VISIBLE" : "HIDDEN"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: BRANDING */}
        {(activeSubSection === "branding" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("branding") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">🏛️</span>
                <span>College Branding & Header Logo</span>
                {dirtySections.has("branding") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("branding", "College Branding")}
                disabled={savingSection === "branding"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("branding")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "branding" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("branding") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Logo Text Badge</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={settings.HOMEPAGE_HEADER_LOGO_TEXT || "GP"}
                    onChange={(e) => updateKey("HOMEPAGE_HEADER_LOGO_TEXT", e.target.value, "branding")}
                    placeholder="e.g. GP"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Header Subtitle Tagline</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={settings.HOMEPAGE_HEADER_SUBTEXT || ""}
                    onChange={(e) => updateKey("HOMEPAGE_HEADER_SUBTEXT", e.target.value, "branding")}
                    placeholder="e.g. SARIAB ROAD, QUETTA • CMS ERP PORTAL"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">College Logo Picture</label>
                  <div className="flex items-center gap-3">
                    {settings.HOMEPAGE_HEADER_LOGO_IMAGE ? (
                      <img src={settings.HOMEPAGE_HEADER_LOGO_IMAGE} alt="Logo" className="w-10 h-10 object-contain border rounded-md p-1 bg-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 border flex items-center justify-center text-xs text-gray-400 font-bold">
                        No Logo
                      </div>
                    )}

                    <label className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors border border-blue-200">
                      {uploadingField === "HOMEPAGE_HEADER_LOGO_IMAGE" ? "Uploading..." : "Upload Logo Image 📷"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "HOMEPAGE_HEADER_LOGO_IMAGE", "branding")}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    className="w-full mt-2 px-3 py-1.5 border border-gray-300 rounded-md text-xs"
                    placeholder="Or paste Logo Image URL..."
                    value={settings.HOMEPAGE_HEADER_LOGO_IMAGE || ""}
                    onChange={(e) => updateKey("HOMEPAGE_HEADER_LOGO_IMAGE", e.target.value, "branding")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: HERO BANNER */}
        {(activeSubSection === "hero" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("hero") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">🌄</span>
                <span>Hero Banner Customization</span>
                {dirtySections.has("hero") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("hero", "Hero Banner")}
                disabled={savingSection === "hero"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("hero")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "hero" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("hero") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Hero Main Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={settings.HOMEPAGE_HERO_TITLE || ""}
                    onChange={(e) => updateKey("HOMEPAGE_HERO_TITLE", e.target.value, "hero")}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Hero Subtitle / Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    value={settings.HOMEPAGE_HERO_SUBTITLE || ""}
                    onChange={(e) => updateKey("HOMEPAGE_HERO_SUBTITLE", e.target.value, "hero")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Hero Background Picture</label>
                    <div className="flex items-center gap-3">
                      {settings.HOMEPAGE_HERO_BG_IMAGE && (
                        <img src={settings.HOMEPAGE_HERO_BG_IMAGE} alt="Hero BG" className="w-16 h-10 object-cover border rounded-md" />
                      )}
                      <label className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors border border-blue-200">
                        {uploadingField === "HOMEPAGE_HERO_BG_IMAGE" ? "Uploading..." : "Upload Hero BG 📷"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "HOMEPAGE_HERO_BG_IMAGE", "hero")}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      className="w-full mt-2 px-3 py-1.5 border border-gray-300 rounded-md text-xs"
                      placeholder="Or paste Hero BG Image URL..."
                      value={settings.HOMEPAGE_HERO_BG_IMAGE || ""}
                      onChange={(e) => updateKey("HOMEPAGE_HERO_BG_IMAGE", e.target.value, "hero")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Primary Button Text</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        value={settings.HOMEPAGE_HERO_BTN1_TEXT || ""}
                        onChange={(e) => updateKey("HOMEPAGE_HERO_BTN1_TEXT", e.target.value, "hero")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Secondary Button Text</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        value={settings.HOMEPAGE_HERO_BTN2_TEXT || ""}
                        onChange={(e) => updateKey("HOMEPAGE_HERO_BTN2_TEXT", e.target.value, "hero")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: STATS COUNTER */}
        {(activeSubSection === "stats" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("stats") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">📊</span>
                <span>Stats Counter Configuration</span>
                {dirtySections.has("stats") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("stats", "Stats Counter")}
                disabled={savingSection === "stats"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("stats")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "stats" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("stats") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Count Calculation Mode:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateKey("HOMEPAGE_STATS_MODE", "MANUAL", "stats")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      settings.HOMEPAGE_STATS_MODE !== "AUTO" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Custom Manual Numbers
                  </button>
                  <button
                    onClick={() => updateKey("HOMEPAGE_STATS_MODE", "AUTO", "stats")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      settings.HOMEPAGE_STATS_MODE === "AUTO" ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Auto Live DB Counts ⚡
                  </button>
                </div>
              </div>

              {settings.HOMEPAGE_STATS_MODE !== "AUTO" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Total Students</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                      value={settings.HOMEPAGE_STATS_STUDENTS || "1420"}
                      onChange={(e) => updateKey("HOMEPAGE_STATS_STUDENTS", e.target.value, "stats")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Active Programs</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                      value={settings.HOMEPAGE_STATS_PROGRAMS || "5"}
                      onChange={(e) => updateKey("HOMEPAGE_STATS_PROGRAMS", e.target.value, "stats")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Faculty Members</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                      value={settings.HOMEPAGE_STATS_FACULTY || "85"}
                      onChange={(e) => updateKey("HOMEPAGE_STATS_FACULTY", e.target.value, "stats")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Total Courses</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-sm font-bold"
                      value={settings.HOMEPAGE_STATS_COURSES || "85"}
                      onChange={(e) => updateKey("HOMEPAGE_STATS_COURSES", e.target.value, "stats")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: LEADERSHIP */}
        {(activeSubSection === "leadership" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("leadership") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">👨‍💼</span>
                <span>Administration & Leadership Team</span>
                {dirtySections.has("leadership") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("leadership", "Leadership Team")}
                disabled={savingSection === "leadership"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("leadership")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "leadership" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("leadership") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setLeadershipItems([
                      ...leadershipItems,
                      {
                        id: `lead-${Date.now()}`,
                        name: "New Member Name",
                        role: "Designation / Role",
                        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
                        show: true,
                      },
                    ]);
                    markDirty("leadership");
                  }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-blue-200"
                >
                  + Add Leadership Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leadershipItems.map((mem, idx) => (
                  <div key={mem.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-600">Member #{idx + 1}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setLeadershipItems((prev) => prev.map((item) => (item.id === mem.id ? { ...item, show: !item.show } : item)));
                            markDirty("leadership");
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded ${mem.show ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                        >
                          {mem.show ? "Visible" : "Hidden"}
                        </button>

                        <button
                          onClick={() => {
                            setLeadershipItems((prev) => prev.filter((item) => item.id !== mem.id));
                            markDirty("leadership");
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-800"
                        >
                          Delete 🗑️
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Full Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border rounded-md text-xs font-bold"
                          value={mem.name}
                          onChange={(e) => {
                            setLeadershipItems((prev) => prev.map((item) => (item.id === mem.id ? { ...item, name: e.target.value } : item)));
                            markDirty("leadership");
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Designation / Role</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border rounded-md text-xs font-semibold text-blue-700"
                          value={mem.role}
                          onChange={(e) => {
                            setLeadershipItems((prev) => prev.map((item) => (item.id === mem.id ? { ...item, role: e.target.value } : item)));
                            markDirty("leadership");
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Profile Picture</label>
                        <div className="flex items-center gap-3 mt-1">
                          {mem.image ? (
                            <img src={mem.image} alt={mem.name} className="w-12 h-12 object-cover rounded-md border" />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-200 border flex items-center justify-center text-xs">No Photo</div>
                          )}

                          <label className="bg-white text-gray-700 hover:bg-gray-100 font-bold text-xs px-3 py-1.5 rounded-md border cursor-pointer">
                            {uploadingField === `LEADERSHIP_IMAGE_${mem.id}` ? "Uploading..." : "Upload Photo 📷"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "LEADERSHIP_IMAGE", "leadership", mem.id)}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          className="w-full mt-2 px-2.5 py-1 border rounded-md text-xs"
                          placeholder="Or paste Image URL..."
                          value={mem.image}
                          onChange={(e) => {
                            setLeadershipItems((prev) => prev.map((item) => (item.id === mem.id ? { ...item, image: e.target.value } : item)));
                            markDirty("leadership");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: EVENTS */}
        {(activeSubSection === "events" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("events") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">🎉</span>
                <span>Campus Life & Recent Events</span>
                {dirtySections.has("events") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("events", "Campus Events")}
                disabled={savingSection === "events"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("events")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "events" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("events") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEventItems([
                      ...eventItems,
                      {
                        id: `evt-${Date.now()}`,
                        category: "JULY 2026 • EVENT",
                        title: "New Event Title",
                        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
                        link: "#",
                        show: true,
                      },
                    ]);
                    markDirty("events");
                  }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-blue-200"
                >
                  + Add Campus Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eventItems.map((evt, idx) => (
                  <div key={evt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-600">Event #{idx + 1}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEventItems((prev) => prev.map((item) => (item.id === evt.id ? { ...item, show: !item.show } : item)));
                            markDirty("events");
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded ${evt.show ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                        >
                          {evt.show ? "Visible" : "Hidden"}
                        </button>

                        <button
                          onClick={() => {
                            setEventItems((prev) => prev.filter((item) => item.id !== evt.id));
                            markDirty("events");
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-800"
                        >
                          Delete 🗑️
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Category / Date Badge</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border rounded-md text-xs font-bold text-emerald-700"
                          value={evt.category}
                          onChange={(e) => {
                            setEventItems((prev) => prev.map((item) => (item.id === evt.id ? { ...item, category: e.target.value } : item)));
                            markDirty("events");
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Event Title</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 border rounded-md text-xs font-bold"
                          value={evt.title}
                          onChange={(e) => {
                            setEventItems((prev) => prev.map((item) => (item.id === evt.id ? { ...item, title: e.target.value } : item)));
                            markDirty("events");
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">Event Image</label>
                        <div className="flex items-center gap-3 mt-1">
                          {evt.image ? (
                            <img src={evt.image} alt={evt.title} className="w-16 h-10 object-cover rounded-md border" />
                          ) : (
                            <div className="w-16 h-10 rounded-md bg-gray-200 border flex items-center justify-center text-xs">No Photo</div>
                          )}

                          <label className="bg-white text-gray-700 hover:bg-gray-100 font-bold text-xs px-3 py-1.5 rounded-md border cursor-pointer">
                            {uploadingField === `EVENT_IMAGE_${evt.id}` ? "Uploading..." : "Upload Image 📷"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "EVENT_IMAGE", "events", evt.id)}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          className="w-full mt-2 px-2.5 py-1 border rounded-md text-xs"
                          placeholder="Or paste Image URL..."
                          value={evt.image}
                          onChange={(e) => {
                            setEventItems((prev) => prev.map((item) => (item.id === evt.id ? { ...item, image: e.target.value } : item)));
                            markDirty("events");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: SCROLLING TICKER */}
        {(activeSubSection === "ticker" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("ticker") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">📣</span>
                <span>Scrolling Ticker Announcements</span>
                {dirtySections.has("ticker") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("ticker", "Ticker Announcements")}
                disabled={savingSection === "ticker"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("ticker")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "ticker" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("ticker") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setTickerItems([
                      ...tickerItems,
                      { id: `tick-${Date.now()}`, text: "New scrolling notice announcement text", link: "#", show: true },
                    ]);
                    markDirty("ticker");
                  }}
                  className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-2 rounded-lg border border-blue-200"
                >
                  + Add Ticker Notice
                </button>
              </div>

              <div className="space-y-3">
                {tickerItems.map((tick) => (
                  <div key={tick.id} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        className="w-full px-2.5 py-1 border rounded text-xs font-semibold"
                        value={tick.text}
                        onChange={(e) => {
                          setTickerItems((prev) => prev.map((item) => (item.id === tick.id ? { ...item, text: e.target.value } : item)));
                          markDirty("ticker");
                        }}
                      />
                      <button
                        onClick={() => {
                          setTickerItems((prev) => prev.filter((item) => item.id !== tick.id));
                          markDirty("ticker");
                        }}
                        className="ml-2 text-xs text-red-600 hover:text-red-800 font-bold shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: OFFICIAL NOTICES */}
        {(activeSubSection === "notices" || activeSubSection === "ALL") && (
          <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
            dirtySections.has("notices") ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200"
          }`}>
            <div className="p-5 flex items-center justify-between border-b border-gray-100 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-2.5 font-black text-gray-900 text-base">
                <span className="text-lg">📋</span>
                <span>Official Notices List</span>
                {dirtySections.has("notices") && (
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    ● UNSAVED CHANGES
                  </span>
                )}
              </div>

              <button
                onClick={() => saveSettingsPayload("notices", "Official Notices")}
                disabled={savingSection === "notices"}
                className={`font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow transform active:scale-95 shrink-0 ${
                  dirtySections.has("notices")
                    ? "bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white animate-pulse border-2 border-amber-300 shadow-lg shadow-red-500/40 ring-2 ring-red-400"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                }`}
              >
                {savingSection === "notices" ? (
                  <span>Saving...</span>
                ) : dirtySections.has("notices") ? (
                  <span>💾 Save Section (Unsaved!)</span>
                ) : (
                  <span>💾 Save Section</span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setNoticeItems([
                      ...noticeItems,
                      { id: `not-${Date.now()}`, date: "August 11, 2026", title: "New official notice title", link: "#", show: true },
                    ]);
                    markDirty("notices");
                  }}
                  className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-2 rounded-lg border border-blue-200"
                >
                  + Add Notice
                </button>
              </div>

              <div className="space-y-3">
                {noticeItems.map((not) => (
                  <div key={not.id} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        className="w-28 px-2 py-1 border rounded text-xs font-bold text-blue-600"
                        value={not.date}
                        onChange={(e) => {
                          setNoticeItems((prev) => prev.map((item) => (item.id === not.id ? { ...item, date: e.target.value } : item)));
                          markDirty("notices");
                        }}
                      />
                      <input
                        type="text"
                        className="w-full px-2.5 py-1 border rounded text-xs font-semibold"
                        value={not.title}
                        onChange={(e) => {
                          setNoticeItems((prev) => prev.map((item) => (item.id === not.id ? { ...item, title: e.target.value } : item)));
                          markDirty("notices");
                        }}
                      />
                      <button
                        onClick={() => {
                          setNoticeItems((prev) => prev.filter((item) => item.id !== not.id));
                          markDirty("notices");
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-bold shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
