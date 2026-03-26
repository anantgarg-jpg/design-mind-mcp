import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function IntakeFormPreview() {
  const [submitted, setSubmitted] = useState(false)
  const [method, setMethod] = useState('')
  const [outcome, setOutcome] = useState('')

  const canSubmit = method && outcome

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <p className="font-semibold text-foreground">Outreach logged</p>
        <p className="text-sm text-muted-foreground">Record saved for Taylor, James</p>
        <Button size="sm" variant="outline" onClick={() => { setSubmitted(false); setMethod(''); setOutcome('') }}>
          Log another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-sm">

      {/* Patient identity */}
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
          <div className="space-y-1">
            <Label className="text-xs">MRN</Label>
            <Input defaultValue="400-291" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Related care gap</Label>
            <Select defaultValue="hba1c">
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hba1c">HbA1c Screening</SelectItem>
                <SelectItem value="wellness">Annual Wellness Visit</SelectItem>
                <SelectItem value="colorectal">Colorectal Screen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Outreach details */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="font-semibold text-foreground">Outreach details</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Method <span className="text-destructive">*</span></Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="portal">Portal Message</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Outcome <span className="text-destructive">*</span></Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reached">Reached</SelectItem>
                <SelectItem value="voicemail">Left Voicemail</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Coordinator</Label>
            <Input defaultValue="M. Rivera" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date &amp; time</Label>
            <Input type="datetime-local" className="h-8 text-sm" />
          </div>
        </div>
        <div className="px-4 pb-4 space-y-1">
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Patient confirmed appointment for Thursday 2pm…" className="text-sm resize-none" rows={2} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => { setMethod(''); setOutcome('') }}>Clear</Button>
        <Button size="sm" disabled={!canSubmit} onClick={() => setSubmitted(true)}>Log Outreach</Button>
      </div>
    </div>
  )
}
