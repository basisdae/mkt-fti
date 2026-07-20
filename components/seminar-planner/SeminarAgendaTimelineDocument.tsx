"use client";

import type { CSSProperties } from "react";
import "./seminar-agenda-print.css";
import { SEMINAR_AGENDA_DOCUMENT_ACCENT } from "@/lib/seminar-agenda-category-colors";
import type { SeminarAgendaDocumentModel } from "@/lib/seminar-agenda-document";
import { SEMINAR_PLANNER_COPY as t } from "@/lib/seminar-planner-i18n";

interface SeminarAgendaTimelineDocumentProps {
  model: SeminarAgendaDocumentModel;
  id?: string;
  className?: string;
}

function SessionRow({
  session,
  isLast,
}: {
  session: SeminarAgendaDocumentModel["sessions"][number];
  isLast: boolean;
}) {
  const { categoryVisual } = session;

  return (
    <article
      className="seminar-agenda-session"
      style={
        {
          "--session-accent": categoryVisual.accent,
          "--tag-bg": categoryVisual.tagBg,
          "--tag-text": categoryVisual.tagText,
        } as CSSProperties
      }
    >
      <div className="seminar-agenda-session__left">
        <span className="seminar-agenda-session__order">
          {session.order.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="seminar-agenda-session__rail" aria-hidden="true">
        <span className="seminar-agenda-session__dot" />
        {!isLast ? <span className="seminar-agenda-session__line" /> : null}
      </div>

      <div className="seminar-agenda-session__content">
        {session.title ? (
          <h3 className="seminar-agenda-session__title">{session.title}</h3>
        ) : null}

        {session.shortDetail ? (
          <p className="seminar-agenda-session__detail">{session.shortDetail}</p>
        ) : null}

        {session.categoryName ? (
          <div className="seminar-agenda-session__tags">
            <span className="seminar-agenda-session__tag seminar-agenda-session__tag--category">
              {session.categoryName}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SeminarAgendaTimelineDocument({
  model,
  id = "seminar-agenda-document-print",
  className,
}: SeminarAgendaTimelineDocumentProps) {
  return (
    <article
      id={id}
      className={["seminar-agenda-document", className].filter(Boolean).join(" ")}
      style={{ "--agenda-accent": SEMINAR_AGENDA_DOCUMENT_ACCENT } as CSSProperties}
    >
      <div className="seminar-agenda-document__running-header">
        <strong>{model.projectTitle}</strong>
        {" · "}
        <span>{t.agendaDocumentEyebrow}</span>
      </div>

      <header className="seminar-agenda-document__header">
        <p className="seminar-agenda-document__eyebrow">{t.agendaDocumentEyebrow}</p>
        {model.isDraft ? (
          <span className="seminar-agenda-document__draft">{t.agendaDocumentDraft}</span>
        ) : null}
        <h1 className="seminar-agenda-document__title">{model.projectTitle}</h1>
        <div className="seminar-agenda-document__accent-line" aria-hidden="true" />
        <div className="seminar-agenda-document__meta">
          <div className="seminar-agenda-document__meta-row">
            <span className="seminar-agenda-document__meta-item">
              <strong>{t.agendaDocumentDate}</strong> {model.dateLabel}
            </span>
            <span className="seminar-agenda-document__meta-item">
              <strong>{t.venue}</strong> {model.venueLabel}
            </span>
            <span className="seminar-agenda-document__meta-item">
              <strong>{t.eventFormat}</strong> {model.formatLabel}
            </span>
          </div>
        </div>
        <p className="seminar-agenda-document__stats">{model.topicCountLabel}</p>
      </header>

      <section className="seminar-agenda-document__timeline" aria-label={t.agendaSection}>
        {model.sessions.map((session, index) => (
          <SessionRow
            key={session.id}
            session={session}
            isLast={index === model.sessions.length - 1}
          />
        ))}
      </section>

      <footer className="seminar-agenda-document__footer" aria-hidden="true" />
    </article>
  );
}
