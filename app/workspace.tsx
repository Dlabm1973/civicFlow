"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CircleDot,
  Clock3,
  FileCheck2,
  FileUp,
  HelpCircle,
  Inbox,
  Languages,
  Loader2,
  LockKeyhole,
  MessageCircleMore,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { languageNames, translate } from "@/lib/civicflow/languages";
import type { ChatReply, RequirementView } from "@/lib/civicflow/types";

type TimelineMessage = {
  id: string;
  direction: "assistant" | "resident" | "system";
  text: string;
};

type CaseRow = {
  id: string;
  reference: string;
  applicant_name: string | null;
  case_type: string;
  current_state: string;
  progress: number;
  property_label: string | null;
  assigned_queue: string;
  priority: string;
  channel: string;
  updated_at: string;
  created_at: string;
};

type CaseDetail = {
  case: Record<string, any>;
  people: Record<string, any>[];
  incomes: Record<string, any>[];
  requirements: Record<string, any>[];
  documents: Record<string, any>[];
  tasks: Record<string, any>[];
  events: Record<string, any>[];
  notification?: { id: string; status: string; error?: string | null; updated_at: string } | null;
};

const implementationModules = [
  ["Channel entry", "Residents use WhatsApp; staff use CivicFlow Desk", "partial"],
  ["Persistent case", "D1 case, session, task and audit records", "ready"],
  ["Document intake", "R2 uploads linked to person and requirement", "ready"],
  ["Household & income", "Adult-by-adult sources and gross totals", "ready"],
  ["Special routes", "Estate, guardian, divorce and no-account tasks", "partial"],
  ["Rules catalogue", "Versioned shell; policy values deliberately unset", "blocked"],
  ["Munsoft, GIS & valuation", "Adapter boundary prepared; interfaces required", "blocked"],
  ["Decision & implementation", "Recommendations available; authority matrix required", "partial"],
];

function statusLabel(value?: string | null) {
  return (value || "UNKNOWN")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value?: string | null) {
  const status = value || "";
  if (/APPROVED|IMPLEMENTED|ACCEPTED|SUBMITTED|READY/.test(status)) return "positive";
  if (/FAIL|DECLINED|REJECTED|BLOCKED/.test(status)) return "danger";
  if (/OUTSTANDING|PENDING|REQUIRED|REVIEW|INFORMATION/.test(status)) return "warning";
  return "neutral";
}

function StatePill({ value }: { value?: string | null }) {
  const tone = statusTone(value);
  const classes = {
    positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  }[tone];
  return (
    <Badge variant="outline" className={`rounded-full px-2.5 py-1 font-medium ${classes}`}>
      {statusLabel(value)}
    </Badge>
  );
}

function ResidentWorkspace({ onCaseChanged }: { onCaseChanged: () => void }) {
  const [sessionId, setSessionId] = useState("");
  const [reply, setReply] = useState<ChatReply | null>(null);
  const [messages, setMessages] = useState<TimelineMessage[]>([]);
  const [entry, setEntry] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const t = (text: string) => translate(text, reply?.language);

  async function send(payload: { text?: string; action?: string }, visibleText?: string) {
    if (!sessionId) return;
    if (visibleText) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), direction: "resident", text: visibleText },
      ]);
    }
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          channelType: "WEB",
          channelIdentifier: sessionId,
          ...payload,
        }),
      });
      const data = (await response.json()) as ChatReply & { error?: string };
      if (!response.ok) throw new Error(data.error || "Khula could not continue");
      setReply(data);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), direction: "assistant", text: data.message },
      ]);
      if (data.caseId) onCaseChanged();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          direction: "system",
          text: error instanceof Error ? error.message : "The service is temporarily unavailable.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function initialise(fresh = false) {
    const existing = fresh ? null : window.localStorage.getItem("civicflow-session");
    const id = existing || crypto.randomUUID();
    window.localStorage.setItem("civicflow-session", id);
    setSessionId(id);
    setReply(null);
    setMessages([]);
  }

  useEffect(() => initialise(false), []);

  useEffect(() => {
    if (!sessionId) return;
    void send({});
    // sessionId intentionally starts one authoritative server-side session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, reply?.requirements]);

  async function submitText(event: FormEvent) {
    event.preventDefault();
    const value = entry.trim();
    if (!value || loading) return;
    setEntry("");
    await send({ text: value }, value);
  }

  async function upload(requirement: RequirementView, file?: File) {
    if (!file || !reply?.caseId) return;
    setUploading(requirement.id);
    const form = new FormData();
    form.append("file", file);
    form.append("caseId", reply.caseId);
    form.append("requirementId", requirement.id);
    form.append("sessionId", sessionId);
    try {
      const response = await fetch("/api/documents", { method: "POST", body: form });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          direction: "system",
          text: `${requirement.label} received and marked for municipal review.`,
        },
      ]);
      await send({});
      onCaseChanged();
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          direction: "system",
          text: error instanceof Error ? error.message : "Upload failed",
        },
      ]);
    } finally {
      setUploading(null);
    }
  }

  const requiresInput = reply?.inputType && !["none"].includes(reply.inputType);

  return (
    <div className="grid min-h-[720px] grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)] gap-6 max-xl:grid-cols-1">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(10,35,48,.11)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f7fbfc] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#087f83] text-white shadow-sm">
              <MessageCircleMore className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#0a2b3a]">Khula</h2>
              <p className="text-sm text-slate-600">Resident application channel</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label={t("Change language")} value={reply?.language || "en"} disabled={loading} onChange={event => void send({ action: `LANG_${event.target.value.toUpperCase()}` }, languageNames[event.target.value])} className="max-w-32 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
              {Object.entries(languageNames).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <Badge className="hidden rounded-full bg-[#e3f6f3] text-[#075f62] hover:bg-[#e3f6f3] sm:inline-flex">
              <Smartphone className="mr-1 size-3.5" /> WhatsApp-ready
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => initialise(true)}
              aria-label="Start a new sandbox session"
              title="New sandbox session"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-3 sm:px-7">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-slate-700">
              {reply?.caseReference || "Application not started"}
            </span>
            <span className="tabular-nums text-slate-500">{reply?.progress || 0}%</span>
          </div>
          <Progress value={reply?.progress || 0} className="h-2 bg-[#d9e8eb] [&_[data-slot=progress-indicator]]:bg-[#087f83]" />
        </div>

        <div className="flex h-[490px] flex-col overflow-y-auto bg-[#eef6f6] px-4 py-5 sm:px-7">
          <div className="mx-auto mb-5 flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600">
            <LockKeyhole className="size-3.5 text-[#087f83]" />
            Pilot sandbox — use sample information only
          </div>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.direction === "resident"
                    ? "ml-auto max-w-[84%] rounded-[20px_20px_5px_20px] bg-[#087f83] px-4 py-3 text-base leading-6 text-white shadow-sm"
                    : message.direction === "system"
                      ? "mx-auto max-w-[90%] rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm leading-5 text-amber-900"
                      : "max-w-[88%] rounded-[20px_20px_20px_5px] border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-800 shadow-sm"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          {reply?.summary && (
            <div className="mt-4 max-w-[94%] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-bold text-[#0a2b3a]">{t("Application summary")}</h3>
              <dl className="space-y-2.5">
                {Object.entries(reply.summary).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(120px,.8fr)_1.2fr] gap-3 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0">
                    <dt className="text-slate-500">{key}</dt>
                    <dd className="font-medium text-slate-800">{String(value ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {!!reply?.requirements?.length && (
            <div className="mt-4 space-y-3">
              {reply.requirements.map((requirement) => {
                const done = requirement.status !== "OUTSTANDING";
                return (
                  <div key={requirement.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {done ? <Check className="size-4" /> : <FileUp className="size-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-5 text-slate-800">{requirement.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{statusLabel(requirement.status)}</p>
                        </div>
                      </div>
                      {!done && (
                        <label className="shrink-0">
                          <input
                            type="file"
                            accept="application/pdf,image/jpeg,image/png"
                            className="sr-only"
                            onChange={(event) => void upload(requirement, event.target.files?.[0])}
                          />
                          <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#0a2b3a] px-3 text-sm font-semibold text-white transition hover:bg-[#123f52]">
                            {uploading === requirement.id ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                            Upload
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
          {!!reply?.choices?.length && (
            <div className="mb-3 flex flex-wrap gap-2">
              {reply.choices.map((choice) => (
                <Button
                  key={choice.id}
                  variant="outline"
                  onClick={() => void send({ action: choice.id }, choice.label)}
                  disabled={loading}
                  className="h-auto min-h-10 whitespace-normal rounded-xl border-[#8eb9bc] bg-white px-3 py-2 text-left text-[#075f62] hover:bg-[#e3f6f3]"
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          )}
          {reply?.step === "DOCUMENTS" && (
            <Button
              onClick={() => void send({ action: "DOC_DONE" }, t("I have finished uploading"))}
              disabled={loading}
              className="mb-3 rounded-xl bg-[#087f83] hover:bg-[#066a6e]"
            >
              {t("I have finished uploading")} <ArrowRight />
            </Button>
          )}
          <form onSubmit={submitText} className="flex gap-2">
            <Input
              type={reply?.inputType === "number" || reply?.inputType === "money" ? "text" : reply?.inputType || "text"}
              inputMode={reply?.inputType === "number" ? "numeric" : reply?.inputType === "money" ? "decimal" : reply?.inputType === "phone" ? "tel" : "text"}
              value={entry}
              onChange={(event) => setEntry(event.target.value)}
              placeholder={requiresInput ? reply?.placeholder : t("Choose an option")}
              disabled={!requiresInput || loading}
              aria-label="Reply to Khula"
              className="h-11 rounded-xl border-slate-300 text-base md:text-base"
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={!requiresInput || !entry.trim() || loading}
              aria-label="Send reply"
              className="rounded-xl bg-[#087f83] hover:bg-[#066a6e]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </div>
      </section>

      <aside className="space-y-5">
        <Card className="rounded-[24px] border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-[#0a2b3a]">
              <ShieldCheck className="size-5 text-[#087f83]" /> Case safeguards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
            <div className="flex gap-3">
              <LockKeyhole className="mt-1 size-4 shrink-0 text-[#087f83]" />
              <p>Case progress is saved outside the chat session and can be resumed.</p>
            </div>
            <div className="flex gap-3">
              <FileCheck2 className="mt-1 size-4 shrink-0 text-[#087f83]" />
              <p>Each document is linked to the right case, person and requirement.</p>
            </div>
            <div className="flex gap-3">
              <UserRoundCheck className="mt-1 size-4 shrink-0 text-[#087f83]" />
              <p>Khula screens and routes. An authorised official makes the decision.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[24px] border-0 bg-[#0a2b3a] text-white shadow-[0_18px_50px_rgba(10,35,48,.18)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircleMore className="size-5 text-[#55d2c7]" /> WhatsApp channel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-200">
            <p>The webhook uses this same workflow for messages, controlled choices and document media.</p>
            <div className="rounded-2xl border border-white/15 bg-white/7 p-3">
              <p className="font-semibold text-white">Production connection requires</p>
              <p className="mt-1 text-slate-300">GMM-approved Meta business account, number, provider ownership and runtime credentials.</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function StaffDesk({ refreshKey }: { refreshKey: number }) {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [exportDataset, setExportDataset] = useState("cases");
  const [exporting, setExporting] = useState(false);

  async function exportRecords(filtered: boolean) {
    setExporting(true);
    setNotice("");
    try {
      const params = new URLSearchParams({ dataset: exportDataset });
      if (filtered) params.set("query", query);
      const response = await fetch(`/api/cases/export?${params}`);
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `civicflow-export.${exportDataset === "full" ? "json" : "csv"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Export downloaded.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to export the records."); }
    finally { setExporting(false); }
  }

  async function loadCases(search = query) {
    const response = await fetch(`/api/cases?query=${encodeURIComponent(search)}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      cases?: CaseRow[];
      stats?: Record<string, number>;
    };
    setCases(data.cases || []);
    setStats(data.stats || {});
  }

  async function loadDetail(id: string) {
    setSelectedId(id);
    setDetail(null);
    const response = await fetch(`/api/cases/${id}`, { cache: "no-store" });
    if (response.ok) setDetail(await response.json());
  }

  useEffect(() => {
    void loadCases("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function action(actionName: string) {
    if (!selectedId) return;
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch(`/api/cases/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName, reason }),
      });
      if (response.ok) {
        setDetail(await response.json());
        setReason("");
        await loadCases();
        setNotice("Case updated. Check the WhatsApp notification status below.");
      } else { const data = await response.json() as { error?: string }; setNotice(data.error || "Unable to update the case."); }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update the case."); } finally {
      setLoading(false);
    }
  }

  const cards = [
    ["All cases", stats.total || 0, Inbox],
    ["Under review", stats.under_review || 0, Clock3],
    ["Documents due", stats.documents_outstanding || 0, FileUp],
    ["Information due", stats.information_required || 0, HelpCircle],
    ["Site visits", stats.site_visits || 0, Building2],
    ["Integration failures", stats.integration_failures || 0, AlertTriangle],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, number, Icon]) => (
          <Card key={label} className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <Icon className="size-4 text-[#087f83]" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Live</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-[#0a2b3a]">{number}</p>
              <p className="mt-1 text-sm text-slate-600">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notice && <p role="status" className="rounded-xl border border-slate-200 bg-white p-3 text-sm">{notice}</p>}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">Bulk export
            <select value={exportDataset} onChange={event => setExportDataset(event.target.value)} className="rounded-lg border border-slate-300 bg-white p-2 text-sm">
              <option value="cases">Case summary (CSV)</option>
              <option value="households">Household members (CSV)</option>
              <option value="incomes">Income records (CSV)</option>
              <option value="full">Full case records (JSON)</option>
            </select>
          </label>
          <Button variant="outline" disabled={exporting} onClick={() => void exportRecords(false)}>{exporting ? "Exporting…" : "Export all"}</Button>
          <Button variant="outline" disabled={exporting || !query.trim()} onClick={() => void exportRecords(true)}>Export search results</Button>
          <p className="w-full text-sm text-slate-500">Exports include all matching records, beyond the 100 shown below. Document exports contain file details; open documents from the case to download the files.</p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden rounded-[24px] border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#0a2b3a]">Cases requiring action</h2>
            <p className="text-sm text-slate-500">Structured records from Khula and assisted capture</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadCases();
            }}
            className="flex w-full gap-2 md:w-auto"
          >
            <div className="relative min-w-0 flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Reference, applicant or property"
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <Button type="submit" variant="outline" className="rounded-xl">Search</Button>
          </form>
        </div>
        {cases.length ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="pl-5">Case</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="pr-5 text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => void loadDetail(item.id)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && void loadDetail(item.id)}>
                  <TableCell className="pl-5 font-semibold text-[#0a2b3a]">{item.reference}</TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-800">{item.applicant_name || "Incomplete applicant"}</p>
                    <p className="max-w-56 truncate text-xs text-slate-500">{item.property_label || statusLabel(item.case_type)}</p>
                  </TableCell>
                  <TableCell><StatePill value={item.current_state} /></TableCell>
                  <TableCell className="text-slate-600">{statusLabel(item.assigned_queue)}</TableCell>
                  <TableCell className="text-slate-600">{statusLabel(item.channel)}</TableCell>
                  <TableCell className="pr-5 text-right text-slate-500">{new Date(item.updated_at).toLocaleDateString("en-ZA")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e3f6f3] text-[#087f83]"><Inbox className="size-5" /></div>
              <h3 className="font-bold text-[#0a2b3a]">No cases yet</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Start a sandbox application in Khula. It will appear here as a structured case.</p>
            </div>
          </div>
        )}
      </Card>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto bg-[#f7fafb] p-0 sm:max-w-2xl">
          {detail ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-white p-6 pr-14">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-2xl tracking-tight text-[#0a2b3a]">{detail.case.reference}</SheetTitle>
                  <StatePill value={detail.case.current_state} />
                </div>
                <SheetDescription>{detail.case.applicant_name || "Incomplete applicant"} · {detail.case.property_label || "Property not yet matched"}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Queue", statusLabel(detail.case.assigned_queue)],
                    ["Channel", statusLabel(detail.case.channel)],
                    ["Progress", `${detail.case.progress}%`],
                    ["Candidate", statusLabel(detail.case.classification_candidate || "Not evaluated")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                <Tabs defaultValue="requirements">
                  <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-200/70 p-1">
                    <TabsTrigger value="requirements">Documents</TabsTrigger>
                    <TabsTrigger value="people">Household</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="requirements" className="mt-3 space-y-2">
                    {detail.requirements.map((item) => {
                      const document = detail.documents.find((doc) => doc.requirement_id === item.id);
                      return (
                        <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <div>
                            <p className="font-semibold text-slate-800">{item.label}</p>
                            <div className="mt-2"><StatePill value={item.status} /></div>
                          </div>
                          {document && (
                            <Button variant="outline" size="sm" className="rounded-lg" asChild>
                              <a href={`/api/documents/${document.id}`} target="_blank" rel="noreferrer">Open</a>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {!detail.requirements.length && <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Requirements will be generated from the resident’s facts.</p>}
                  </TabsContent>
                  <TabsContent value="people" className="mt-3 space-y-2">
                    {detail.people.map((person) => (
                      <div key={person.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div><p className="font-semibold text-slate-800">{person.full_name}</p><p className="text-sm text-slate-500">{statusLabel(person.role)} · {person.identity_masked || "Identity pending"}</p></div>
                          <StatePill value={person.income_status} />
                        </div>
                        {detail.incomes.filter((income) => income.person_id === person.id).map((income) => (
                          <p key={income.id} className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{statusLabel(income.income_type)} · R {(income.gross_amount_cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} gross monthly</p>
                        ))}
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="tasks" className="mt-3 space-y-2">
                    {detail.tasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{task.title}</p><p className="mt-1 text-sm text-slate-500">{statusLabel(task.owner_queue)} · {statusLabel(task.task_type)}</p></div><StatePill value={task.status} /></div>
                      </div>
                    ))}
                    {!detail.tasks.length && <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">No open tasks.</p>}
                  </TabsContent>
                  <TabsContent value="audit" className="mt-3 space-y-0">
                    {detail.events.map((event, index) => (
                      <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < detail.events.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%-10px)] w-px bg-slate-200" />}
                        <CircleDot className="relative mt-1 size-4 shrink-0 text-[#087f83]" />
                        <div><p className="text-sm font-semibold text-slate-800">{statusLabel(event.event_code)}</p><p className="text-xs text-slate-500">{statusLabel(event.actor_type)} · {new Date(event.created_at).toLocaleString("en-ZA")}</p></div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-[#0a2b3a]">Assessment actions</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">This sandbox records recommendations. It does not grant final decision authority.</p>
                  <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason or instruction" className="mt-4 h-10 rounded-xl" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => void action("RETURN_ASSESSMENT")} disabled={loading}>Mark under review</Button>
                    <Button variant="outline" size="sm" onClick={() => void action("REQUEST_INFORMATION")} disabled={loading}>Request information</Button>
                    <Button variant="outline" size="sm" onClick={() => void action("ORDER_SITE_VISIT")} disabled={loading}>Order site visit</Button>
                    <Button size="sm" className="bg-[#087f83] hover:bg-[#066a6e]" onClick={() => void action("RECOMMEND_APPROVAL")} disabled={loading}>Recommend approval</Button>
                    <Button variant="destructive" size="sm" onClick={() => void action("RECOMMEND_DECLINE")} disabled={loading}>Recommend decline</Button>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">WhatsApp notification</p>
                    <p className="mt-1">{detail.notification ? ({ ACCEPTED: "Accepted by Meta; awaiting delivery confirmation", DELIVERED: "Delivered", READ: "Read", FAILED: "Failed to send", WAITING_FOR_REPLY: "Waiting for the resident to message Khula, or an approved notification template", NO_WHATSAPP_SESSION: "No linked WhatsApp number for this case", PENDING: "Queued", SENDING: "Sending", SUPERSEDED: "Replaced by a newer update" } as Record<string, string>)[detail.notification.status] || detail.notification.status : "No recommendation notification recorded yet"}</p>
                    {detail.notification?.error && <p className="mt-1 text-amber-800">{detail.notification.error}</p>}
                    {detail.notification && ["FAILED", "WAITING_FOR_REPLY", "PENDING", "NO_WHATSAPP_SESSION"].includes(detail.notification.status) && <Button className="mt-2" variant="outline" size="sm" disabled={loading} onClick={() => void action("RETRY_NOTIFICATION")}>Retry notification</Button>}
                    <p className="mt-2 text-slate-500">Messages begin “Recommendation: …”. Recommendations remain subject to the authorised official’s final decision.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center"><Loader2 className="size-6 animate-spin text-[#087f83]" /></div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RulesAndIntegrations() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="rounded-[24px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-[#0a2b3a]"><Workflow className="size-5 text-[#087f83]" /> Implementation coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {implementationModules.map(([name, detail, state]) => (
            <div key={name} className="grid gap-2 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
              <p className="font-semibold text-slate-800">{name}</p>
              <p className="text-sm leading-6 text-slate-500">{detail}</p>
              <StatePill value={state === "ready" ? "SANDBOX_READY" : state === "partial" ? "PARTIAL" : "GMM_INPUT_REQUIRED"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[24px] border-0 bg-[#0a2b3a] text-white shadow-[0_18px_50px_rgba(10,35,48,.18)]">
          <CardHeader><CardTitle className="text-xl">Production gate</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-200">
            <p>Manual 38 contains open P0 decisions. The app therefore keeps legal entitlement, final authority and financial implementation under human control.</p>
            <div className="space-y-2">
              {["2026/27 indigent policy values", "Delegation and Council route", "Munsoft and indigent-register interfaces", "WhatsApp account ownership", "Identity assurance and POPIA approvals"].map((item) => (
                <div key={item} className="flex gap-2 rounded-xl bg-white/8 px-3 py-2"><AlertTriangle className="mt-1 size-3.5 shrink-0 text-[#f5c451]" /><span>{item}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-[#0a2b3a]"><Languages className="size-5 text-[#087f83]" /> Language control</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">Resident application prompts and menus support English, Afrikaans, isiZulu, isiNdebele and Sesotho. Translations are working drafts for testing and municipal language review. Residents can type a language name at any time to change language without losing progress.</CardContent>
        </Card>
      </div>
    </div>
  );
}

type WhatsAppConnection = { configured: boolean; businessNumber: string };

function WhatsAppChannel({ connection }: { connection: WhatsAppConnection }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Card className="rounded-[24px] border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="flex items-center gap-3 text-2xl text-[#0a2b3a]"><MessageCircleMore className="text-[#087f83]" /> Khula on WhatsApp</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-base leading-7 text-slate-700">
          <p>Residents start a WhatsApp conversation with Khula to apply for indigent support, send supporting documents and check their application.</p>
          <ol className="list-decimal space-y-3 pl-6">
            <li>Send “Hi” to the municipal WhatsApp number and choose a language.</li>
            <li>Follow Khula’s questions about the applicant, property, household and income.</li>
            <li>Select the requested document and attach a PDF or photograph in the same chat. Files may be up to 10 MB.</li>
            <li>Review and submit the application, then keep the case reference.</li>
          </ol>
          <p>Case progress and documents are saved to CivicFlow. Municipal staff review them in the Desk.</p>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card className="rounded-[24px] border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-xl text-[#0a2b3a]">Connection status</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-base leading-7 text-slate-700">
            <Badge variant="outline" className="border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-900">{connection.configured ? "Configured — delivery test required" : "Not connected"}</Badge>
            <p>{connection.configured ? "The WhatsApp account settings are present. Verify the incoming connection and test an application and document upload before inviting residents." : "The municipal WhatsApp Business number and Meta account connection still need to be configured. Residents cannot submit through WhatsApp yet."}</p>
            {connection.businessNumber ? <p>Business number: +{connection.businessNumber}</p> : <p>Business number: not supplied</p>}
            {connection.configured && connection.businessNumber && <Button asChild className="bg-[#087f83] hover:bg-[#066a6e]"><a href={`https://wa.me/${connection.businessNumber}?text=Hi`} target="_blank" rel="noreferrer">Open WhatsApp for testing</a></Button>}
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-0 bg-[#0a2b3a] text-white">
          <CardHeader><CardTitle className="text-xl">Staff workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-base leading-7 text-slate-200"><p>Use CivicFlow Desk to review cases and open uploaded documents. Staff test lets approved staff rehearse Khula’s questions.</p><p>WhatsApp messages identify the sending number. Supporting evidence still requires municipal verification, and an authorised official makes the decision.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CivicFlowWorkspace({ connection }: { connection: WhatsAppConnection }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState("desk");
  const refreshedAt = useMemo(() => new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }), [refreshKey]);

  return (
    <main className="min-h-screen bg-[#edf3f4] text-slate-900">
      <header className="border-b border-white/10 bg-[#0a2b3a] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#55d2c7] font-black text-[#0a2b3a]">CF</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CivicFlow</h1>
              <p className="text-sm text-slate-300">Govan Mbeki Local Municipality · private pilot</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"><ShieldCheck className="size-4 text-[#55d2c7]" /> Human decision control</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5"><RefreshCw className="size-3.5" /> {refreshedAt}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-[#087f83]">Indigent-support MVP</p>
              <h2 className="text-2xl font-bold tracking-tight text-[#0a2b3a] sm:text-3xl">
                WhatsApp applications · municipal case management
              </h2>
            </div>
            <TabsList className="h-auto w-full justify-start rounded-2xl bg-white p-1.5 shadow-sm md:w-auto">
              <TabsTrigger value="desk" className="min-h-10 rounded-xl px-4"><UsersRound /> CivicFlow Desk</TabsTrigger>
              <TabsTrigger value="whatsapp" className="min-h-10 rounded-xl px-4"><MessageCircleMore /> WhatsApp channel</TabsTrigger>
              <TabsTrigger value="resident" className="min-h-10 rounded-xl px-4"><Smartphone /> Staff test</TabsTrigger>
              <TabsTrigger value="rules" className="min-h-10 rounded-xl px-4"><Workflow /> Rules & integrations</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="resident"><ResidentWorkspace onCaseChanged={() => setRefreshKey((value) => value + 1)} /></TabsContent>
          <TabsContent value="whatsapp"><WhatsAppChannel connection={connection} /></TabsContent>
          <TabsContent value="desk"><StaffDesk refreshKey={refreshKey} /></TabsContent>
          <TabsContent value="rules"><RulesAndIntegrations /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
