"use client";

import { useState } from "react";

import type {
  ActionRequired,
  DateField,
  IntelligenceResult,
  TextField,
} from "@/lib/intelligence/schema";

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
        <p className="mt-2 text-sm leading-6 text-white">{field.value}</p>
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
    return (
      <span className="text-slate-400">Date not specified</span>
    );
  }

  return (
    <span>
      <span>{date.raw}</span>

      {date.normalized ? (
        <span className="ml-2 text-cyan-200/70">
          {date.normalized}
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

function FieldStatusValue({
  value,
}: {
  value: TextField;
}) {
  if (value.status === "present") {
    return value.value;
  }

  if (value.status === "uncertain") {
    return value.value ?? value.explanation;
  }

  return "Not specified";
}

function ActionValue({ action }: { action: ActionRequired }) {
  if (action.status === "not_specified") {
    return "Not specified";
  }

  if (action.status === "uncertain") {
    return action.value
      ? `${action.value.replaceAll("_", " ")} · ${action.explanation}`
      : action.explanation;
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
    <details className="group rounded-xl border border-cyan-200/10 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm text-cyan-100/80 marker:hidden">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/70" />
          Evidence from notice
        </span>

        <span className="text-lg leading-none text-cyan-300 transition-transform group-open:rotate-180">
         ⌄
        </span>
      </summary>

      <div className="border-t border-cyan-200/10 px-4 pb-4 pt-3">
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
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-slate-200">
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
  return (
    <article className="relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-[#102b42] via-[#0b1d31] to-[#081321] p-5 shadow-xl shadow-cyan-950/20">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                {item.title}
              </h3>

              <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-xs capitalize text-cyan-100">
                {item.type}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {item.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailCard label="Date">
                <DateValue date={item.date} />
              </DetailCard>

              <DetailCard label="Time">
                {FieldStatusValue({ value: item.time })}
              </DetailCard>

              <DetailCard label="Location">
                {FieldStatusValue({ value: item.location })}
              </DetailCard>

              <DetailCard label="Action">
                <span className="capitalize">
                  <ActionValue action={item.actionRequired} />
                </span>
              </DetailCard>
            </div>

            {item.uncertainty ? (
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />

                <p>
                  <span className="font-medium">Uncertainty: </span>
                  {item.uncertainty.reason}
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-2">
              {item.evidence.map((evidence, evidenceIndex) => (
                <EvidenceCard
                  key={`${evidence.sourceSegmentId}-${evidenceIndex}`}
                  quote={evidence.quote}
                  sourceSegmentId={evidence.sourceSegmentId}
                />
              ))}
            </div>
          </div>
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
      className="relative mt-6 overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#050d18] p-5 shadow-2xl shadow-cyan-950/30 sm:p-7"
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
            <div className="mt-4 space-y-4">
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