import BulbIcon from "./BulbIcon"
import { lessonPages, pageForSlide, sourceSlideForPage } from "./lesson-navigation"
import { displayStudent } from "./class-display"
import { SharedText } from "./ClassResults"
import { ClassBadge, useClassroom } from "./ClassRoom"
import TutorActivity from "./TutorActivity"
import type { QuestionRow } from "./class-types"
import ExtraActivity from "./ExtraActivity"
import { createPortal } from "react-dom"
import MyLearning, { initialLearningEntries, type LearningEntry } from "./MyLearning"
import {
  useEffect,
  useLayoutEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react"
import {
  activityAnswer,
  activityReducer,
  activityTemplates,
  initialActivities,
  type ActivityRun,
  type ActivityAction,
} from "./activity-state"
import {
  initialPeerDiscussions,
  peerDiscussionReducer,
  samplePeerResponses,
  type PeerDiscussion,
  type PeerDiscussionAction,
  type PeerMessage,
} from "./peer-discussion"

type Section = "live" | "learning"
type LessonReaction = "understood" | "thinking" | "confused" | "insightful" | "applause"

const lessonReactions: {
  id: LessonReaction
  emoji: string
  label: string
  description: string
}[] = [
  {
    id: "understood",
    emoji: "✅",
    label: "Got it",
    description: "I’m following along",
  },
  {
    id: "thinking",
    emoji: "🤔",
    label: "Thinking",
    description: "I’m thinking this through",
  },
  {
    id: "confused",
    emoji: "❓",
    label: "Confused",
    description: "I need a little more explanation",
  },
  {
    id: "insightful",
    emoji: "💡",
    label: "Insightful",
    description: "This helped something click",
  },
  {
    id: "applause",
    emoji: "👏",
    label: "Applause",
    description: "That was really helpful",
  },
]

type IconName = "progress" | "slide" | "broadcast" | "sparkles" | "bookmark" | "search" | "plus" | "chevron" | "person" | "globe" | "arrow" | "heart" | "bubble" | "share" | "ellipsis" | "tray" | "folder" | "grid" | "list" | "check" | "mic" | "sidebar" | "x" | "help" | "expand"


function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    progress: <><path d="M4 19h16M7 15v-4M12 15V5M17 15V8" /></>,
    slide: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M12 17v4M8 21h8" /></>,
    broadcast: (
      <>
        <circle cx="12" cy="12" r="2.3" />
        <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 4.8a10.2 10.2 0 0 1 0 14.4" />
      </>
    ),
    sparkles: (
      <path d="m12 3 .9 3.1A4.2 4.2 0 0 0 15.9 9l3.1 1-3.1.9a4.2 4.2 0 0 0-3 3L12 17l-.9-3.1a4.2 4.2 0 0 0-3-3L5 10l3.1-.9a4.2 4.2 0 0 0 3-3L12 3ZM18.5 15.5l.4 1.2a2 2 0 0 0 1.3 1.4l1.3.4-1.3.4a2 2 0 0 0-1.3 1.3l-.4 1.3-.4-1.3a2 2 0 0 0-1.3-1.3l-1.3-.4 1.3-.4a2 2 0 0 0 1.3-1.4l.4-1.2Z" />
    ),
    bookmark: (
      <path d="M6.5 4.7c0-1 .8-1.7 1.7-1.7h7.6c.9 0 1.7.8 1.7 1.7V21L12 17.1 6.5 21V4.7Z" />
    ),
    search: (
      <>
        <circle cx="10.7" cy="10.7" r="6.7" />
        <path d="m16 16 4 4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    person: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9s-1.2 6.5-3.7 9c-2.5-2.5-3.7-5.5-3.7-9S9.5 5.5 12 3Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    heart: (
      <path d="M20.8 5.8c-1.8-1.9-4.8-1.9-6.7 0L12 8l-2.1-2.2a4.6 4.6 0 0 0-6.7 0 5 5 0 0 0 0 6.9L12 21l8.8-8.3a5 5 0 0 0 0-6.9Z" />
    ),
    bubble: (
      <path d="M20.5 11.4c0 4.5-4 8.1-8.9 8.1-1.1 0-2.2-.2-3.2-.5L4 21l1.1-4c-1.5-1.5-2.4-3.4-2.4-5.6 0-4.5 4-8.1 8.9-8.1s8.9 3.6 8.9 8.1Z" />
    ),
    share: (
      <>
        <path d="M12 15V3m0 0L8 7m4-4 4 4" />
        <path d="M5 11v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-8" />
      </>
    ),
    ellipsis: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    tray: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M4 14h5l1.5 2h3L15 14h5" />
      </>
    ),
    folder: <path d="M3 7.5h7l2-2h3.5c1 0 1.5.5 1.8 1.5H21v12H3V7.5Z" />,
    grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.1M4 12h.1M4 18h.1" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 .2c0 1.8-2.5 2-2.5 3.8M12 16.5h.01" />
      </>
    ),
    mic: (
      <>
        <rect height="11" rx="3.5" width="7" x="8.5" y="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" />
      </>
    ),
    sidebar: <path d="M4 4h16v16H4zM15 4v16" />,
    expand: <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      >
        {paths[name]}
      </g>
    </svg>
  )
}

function ActionButton({
  ariaLabel,
  children,
  className = "",
  onClick,
  pressed,
  title,
}: {
  ariaLabel?: string
  children: ReactNode
  className?: string
  onClick?: () => void
  pressed?: boolean
  title?: string
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={`action-button ${className}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

type ClassroomQuestion = {
  id: number | string
  dbId?: string
  tutorAnswer?: string
  sendError?: boolean
  slide: number
  name: string
  initials: string
  time: string
  text: string
  votes: number
  same: number
  answered: boolean
  answeredAt?: string
  translation?: string
  sourceLanguage?: string
}
function classroomQuestion(row: QuestionRow, currentIdentity?: import("./class-types").ClassIdentity | null): ClassroomQuestion {
  const name = row.anonymous ? "Anonymous" : displayStudent(row.student, currentIdentity || null)
  return { id: row.id, dbId: row.id, slide: row.slide || 1, name,
    initials: name.split(" ").map(part => part[0]).join("").slice(0,2), time: "a moment",
    text: row.text, translation: row.text_en || undefined, sourceLanguage: row.lang?.startsWith("zh") ? "Chinese" : row.lang || undefined,
    votes: row.upvotes, same: 0, answered: row.status === "ans", tutorAnswer: row.answer || undefined }
}
const questions: ClassroomQuestion[] = [
  {
    id: 4,
    slide: 11,
    name: "Alex Morgan",
    initials: "AM",
    time: "1 min",
    text: "How do we decide which research patterns belong in the same persona?",
    votes: 5,
    same: 0,
    answered: false,
  },
  {
    id: 5,
    slide: 15,
    name: "Anonymous",
    initials: "A",
    time: "a moment",
    text: "How can we make a How Might We question focused enough without jumping to a solution?",
    votes: 3,
    same: 0,
    answered: false,
  },
  {
    id: 3,
    slide: 10,
    name: "Yuki Tanaka",
    initials: "YT",
    time: "6 min",
    text: "Can one finding lead to multiple insights?",
    votes: 9,
    same: 3,
    answered: true,
    answeredAt: "10:22 AM",
  },
  {
    id: 1,
    slide: 8,
    name: "Maya Chen",
    initials: "MC",
    time: "2 min",
    text: "How is an insight different from a finding?",
    answeredAt: "10:24 AM",
    votes: 18,
    same: 7,
    answered: true,
  },
  {
    id: 2,
    slide: 15,
    name: "Anonymous",
    initials: "A",
    time: "4 min",
    text: "我们怎么判断一个洞察是否有足够的证据支持？",
    translation: "How do we know whether an insight is supported by evidence?",
    sourceLanguage: "Chinese",
    votes: 12,
    same: 5,
    answered: false,
  },
]

function Sidebar({
  section,
  setSection,
}: {
  section: Section
  setSection: (section: Section) => void
}) {
  const courses = [
    {
      code: "9106",
      name: "Design Thinking",
      semester: "Semester 2 · 2026",
    },
    {
      code: "9105",
      name: "Interface Design",
      semester: "Semester 2 · 2026",
    },
    {
      code: "9103",
      name: "Creative Coding",
      semester: "Semester 2 · 2026",
    },
  ]
  const [courseCode, setCourseCode] = useState("9106")
  const [courseMenuOpen, setCourseMenuOpen] = useState(false)
  useEffect(() => {
    if (!courseMenuOpen) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Element && !event.target.closest(".course-menu, .course-card")) setCourseMenuOpen(false)
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setCourseMenuOpen(false); document.querySelector<HTMLButtonElement>(".course-card")?.focus() }
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", keyboard)
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keyboard) }
  }, [courseMenuOpen])
  const activeCourse =
    courses.find((course) => course.code === courseCode) ?? courses[0]
  const items: {
    id: Section
    label: string
    icon: IconName
    isLive?: boolean
  }[] = [
    {
      id: "live",
      label: "Live",
      icon: "broadcast",
      isLive: true,
    },
    { id: "learning", label: "My Learning", icon: "progress" },
  ]
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <img alt="" height="30" src="/assets/studio-bridge-logo.svg" width="30" />
        </div>
      </div>
      <nav className="primary-nav" aria-label="Main sections">
        {items.map((item) => (
          <button
            aria-current={section === item.id ? "page" : undefined}
            aria-label={item.label}
            className={section === item.id ? "nav-item active" : "nav-item"}
            key={item.id}
            onClick={() => setSection(item.id)}
            title={item.label}
            type="button"
          >
            <span className="nav-icon">
              <Icon name={item.icon} size={19} />
              {item.isLive && (
                <span aria-hidden="true" className="nav-live-indicator" />
              )}
            </span>
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="course-switcher">
        {courseMenuOpen && (
          <CourseMenu>
            <div className="course-menu-heading">
              <strong>Switch course</strong>
              <small>Semester 2 · 2026</small>
            </div>
            {courses.map((course) => (
              <button
                className={course.code === courseCode ? "selected" : ""}
                key={course.code}
                onClick={() => {
                  setCourseCode(course.code)
                  setCourseMenuOpen(false)
                }}
                role="menuitem"
                type="button"
              >
                <span className={`course-code course-${course.code}`}>
                  {course.code}
                </span>
                <span>
                  <strong>{course.name}</strong>
                  <small>IDEA{course.code}</small>
                </span>
                {course.code === courseCode && (
                  <span className="course-selected">
                    <Icon name="check" size={12} />
                  </span>
                )}
              </button>
            ))}
          </CourseMenu>
        )}
        <button
          aria-label={`Switch course. Current course: IDEA${activeCourse.code} ${activeCourse.name}`}
          aria-haspopup="menu"
          aria-expanded={courseMenuOpen}
          className="course-card"
          onClick={() => setCourseMenuOpen(!courseMenuOpen)}
          title={`IDEA${activeCourse.code} · ${activeCourse.name}`}
          type="button"
        >
          <span className={`course-code course-${activeCourse.code}`}>
            {activeCourse.code}
          </span>
        </button>
      </div>
      <div className="profile" title="Elena Liu · Student · Online">
        <span className="avatar image-avatar">EL</span>
      </div>
    </aside>
  )
}

function CourseMenu({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(null)
  useLayoutEffect(() => {
    function place() {
      const control = document.querySelector(".course-card")
      if (!control) return
      const bounds = control.getBoundingClientRect()
      setPosition({ left: Math.min(bounds.right + 12, window.innerWidth - 240), bottom: window.innerHeight - bounds.bottom })
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [])
  return position && createPortal(<div className="course-menu glass" role="menu" style={{ position: "fixed", left: position.left, bottom: position.bottom }}>{children}</div>, document.body)
}

function ComposerMenu({ children, className }: { children: ReactNode; className: string }) {
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(null)
  useLayoutEffect(() => {
    function place() {
      const control = document.querySelector('.identity-control[aria-expanded="true"]')
      if (!control) return
      const bounds = control.getBoundingClientRect()
      setPosition({ left: Math.max(12, Math.min(bounds.left, window.innerWidth - 248)), bottom: window.innerHeight - bounds.top + 8 })
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [])
  return position && createPortal(
    <div className={className} role="menu" style={{ position: "fixed", left: position.left, bottom: position.bottom }}>{children}</div>, document.body,
  )
}

function ActivityContent({
  activity,
  onSelect,
  onSubmit,
  onReturn,
  onViewPeers,
  returnLabel = "Back to class",
}: {
  activity: ActivityRun
  onSelect: (answer: number) => void
  onSubmit: () => void
  onReturn?: () => void
  onViewPeers: () => void
  returnLabel?: string
}) {
  const groupId = useId()
  const template = activityTemplates[activity.kind]
  return (
    <div className="activity-content">
      <div className="activity-meta">
        <span>{template.label}</span>
        <span
          className={
            activity.submitted ? "activity-status submitted" : "activity-status"
          }
        >
          {activity.submitted ? (
            <>
              <Icon name="check" size={12} /> Submitted
            </>
          ) : (
            "Open"
          )}
        </span>
      </div>
      <h3>{template.title}</h3>
      <p className="activity-description">{template.description}</p>
      {activity.submitted ? (
        <div className="activity-confirmation" role="status">
          <div className="activity-confirmation-heading">
            <span className="activity-confirmation-icon">
              <Icon name="check" size={20} />
            </span>
            <div>
              <strong>You’re all set.</strong>
              <p>Your response is saved for this session.</p>
            </div>
          </div>
          <div className="activity-answer">
            <small>Your response</small>
            <span>{activityAnswer(activity)}</span>
          </div>
          <div className="activity-confirmation-actions">
          <button
            className="activity-peer-link"
            onClick={onViewPeers}
            type="button"
          >
            <Icon name="bubble" size={17} /> View peer responses{" "}
            <Icon name="chevron" size={14} />
          </button>
          {onReturn && (
            <button
              className="activity-submit"
              onClick={onReturn}
              type="button"
            >
              {returnLabel} <Icon name="arrow" size={16} />
            </button>
          )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <fieldset className="activity-answers">
            <legend>
              {activity.kind === "choice"
                ? "Choose one answer"
                : "Choose a score from 1 to 5"}
            </legend>
            {activity.kind === "choice" ? (
              <div className="activity-options">
                {template.options.map((option, index) => (
                  <label
                    className={
                      activity.answer === index
                        ? "activity-option selected"
                        : "activity-option"
                    }
                    key={option}
                  >
                    <input
                      checked={activity.answer === index}
                      name={groupId}
                      onChange={() => onSelect(index)}
                      type="radio"
                      value={index}
                    />
                    <span className="activity-option-letter" aria-hidden="true">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <>
                <div className="activity-rating">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score}>
                      <input
                        aria-label={`${score} out of 5${
                          score === 1
                            ? ", not confident yet"
                            : score === 5
                              ? ", ready to try"
                              : ""
                        }`}
                        checked={activity.answer === score}
                        className="sr-only"
                        name={groupId}
                        onChange={() => onSelect(score)}
                        type="radio"
                        value={score}
                      />
                      <span>{score}</span>
                    </label>
                  ))}
                </div>
                <div className="activity-rating-labels">
                  <span>Not confident yet</span>
                  <span>Ready to try</span>
                </div>
              </>
            )}
          </fieldset>
          <p className="activity-local-note">
            Responses are kept for this session.
          </p>
        </form>
      )}
    </div>
  )
}

function PeerMessageItem({ message }: { message: PeerMessage }) {
  return (
    <div
      className={message.own ? "peer-message own" : "peer-message"}
      data-message-id={message.id}
    >
      <span
        className={
          message.own ? "avatar image-avatar" : "avatar lavender-avatar"
        }
      >
        {message.initials}
      </span>
      <div>
        <div className="peer-message-meta">
          <strong>{message.name}</strong>
          <small>{message.own ? "You · Just now" : "Classmate"}</small>
        </div>
        <p>{message.text}</p>
      </div>
    </div>
  )
}

function ActivityPeerResponses({
  activity,
  discussion,
  dispatch,
  onBack,
  navigation,
  onPosted,
}: {
  activity: ActivityRun
  discussion: PeerDiscussion
  dispatch: (action: PeerDiscussionAction) => void
  onBack: () => void
  navigation: ReactNode
  onPosted: (text: string) => void
}) {
  const peers = samplePeerResponses[activity.kind === "rating" ? "rating" : "choice"]
  const template = activityTemplates[activity.kind]
  const composerId = useId()
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const replyTarget = peers.find((peer) => peer.id === discussion.replyTo)
  const previousMessageCount = useRef(discussion.messages.length)
  const [announcement, setAnnouncement] = useState("")
  useEffect(() => {
    if (discussion.messages.length > previousMessageCount.current) {
      const last = discussion.messages[discussion.messages.length - 1]
      const container = scrollRef.current
      const target = container?.querySelector<HTMLElement>(
        `[data-message-id="${last.id}"]`,
      )
      if (container && target)
        container.scrollTop = Math.max(
          0,
          target.offsetTop - container.clientHeight / 2,
        )
    }
    previousMessageCount.current = discussion.messages.length
  }, [discussion.messages])
  function reply(peerId: string) {
    dispatch({ type: "reply", activityId: activity.id, peerId })
    composerRef.current?.focus({ preventScroll: true })
  }
  function post() {
    if (!discussion.draft.trim()) return
    onPosted(discussion.draft.trim())
    dispatch({ type: "post", activityId: activity.id, id: crypto.randomUUID() })
    setAnnouncement("Your comment was added to this session’s discussion.")
  }
  const values = activity.kind === "choice" ? [0, 1, 2, 3] : [1, 2, 3, 4, 5]
  const answers = [...peers.map((peer) => peer.answer), activity.answer]
  return (
    <div className="peer-discussion">
      <div className="peer-reader">
        <div className="peer-response-scroll" ref={scrollRef}>
          <div className="peer-context">
            <button className="peer-back" onClick={onBack} type="button">
              <Icon name="chevron" size={13} /> Your response
            </button>
            <h3>{template.title}</h3>
            <div className="peer-your-answer">
              <Icon name="check" size={13} />
              <span>Your answer: {activityAnswer(activity)}</span>
            </div>
          </div>
          <details className="peer-snapshot">
            <summary>
              <Icon name="grid" size={16} />
              <span>
                Compare responses
                <small>{peers.length} sample peers + you</small>
              </span>
              <Icon name="chevron" size={14} />
            </summary>
            <div className="peer-result-list">
              {values.map((value) => {
                const count = answers.filter(
                  (answer) => answer === value,
                ).length
                const label =
                  activity.kind === "choice"
                    ? `${String.fromCharCode(65 + value)}. ${template.options[value]}`
                    : `${value} / 5`
                return (
                  <div
                    className={
                      activity.answer === value
                        ? "peer-result your-answer"
                        : "peer-result"
                    }
                    key={value}
                  >
                    <div>
                      <span>{label}</span>
                      {activity.answer === value && <em>You</em>}
                      <small>
                        {count}/{answers.length}
                      </small>
                    </div>
                    <progress
                      aria-label={label}
                      max={answers.length}
                      value={count}
                    />
                  </div>
                )
              })}
            </div>
          </details>
          <div className="peer-list-heading">
            <h4>How others are thinking</h4>
            <span>{peers.length} sample peers</span>
          </div>
          {peers.map((peer) => {
            const replies = discussion.messages.filter(
              (message) => message.parentId === peer.id,
            )
            const helpful = discussion.helpfulIds.includes(peer.id)
            return (
              <article className="peer-response-card" key={peer.id}>
                <div className="peer-card-author">
                  <span className={`avatar peer-avatar-${peer.tone}`}>
                    {peer.initials}
                  </span>
                  <div>
                    <strong>{peer.name}</strong>
                    <small>IDEA9106 · Classmate</small>
                  </div>
                  <span className="peer-answer-tag">
                    {activity.kind === "choice"
                      ? `Option ${String.fromCharCode(65 + peer.answer)}`
                      : `${peer.answer} / 5`}
                  </span>
                </div>
                {activity.kind === "choice" && (
                  <p className="peer-choice-answer">
                    {template.options[peer.answer]}
                  </p>
                )}
                <p className="peer-thought">{peer.thought}</p>
                <div className="peer-card-actions">
                  <button
                    aria-label={`Mark ${peer.name}’s response as helpful`}
                    aria-pressed={helpful}
                    onClick={() =>
                      dispatch({
                        type: "helpful",
                        activityId: activity.id,
                        peerId: peer.id,
                      })
                    }
                    type="button"
                  >
                    <Icon name="sparkles" size={14} /> Helpful{" "}
                    <small>{peer.helpful + Number(helpful)}</small>
                  </button>
                  <button
                    aria-label={`Reply to ${peer.name}`}
                    onClick={() => reply(peer.id)}
                    type="button"
                  >
                    <Icon name="bubble" size={14} /> Reply
                    {replies.length > 0 && <small>{replies.length}</small>}
                  </button>
                </div>
                {replies.length > 0 && (
                  <div className="peer-replies">
                    {replies.map((message) => (
                      <PeerMessageItem key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </article>
            )
          })}
          <div className="peer-general-discussion">
            <h4>Share your perspective</h4>
            {discussion.messages
              .filter((message) => message.parentId === null)
              .map((message) => (
                <PeerMessageItem key={message.id} message={message} />
              ))}
            {!discussion.messages.some(
              (message) => message.parentId === null,
            ) && (
              <p>
                What stood out to you? Add a connection, a different
                perspective, or a question for the class.
              </p>
            )}
          </div>
        </div>
        {navigation}
      </div>
      <form
        className="peer-composer"
        onSubmit={(event) => {
          event.preventDefault()
          post()
        }}
      >
        {replyTarget && (
          <div className="peer-reply-context">
            <span>
              Replying to <strong>{replyTarget.name}</strong>
            </span>
            <button
              aria-label="Cancel reply"
              onClick={() =>
                dispatch({
                  type: "reply",
                  activityId: activity.id,
                  peerId: null,
                })
              }
              type="button"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        )}
        <label className="sr-only" htmlFor={composerId}>
          Share your thoughts on question {activity.id}
        </label>
        <div className="peer-composer-input">
          <span className="avatar image-avatar">EL</span>
          <textarea
            id={composerId}
            maxLength={2000}
            onChange={(event) =>
              dispatch({
                type: "draft",
                activityId: activity.id,
                text: event.target.value,
              })
            }
            placeholder={
              replyTarget
                ? `Reply to ${replyTarget.name}…`
                : "Share a thought or ask a classmate…"
            }
            ref={composerRef}
            rows={1}
            value={discussion.draft}
          />
          <button disabled={!discussion.draft.trim()} type="submit">
            Post <Icon name="arrow" size={15} />
          </button>
        </div>
      </form>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  )
}

const slideCaptions = [
  ["Today we’re exploring personas and reframing.", "今天我们将学习用户画像与问题重构。"],
  ["We acknowledge the Traditional Custodians of the land.", "我们向这片土地的传统守护者致以敬意。"],
  ["We’ll use research insights to create a persona and reframe the brief.", "我们将运用研究洞察创建用户画像，并重构设计简报。"],
  ["Today’s agenda: mindset, personas, reframing and wrap-up.", "今天的安排：思维任务、用户画像、问题重构与总结。"],
  ["Take five minutes to complete the mindset task on Canvas.", "请用五分钟完成 Canvas 上的思维任务。"],
  ["Next, we’ll develop evidence-based personas.", "接下来，我们将建立有研究依据的用户画像。"],
  ["Use insights from your affinity diagram to build a persona.", "运用亲和图分析得到的洞察来建立用户画像。"],
  ["Personas represent typical users and are grounded in real research.", "用户画像代表典型用户，并以真实研究为基础。"],
  ["Identify behavioural, attitudinal and demographic variables in your interviews.", "从访谈中识别行为、态度和人口统计等变量。"],
  ["Look for patterns across the variables in your interview data.", "在访谈资料的不同变量之间寻找共同模式。"],
  ["Combine the patterns into a coherent persona with a name and backstory.", "将这些模式整合为连贯的用户画像，并补充姓名和背景。"],
  ["Review each other’s personas and offer constructive feedback.", "相互审阅用户画像，并提出建设性反馈。"],
  ["What makes a persona useful? Choose the answer based on research evidence.", "什么样的用户画像才有用？请选择基于研究证据的答案。"],
  ["How confident do you feel about turning an insight into a problem statement?", "你对将研究洞察转化为问题陈述有多大信心？"],
  ["Use your group’s insights to reframe the brief and ask a new How Might We question.", "运用小组洞察重构简报，并提出新的「我们如何才能」问题。"],
  ["Use a discussion card to agree, ask for clarification or share an idea.", "用讨论卡表达赞同、提出疑问或分享想法。"],
  ["Take a photo of your group’s artefact and share the thinking behind it.", "拍摄小组的设计产物，并分享背后的思考。"],
  ["Let’s wrap up today’s tutorial.", "现在我们来总结今天的课程。"],
  ["Share any unexpected insights or questions you still have.", "分享意外发现的洞察，或提出仍有疑问的地方。"],
  ["Before next week, refine your brief and prepare the problem statement.", "下周前，请完善设计简报并准备问题陈述。"],
  ["Thank you for participating. See you next week!", "感谢参与，我们下周见！"],
] as const

function LiveView({
  notify,
  questionsOpen,
  active,
  onLearningEntry,
  reviewSlide,
  activities,
  dispatchActivity,
}: {
  notify: (message: string) => void
  questionsOpen: boolean
  active: boolean
  onLearningEntry: (entry: LearningEntry) => void
  reviewSlide: { page: number; request: number; activityId?: string } | null
  activities: ActivityRun[]
  dispatchActivity: (action: ActivityAction) => void
}) {
  const room = useClassroom()
  const liveMode = Boolean(room.identity && room.session)
  const studentName = room.identity?.name || "Elena Liu"
  const [peerView, setPeerView] = useState(false)
  const [peerDiscussions, dispatchPeerDiscussion] = useReducer(
    peerDiscussionReducer,
    initialPeerDiscussions,
  )
  function submitActivity(item: ActivityRun) {
    if ((item.kind === "artefact" ? !item.photo : item.answer === null) || item.submitted) return
    dispatchActivity({ type: "submit", id: item.id })
    notify("Practice response saved on this device.")
  }
  function openPeerResponses(item: ActivityRun) {
    if (!item.submitted) return
    setPeerView(true)
  }
  const [composer, setComposer] = useState("")
  const [questionList, setQuestionList] = useState(questions)
  const [originalQuestions, setOriginalQuestions] = useState<(number | string)[]>([])
  const [replyQuestion, setReplyQuestion] = useState<number | string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [questionReplies, setQuestionReplies] = useState<Record<string, { id: string; text: string; name: string; english?: string }[]>>({})
  const [identity, setIdentity] = useState<"anonymous" | "named">(room.identity?.anonymous === false ? "named" : "anonymous")
  const [questionLanguage, setQuestionLanguage] = useState<"zh" | "en">("zh")
  const [identityMenuOpen, setIdentityMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  useEffect(() => {
    if (!identityMenuOpen && !languageMenuOpen) return
    function closeMenus() { setIdentityMenuOpen(false); setLanguageMenuOpen(false) }
    function outside(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest(".composer-control-wrap, .composer-menu")) closeMenus()
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const openControl = document.querySelector<HTMLButtonElement>('.identity-control[aria-expanded="true"]')
        closeMenus()
        openControl?.focus()
      }
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", keydown)
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keydown) }
  }, [identityMenuOpen, languageMenuOpen])
  const [feedback, setFeedback] = useState<LessonReaction | null>(null)
  const [reactionBursts, setReactionBursts] = useState<{ id: number; reaction: LessonReaction }[]>([])
  const burstSequence = useRef(0)
  const burstTimers = useRef(new Set<number>())
  useEffect(() => () => {
    burstTimers.current.forEach(timer => window.clearTimeout(timer))
  }, [])
  const [feedbackCounts, setFeedbackCounts] =
    useState<Record<LessonReaction, number>>({
      understood: 18,
      thinking: 6,
      insightful: 14,
      confused: 3,
      applause: 9,
    })
  const teacherSlide = liveMode ? Math.max(1, Math.min(19, Number(room.state.slide) || 1)) : 17
  const totalSlides = lessonPages.length
  const [viewedSlide, setViewedSlide] = useState(1)
  const [followingTutor, setFollowingTutor] = useState(false)
  const [hasTeacherCommand, setHasTeacherCommand] = useState(false)
  const lastTeacherCommand = useRef<string | null>(null)
  const [historicalActivityId, setHistoricalActivityId] = useState<string | null>(null)
  useEffect(() => {
    if (reviewSlide) { setFollowingTutor(false); setViewedSlide(reviewSlide.page); setHistoricalActivityId(reviewSlide.activityId || null); setPeerView(false) }
  }, [reviewSlide])
  const isFollowingTutor = liveMode && followingTutor && !historicalActivityId
  const activity = activities.find((item) => item.page === viewedSlide)
  const sourceSlide = sourceSlideForPage(viewedSlide)
  const remoteActivityId = liveMode ? historicalActivityId || (isFollowingTutor ? room.state.activityId : null) : null
  const remoteActivity = room.activities.find(item => item.id === remoteActivityId)
  const originalCaption = sourceSlide === 13 || sourceSlide === 14
    ? ["Use research insights to reframe the design problem.", "运用研究洞察重构设计问题。"]
    : slideCaptions[(sourceSlide >= 16 ? sourceSlide + 2 : sourceSlide) - 1] || slideCaptions[0]
  const slideCaption = remoteActivityId ? remoteActivity?.kind === "discussion" ? slideCaptions[15]
    : remoteActivity?.kind === "artefact" ? slideCaptions[16]
    : remoteActivity?.kind === "reflection" ? [remoteActivity.spec?.question || "Reflect on your learning.", "回顾你的学习，并分享思考。"]
    : remoteActivity?.kind === "qa" ? ["Share a question with your tutor and classmates.", "向老师和同学提出你的问题。"]
    : ["Use research evidence to answer your tutor’s concept check.", "运用研究证据回答老师发布的概念题。"]
    : activity ? activity.kind === "choice" ? slideCaptions[12] : activity.kind === "rating" ? slideCaptions[13] : activity.kind === "discussion" ? slideCaptions[15] : slideCaptions[16] : originalCaption
  // The tutor's voice becomes captions: show them (English + Chinese) for 25 seconds after each sentence.
  const [captionNow, setCaptionNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setCaptionNow(Date.now()), 4000)
    return () => window.clearInterval(timer)
  }, [])
  const tutorCaption = liveMode ? room.state.caption : undefined
  const captions = tutorCaption?.en && captionNow - Date.parse(tutorCaption.at || "") < 25000 ? [tutorCaption.en, tutorCaption.zh || ""] : slideCaption
  useEffect(() => {
    if (!liveMode) { lastTeacherCommand.current = null; return }
    const command = JSON.stringify([room.state.slide || 1, room.state.activityId || null, room.state.activityKind || null, room.state.updatedAt || null])
    // The initial snapshot is a baseline, not a new teacher command. Periodic
    // snapshots and classmates' actions never interrupt independent browsing.
    if (lastTeacherCommand.current === null) { lastTeacherCommand.current = command; return }
    if (lastTeacherCommand.current === command) return
    lastTeacherCommand.current = command
    setHasTeacherCommand(true); setFollowingTutor(true)
    setViewedSlide(pageForSlide(teacherSlide)); setHistoricalActivityId(null); setPeerView(false)
  }, [liveMode, teacherSlide, room.state.activityId, room.state.activityKind, room.state.updatedAt])
  useEffect(() => {
    if (liveMode) setQuestionList(current => [
      ...current.filter(question => question.sendError && !room.questions.some(row => row.id === question.id)),
      ...room.questions.map(row => classroomQuestion(row, room.identity)),
    ])
  }, [liveMode, room.questions])
  const previousReactionCounts = useRef<Record<string, number> | null>(null)
  const [reactionPops, setReactionPops] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!liveMode) return
    const map = { got: "understood", think: "thinking", confused: "confused", insight: "insightful", applause: "applause" } as const
    const counts = { understood: 0, thinking: 0, confused: 0, insightful: 0, applause: 0 }
    for (const reaction of room.reactions) if (map[reaction.kind]) counts[map[reaction.kind]]++
    const previous = previousReactionCounts.current
    if (previous) setReactionPops(current => {
      const next = { ...current }
      for (const key of Object.keys(counts) as LessonReaction[]) if (counts[key] > previous[key]) next[key] = (next[key] || 0) + 1
      return next
    })
    previousReactionCounts.current = counts
    setFeedbackCounts(counts)
  }, [liveMode, room.reactions])

  function goToPage(page: number) {
    setFollowingTutor(false)
    setHistoricalActivityId(null)
    setViewedSlide(Math.max(1, Math.min(totalSlides, page)))
    setPeerView(false)
  }

  function returnToTutor() {
    setFollowingTutor(true); setHasTeacherCommand(true)
    setHistoricalActivityId(null); setViewedSlide(pageForSlide(teacherSlide)); setPeerView(false)
  }
  useEffect(() => {
    if (!active) return
    function navigate(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || target?.closest("input, textarea, select, [contenteditable], dialog, [role=menu]")) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); goToPage(viewedSlide + (event.key === "ArrowRight" ? 1 : -1))
      }
    }
    window.addEventListener("keydown", navigate)
    return () => window.removeEventListener("keydown", navigate)
  }, [active, viewedSlide])

  function sendFeedback(next: LessonReaction) {
    if (room.identity) {
      const map = { understood: "got", thinking: "think", confused: "confused", insightful: "insight", applause: "applause" } as const
      void room.api.sendReaction(map[next])
    }
    const id = ++burstSequence.current
    setReactionBursts(current => [...current.slice(-7), { id, reaction: next }])
    const timer = window.setTimeout(() => {
      setReactionBursts(current => current.filter(burst => burst.id !== id))
      burstTimers.current.delete(timer)
    }, 1900)
    burstTimers.current.add(timer)
    if (feedback === next) return
    if (!liveMode) setFeedbackCounts((current) => {
      const updated = { ...current, [next]: current[next] + 1 }
      if (feedback) updated[feedback] = Math.max(0, current[feedback] - 1)
      return updated
    })
    setFeedback(next)
  }

  const questionSending = useRef(false)
  async function submitQuestion() {
    if (!composer.trim() || questionSending.current) return
    const text = composer.trim()
    const id = room.identity ? crypto.randomUUID() : Date.now()
    if (room.identity) {
      try {
        const key = `studio-bridge-questions:${room.identity.clientId}`
        const ids: string[] = JSON.parse(localStorage.getItem(key) || "[]")
        localStorage.setItem(key, JSON.stringify([...ids, id]))
      } catch { /* Questions can still be sent without local storage. */ }
    }
    const anonymous = room.identity?.anonymous || identity === "anonymous"
    const local: ClassroomQuestion = { id, slide: sourceSlide, name: anonymous ? "Anonymous" : studentName, initials: anonymous ? "A" : studentName.slice(0,2).toUpperCase(), time: "now", text, votes: 1, same: 0, answered: false, sendError: Boolean(room.identity) }
    setQuestionList(current => [local, ...current]); setComposer("")
    onLearningEntry({ id: `live-question-${id}`, kind: "Question", title: text, detail: "Your question · Just asked in class", slide: sourceSlide, week: room.session?.week || 6 })
    if (!room.identity) { notify("Your question was added to the demo."); return }
    questionSending.current = true
    try {
      const result = await room.api.askQuestion({ id: String(id), text, anonymous, slide: sourceSlide, lang: /[\u3400-\u9fff]/.test(text) ? "zh" : questionLanguage })
      if (result.data) { setQuestionList(current => [classroomQuestion(result.data!, room.identity), ...current.filter(q => q.id !== id)]); notify("Your question was sent to your tutor.") }
      else notify("Question kept on this device. Retry to send.")
    } finally { questionSending.current = false }
  }
  async function retryQuestion(question: ClassroomQuestion) {
    const result = await room.api.askQuestion({ id: String(question.id), text: question.text, anonymous: question.name === "Anonymous", slide: question.slide, lang: /[\u3400-\u9fff]/.test(question.text) ? "zh" : "en" })
    if (result.data) setQuestionList(current => current.map(q => q.id === question.id ? classroomQuestion(result.data!, room.identity) : q))
  }
  async function voteQuestion(question: ClassroomQuestion) {
    if (!room.identity) { setQuestionList(current => current.map(q => q.id === question.id ? { ...q, votes: q.votes + 1 } : q)); return }
    if (!question.dbId) return
    const result = await room.api.upvoteQuestion(question.dbId)
    if (result.data) setQuestionList(current => current.map(q => q.id === question.id ? classroomQuestion(result.data!, room.identity) : q))
  }

  useEffect(() => {
    if (!liveMode) return
    const grouped: Record<string, { id: string; text: string; name: string; english?: string }[]> = {}
    for (const row of room.responses) {
      if (row.kind !== "qa_reply" || typeof row.payload.questionId !== "string") continue
      const parent = row.payload.questionId
      ;(grouped[parent] ||= []).push({ id: row.id, text: String(row.payload.text || ""), english: typeof row.payload.text_en === "string" ? row.payload.text_en : undefined, name: displayStudent(row.student, room.identity, row.payload.clientId) })
    }
    setQuestionReplies(current => {
      const next = { ...current }
      for (const [parent, rows] of Object.entries(grouped)) next[parent] = [...rows, ...(current[parent] || []).filter(local => !rows.some(row => row.id === local.id))]
      return next
    })
  }, [liveMode, room.responses])
  function submitQuestionReply(question: ClassroomQuestion) {
    const text = (replyDrafts[question.id] || "").trim()
    if (!text) return
    const id = crypto.randomUUID()
    setQuestionReplies(current => ({
      ...current,
      [question.id]: [...(current[question.id] || []), { id, text, name: identity === "anonymous" ? "You · Anonymous" : `You · ${studentName}` }],
    }))
    if (room.identity && question.dbId) {
      void room.api.replyToQuestion({ id, questionId: question.dbId, text }).then(result => {
        if (result.error) { setReplyDrafts(current => ({ ...current, [question.id]: text })); notify("Reply kept on this device. Please retry when connected.") }
      })
    }
    setReplyDrafts(current => ({ ...current, [question.id]: "" }))
    onLearningEntry({ id: `live-response-${id}`, kind: "Response", title: text, detail: `Your reply to ${question.name} · ${question.translation || question.text}`, slide: question.slide, week: 6 })
  }

  const pageNavigation = (
    <nav
      className="presentation-arrows glass"
      aria-label="Slides and activities"
    >
      <button
        aria-label="Previous page"
        className="presentation-arrow previous"
        disabled={viewedSlide <= 1}
        onClick={() => goToPage(viewedSlide - 1)}
        type="button"
      >
        <Icon name="chevron" size={18} />
      </button>
      <span className="presentation-page" aria-live="polite" aria-atomic="true">
        {viewedSlide} <span>/ {totalSlides}</span>
      </span>
      <button
        aria-label="Next page"
        className="presentation-arrow"
        disabled={viewedSlide >= totalSlides}
        onClick={() => goToPage(viewedSlide + 1)}
        type="button"
      >
        <Icon name="chevron" size={18} />
      </button>
    </nav>
  )

  return (
    <main
      className={
        questionsOpen ? "live-layout" : "live-layout questions-collapsed"
      }
    >
      <section className="lesson-pane">
        <div className="session-heading">
          <div className="session-copy">
            <div className="eyebrow tutorial-label">IDEA9106 Tutorial 2</div>
            <h1>Week 6: Personas &amp; Reframing</h1>
            <p>{liveMode ? `${room.session?.unit || "IDEA9106"} · Week ${room.session?.week || 6}` : "Dr. Priya Nair · 42 students"}</p>
            <ClassBadge />
          </div>
          <div className="session-actions">
            {isFollowingTutor ? (
              <span className="presentation-live">
                <span className="live-dot" /> Following tutor
              </span>
            ) : !hasTeacherCommand && !historicalActivityId ? (
              <span className="presentation-live">Browse freely</span>
            ) : (
              <button
                className="presentation-back-live"
                onClick={returnToTutor}
                type="button"
              >
                <span className="live-dot" /> Back to live
              </button>
            )}
          </div>
        </div>
        <div className="lesson-content">
          <div className="slide-stage">

            <div className="slide-surface">
              {remoteActivityId ? (
                <section className="slide embedded-activity" aria-label="Live class activity">
                  <header className="embedded-activity-header"><span><Icon name="grid" size={16} />Class activity</span><div className="class-activity-navigation">{pageNavigation}</div></header>
                  {remoteActivity ? <TutorActivity key={`${remoteActivity.id}:${remoteActivity.kind}`} activity={remoteActivity} onRecorded={onLearningEntry} /> : <div className="tutor-activity"><h3>Your activity is getting ready.</h3><p>Waiting for your tutor’s activity…</p></div>}
                </section>
              ) : activity ? (
                <section
                  className="slide embedded-activity"
                  aria-label={`Page ${viewedSlide}: ${activityTemplates[activity.kind].title}`}
                >
                  <header className="embedded-activity-header">
                    <span>
                      <Icon name={peerView ? "bubble" : "grid"} size={16} />
                      {peerView ? "Peer responses" : "Class activity · Practice"}
                    </span>
                    <small>
                      Activity {activities.indexOf(activity) + 1} of{" "}
                      {activities.length}
                    </small>
                  </header>
                  {activity.kind === "discussion" || activity.kind === "artefact" ? (
                    <ExtraActivity key={activity.id} active={active} activity={activity} dispatch={dispatchActivity} />
                  ) : peerView && activity.submitted ? (
                    <div className="embedded-activity-peers">
                      <ActivityPeerResponses
                        key={activity.id}
                        activity={activity}
                        discussion={peerDiscussions[activity.id]}
                        dispatch={dispatchPeerDiscussion}
                        onPosted={(text) => onLearningEntry({ id: `live-response-${Date.now()}`, kind: "Response", title: text, detail: "Your contribution · Peer discussion", slide: activity.page, week: 6 })}
                        onBack={() => setPeerView(false)}
                        navigation={pageNavigation}
                      />
                    </div>
                  ) : (
                    <div className="embedded-activity-body" key={activity.id}>
                      <ActivityContent
                        activity={activity}
                        onReturn={() => goToPage(viewedSlide + 1)}
                        onSelect={(answer) =>
                          dispatchActivity({
                            type: "select",
                            id: activity.id,
                            answer,
                          })
                        }
                        onSubmit={() => submitActivity(activity)}
                        onViewPeers={() => openPeerResponses(activity)}
                        returnLabel="Continue to next page"
                      />
                    </div>
                  )}
                </section>
              ) : (
                <div
                  className={
                    isFollowingTutor ? "slide" : "slide viewing-history"
                  }
                >
                  <img
                    alt={`IDEA9106 Week 6 tutorial slide ${sourceSlide}`}
                    className="slide-image"
                    src={`/assets/slides/week6/page-${String(sourceSlide).padStart(2, "0")}.jpg`}
                  />
                </div>
              )}
              {!remoteActivityId && !(peerView && activity?.submitted) && pageNavigation}
              {activity && activity.kind !== "discussion" && activity.kind !== "artefact" && !activity.submitted && (
                <button
                  className="activity-submit activity-floating-submit"
                  disabled={activity.answer === null}
                  onClick={() => submitActivity(activity)}
                  type="button"
                >
                  Submit response <Icon name="arrow" size={16} />
                </button>
              )}
            </div>
          </div>
          <section
            className="lesson-tools"
            aria-label="Live translation captions and lesson feedback"
          >
            <div
              className="live-captions"
              aria-label="Live translation"
            >
              <span className="caption-indicator" aria-hidden="true">
                <Icon name="globe" size={14} />
              </span>
              <div className="caption-lines" aria-live="polite">
                <p lang="en">{captions[0]}</p>
                <p lang="zh-CN">{captions[1]}</p>
              </div>
            </div>
            <div
              className="live-feedback"
              role="group"
              aria-label="How is this landing? Quick lesson feedback"
            >
              <span className="sr-only" role="status">
                {feedback
                  ? `${lessonReactions.find((reaction) => reaction.id === feedback)?.label} selected`
                  : ""}
              </span>
              <div className="feedback-actions">
                {lessonReactions.map((reaction) => (
                  <button
                    aria-label={reaction.label}
                    aria-pressed={feedback === reaction.id}
                    className={feedback === reaction.id ? "selected" : ""}
                    key={reaction.id}
                    onClick={() => sendFeedback(reaction.id)}
                    title={`${reaction.label} — ${reaction.description}`}
                    type="button"
                  >
                    <span aria-hidden="true" className="feedback-emoji">
                      {reaction.emoji}
                    </span>
                    {reactionBursts.filter(burst => burst.reaction === reaction.id).map(burst =>
                      <span className="reaction-burst" key={burst.id} aria-hidden="true">
                        {[-2, -1, 0, 1, 2].map((direction, index) =>
                          <span className="feedback-particle" key={direction} style={{
                            "--drift": `${direction * 24}px`,
                            "--rise": `${105 + (2 - Math.abs(direction)) * 22}px`,
                            "--tilt": `${direction * 13}deg`,
                            animationDelay: `${index * 55}ms`,
                          } as CSSProperties}>{reaction.emoji}</span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {questionsOpen && (
        <aside id="live-questions" className="questions-pane" aria-label="Questions sidebar">
          <header className="questions-header">
            <h2>Questions</h2>
            <span className="count-badge">{questionList.length + (liveMode ? 0 : 21)}</span>
          </header>
          <div className="questions-panel" id="questions-panel">
            <div className="questions-list">
              {questionList.map((question) => (
                <article className={question.answered ? "question-card answered" : "question-card"} key={question.id}>
                  <div className="question-meta">
                    <span className={`avatar avatar-${String(question.id).charCodeAt(0) % 3}`}>
                      {question.initials}
                    </span>
                    <div>
                      <strong>{question.name}</strong>
                      <small>{question.time} ago</small>
                    </div>

                    {question.answered && (
                      <span className="question-answer-mark" role="img" aria-label="Answered verbally in class" title={question.answeredAt ? `Answered verbally · ${question.answeredAt}` : "Answered verbally in class"}>
                        <Icon name="check" size={15} />
                      </span>
                    )}
                  </div>
                  <p className="question-text" lang={"translation" in question && question.translation ? "en" : undefined}>
                    {"translation" in question && question.translation ? question.translation : question.text}
                  </p>
                  {"translation" in question && question.translation && (
                    <>
                    <div className="question-translation-info">
                      <span>
                        <Icon name="globe" size={13} />
                        Translated from {question.sourceLanguage}
                      </span>
                      <button
                        type="button"
                        aria-expanded={originalQuestions.includes(question.id)}
                        aria-controls={`question-original-${question.id}`}
                        onClick={() => setOriginalQuestions((current) => current.includes(question.id)
                          ? current.filter((id) => id !== question.id)
                          : [...current, question.id])}
                      >
                        {originalQuestions.includes(question.id) ? "Hide original" : "View original"}
                      </button>
                    </div>
                    {originalQuestions.includes(question.id) && (
                      <div className="translation question-original" id={`question-original-${question.id}`}>
                        <small>{question.sourceLanguage} · Original</small>
                        <p lang={question.sourceLanguage === "Chinese" ? "zh-CN" : undefined}>{question.text}</p>
                      </div>
                    )}
                    </>
                  )}
                  {question.tutorAnswer && <div className="question-tutor-answer"><strong>Tutor’s answer</strong><p>{question.tutorAnswer}</p></div>}
                  {question.sendError && <div className="class-send-note">Not sent · <button type="button" onClick={() => void retryQuestion(question)}>Retry sending</button></div>}
                  <div className="question-actions">
                    <button
                      onClick={() => void voteQuestion(question)}
                      aria-label="Upvote question"
                      type="button"
                    >
                      <span className="up-arrow" aria-hidden="true">↑</span> {question.votes}
                    </button>
                    <button type="button" aria-expanded={replyQuestion === question.id} aria-controls={`question-reply-${question.id}`} onClick={() => setReplyQuestion(current => current === question.id ? null : question.id)}>
                      <Icon name="bubble" size={14} /> Reply{questionReplies[question.id]?.length ? ` · ${questionReplies[question.id].length}` : ""}
                    </button>
                  <div className="question-context">
                    <button
                      className="question-slide-link"
                      onClick={() => goToPage(pageForSlide(question.slide))}
                      type="button"
                      aria-label={`Go to slide ${question.slide}`}
                      title={`Go to slide ${question.slide}`}
                    >
                      <Icon name="slide" size={13} />
                      <span>Slide {question.slide}</span>
                      <Icon name="chevron" size={11} />
                    </button>

                  </div>
                  </div>

                  {replyQuestion !== question.id && questionReplies[question.id]?.length > 0 && <div className="question-replies classroom-inline-replies">{questionReplies[question.id].map(reply => <div className="question-reply-message" key={reply.id}><small>{reply.name}</small><SharedText text={reply.text} english={reply.english} /></div>)}</div>}
                  {replyQuestion === question.id && (
                    <div className="question-reply-panel" id={`question-reply-${question.id}`}>
                      <div className="question-replies" aria-live="polite">
                        {(questionReplies[question.id] || []).map(reply => (
                          <div className="question-reply-message" key={reply.id}>
                            <small>{reply.name}</small>
                            <SharedText text={reply.text} english={reply.english} />
                          </div>
                        ))}
                      </div>
                      <form className="question-reply-composer" onSubmit={event => { event.preventDefault(); submitQuestionReply(question) }}>
                        <textarea
                          autoFocus
                          aria-label={`Reply to ${question.name}`}
                          placeholder={`Reply to ${question.name}…`}
                          value={replyDrafts[question.id] || ""}
                          onChange={event => setReplyDrafts(current => ({ ...current, [question.id]: event.target.value }))}
                          onKeyDown={event => {
                            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                              event.preventDefault()
                              event.currentTarget.form?.requestSubmit()
                            }
                            if (event.key === "Escape") setReplyQuestion(null)
                          }}
                          rows={1}
                        />
                        <button type="submit" aria-label="Send reply" title="Send reply" disabled={!(replyDrafts[question.id] || "").trim()}><Icon name="arrow" size={16} /></button>
                      </form>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="ask-composer glass">
              <textarea
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                    event.preventDefault()
                    void submitQuestion()
                  }
                }}
                placeholder={
                  questionLanguage === "zh" ? "用中文提问…" : "Ask a question…"
                }
                value={composer}
              />
              <div>
                <div className="composer-control-wrap">
                  <button
                    aria-haspopup="menu"
                    aria-expanded={identityMenuOpen}
                    className="identity-control"
                    onClick={() => {
                      setIdentityMenuOpen(!identityMenuOpen)
                      setLanguageMenuOpen(false)
                    }}
                    type="button"
                  >
                    <Icon name="person" size={14} />{" "}
                    {identity === "anonymous" ? "Anonymous" : studentName}{" "}
                    <span>⌄</span>
                  </button>
                  {identityMenuOpen && (
                    <ComposerMenu className="composer-menu identity-menu glass">
                      <div className="composer-menu-heading">
                        <strong>Ask as</strong>
                        <small>You can change this anytime</small>
                      </div>
                      <button
                        className={identity === "anonymous" ? "selected" : ""}
                        onClick={() => {
                          setIdentity("anonymous")
                          setIdentityMenuOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={identity === "anonymous"}
                        type="button"
                      >
                        <span className="menu-option-icon anonymous-option">
                          <Icon name="person" size={16} />
                        </span>
                        <span>
                          <strong>Anonymous</strong>
                          <small>Your name won’t be shown</small>
                        </span>
                        {identity === "anonymous" && (
                          <Icon name="check" size={13} />
                        )}
                      </button>
                      <button
                        className={identity === "named" ? "selected" : ""}
                        onClick={() => {
                          setIdentity("named")
                          setIdentityMenuOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={identity === "named"}
                        type="button"
                      >
                        <span className="menu-option-icon named-option">
                          {studentName.split(" ").map(part => part[0]).join("").slice(0,2)}
                        </span>
                        <span>
                          <strong>{studentName}</strong>
                          <small>Post with your name</small>
                        </span>
                        {identity === "named" && (
                          <Icon name="check" size={13} />
                        )}
                      </button>
                    </ComposerMenu>
                  )}
                </div>
                <div className="composer-control-wrap">
                  <button
                    aria-haspopup="menu"
                    aria-expanded={languageMenuOpen}
                    className="identity-control"
                    onClick={() => {
                      setLanguageMenuOpen(!languageMenuOpen)
                      setIdentityMenuOpen(false)
                    }}
                    type="button"
                  >
                    <Icon name="globe" size={14} />{" "}
                    {questionLanguage === "zh" ? "中文（简体）" : "English"}{" "}
                    <span>⌄</span>
                  </button>
                  {languageMenuOpen && (
                    <ComposerMenu className="composer-menu language-menu glass">
                      <div className="composer-menu-heading">
                        <strong>Question language</strong>
                        <small>Chinese is sent in its original language</small>
                      </div>
                      <button
                        className={questionLanguage === "zh" ? "selected" : ""}
                        onClick={() => {
                          setQuestionLanguage("zh")
                          setLanguageMenuOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={questionLanguage === "zh"}
                        type="button"
                      >
                        <span className="menu-option-icon language-option">
                          中
                        </span>
                        <span>
                          <strong>中文（简体）</strong>
                          <small>Chinese, Simplified</small>
                        </span>
                        {questionLanguage === "zh" && (
                          <Icon name="check" size={13} />
                        )}
                      </button>
                      <button
                        className={questionLanguage === "en" ? "selected" : ""}
                        onClick={() => {
                          setQuestionLanguage("en")
                          setLanguageMenuOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={questionLanguage === "en"}
                        type="button"
                      >
                        <span className="menu-option-icon language-option">
                          EN
                        </span>
                        <span>
                          <strong>English</strong>
                          <small>English</small>
                        </span>
                        {questionLanguage === "en" && (
                          <Icon name="check" size={13} />
                        )}
                      </button>
                    </ComposerMenu>
                  )}
                </div>
                <ActionButton
                  className="send"
                  onClick={submitQuestion}
                  title="Send question"
                >
                  <Icon name="arrow" size={16} />
                </ActionButton>
              </div>
            </div>
          </div>
        </aside>
      )}
    </main>
  )
}

export default function App() {
  const [activities, dispatchActivity] = useReducer(activityReducer, initialActivities)
  const room = useClassroom()
  const sharedActivities: LearningEntry[] | undefined = room.identity ? [...activities.map(activity => ({ id: `practice-${activity.id}`, kind: "Activity" as const, title: activityTemplates[activity.kind].title, detail: activity.submitted ? `Practice response · ${activityAnswer(activity)}` : "Practice activity · Explore at your own pace", slide: activity.page, week: room.session?.week || 6, completed: activity.submitted, image: activity.photo?.url })), ...room.activities.map(activity => {
    const own = room.responses.filter(row => row.activity_id === activity.id && row.payload.clientId === room.identity?.clientId)
    const photo = own.find(row => row.kind === "artefact")
    const questions = activity.spec?.questions || []
    const completed = activity.kind === "concept" ? questions.length > 0 && questions.every((_, q) => own.some(row => row.payload.q === q && ["choice", "rating", "open"].includes(row.kind))) : own.some(row => row.kind === activity.kind)
    return { id: activity.id, kind: "Activity" as const, title: activity.kind === "concept" ? "Concept check" : activity.kind === "reflection" ? activity.spec?.question || "Class reflection" : activity.kind === "discussion" ? "Discuss with your peers." : activity.kind === "artefact" ? "Your group artefact" : "Class Q&A", detail: completed ? "Your response · Sent to your tutor" : "Open this activity when your tutor makes it live.", slide: activity.slide || 1, week: room.session?.week || 6, completed, image: photo ? String(photo.payload.url || "") : undefined }
  })] : undefined
  let ownedQuestionIds: string[] = []
  try { ownedQuestionIds = JSON.parse(localStorage.getItem(`studio-bridge-questions:${room.identity?.clientId}`) || "[]") } catch { /* Optional history. */ }
  const restoredQuestions: LearningEntry[] = room.questions.filter(question => ownedQuestionIds.includes(question.id)).map(question => ({ id: `live-question-${question.id}`, kind: "Question", title: question.text_en || question.text, detail: question.status === "ans" ? "Your question · Answered in class" : "Your question · Shared in class", slide: question.slide || 1, week: room.session?.week || 6 }))
  const personalEntries: LearningEntry[] = room.identity ? room.responses.filter(row => row.payload.clientId === room.identity?.clientId && ["peer_reply", "qa_reply"].includes(row.kind)).map(row => ({ id: `live-response-${row.id}`, kind: "Response", title: String(row.payload.text || ""), detail: "Your reply · Shared in class", slide: room.activities.find(a => a.id === row.activity_id)?.slide || 1, week: room.session?.week || 6 })) : []
  const [section, setSection] = useState<Section>("live")
  const [questionsOpen, setQuestionsOpen] = useState(true)
  const [learningEntries, setLearningEntries] = useState(initialLearningEntries)
  const [reviewSlide, setReviewSlide] = useState<{page: number; request: number; activityId?: string} | null>(null)
  function reviewLearningSlide(page: number) { setReviewSlide({page: pageForSlide(page), request: Date.now()}); setSection("live") }
  function recordLearning(entry: LearningEntry) { setLearningEntries(current => [entry, ...current.filter(e => e.id !== entry.id)]) }
  const [toast, setToast] = useState("")
  const toastTimer = useMemo(() => ({ current: 0 }), [])
  function notify(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(""), 2600)
  }
  return (
    <div className="desktop">
      <div className="app-window">
        <Sidebar section={section} setSection={setSection} />
        <div className="app-main">
          {section === "live" && (
            <button
              className="floating-panel-toggle"
              type="button"
              aria-label={questionsOpen ? "Hide questions sidebar" : "Show questions sidebar"}
              aria-expanded={questionsOpen}
              aria-controls="live-questions"
              title={questionsOpen ? "Hide questions" : "Show questions"}
              onClick={() => setQuestionsOpen(current => !current)}
            >
              <BulbIcon size={24} />
            </button>
          )}
          <div className="live-view-container" hidden={section !== "live"}>
            <LiveView active={section === "live"} notify={notify} questionsOpen={questionsOpen} onLearningEntry={recordLearning} reviewSlide={reviewSlide} activities={activities} dispatchActivity={dispatchActivity} />
          </div>
          <div className="learning-view-container" hidden={section !== "learning"}>
            <MyLearning activities={room.identity ? [] : activities} sharedActivities={sharedActivities} onReviewActivity={(activityId, page) => { setReviewSlide({page: /^(practice|activity)-/.test(activityId) ? page : pageForSlide(page), activityId: /^(practice|activity)-/.test(activityId) ? undefined : activityId, request: Date.now()}); setSection("live") }} entries={room.identity ? [...restoredQuestions, ...personalEntries, ...learningEntries.filter(entry => (entry.id.startsWith("live-question") || entry.id.startsWith("live-response")) && ![...personalEntries, ...restoredQuestions].some(p => p.id === entry.id))] : learningEntries} onReviewSlide={reviewLearningSlide}
              onShareReflection={room.state.activityId && room.activities.find(a => a.id === room.state.activityId)?.kind === "reflection" ? async text => {
                const result = await room.api.submitResponse({ activityId: room.state.activityId!, kind: "reflection", payload: { text, lang: /[\u3400-\u9fff]/.test(text) ? "zh" : "en" } })
                return result.error || "Reflection sent to your tutor ✓"
              } : undefined} />
          </div>
        </div>
      </div>
      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" size={14} />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
