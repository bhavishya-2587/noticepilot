"use client";

import { useState, type ReactNode } from "react";

import type {
  ActionRequired,
  DateField,
  IntelligenceResult,
  TextField,
} from "@/lib/intelligence/schema";

const itemColors = [
  {
    shell:
      "border-cyan-200/25 bg-gradient-to-br from-[#b8f3ff]/20 via-[#164158]/70 to-[#071827]",
    glow: "bg-cyan-200/20",
    badge: "border-cyan-100/30 bg-cyan-100/15 text-cyan-50",
  },
  {
    shell:
      "border-white/40 bg-gradient-to-br from-white/20 via-[#dbeafe]/10 to-[#172235]",
    glow: "bg-white/20",
    badge: "border-white/30 bg-white/15 text-white",
  },
  {
    shell:
      "border-indigo-200/20 bg-gradient-to-br from-[#263b66] via-[#101d39] to-[#060d1c]",
    glow: "bg-indigo-300/15",
    badge: "border-indigo-200/25 bg-indigo-200/10 text-indigo-100",
  },
  {
    shell:
      "border-sky-200/25 bg-gradient-to-br from-[#8bdcff]/25 via-[#164c70]/70 to-[#071827]",
    glow: "bg-sky-200/20",
    badge: "border-sky-100/30 bg-sky-100/15 text-sky-50",
  },
];

function FieldValue({
  label,
  field,
}: {
  label: string;
  field: TextField;
}) {
  return (
    <div className="rounded-2xl border border-cyan-100/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/60">
        {label}
      </p>

      {field.status === "present" ? (
        <p className="mt-2 text-sm leading-6 text-white">
          {field.value}
        </p>
      ) : null}

      {field.status === "uncertain" ? (
        <div className="mt-2">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
            <p className="text-sm leading-6 text-white">
              {field.value ?? "Unclear"}
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-amber-200/80">
            {field.explanation}
          </p>
        </div>
      ) : null}

      {field.status === "not_specified" ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Not specified
        </div>
      ) : null}
    </div>
  );
}

function DateValue({ date }: { date: DateField }) {
  if (date.status === "not_specified") {
    return <span className="text-slate-400">Not specified</span>;
  }

  return (
    <span>
      <span>{date.raw}</span>

      {date.normalized ? (
        <span className="mt-1 block text-xs text-cyan-200/70">
          Normalized: {date.normalized}
        </span>
      ) : null}

      {date.status === "uncertain" ? (
        <span className="mt-1 block text-xs text-amber-200/80">
          {date.explanation}
        </span>
      ) : null}
    </span>
  );
}

function TextFieldValue({ field }: { field: TextField }) {
  if (field.status === "present") {
    return field.value;
  }

  if (field.status === "uncertain") {
    return (
      <span>
        {field.value ?? "Unclear"}
        <span className="mt-1 block text-xs text-amber-200/80">
          {field.explanation}
        </span>
      </span>
    );
  }

  return <span className="text-slate-400">Not specified</span>;
}

function ActionValue({ action }: { action: ActionRequired }) {
  if (action.status === "not_specified") {
    return <span className="text-slate-400">Not specified</span>;
  }

  if (action.status === "uncertain") {
    return (
      <span>
        {action.value
          ? action.value.replaceAll("_", " ")
          : "Unclear"}

        <span className="mt-1 block text-xs text-amber-200/80">
          {action.explanation}
        </span>
      </span>
    );
  }

  return action.value.replaceAll("_", " ");
}

function EvidenceCard({
  quote,
  sourceSegmentId,
}: {
  quote: string;
  sourceSegmentId: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyQuote() {
    try {
      await navigator.clipboard.writeText(quote);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="group rounded-xl border border-white/10 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm text-cyan-100/80 marker:hidden">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/70" />
          Evidence from notice
        </span>

        <span className="text-lg leading-none text-cyan-300 transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>

      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        <p className="border-l-2 border-cyan-300/70 pl-3 text-sm italic leading-6 text-slate-200">
          “{quote}”
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-cyan-200/60">
            Source segment: {sourceSegmentId}
          </p>

          <button
            type="button"
            onClick={copyQuote}
            className="rounded-lg border border-cyan-200/15 bg-cyan-200/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/30 hover:bg-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          >
            {copied ? "Copied" : "Copy quote"}
          </button>
        </div>
      </div>
    </details>
  );
}

function DetailCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-slate-200">
      <span className="block text-xs font-medium uppercase tracking-[0.14em] text-cyan-200/50">
        {label}
      </span>

      <span className="mt-1 block leading-6">{children}</span>
    </div>
  );
}

function ItemCard({
  item,
  index,
}: {
  item: IntelligenceResult["items"][number];
  index: number;
}) {
  const colors = itemColors[index % itemColors.length];

  return (
    <article
      className={`relative min-h-0 overflow-hidden rounded-2xl border p-5 shadow-xl shadow-cyan-950/20 ${colors.shell}`}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${colors.glow}`}
      />

      <div className="relative flex h-full min-h-0 flex-col">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${colors.badge}`}
          >
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {item.title}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs capitalize ${colors.badge}`}
              >
                {item.type}
              </span>
            </div>

            <div className="mt-4 max-h-32 overflow-y-auto pr-1">
              <p className="text-sm leading-6 text-slate-200">
                {item.description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailCard label="Date">
            <DateValue date={item.date} />
          </DetailCard>

          <DetailCard label="Time">
            <TextFieldValue field={item.time} />
          </DetailCard>

          <DetailCard label="Location">
            <TextFieldValue field={item.location} />
          </DetailCard>

          <DetailCard label="Action">
            <ActionValue action={item.actionRequired} />
          </DetailCard>
        </div>

        {item.uncertainty ? (
          <div className="mt-4 max-h-24 overflow-y-auto rounded-xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-medium">Uncertainty: </span>
            {item.uncertainty.reason}
          </div>
        ) : null}

        <div className="mt-5 max-h-48 space-y-2 overflow-y-auto pr-1">
          {item.evidence.map((evidence, evidenceIndex) => (
            <EvidenceCard
              key={`${evidence.sourceSegmentId}-${evidenceIndex}`}
              quote={evidence.quote}
              sourceSegmentId={evidence.sourceSegmentId}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

export function IntelligenceResultView({
  intelligence,
}: {
  intelligence: IntelligenceResult;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#050d18] p-5 shadow-2xl shadow-cyan-950/30 sm:p-7"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/70">
              Notice intelligence
            </p>

            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {intelligence.notice.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/80" />
            Evidence-backed
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/60">
            Summary
          </p>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            {intelligence.notice.summary}
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldValue
            label="Issuer"
            field={intelligence.notice.issuer}
          />

          <FieldValue
            label="Audience"
            field={intelligence.notice.audience}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/60">
                Important details
              </p>

              <h3 className="mt-2 text-xl font-semibold text-white">
                What you may need to know
              </h3>
            </div>

            <span className="text-sm text-slate-400">
              {intelligence.items.length}{" "}
              {intelligence.items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {intelligence.items.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {intelligence.items.map((item, index) => (
                <ItemCard
                  key={`${item.type}-${item.title}-${index}`}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
              No specific action items were found in this notice.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}