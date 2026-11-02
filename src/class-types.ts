export type ClassIdentity = {
  code: string
  name: string
  anonymous: boolean
  clientId: string
}
export type ClassState = {
  slide?: number
  activityId?: string | null
  activityKind?: string | null
  updatedAt?: string
  /* the tutor's live caption: English, with a Chinese translation */
  caption?: { en: string; zh?: string; src?: string; lang?: string; at?: string }
  /* the question the tutor has on the screen during a Q&A */
  qaQuestion?: string | null
}
export type ConceptQuestion = {
  level?: string
  label?: string
  type: "mc" | "scale" | "open"
  text: string
  options?: {
    t: string
    ok?: boolean
  }[]
  lo?: string
  hi?: string
  hint?: string
}
export type TutorActivity = {
  id: string
  session: string
  kind: "concept" | "qa" | "discussion" | "artefact" | "reflection"
  slide: number | null
  spec: {
    questions?: ConceptQuestion[]
    question?: string
    hint?: string
  }
}
export type ClassRow = {
  code: string
  unit: string | null
  week: number | null
  state: ClassState
}
export type QuestionRow = {
  id: string
  session: string
  student: string | null
  anonymous: boolean
  text: string
  text_en: string | null
  lang: string | null
  slide: number | null
  upvotes: number
  status: "open" | "ans"
  answer: string | null
  created_at: string
}
export type ResponseRow = {
  id: string
  session: string
  activity_id: string
  kind: string
  student: string | null
  team: string | null
  payload: Record<string, unknown>
  created_at: string
}
export type ReactionKind = "got" | "think" | "confused" | "insight" | "applause"
export type ReactionRow = {
  id: number
  session: string
  kind: ReactionKind
  student: string | null
  created_at: string
}
