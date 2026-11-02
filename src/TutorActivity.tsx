import ClassResults, { ArtefactGallery } from "./ClassResults"
import { useEffect, useReducer, useRef, useState } from "react"
import { useClassroom } from "./ClassRoom"
import {
  activityReducer,
  activityTemplates,
  type ActivityAction,
  type ActivityRun,
} from "./activity-state"
import type {
  ConceptQuestion,
  TutorActivity as TutorActivityRow,
} from "./class-types"
import ExtraActivity from "./ExtraActivity"
import LivePeers from "./LivePeers"

function isQuestion(value: unknown): value is ConceptQuestion {
  if (!value || typeof value !== "object") return false
  const q = value as ConceptQuestion
  return (
    typeof q.text === "string" &&
    ["mc", "scale", "open"].includes(q.type) &&
    (q.type !== "mc" ||
      (Array.isArray(q.options) &&
        q.options.length > 0 &&
        q.options.every((o) => typeof o?.t === "string")))
  )
}
const sampleQuestions: ConceptQuestion[] = [
  {
    type: "mc",
    text: activityTemplates.choice.title,
    options: activityTemplates.choice.options.map((t) => ({ t })),
  },
  {
    type: "scale",
    text: activityTemplates.rating.title,
    lo: "Not confident yet",
    hi: "Ready to try",
  },
]
export default function TutorActivity({
  activity,
  onRecorded,
}: {
  activity: TutorActivityRow
  onRecorded: (entry: {
    id: string
    title: string
    detail: string
    slide: number
    week: number
    kind: "Activity"
  }) => void
}) {
  const room = useClassroom()
  const identity = room.identity!
  const key = `studio-bridge-activity:${identity.code}:${identity.clientId}:${activity.id}`
  const [q, setQ] = useState(0)
  const [showPeers, setShowPeers] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number | string>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(key) || "{}").answers || {}
      } catch {
        return {}
      }
    },
  )
  const [localSent, setLocalSent] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [retry, setRetry] = useState<{
    id: string
    kind: string
    payload: Record<string, unknown>
    team?: string
  } | null>(null)
  const ids = useRef<Record<string, string>>({})
  const uploadUrl = useRef<{
    source: string
    url: string
  } | null>(null)
  const extraKind = activity.kind === "artefact" ? "artefact" : "discussion"
  const initial: ActivityRun = {
    id: 1,
    page: activity.slide || 1,
    kind: extraKind,
    answer: null,
    submitted: false,
  }
  const [runs, dispatchLocal] = useReducer(activityReducer, [initial])
  const run = runs[0]
  const own = room.responses.filter(
    (r) =>
      r.activity_id === activity.id && r.payload.clientId === identity.clientId,
  )
  const sent = new Set([
    ...localSent,
    ...own.filter(r => ["choice", "rating", "open", "reflection", "discussion", "artefact"].includes(r.kind)).map((r) =>
      r.kind === "reflection" ? "reflection" : String(r.payload.q ?? r.kind),
    ),
  ])
  const rawQuestions = Array.isArray(activity.spec?.questions)
    ? activity.spec.questions
    : []
  // Never filter out a malformed question: doing so would shift payload.q for later answers.
  const questions = rawQuestions.every(isQuestion) ? rawQuestions : []
  const concept = questions.length ? questions : sampleQuestions
  const index = Math.min(q, concept.length - 1)
  const question =
    activity.kind === "reflection"
      ? {
          type: "open" as const,
          text:
            activity.spec?.question || "What changed in your understanding?",
          hint: activity.spec?.hint,
        }
      : concept[index]
  const answerKey =
    activity.kind === "reflection" ? "reflection" : String(index)
  const previous = own.find((r) =>
    activity.kind === "reflection"
      ? r.kind === "reflection"
      : ["choice", "rating", "open"].includes(r.kind) && r.payload.q === index,
  )
  const answer =
    answers[answerKey] ??
    previous?.payload.answer ??
    previous?.payload.text ??
    ""
  const isLive = room.state.activityId === activity.id
  const canSend =
    isLive && (activity.kind !== "concept" || questions.length > 0)
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ answers }))
    } catch {
      /* Keep the active draft in memory. */
    }
  }, [key, answers])
  useEffect(() => {
    if (activity.kind === "artefact") {
      const saved = own.find(
        (r) => r.kind === "artefact" && typeof r.payload.url === "string",
      )
      if (saved && !run.submitted) {
        dispatchLocal({
          type: "photo",
          id: 1,
          photo: {
            url: String(saved.payload.url),
            name: String(saved.payload.name || "Artefact"),
            caption: String(saved.payload.caption || ""),
            group: saved.team || "",
          },
        })
        dispatchLocal({ type: "submit", id: 1 })
      }
    }
  }, [room.responses, activity.id])
  async function send(
    input: {
      id: string
      kind: string
      payload: Record<string, unknown>
      team?: string
    },
    mark: string,
  ) {
    if (pending.current) return false
    if (room.currentActivityId.current !== activity.id) {
      setStatus("This activity is no longer live. Your draft stays here.")
      return false
    }
    pending.current = true
    setBusy(true)
    setStatus("Sending…")
    try {
      const result = await room.api.submitResponse({
        ...input,
        activityId: activity.id,
      })
      if (result.error) {
        setRetry(input)
        setStatus(result.error)
        return false
      }
      setRetry(null)
      setLocalSent((current) => [...new Set([...current, mark])])
      setStatus("Sent to your tutor ✓")
      onRecorded({
        id: `live-activity-${input.id}`,
        kind: "Activity",
        title:
          activity.kind === "concept"
            ? question.text
            : activity.kind === "reflection"
              ? question.text
              : activityTemplates[extraKind].title,
        detail: "Your response · Sent to your tutor",
        slide: activity.slide || 1,
        week: room.session?.week || 6,
      })
      return true
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function submitText() {
    if (sent.has(answerKey) || busy || !canSend) return
    const value = answers[answerKey]
    if (value === undefined || (typeof value === "string" && !value.trim()))
      return
    const kind =
      activity.kind === "reflection"
        ? "reflection"
        : question.type === "mc"
          ? "choice"
          : question.type === "scale"
            ? "rating"
            : "open"
    const payload =
      typeof value === "number"
        ? { q: index, answer: value }
        : {
            ...(activity.kind === "concept" ? { q: index } : {}),
            text: value.trim(),
            lang: /[\u3400-\u9fff]/.test(value) ? "zh" : "en",
          }
    ids.current[answerKey] ||= crypto.randomUUID()
    await send({ id: ids.current[answerKey], kind, payload }, answerKey)
  }
  async function dispatchExtra(action: ActivityAction) {
    if (pending.current || busy) return
    if (action.type === "play") {
      dispatchLocal(action)
      await send(
        {
          id: crypto.randomUUID(),
          kind: "discussion",
          payload: { card: action.card },
        },
        "discussion",
      )
    } else if (action.type === "submit" && run.photo) {
      // Preserve the photo while storage is unavailable; retry does not upload twice.
      pending.current = true
      setBusy(true)
      setStatus("Uploading photo…")
      let url =
        uploadUrl.current?.source === run.photo.url ? uploadUrl.current.url : ""
      if (!url) {
        const result = await room.api.uploadArtefact(run.photo)
        if (result.data) {
          url = result.data
          uploadUrl.current = { source: run.photo.url, url }
        } else {
          pending.current = false
          setBusy(false)
          setStatus(result.error || "Photo not sent. Try again.")
          return
        }
      }
      pending.current = false
      setBusy(false)
      const input = {
        id: (ids.current.artefact ||= crypto.randomUUID()),
        kind: "artefact",
        team: run.photo.group,
        payload: { url, name: run.photo.name, caption: run.photo.caption },
      }
      if (await send(input, "artefact")) {
        dispatchLocal({ type: "photo", id: 1, photo: { ...run.photo, url } })
        dispatchLocal(action)
      }
    } else dispatchLocal(action)
  }
  function statusFooter(mark: string) {
    return (
      <div className="tutor-activity-footer">
        <small role="status">
          {status ||
            (isLive
              ? "Shared with your tutor when submitted."
              : "Activity closed · viewing your response")}
        </small>
        {retry && (
          <button
            type="button"
            disabled={busy}
            className="extra-primary"
            onClick={() =>
              void send(retry, mark).then((ok) => {
                if (ok && retry.kind === "artefact")
                  dispatchLocal({ type: "submit", id: 1 })
              })
            }
          >
            Retry sending
          </button>
        )}
      </div>
    )
  }
  if (activity.kind === "qa") {
    // the question the tutor has on the screen, drawn as the same card as in the Questions panel
    const shown = room.questions.find((row) => row.id === room.state.qaQuestion)
    const who = shown ? (shown.anonymous ? "Anonymous" : shown.student || "Student") : ""
    const minutes = shown ? Math.max(0, Math.floor((Date.now() - new Date(shown.created_at).getTime()) / 60000)) : 0
    return (
      <div className="tutor-activity">
        <span className="eyebrow">Q&amp;A</span>
        {shown ? (
          <article className={shown.status === "ans" ? "question-card qa-spotlight answered" : "question-card qa-spotlight"}>
            <div className="question-meta">
              <span className="avatar avatar-1">{who.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{who}</strong>
                <small>{minutes < 1 ? "just now" : `${minutes} min ago`}</small>
              </div>
              {shown.status === "ans" && <span className="question-answer-mark" aria-label="Answered">✓</span>}
            </div>
            <p className="question-text">{shown.text_en || shown.text}</p>
            <div className="question-actions">
              <span>↑ {shown.upvotes}</span>
              {shown.slide ? <span className="qa-spotlight-slide">Slide {shown.slide} ›</span> : null}
            </div>
          </article>
        ) : (
          <h3>What’s on your mind?</h3>
        )}
        <p>
          Ask a question in the Questions panel. Your tutor will see it live.
        </p>
        <button
          type="button"
          className="extra-primary"
          onClick={() => {
            const composer = document.querySelector<HTMLTextAreaElement>(
              ".ask-composer textarea",
            )
            if (composer) composer.focus()
            else
              document
                .querySelector<HTMLButtonElement>(".floating-panel-toggle")
                ?.click()
          }}
        >
          Ask a question →
        </button>
      </div>
    )
  }
  if (activity.kind === "discussion" || activity.kind === "artefact") {
    const saved = own.find((r) => r.kind === "artefact")
    const cardCounts = [0, 0, 0, 0, 0]
    for (const response of own)
      if (
        response.activity_id === activity.id &&
        response.kind === "discussion" &&
        Number.isInteger(response.payload.card) &&
        Number(response.payload.card) >= 0 &&
        Number(response.payload.card) < 5
      )
        cardCounts[Number(response.payload.card)]++
    const displayRun =
      saved && !run.photo
        ? {
            ...run,
            photo: {
              url: String(saved.payload.url || ""),
              name: String(saved.payload.name || "Artefact"),
              caption: String(saved.payload.caption || ""),
              group: saved.team || "",
            },
            submitted: true,
          }
        : activity.kind === "discussion"
          ? { ...run, cardCounts }
          : run
    return (
      <div
        className="tutor-activity-shell"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {activity.kind === "artefact" && <div className="class-gallery-switch"><button type="button" onClick={() => setShowGallery(!showGallery)}>{showGallery ? "← Your artefact" : `Class artefacts · ${room.responses.filter(row => row.activity_id === activity.id && row.kind === "artefact" && row.payload.clientId !== identity.clientId).length}`}</button></div>}
        <div className="class-extra-form" style={{ display: showGallery ? "none" : "flex" }}>
          <ExtraActivity activity={displayRun} dispatch={action => void dispatchExtra(action)} active={!showGallery} pending={busy || !isLive} />
        </div>
        {showGallery && <ArtefactGallery activityId={activity.id} />}
        <div style={{ padding: "0 28px 12px" }}>{statusFooter(extraKind)}</div>
      </div>
    )
  }
  return (
    <div className="tutor-activity">
      <div className="tutor-question-nav">
        <span>
          {activity.kind === "reflection" ? "Reflection" : "Concept check"}
        </span>
        {activity.kind === "concept" &&
          concept.map((_, i) => (
            <button
              key={i}
              type="button"
              disabled={busy}
              aria-label={`Question ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => {
                setQ(i)
                setStatus("")
                setShowPeers(false)
              }}
            >
              {i + 1}
              {sent.has(String(i)) ? " ✓" : ""}
            </button>
          ))}
      </div>
      <h3>{question.text}</h3>
      {question.hint && <p>{question.hint}</p>}
      {!isLive ? (
        <p role="status">Activity closed · viewing your responses.</p>
      ) : (
        !canSend && (
          <p role="status">
            Your tutor is preparing this activity. These sample questions are
            for preview.
          </p>
        )
      )}
      {!sent.has(answerKey) && (question.type === "mc" ? (
        <div
          className="tutor-choices"
          role="group"
          aria-label="Choose one answer"
        >
          {question.options?.map((option, i) => (
            <button
              key={i}
              type="button"
              disabled={busy || !isLive || sent.has(answerKey)}
              aria-pressed={answer === i}
              onClick={() => {
                setAnswers((a) => ({ ...a, [answerKey]: i }))
                ids.current[answerKey] = crypto.randomUUID()
                setRetry(null)
              }}
            >
              <b>{String.fromCharCode(65 + i)}</b>
              {option.t}
            </button>
          ))}
        </div>
      ) : question.type === "scale" ? (
        <>
          <div
            className="tutor-scale"
            role="group"
            aria-label="Choose a score from 1 to 5"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                disabled={busy || !isLive || sent.has(answerKey)}
                aria-pressed={answer === n}
                onClick={() => {
                  setAnswers((a) => ({ ...a, [answerKey]: n }))
                  ids.current[answerKey] = crypto.randomUUID()
                  setRetry(null)
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="tutor-scale-labels">
            <span>{question.lo || "Not yet"}</span>
            <span>{question.hi || "Very sure"}</span>
          </div>
        </>
      ) : (
        <textarea
          aria-label="Your response"
          disabled={busy || !isLive || sent.has(answerKey)}
          value={String(answer)}
          onChange={(e) => {
            setAnswers((a) => ({ ...a, [answerKey]: e.target.value }))
            ids.current[answerKey] = crypto.randomUUID()
            setRetry(null)
          }}
          placeholder={question.hint || "Share your thoughts…"}
        />
      ))}
      {sent.has(answerKey) && <ClassResults activityId={activity.id} q={index} question={question} reflection={activity.kind === "reflection"} answer={answer} />}
      {sent.has(answerKey) ? (
        <div className="tutor-sent">
          <strong>✓ Response sent</strong>
          <p>Your tutor can see your response.</p>
          {activity.kind === "concept" && (
            <button type="button" onClick={() => setShowPeers(!showPeers)}>
              {showPeers ? "Hide peer responses" : "View peer responses"}
            </button>
          )}
        </div>
      ) : (
        <div className="tutor-activity-footer">
          <small role="status">
            {status || "Your response is shared with your tutor."}
          </small>
          <button
            type="button"
            className="extra-primary"
            disabled={busy || answer === "" || !canSend}
            onClick={() => void submitText()}
          >
            {busy ? "Sending…" : "Submit response →"}
          </button>
        </div>
      )}
      <LivePeers key={index} activityId={activity.id} q={index} expanded={showPeers} />
    </div>
  )
}
