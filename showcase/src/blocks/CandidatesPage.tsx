import React, { useState } from 'react'
import _candidatesData from 'virtual:candidates'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Fixture } from '@/components/Fixture'
import {
  CheckCircle2,
  Circle,
  Phone,
  MessageSquare,
  AlertTriangle,
  Clock,
  Play,
  Home,
  Truck,
  DollarSign,
  Users,
  Utensils,
  FileText,
  BotMessageSquare,
  Wifi,
  Battery,
  Signal,
  Loader2,
} from 'lucide-react'

// ── Candidate data ───────────────────────────────────────────────────────────

export interface Candidate {
  candidate_id: string
  pattern_name: string
  status: 'logged' | 'ratified'
  frequency_count: number
  description: string
  intent_it_serves: string
  why_existing_patterns_didnt_fit: string
  implementation_ref: string
  ontology_refs: string[]
  similar_candidates: string[]
}

export const CANDIDATES: Candidate[] = _candidatesData as Candidate[]


// ── Preview renders ──────────────────────────────────────────────────────────

function OutreachLogRowPreview() {
  const [filter, setFilter] = useState('All')
  const rows = [
    { initials: 'TJ', name: 'Taylor, James', gap: 'HbA1c Screening', type: 'Phone Call', Icon: Phone, outcome: 'Reached', outcomeClass: 'text-success', coordinator: 'M. Rivera', time: '2h ago', warn: false },
    { initials: 'LP', name: 'Lopes, Patricia', gap: 'Annual Wellness', type: 'Portal Message', Icon: MessageSquare, outcome: 'No Answer', outcomeClass: 'text-amber-500', coordinator: 'M. Rivera', time: '3h ago', warn: true },
    { initials: 'KC', name: 'Kim, Christine', gap: 'Diabetes Mgmt', type: 'Phone Call', Icon: Phone, outcome: 'Left Voicemail', outcomeClass: 'text-muted-foreground', coordinator: 'M. Rivera', time: '5h ago', warn: false },
    { initials: 'RW', name: 'Wallace, Raymond', gap: 'Colorectal Screen', type: 'Letter', Icon: FileText, outcome: 'Sent', outcomeClass: 'text-muted-foreground', coordinator: 'T. Chen', time: '6h ago', warn: false },
  ]
  const visible = filter === 'All' ? rows : rows.filter((r) =>
    filter === 'Phone' ? r.type === 'Phone Call' :
    filter === 'Portal' ? r.type === 'Portal Message' :
    r.type === 'Letter'
  )
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Today's Outreach</span>
          <span className="text-success font-medium">1 reached</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-amber-500 font-medium">1 no-answer</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">1 voicemail</span>
        </div>
        <div className="flex gap-1">
          {['All', 'Phone', 'Portal', 'Letter'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-2 py-0.5 rounded-full border text-xs transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              )}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {visible.map((r, i) => (
        <div key={i} className={cn(
          'flex items-center gap-3 px-4 py-3 bg-card border-b border-border last:border-b-0',
          r.warn && 'border-l-2 border-l-amber-400 pl-[14px]'
        )}>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{r.initials}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.gap}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <r.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{r.type}</span>
          </div>
          <span className={cn('text-xs font-medium shrink-0', r.outcomeClass)}>{r.outcome}</span>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            <p>{r.coordinator}</p>
            <p>{r.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ChatQuickActionChipPreview() {
  const [triggered, setTriggered] = useState<string | null>(null)
  const chips = ['Next patient', 'Last outreach', 'Open tasks', 'Recent labs']
  return (
    <div className="rounded-lg border border-border overflow-hidden flex flex-col bg-muted/20" style={{ height: 340 }}>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex justify-start">
          <div className="max-w-[75%] bg-card border border-border rounded-xl px-3 py-2 text-sm">
            Good morning! I can help you prioritize today's outreach. Tap a chip below to get started.
          </div>
        </div>
        {triggered && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-card border border-border rounded-xl px-3 py-2 text-sm space-y-2">
              <p>Here's the next priority patient for you:</p>
              <div className="rounded-xl border border-border shadow-sm bg-background">
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border">
                  <div className="h-8 w-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">TJ</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Taylor, James</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                      High risk · 3 open gaps
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 text-xs">
                  <p className="text-muted-foreground font-medium uppercase tracking-wider mb-1">Next up</p>
                  <p className="font-medium">HbA1c Screening</p>
                  <p className="text-muted-foreground">Due Mar 25 · In outreach</p>
                </div>
                <div className="px-3 py-2 border-t border-border flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Start outreach — overdue 90 days
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border bg-card px-3 pt-2 pb-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button key={chip} onClick={() => setTriggered(chip)}
              className={cn(
                'px-3 py-1 rounded-full border text-xs transition-colors',
                triggered === chip
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-border/70 hover:border-primary/50 shadow-sm text-foreground'
              )}>
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Message…" className="h-8 text-sm" readOnly />
          <Button size="sm" className="h-8 px-3 shrink-0" disabled>Send</Button>
        </div>
      </div>
    </div>
  )
}

function InlineNextPatientCardPreview() {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm">
          Who should I call next?
        </div>
      </div>
      <div className="flex justify-start gap-2">
        <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-1">
          <BotMessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="max-w-[80%] bg-card border border-border rounded-xl px-3 py-2.5 text-sm space-y-2.5">
          <p>Based on risk tier and open items, your next patient is:</p>
          <div className="rounded-xl border border-border shadow-sm bg-background overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border">
              <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold shrink-0">TJ</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Taylor, James</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  <span>High risk</span>
                  <span className="text-border">·</span>
                  <span>3 open care gaps</span>
                </div>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Next up</p>
              <p className="text-sm font-medium text-foreground">HbA1c Screening</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">Due Mar 25</span>
                <span className="inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">In outreach</span>
              </div>
            </div>
            <div className="px-3 py-2 border-t border-border flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Start outreach — overdue 90 days
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Want me to draft an outreach message?</p>
        </div>
      </div>
    </div>
  )
}

const SDOH_DOMAINS = [
  { id: 'housing', label: 'Housing', Icon: Home, question: 'In the past 12 months, have you been worried about losing your housing?' },
  { id: 'food', label: 'Food Security', Icon: Utensils, question: 'In the past 12 months, did you worry that your food would run out before you got money to buy more?' },
  { id: 'transport', label: 'Transportation', Icon: Truck, question: 'In the past 12 months, has lack of reliable transportation kept you from medical appointments or the pharmacy?' },
  { id: 'social', label: 'Social Isolation', Icon: Users, question: 'How often do you feel lonely or isolated from those around you?' },
  { id: 'financial', label: 'Financial Strain', Icon: DollarSign, question: 'How hard is it for you to pay for the very basics like food, housing, medical care, and heating?' },
]

const SDOH_OPTIONS = [
  { value: '0', label: 'Never' },
  { value: '1', label: 'Rarely' },
  { value: '2', label: 'Sometimes' },
  { value: '3', label: 'Often' },
  { value: '4', label: 'Always' },
]

function SdohAssessmentTabPreview() {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  function setAnswer(id: string, val: string) {
    setAnswers((prev) => ({ ...prev, [id]: val }))
  }

  const flagged = SDOH_DOMAINS.filter((d) => parseInt(answers[d.id] ?? '0') >= 2)
  const cleared = SDOH_DOMAINS.filter((d) => answers[d.id] !== undefined && parseInt(answers[d.id]) < 2)
  const unscreened = SDOH_DOMAINS.filter((d) => answers[d.id] === undefined)

  return (
    <Tabs defaultValue="screening">
      <TabsList className="mb-4">
        <TabsTrigger value="screening">Screening</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>
      <TabsContent value="screening" className="space-y-4 mt-0">
        {SDOH_DOMAINS.map((domain) => (
          <div key={domain.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <domain.Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{domain.label}</span>
            </div>
            <p className="text-sm text-foreground">{domain.question}</p>
            <RadioGroup value={answers[domain.id] ?? ''} onValueChange={(v) => setAnswer(domain.id, v)}
              className="flex flex-wrap gap-x-4 gap-y-2">
              {SDOH_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={opt.value} id={`${domain.id}-${opt.value}`} />
                  <Label htmlFor={`${domain.id}-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
        <div className="flex justify-end">
          <Button disabled={Object.keys(answers).length < SDOH_DOMAINS.length}>View Results</Button>
        </div>
      </TabsContent>
      <TabsContent value="results" className="space-y-3 mt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {flagged.length > 0
            ? `${flagged.length} domain${flagged.length > 1 ? 's' : ''} flagged — review and create follow-up tasks.`
            : 'No needs identified across all domains.'}
        </p>
        {SDOH_DOMAINS.map((domain) => {
          const isFlagged = flagged.includes(domain)
          const isCleared = cleared.includes(domain)
          return (
            <div key={domain.id} className={cn(
              'rounded-lg border px-4 py-3 flex items-center justify-between gap-3',
              isFlagged ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border bg-card'
            )}>
              <div className="flex items-center gap-2.5">
                <domain.Icon className={cn('h-4 w-4', isFlagged ? 'text-amber-600' : 'text-muted-foreground')} />
                <span className="text-sm font-medium">{domain.label}</span>
                {isFlagged && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Need identified</span>}
                {isCleared && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30">Clear</span>}
                {unscreened.includes(domain) && <span className="text-xs text-muted-foreground">Not screened</span>}
              </div>
              {isFlagged && <Button size="sm" variant="outline" className="shrink-0 text-xs h-7">Create Task</Button>}
            </div>
          )
        })}
      </TabsContent>
    </Tabs>
  )
}

function MobileChatDrawerPreview() {
  const messages = [
    { dir: 'out', text: "Hi James, this is Maria from Riverside Clinic. We wanted to check in on your HbA1c screening — it's been a while since your last visit." },
    { dir: 'in', text: "Oh hi, yes I've been meaning to schedule that. Things have been busy." },
    { dir: 'out', text: 'Totally understand! We have openings this week. Would Thursday afternoon work for you?' },
    { dir: 'in', text: 'Thursday works. What time?' },
    { dir: 'out', text: 'We have 2pm or 4pm available. Which do you prefer?' },
  ]
  return (
    <div className="flex justify-center">
      <div className="w-64 rounded-[2rem] border-[3px] border-foreground/20 bg-background shadow-lg overflow-hidden" style={{ height: 480 }}>
        <div className="bg-muted/60 px-4 py-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3 text-foreground" />
            <Wifi className="h-3 w-3 text-foreground" />
            <Battery className="h-3.5 w-3.5 text-foreground" />
          </div>
        </div>
        <div className="bg-card border-b border-border px-3 py-2 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">TJ</div>
          <div>
            <p className="text-xs font-semibold leading-tight">Taylor, James</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Portal Message</p>
          </div>
        </div>
        <div className="overflow-y-auto px-3 py-3 space-y-2 bg-background" style={{ height: 360 }}>
          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.dir === 'out' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[80%] rounded-xl px-2.5 py-1.5 text-[11px] leading-snug',
                m.dir === 'out' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              )}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-card px-3 py-2">
          <div className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
            Read-only view · sent via portal
          </div>
        </div>
      </div>
    </div>
  )
}

function IntakeFormPreview() {
  const [submitted, setSubmitted] = useState(false)
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <p className="font-semibold text-foreground">Outreach logged</p>
        <p className="text-sm text-muted-foreground">Record saved for Taylor, James</p>
        <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>Log another</Button>
      </div>
    )
  }
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="font-semibold text-foreground">Patient identity</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Last name</Label>
            <Input defaultValue="Taylor" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">First name</Label>
            <Input defaultValue="James" className="h-8 text-sm" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">MRN</Label>
            <Input defaultValue="MRN-00421" className="h-8 text-sm" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="font-semibold text-foreground">Outreach details</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select defaultValue="phone">
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="portal">Portal Message</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Outcome</Label>
            <Select defaultValue="reached">
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reached">Reached</SelectItem>
                <SelectItem value="voicemail">Left Voicemail</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Related gap / task</Label>
            <Select defaultValue="hba1c">
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hba1c">HbA1c Screening</SelectItem>
                <SelectItem value="wellness">Annual Wellness Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="font-semibold text-foreground">Log details</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Coordinator</Label>
              <Input defaultValue="M. Rivera" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date &amp; time</Label>
              <Input type="datetime-local" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Patient confirmed appointment for Thursday 2pm…" className="text-sm resize-none" rows={2} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <Button variant="outline" size="sm">Discard</Button>
        <Button size="sm" onClick={() => setSubmitted(true)}>Log outreach</Button>
      </div>
    </div>
  )
}

const PHQ9_QUESTIONS = [
  { id: 'q1', text: 'Little interest or pleasure in doing things' },
  { id: 'q2', text: 'Feeling down, depressed, or hopeless' },
  { id: 'q3', text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 'q4', text: 'Feeling tired or having little energy' },
  { id: 'q5', text: 'Poor appetite or overeating' },
  { id: 'q6', text: 'Feeling bad about yourself — or that you are a failure' },
  { id: 'q7', text: 'Trouble concentrating on things, such as reading or watching TV' },
  { id: 'q8', text: 'Moving or speaking so slowly that other people could notice' },
  { id: 'q9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', isSafety: true },
]

const PHQ9_COLS = ['Not at all', 'Several days', 'More than half', 'Nearly every day']

function getSeverity(score: number) {
  if (score <= 4) return { label: 'Minimal', cls: 'bg-success/10 text-success border-success/30' }
  if (score <= 9) return { label: 'Mild', cls: 'bg-accent text-accent-foreground border-accent-foreground/20' }
  if (score <= 14) return { label: 'Moderate', cls: 'bg-amber-100 text-amber-700 border-amber-300' }
  if (score <= 19) return { label: 'Mod. Severe', cls: 'bg-orange-100 text-orange-700 border-orange-300' }
  return { label: 'Severe', cls: 'bg-destructive/10 text-destructive border-destructive/30' }
}

function ClinicalAssessmentFormPreview() {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const score = Object.values(answers).reduce((a, b) => a + b, 0)
  const answered = Object.keys(answers).length
  const safetyFlagged = (answers['q9'] ?? 0) > 0
  const severity = getSeverity(score)

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-semibold text-foreground">PHQ-9 Depression Scale</p>
          <p className="text-xs text-muted-foreground">Patient Health Questionnaire · 9 questions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{answered}/9 answered</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">{score}</span>
            {answered > 0 && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', severity.cls)}>
                {severity.label}
              </span>
            )}
          </div>
        </div>
      </div>
      <Progress value={(answered / 9) * 100} className="h-1" />
      {safetyFlagged && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive text-sm">Safety concern flagged (Q9)</p>
            <p className="text-xs text-destructive/80 mt-0.5">Patient indicated thoughts of self-harm. Follow clinical safety protocol before proceeding.</p>
          </div>
        </div>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid bg-muted/30 border-b border-border" style={{ gridTemplateColumns: '1fr repeat(4, 90px)' }}>
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">Over the last 2 weeks, how often have you been bothered by…</div>
          {PHQ9_COLS.map((col) => (
            <div key={col} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground leading-tight">{col}</div>
          ))}
        </div>
        {PHQ9_QUESTIONS.map((q, i) => (
          <div key={q.id}
            className={cn('grid border-b border-border last:border-b-0',
              q.isSafety && answers[q.id] && answers[q.id] > 0 ? 'bg-destructive/5' : i % 2 === 0 ? 'bg-card' : 'bg-muted/10'
            )}
            style={{ gridTemplateColumns: '1fr repeat(4, 90px)' }}>
            <div className="px-4 py-3 text-sm flex items-center gap-2">
              {q.isSafety && <span className="text-xs text-muted-foreground font-mono shrink-0">Q9</span>}
              <span className={cn(q.isSafety && 'font-medium')}>{q.text}</span>
            </div>
            {[0, 1, 2, 3].map((val) => (
              <div key={val} className="flex items-center justify-center py-3">
                <button
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-colors flex items-center justify-center',
                    answers[q.id] === val
                      ? q.isSafety && val > 0
                        ? 'border-destructive bg-destructive'
                        : 'border-primary bg-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {answers[q.id] === val && <span className="h-2 w-2 rounded-full bg-white" />}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <Button variant="outline" size="sm">Save draft</Button>
        <Button size="sm" disabled={answered < 9}>Submit assessment</Button>
      </div>
    </div>
  )
}

const INSTRUMENTS = [
  { code: 'PHQ-9', name: 'Patient Health Questionnaire-9', domain: 'Depression', minutes: 5, questions: 9, lastDone: 'Mar 1, 2026', available: true },
  { code: 'GAD-7', name: 'Generalized Anxiety Disorder-7', domain: 'Anxiety', minutes: 3, questions: 7, lastDone: 'Jan 15, 2026', available: true },
  { code: 'AHC-HRSN', name: 'Accountable Health Communities HRSN Screening Tool', domain: 'SDOH', minutes: 10, questions: 22, lastDone: null, available: true },
  { code: 'AUDIT-C', name: 'Alcohol Use Disorders Identification Test-C', domain: 'Substance Use', minutes: 2, questions: 3, lastDone: null, available: true },
  { code: 'PC-PTSD-5', name: 'Primary Care PTSD Screen for DSM-5', domain: 'Trauma', minutes: 3, questions: 5, lastDone: null, available: false },
  { code: 'CAGE-AID', name: 'CAGE Adapted to Include Drugs', domain: 'Substance Use', minutes: 3, questions: 4, lastDone: null, available: false },
]

function AssessmentInstrumentListPreview() {
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
        <p className="font-semibold text-foreground">Screening Instruments</p>
        <p className="text-xs text-muted-foreground mt-0.5">Taylor, James · 4 available</p>
      </div>
      {INSTRUMENTS.map((inst) => (
        <div key={inst.code} className={cn(
          'flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-colors',
          inst.available
            ? 'bg-card hover:bg-muted/60 border-l-2 border-l-transparent hover:border-l-primary'
            : 'bg-muted/20 opacity-60'
        )}>
          <div className="shrink-0">
            <span className="inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted border border-border text-foreground">
              {inst.code}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium truncate', !inst.available && 'text-muted-foreground')}>{inst.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{inst.domain}</span>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{inst.minutes} min</span>
              <span>·</span>
              <span>{inst.questions} questions</span>
              {inst.lastDone && (
                <>
                  <span>·</span>
                  <span className="text-success">Last: {inst.lastDone}</span>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {inst.available ? (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <Play className="h-3 w-3" />
                Start
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground italic">Coming soon</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Auto-discover previews written alongside candidate YAML files (.preview.tsx)
const _discoveredPreviews = import.meta.glob(
  '../../../blocks/_candidates/*.preview.tsx',
  { eager: true }
) as Record<string, { default: React.FC }>

const _discoveredPreviewMap: Partial<Record<string, React.FC>> = Object.fromEntries(
  Object.entries(_discoveredPreviews)
    .map(([path, mod]) => {
      const id = path.match(/([^/]+)\.preview\.tsx$/)?.[1] ?? ''
      return [id, mod.default] as [string, React.FC]
    })
    .filter(([id]) => !!id)
)

// Hardcoded previews for candidates that pre-date auto-discovery.
// Discovered .preview.tsx files take precedence if both exist for the same id.
const PREVIEW_MAP: Partial<Record<string, React.FC>> = {
  '2026-03-20T11-39-52-sdohassessmenttab': SdohAssessmentTabPreview,
  '2026-03-20T11-50-13-outreachlogrow': OutreachLogRowPreview,
  '2026-03-20T11-53-02-chatquickactionchip': ChatQuickActionChipPreview,
  '2026-03-20T11-56-47-inlinenextpatientcard': InlineNextPatientCardPreview,
  '2026-03-20T12-07-28-mobilechatdrawer': MobileChatDrawerPreview,
  '2026-03-20T18-46-17-intakeform': IntakeFormPreview,
  '2026-03-20T20-18-25-clinicalassessmentform': ClinicalAssessmentFormPreview,
  '2026-03-20T20-50-58-assessmentinstrumentlist': AssessmentInstrumentListPreview,
  ..._discoveredPreviewMap,
}

// ── Ratification dialog ──────────────────────────────────────────────────────

const RATIFY_STEPS = [
  'Review the description and intent',
  'Check similar_candidates — merge if duplicate',
  'Create blocks/{PatternName}/ with meta.yaml and component.tsx',
]

type SeedStatus = 'idle' | 'pending' | 'ok' | 'error'

function RatifyDialog({
  candidate,
  open,
  onOpenChange,
  onConfirm,
}: {
  candidate: Candidate
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState<boolean[]>(RATIFY_STEPS.map(() => false))
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle')
  const [seedMeta, setSeedMeta] = useState<{ patterns?: number; rules?: number } | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)

  // Reset state each time the dialog opens
  React.useEffect(() => {
    if (open) {
      setChecked(RATIFY_STEPS.map(() => false))
      setSeedStatus('idle')
      setSeedMeta(null)
      setSeedError(null)
    }
  }, [open])

  const allChecked = checked.every(Boolean)

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  async function handleConfirm() {
    setSeedStatus('pending')
    try {
      const res = await fetch('/seed', { method: 'POST' })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const data = await res.json()
      setSeedMeta(data)
      setSeedStatus('ok')
      onConfirm()
      setTimeout(() => onOpenChange(false), 1200)
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : 'Unknown error')
      setSeedStatus('error')
      // Ratification still succeeds — seed is best-effort
      onConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={seedStatus === 'pending' ? undefined : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ratify {candidate.pattern_name}</DialogTitle>
          <DialogDescription>
            Complete each step, then confirm to promote this candidate and re-index the genome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {RATIFY_STEPS.map((step, i) => (
            <button key={i} onClick={() => toggle(i)} className="flex items-start gap-3 w-full text-left group"
              disabled={seedStatus === 'pending'}>
              {checked[i] ? (
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-foreground transition-colors" />
              )}
              <span className={cn('text-sm leading-snug transition-colors', checked[i] ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {step}
              </span>
            </button>
          ))}

          {/* Seed step — automatic */}
          <div className="flex items-start gap-3">
            {seedStatus === 'pending' && <Loader2 className="h-5 w-5 text-primary mt-0.5 shrink-0 animate-spin" />}
            {seedStatus === 'ok'      && <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />}
            {seedStatus === 'error'   && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />}
            {seedStatus === 'idle'    && <Circle className="h-5 w-5 text-muted-foreground/40 mt-0.5 shrink-0" />}
            <div className="space-y-1">
              <span className={cn('text-sm leading-snug',
                seedStatus === 'idle'    && 'text-muted-foreground/50',
                seedStatus === 'pending' && 'text-foreground',
                seedStatus === 'ok'      && 'text-muted-foreground line-through',
                seedStatus === 'error'   && 'text-foreground',
              )}>
                {seedStatus === 'pending' ? 'Re-indexing genome…' :
                 seedStatus === 'ok'      ? `Re-indexed · ${seedMeta?.patterns ?? '?'} patterns, ${seedMeta?.rules ?? '?'} rules` :
                 seedStatus === 'error'   ? 'Seed failed — run manually' :
                 'Re-index genome  (automatic)'}
              </span>
              {seedStatus === 'error' && (
                <div className="rounded border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 dark:bg-amber-950/20 dark:border-amber-700">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-1">{seedError}</p>
                  <code className="text-xs font-mono text-amber-800 dark:text-amber-300">node server/src/seed.js</code>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            disabled={seedStatus === 'pending'}>
            {seedStatus === 'error' ? 'Close' : 'Cancel'}
          </Button>
          <Button
            disabled={!allChecked || seedStatus === 'pending' || seedStatus === 'ok'}
            onClick={handleConfirm}
          >
            {seedStatus === 'pending' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Re-indexing…</>
            ) : 'Mark as Ratified'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function CandidateStatusBadge({ status }: { status: Candidate['status'] }) {
  return (
    <Badge badgeColor={status === 'ratified' ? 'green' : 'grey'} badgeStyle="subtle" className={cn(
      'text-xs font-semibold capitalize',
    )}>
      {status === 'ratified' ? '✓ ratified' : 'logged'}
    </Badge>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-4 text-sm">
      <span className="text-muted-foreground font-medium pt-0.5 shrink-0">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  )
}

// ── CandidateDetailPane (exported) ───────────────────────────────────────────

export function CandidateDetailPane({
  candidateId,
  isRatified,
  onRatify,
}: {
  candidateId: string
  isRatified: boolean
  onRatify: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const candidate = CANDIDATES.find((c) => c.candidate_id === candidateId)
  if (!candidate) return null

  const PreviewComponent = PREVIEW_MAP[candidateId]
  const effectiveStatus = isRatified ? 'ratified' : candidate.status

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">{candidate.pattern_name}</h1>
            <CandidateStatusBadge status={effectiveStatus} />
            <span className="text-sm font-mono text-muted-foreground">freq {candidate.frequency_count}</span>
          </div>
          {!isRatified && (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
              Ratify
            </Button>
          )}
        </div>
        <p className="text-base text-muted-foreground max-w-prose">{candidate.description}</p>
      </div>

      {/* Preview */}
      <div className="mb-8">
        <Fixture label="Preview">
          {PreviewComponent
            ? <PreviewComponent />
            : <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No preview — add a <code className="mx-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">.preview.tsx</code> alongside the candidate YAML.</div>
          }
        </Fixture>
      </div>

      {/* Meta details */}
      <div className="space-y-3">
        <MetaRow label="Intent">{candidate.intent_it_serves}</MetaRow>
        <MetaRow label="Gap analysis">{candidate.why_existing_patterns_didnt_fit}</MetaRow>
        <MetaRow label="Impl. ref">
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{candidate.implementation_ref}</code>
        </MetaRow>
        <MetaRow label="Ontology refs">
          <span className="flex flex-wrap gap-1">
            {candidate.ontology_refs.map((ref) => (
              <Badge key={ref} badgeColor="grey" badgeStyle="subtle" className="text-xs font-normal">{ref}</Badge>
            ))}
          </span>
        </MetaRow>
        <MetaRow label="Candidate ID">
          <span className="text-xs font-mono text-muted-foreground">{candidate.candidate_id}</span>
        </MetaRow>
      </div>

      <RatifyDialog
        candidate={candidate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={onRatify}
      />
    </div>
  )
}
