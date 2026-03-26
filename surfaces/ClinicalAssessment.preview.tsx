import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const QUESTIONS = [
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

const FREQ = ['Not at all', 'Several days', 'More than half', 'Nearly every day']

function getSeverity(score: number) {
  if (score <= 4)  return { label: 'Minimal',     cls: 'bg-success/10 text-success border-success/30' }
  if (score <= 9)  return { label: 'Mild',         cls: 'bg-muted text-muted-foreground border-border' }
  if (score <= 14) return { label: 'Moderate',     cls: 'bg-amber-100 text-amber-700 border-amber-300' }
  if (score <= 19) return { label: 'Mod. Severe',  cls: 'bg-orange-100 text-orange-700 border-orange-300' }
  return                   { label: 'Severe',       cls: 'bg-destructive/10 text-destructive border-destructive/30' }
}

export default function ClinicalAssessmentPreview() {
  const [instrument, setInstrument] = useState('phq9')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = Object.values(answers).reduce((a, b) => a + b, 0)
  const answered = Object.keys(answers).length
  const safetyFlagged = (answers['q9'] ?? 0) > 0
  const severity = getSeverity(score)
  const allAnswered = answered === QUESTIONS.length

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <p className="font-semibold text-foreground">Assessment recorded</p>
        <div className={cn('text-sm font-semibold px-3 py-1 rounded-full border', severity.cls)}>
          PHQ-9 Score: {score} — {severity.label}
        </div>
        <Button size="sm" variant="outline" onClick={() => { setAnswers({}); setSubmitted(false) }}>
          New assessment
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-sm">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Select value={instrument} onValueChange={setInstrument}>
            <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="phq9">PHQ-9</SelectItem>
              <SelectItem value="gad7">GAD-7</SelectItem>
              <SelectItem value="sdoh">AHC-HRSN</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Taylor, James · 9 questions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{answered}/9</span>
          {answered > 0 && (
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', severity.cls)}>
              {score} — {severity.label}
            </span>
          )}
        </div>
      </div>

      <Progress value={(answered / QUESTIONS.length) * 100} className="h-1" />

      {safetyFlagged && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Safety concern flagged (Q9)</p>
            <p className="text-xs text-destructive/80 mt-0.5">Patient indicated thoughts of self-harm. Follow clinical safety protocol before proceeding.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid bg-muted/30 border-b border-border" style={{ gridTemplateColumns: '1fr repeat(4, 80px)' }}>
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">Over the last 2 weeks, how often have you been bothered by…</div>
          {FREQ.map((f) => (
            <div key={f} className="px-1 py-2 text-center text-xs font-semibold text-muted-foreground leading-tight">{f}</div>
          ))}
        </div>
        {QUESTIONS.map((q, i) => (
          <div key={q.id}
            className={cn(
              'grid border-b border-border last:border-b-0',
              q.isSafety && answers[q.id] && answers[q.id] > 0 ? 'bg-destructive/5' : i % 2 === 0 ? 'bg-card' : 'bg-muted/10'
            )}
            style={{ gridTemplateColumns: '1fr repeat(4, 80px)' }}>
            <div className="px-4 py-2.5 text-sm flex items-center gap-2">
              {q.isSafety && <span className="text-xs text-muted-foreground font-mono shrink-0">Q9</span>}
              <span className={cn(q.isSafety && 'font-medium')}>{q.text}</span>
            </div>
            {[0, 1, 2, 3].map((val) => (
              <div key={val} className="flex items-center justify-center py-2.5">
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
        <Button variant="outline" size="sm" onClick={() => setAnswers({})}>Clear</Button>
        <Button size="sm" disabled={!allAnswered} onClick={() => setSubmitted(true)}>Record Assessment</Button>
      </div>
    </div>
  )
}
