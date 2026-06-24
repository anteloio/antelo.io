import { useEffect, useRef, useState, useTransition } from "react"
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query"
import { Toaster, toast } from "react-hot-toast"
import { authClient } from "../lib/auth-client"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: number
  name: string
  hourlyRate: number | null
}

interface Location {
  id: number
  name: string
}

interface State {
  projects: Project[]
  entries: Record<string, number>
  locations: Location[]
  dayLocations: Record<string, number>
}

interface WeekNav {
  weekDates: string[]
  startStr: string
  prevStart: string
  nextStart: string
  thisStart: string
  weekLabel: string
  todayStr: string
}

type Modal =
  | { type: "entry"; projectId: number; projectName: string; date: string; label: string }
  | { type: "manage-projects" }
  | { type: "manage-locations" }
  | { type: "set-location"; date: string; label: string }
  | { type: "confirm"; message: string; onConfirm: () => void }
  | null

export interface TimesheetProps {
  weekDates: string[]
  startStr: string
  todayStr: string
  prevStart: string
  nextStart: string
  thisStart: string
  weekLabel: string
  userEmail: string
  projects: Project[]
  entries: Array<{ projectId: number; date: string; hours: number }>
  entryCounts: Record<string, number>
  locations: Location[]
  dayLocations: Array<{ date: string; locationId: number }>
  locationCounts: Record<string, number>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtH = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1))
const fmtM = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v)

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const monthDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
const currentYear = new Date().getFullYear()
const dateLabel = (ds: string) => {
  const d = new Date(ds + "T00:00:00")
  return d.getFullYear() === currentYear ? monthDayFmt.format(d) : `${monthDayFmt.format(d)}, ${d.getFullYear()}`
}

// Week navigation is fully derivable on the client (mirrors computeWeekMeta in
// api/timesheet.ts). Only the table data needs the backend.
const pad = (n: number) => String(n).padStart(2, "0")
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, -((x.getDay() + 6) % 7)) }

function computeWeekMeta(startParam: string): WeekNav {
  const weekStart = mondayOf(new Date(startParam + "T00:00:00"))
  const weekDates = Array.from({ length: 7 }, (_, i) => fmtDate(addDays(weekStart, i)))
  const endStr = weekDates[6]
  const withYear = (d: Date) =>
    d.getFullYear() === currentYear ? monthDayFmt.format(d) : `${monthDayFmt.format(d)}, ${d.getFullYear()}`
  const thisMonday = mondayOf(new Date())
  const weekOffset = Math.round((weekStart.getTime() - thisMonday.getTime()) / (7 * 86400000))
  const weekLabel =
    weekOffset === 0 ? "This week" :
    weekOffset === -1 ? "Last week" :
    weekOffset === 1 ? "Next week" :
    `${withYear(weekStart)} - ${withYear(new Date(endStr + "T00:00:00"))}`
  return {
    weekDates,
    startStr: fmtDate(weekStart),
    prevStart: fmtDate(addDays(weekStart, -7)),
    nextStart: fmtDate(addDays(weekStart, 7)),
    thisStart: fmtDate(thisMonday),
    todayStr: fmtDate(new Date()),
    weekLabel,
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

async function post(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch("/api/timesheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── QueryClient ───────────────────────────────────────────────────────────────

const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: 1 } } })

// ── Dialog base component ────────────────────────────────────────────────────

function Dialog({ onClose, children, className = "" }: { onClose: () => void; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`rounded-2xl p-0 shadow-2xl backdrop:bg-gray-900/40 ${className}`}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      onClose={onClose}
    >
      {children}
    </dialog>
  )
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="absolute top-3 right-3 z-10 w-8 h-8 inline-flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

// ── Modals ────────────────────────────────────────────────────────────────────

const QUICK_HOURS = [2, 4, 8]

function EntryModal({ projectName, label, currentHours, onSet, onClose }: {
  projectName: string
  label: string
  currentHours: number
  onSet: (hours: number) => void
  onClose: () => void
}) {
  const [custom, setCustom] = useState(currentHours > 0 ? String(currentHours) : "")

  return (
    <Dialog onClose={onClose} className="w-[90vw] max-w-[18rem]">
      <div className="relative p-5">
        <CloseBtn onClose={onClose} />
        <h2 className="text-sm font-semibold text-gray-900">{projectName}</h2>
        <p className="text-xs text-gray-400 mb-4">{label}</p>

        <div className="grid grid-cols-3 gap-2 mb-2">
          {QUICK_HOURS.map((q) => (
            <button
              key={q}
              type="button"
              className="py-2.5 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors tabular-nums"
              onClick={() => onSet(q)}
            >
              {q}h
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="number"
            value={custom}
            step="0.5"
            min="0"
            max="24"
            placeholder="Custom"
            className="flex-1 w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none tabular-nums"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && custom) onSet(Number(custom)) }}
          />
          <button
            type="button"
            className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            onClick={() => { if (custom) onSet(Number(custom)) }}
          >
            Set
          </button>
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          {currentHours > 0 ? (
            <button type="button" className="text-xs text-gray-400 hover:text-red-500 transition-colors" onClick={() => onSet(0)}>
              Clear entry
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  )
}

function ProjectRow({ project, onRename, onDelete }: {
  project: Project
  onRename: (id: number, name: string, rate: number | null) => void
  onDelete: (id: number) => void
}) {
  const [name, setName] = useState(project.name)
  const [rate, setRate] = useState(project.hourlyRate != null ? String(project.hourlyRate) : "")

  const save = () => {
    const trimmed = name.trim()
    const newRate = rate === "" ? null : Number(rate)
    if (trimmed && (trimmed !== project.name || newRate !== project.hourlyRate)) {
      onRename(project.id, trimmed, newRate)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2">
        <input
          type="text"
          value={name}
          required
          className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save() } }}
        />
        <div className="relative w-24 flex-shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            value={rate}
            step="any"
            min="0"
            placeholder="—"
            className="w-full text-sm pl-6 pr-2 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none tabular-nums"
            onChange={(e) => setRate(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save() } }}
          />
        </div>
      </div>
      <button
        type="button"
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
        aria-label={`Delete ${project.name}`}
        onClick={() => onDelete(project.id)}
      >
        ×
      </button>
    </div>
  )
}

function ManageProjectsModal({ projects, onAdd, onRename, onDelete, onClose }: {
  projects: Project[]
  onAdd: (name: string) => void
  onRename: (id: number, name: string, rate: number | null) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [newName, setNewName] = useState("")

  return (
    <Dialog onClose={onClose} className="w-[90vw] max-w-lg">
      <div className="relative p-6">
        <CloseBtn onClose={onClose} />
        <h2 className="text-base font-semibold text-gray-900 mb-4">Manage projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No projects yet. Add your first one below.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              <span className="flex-1">Name</span>
              <span className="w-24">Rate</span>
              <span className="w-9" />
            </div>
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} onRename={onRename} onDelete={onDelete} />
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2 border-t border-gray-100 pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (newName.trim()) { onAdd(newName.trim()); setNewName("") }
          }}
        >
          <input
            type="text"
            value={newName}
            placeholder="New project name"
            required
            className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors flex-shrink-0">
            Add
          </button>
        </form>
      </div>
    </Dialog>
  )
}

function LocationRow({ location, onRename, onDelete }: {
  location: Location
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
}) {
  const [name, setName] = useState(location.name)

  const save = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== location.name) onRename(location.id, trimmed)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        required
        className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save() } }}
      />
      <button
        type="button"
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
        aria-label={`Delete ${location.name}`}
        onClick={() => onDelete(location.id)}
      >
        ×
      </button>
    </div>
  )
}

function ManageLocationsModal({ locations, onAdd, onRename, onDelete, onClose }: {
  locations: Location[]
  onAdd: (name: string) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [newName, setNewName] = useState("")

  return (
    <Dialog onClose={onClose} className="w-[90vw] max-w-md">
      <div className="relative p-6">
        <CloseBtn onClose={onClose} />
        <h2 className="text-base font-semibold text-gray-900 mb-4">Manage locations</h2>
        {locations.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No locations yet. Add your first one below.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {locations.map((l) => (
              <LocationRow key={l.id} location={l} onRename={onRename} onDelete={onDelete} />
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2 border-t border-gray-100 pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (newName.trim()) { onAdd(newName.trim()); setNewName("") }
          }}
        >
          <input
            type="text"
            value={newName}
            placeholder="New location name"
            required
            className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:outline-none"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors flex-shrink-0">
            Add
          </button>
        </form>
      </div>
    </Dialog>
  )
}

function SetLocationModal({ label, locations, currentLocationId, onSet, onClose }: {
  label: string
  locations: Location[]
  currentLocationId: number
  onSet: (locationId: number) => void
  onClose: () => void
}) {
  return (
    <Dialog onClose={onClose} className="w-[90vw] max-w-[18rem]">
      <div className="relative p-5">
        <CloseBtn onClose={onClose} />
        <h2 className="text-sm font-semibold text-gray-900">Location</h2>
        <p className="text-xs text-gray-400 mb-4">{label}</p>
        {locations.length === 0 ? (
          <p className="text-sm text-gray-400 mb-2">No locations yet. Create one with "Manage locations".</p>
        ) : (
          <div className="flex flex-col gap-1.5 mb-2">
            {locations.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`w-full text-left text-sm px-3 py-2 rounded-xl border transition-colors ${l.id === currentLocationId ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900"}`}
                onClick={() => onSet(l.id)}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center border-t border-gray-100 mt-3 pt-3">
          {currentLocationId > 0 ? (
            <button type="button" className="text-xs text-gray-400 hover:text-red-500 transition-colors" onClick={() => onSet(0)}>
              Clear
            </button>
          ) : <span />}
          <button type="button" className="text-sm text-gray-500 hover:text-gray-900 transition-colors" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  )
}

function ConfirmModal({ message, onConfirm, onClose }: { message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog onClose={onClose} className="w-[90vw] max-w-sm">
      <div className="relative p-6">
        <CloseBtn onClose={onClose} />
        <h2 className="text-base font-semibold text-gray-900 mb-2">Are you sure?</h2>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="text-sm px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors" onClick={() => { onConfirm(); onClose() }}>
            Delete
          </button>
        </div>
      </div>
    </Dialog>
  )
}

function WeekPicker({ startStr, weekLabel, onNavigate }: { startStr: string; weekLabel: string; onNavigate: (start: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        onClick={() => { if (inputRef.current?.showPicker) inputRef.current.showPicker(); else inputRef.current?.focus() }}
      >
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M3 9.5h18M8 3v3M16 3v3" />
        </svg>
        <span className="font-medium tabular-nums">{weekLabel}</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        defaultValue={startStr}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (!e.target.value) return
          const d = new Date(e.target.value + "T00:00:00")
          const dow = (d.getDay() + 6) % 7
          d.setDate(d.getDate() - dow)
          const p = (n: number) => String(n).padStart(2, "0")
          onNavigate(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`)
        }}
      />
    </div>
  )
}

function ManageMenu({ onManageProjects, onManageLocations }: { onManageProjects: () => void; onManageLocations: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        aria-label="Manage"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-52 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
            <button
              type="button"
              className="group flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); onManageProjects() }}
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.6a2 2 0 011.4.6L12.4 7H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              Manage projects
            </button>
            <button
              type="button"
              className="group flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); onManageLocations() }}
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6.5-5.8 6.5-10.5a6.5 6.5 0 10-13 0C5.5 15.2 12 21 12 21z" />
                <circle cx="12" cy="10.5" r="2.2" />
              </svg>
              Manage locations
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function TimesheetInner({
  weekDates: initialWeekDates,
  startStr: initialStartStr,
  todayStr: initialTodayStr,
  prevStart: initialPrevStart,
  nextStart: initialNextStart,
  thisStart: initialThisStart,
  weekLabel: initialWeekLabel,
  userEmail,
  projects: initialProjects,
  entries: initialEntries,
  entryCounts: initialEntryCounts,
  locations: initialLocations,
  dayLocations: initialDayLocations,
  locationCounts: initialLocationCounts,
}: TimesheetProps) {
  // ── Week navigation state ───────────────────────────────────────────────────

  const [week, setWeek] = useState<WeekNav>({
    weekDates: initialWeekDates,
    startStr: initialStartStr,
    prevStart: initialPrevStart,
    nextStart: initialNextStart,
    thisStart: initialThisStart,
    weekLabel: initialWeekLabel,
    todayStr: initialTodayStr,
  })
  const [isNavigating, startTransition] = useTransition()

  const navigateTo = (newStart: string, push = true) => {
    // Header (arrows, date, week label) is computed on the client and updates
    // instantly. Only the table data below waits for the backend.
    setWeek(computeWeekMeta(newStart))
    if (push) history.pushState(null, "", `/timesheet?start=${newStart}`)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/timesheet?start=${newStart}`)
        const data = await res.json()
        setState((s) => ({
          ...s,
          entries: Object.fromEntries(data.entries.map((e: { projectId: number; date: string; hours: number }) => [`${e.projectId}:${e.date}`, e.hours])),
          dayLocations: Object.fromEntries(data.dayLocations.map((dl: { date: string; locationId: number }) => [dl.date, dl.locationId])),
        }))
      } catch {
        toast.error("Failed to load week")
      }
    })
  }

  useEffect(() => {
    const onPop = () => {
      const start = new URLSearchParams(window.location.search).get("start")
      navigateTo(start ?? week.thisStart, false)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data state ──────────────────────────────────────────────────────────────

  const [state, setState] = useState<State>(() => ({
    projects: initialProjects,
    entries: Object.fromEntries(initialEntries.map((e) => [`${e.projectId}:${e.date}`, e.hours])),
    locations: initialLocations,
    dayLocations: Object.fromEntries(initialDayLocations.map((dl) => [dl.date, dl.locationId])),
  }))
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>(initialEntryCounts)
  const [modal, setModal] = useState<Modal>(null)

  // ── Derived values ──────────────────────────────────────────────────────────

  const getH = (projectId: number, date: string) => state.entries[`${projectId}:${date}`] ?? 0
  const rowTotal = (pid: number) => week.weekDates.reduce((s, d) => s + getH(pid, d), 0)
  const dayTotal = (date: string) => state.projects.reduce((s, p) => s + getH(p.id, date), 0)
  const weekTotal = week.weekDates.reduce((s, d) => s + dayTotal(d), 0)
  const rateOf = (pid: number) => state.projects.find((p) => p.id === pid)?.hourlyRate ?? null
  const rowMoney = (pid: number) => { const r = rateOf(pid); return r ? rowTotal(pid) * r : null }
  const weekMoney = state.projects.reduce((s, p) => s + (rowMoney(p.id) ?? 0), 0)
  const hasAnyRate = state.projects.some((p) => (p.hourlyRate ?? 0) > 0)
  const dayMoney = (date: string) => state.projects.reduce((s, p) => { const r = rateOf(p.id); return s + (r ? getH(p.id, date) * r : 0) }, 0)
  const locName = (locId: number) => state.locations.find((l) => l.id === locId)?.name

  // ── Mutations ───────────────────────────────────────────────────────────────

  const setHoursMut = useMutation({
    mutationFn: (v: { projectId: number; date: string; hours: number }) => post({ intent: "setHours", ...v }),
    onMutate: ({ projectId, date, hours }) => {
      const key = `${projectId}:${date}`
      const prev = state.entries[key] ?? 0
      const snapshot = state.entries
      setState((s) => {
        const entries = { ...s.entries }
        if (hours > 0) entries[key] = hours
        else delete entries[key]
        return { ...s, entries }
      })
      if (hours > 0 && !prev) setEntryCounts((c) => ({ ...c, [projectId]: (Number(c[projectId]) || 0) + 1 }))
      if (!hours && prev > 0) setEntryCounts((c) => ({ ...c, [projectId]: Math.max(0, (Number(c[projectId]) || 1) - 1) }))
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState((s) => ({ ...s, entries: snapshot }))
      toast.error("Failed to save")
    },
    onSuccess: (_d, v) => {
      if (v.hours > 0) toast.success("Saved")
    },
  })

  const addProjectMut = useMutation({
    mutationFn: (v: { name: string }) => post({ intent: "addProject", ...v }),
    onSuccess: (data) => {
      if (data.ok && data.project) {
        const p = data.project as Project
        setState((s) => ({ ...s, projects: [...s.projects, p].sort((a, b) => a.name.localeCompare(b.name)) }))
        toast.success("Project added")
      }
    },
    onError: () => toast.error("Failed to add project"),
  })

  const renameProjectMut = useMutation({
    mutationFn: (v: { projectId: number; name: string; hourlyRate: number | null }) => post({ intent: "renameProject", ...v }),
    onMutate: ({ projectId, name, hourlyRate }) => {
      const snapshot = state.projects
      setState((s) => ({ ...s, projects: s.projects.map((p) => p.id === projectId ? { ...p, name, hourlyRate } : p) }))
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState((s) => ({ ...s, projects: snapshot }))
      toast.error("Failed to save")
    },
  })

  const deleteProjectMut = useMutation({
    mutationFn: (v: { projectId: number }) => post({ intent: "deleteProject", ...v }),
    onMutate: ({ projectId }) => {
      const snapshot = state
      setState((s) => {
        const entries = { ...s.entries }
        Object.keys(entries).forEach((k) => { if (k.startsWith(`${projectId}:`)) delete entries[k] })
        return { ...s, projects: s.projects.filter((p) => p.id !== projectId), entries }
      })
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState(snapshot)
      toast.error("Failed to delete")
    },
    onSuccess: () => { setModal(null); toast.success("Project deleted") },
  })

  const addLocationMut = useMutation({
    mutationFn: (v: { name: string }) => post({ intent: "addLocation", ...v }),
    onSuccess: (data) => {
      if (data.ok && data.location) {
        const l = data.location as Location
        setState((s) => ({ ...s, locations: [...s.locations, l].sort((a, b) => a.name.localeCompare(b.name)) }))
        toast.success("Location added")
      }
    },
    onError: () => toast.error("Failed to add location"),
  })

  const renameLocationMut = useMutation({
    mutationFn: (v: { locationId: number; name: string }) => post({ intent: "renameLocation", ...v }),
    onMutate: ({ locationId, name }) => {
      const snapshot = state.locations
      setState((s) => ({ ...s, locations: s.locations.map((l) => l.id === locationId ? { ...l, name } : l) }))
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState((s) => ({ ...s, locations: snapshot }))
      toast.error("Failed to save")
    },
  })

  const deleteLocationMut = useMutation({
    mutationFn: (v: { locationId: number }) => post({ intent: "deleteLocation", ...v }),
    onMutate: ({ locationId }) => {
      const snapshot = state
      setState((s) => {
        const dayLocations = { ...s.dayLocations }
        Object.entries(dayLocations).forEach(([date, lid]) => { if (lid === locationId) delete dayLocations[date] })
        return { ...s, locations: s.locations.filter((l) => l.id !== locationId), dayLocations }
      })
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState(snapshot)
      toast.error("Failed to delete")
    },
    onSuccess: () => { setModal(null); toast.success("Location deleted") },
  })

  const setDayLocMut = useMutation({
    mutationFn: (v: { date: string; locationId: number }) => post({ intent: "setDayLocation", ...v }),
    onMutate: ({ date, locationId }) => {
      const snapshot = state.dayLocations
      setState((s) => {
        const dayLocations = { ...s.dayLocations }
        if (locationId > 0) dayLocations[date] = locationId
        else delete dayLocations[date]
        return { ...s, dayLocations }
      })
      return snapshot
    },
    onError: (_e, _v, snapshot) => {
      if (snapshot) setState((s) => ({ ...s, dayLocations: snapshot }))
      toast.error("Failed to save")
    },
  })

  // ── Action helpers ──────────────────────────────────────────────────────────

  const handleSetHours = (projectId: number, date: string, hours: number) => {
    setHoursMut.mutate({ projectId, date, hours })
    setModal(null)
  }

  const handleDeleteProject = (projectId: number) => {
    const n = Number(entryCounts[projectId]) || 0
    const msg = n === 0 ? "Delete this project?" : n === 1 ? "Delete this project and its 1 entry?" : `Delete this project and all its ${n} entries?`
    setModal({ type: "confirm", message: msg, onConfirm: () => deleteProjectMut.mutate({ projectId }) })
  }

  const handleDeleteLocation = (locationId: number) => {
    const n = Number(initialLocationCounts[locationId]) || 0
    const msg = n === 0 ? "Delete this location?" : n === 1 ? "Delete this location? It is set on 1 day." : `Delete this location? It is set on ${n} days.`
    setModal({ type: "confirm", message: msg, onConfirm: () => deleteLocationMut.mutate({ locationId }) })
  }

  const handleSetDayLocation = (date: string, locationId: number) => {
    setDayLocMut.mutate({ date, locationId })
    setModal(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="max-w-5xl mx-auto px-6 pt-16 pb-24" style={{ fontFeatureSettings: "'cv02' 1, 'tnum' 1" }}>
      <Toaster position="bottom-center" toastOptions={{ duration: 2000, style: { fontSize: "14px" } }} />

      {/* Account */}
      <div className="flex items-center justify-end gap-3 mb-6 text-xs text-gray-400">
        <span className="truncate max-w-[16rem]">{userEmail}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className="hover:text-gray-900 transition-colors underline-offset-2 hover:underline"
          onClick={async () => { await authClient.signOut(); window.location.href = "/login" }}
        >
          Sign out
        </button>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Timesheet</h1>
          <p className="text-sm text-gray-500 mt-1">{dateLabel(week.weekDates[0])} – {dateLabel(week.weekDates[6])}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-gray-900 leading-none">
            {fmtH(weekTotal)}<span className="text-base font-normal text-gray-400 ml-0.5">h</span>
          </div>
          <div className={`text-sm font-medium text-gray-500 tabular-nums mt-1.5 ${weekMoney > 0 ? "" : "invisible"}`}>
            {weekMoney > 0 ? fmtM(weekMoney) : "—"}
          </div>
          <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">this week</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center h-9 rounded-lg border border-gray-300 overflow-hidden divide-x divide-gray-300">
            <button
              type="button"
              className="w-9 h-full inline-flex items-center justify-center text-lg text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Previous week"
              onClick={() => navigateTo(week.prevStart)}
            >‹</button>
            <button
              type="button"
              className="w-9 h-full inline-flex items-center justify-center text-lg text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Next week"
              onClick={() => navigateTo(week.nextStart)}
            >›</button>
          </div>
          <WeekPicker startStr={week.startStr} weekLabel={week.weekLabel} onNavigate={navigateTo} />
          {week.startStr !== week.thisStart && (
            <button
              type="button"
              className="h-9 px-3 inline-flex items-center rounded-lg border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => navigateTo(week.thisStart)}
            >Today</button>
          )}
        </div>
        <ManageMenu
          onManageProjects={() => setModal({ type: "manage-projects" })}
          onManageLocations={() => setModal({ type: "manage-locations" })}
        />
      </div>

      {/* Table */}
      {state.projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center">
          <p className="text-sm text-gray-500">No projects yet.</p>
          <p className="text-xs text-gray-400 mt-1">Click "Manage projects" above to start tracking.</p>
        </div>
      ) : (
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-opacity ${isNavigating ? "opacity-50" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50/70 text-left font-medium text-gray-400 text-xs uppercase tracking-wide py-3 px-5 min-w-[150px]">Project</th>
                  {week.weekDates.map((ds, i) => (
                    <th key={ds} className={`text-center font-medium py-3 px-1 w-[68px] ${ds === week.todayStr ? "bg-gray-900/[0.04]" : ""}`}>
                      <div className={`text-xs uppercase tracking-wide ${i >= 5 ? "text-gray-300" : "text-gray-400"}`}>{DAY_NAMES[i]}</div>
                      <div className={`text-sm font-semibold tabular-nums mt-0.5 ${ds === week.todayStr ? "text-gray-900" : i >= 5 ? "text-gray-300" : "text-gray-600"}`}>
                        {new Date(ds + "T00:00:00").getDate()}
                      </div>
                    </th>
                  ))}
                  <th className="text-center font-medium text-gray-400 text-xs uppercase tracking-wide py-3 px-4 w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {state.locations.length > 0 && (
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <td className="sticky left-0 z-10 bg-gray-50/40 py-2.5 px-5 align-middle whitespace-nowrap text-xs font-medium uppercase tracking-wide text-gray-400">
                      Location
                    </td>
                    {week.weekDates.map((ds, i) => {
                      const locId = state.dayLocations[ds]
                      const name = locId ? locName(locId) : undefined
                      return (
                        <td key={ds} className={`p-0 align-middle ${ds === week.todayStr ? "bg-gray-900/[0.03]" : ""}`}>
                          <button
                            type="button"
                            className="group w-full h-full px-1 py-2 flex items-center justify-center cursor-pointer"
                            title={name ?? "Set location"}
                            onClick={() => setModal({ type: "set-location", date: ds, label: `${DAY_NAMES[i]}, ${monthDayFmt.format(new Date(ds + "T00:00:00"))}` })}
                          >
                            <span className={`max-w-[60px] truncate text-xs rounded-md px-1.5 py-1 transition-colors ${name ? "bg-gray-200/70 text-gray-700 group-hover:bg-gray-300/70" : "text-gray-300 group-hover:text-gray-500"}`}>
                              {name ?? "+"}
                            </span>
                          </button>
                        </td>
                      )
                    })}
                    <td />
                  </tr>
                )}
                {state.projects.map((p) => {
                  const rt = rowTotal(p.id)
                  const rm = rowMoney(p.id)
                  return (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0 group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/80 transition-colors py-2.5 px-5 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          className="text-left text-gray-900 font-medium hover:text-gray-500 transition-colors"
                          onClick={() => setModal({ type: "manage-projects" })}
                        >
                          {p.name}
                        </button>
                      </td>
                      {week.weekDates.map((ds, i) => {
                        const h = getH(p.id, ds)
                        return (
                          <td key={ds} className={`p-0 align-middle ${ds === week.todayStr ? "bg-gray-900/[0.03]" : ""}`}>
                            <button
                              type="button"
                              className="group w-full h-full px-1 py-2 flex items-center justify-center cursor-pointer select-none"
                              onClick={() => setModal({ type: "entry", projectId: p.id, projectName: p.name, date: ds, label: `${DAY_NAMES[i]}, ${monthDayFmt.format(new Date(ds + "T00:00:00"))}` })}
                            >
                              <span className={`inline-flex items-center justify-center w-12 h-9 rounded-lg border tabular-nums transition-all ${h ? "border-gray-900 bg-gray-900 text-white font-medium shadow-sm group-hover:bg-gray-700" : "border-transparent text-gray-300 group-hover:border-gray-200 group-hover:bg-gray-50 group-hover:text-gray-500"}`}>
                                {h ? fmtH(h) : "+"}
                              </span>
                            </button>
                          </td>
                        )
                      })}
                      <td className={`text-center px-4 align-middle tabular-nums font-semibold ${rt ? "text-gray-700" : "text-gray-300"}`}>
                        {rm != null ? fmtM(rm) : <span>{fmtH(rt)}<span className="text-xs font-normal text-gray-400">h</span></span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/70 border-t border-gray-200">
                  <td className="sticky left-0 z-10 bg-gray-50/70 py-2.5 px-5 text-gray-400 text-xs uppercase tracking-wide">Daily</td>
                  {week.weekDates.map((ds) => {
                    const dh = dayTotal(ds)
                    const dm = dayMoney(ds)
                    const display = hasAnyRate ? (dm > 0 ? fmtM(dm) : "") : dh ? fmtH(dh) : ""
                    return (
                      <td key={ds} className={`text-center px-1 py-2.5 text-xs font-medium tabular-nums ${ds === week.todayStr ? "bg-gray-900/[0.04] text-gray-900" : "text-gray-500"}`}>
                        {display}
                      </td>
                    )
                  })}
                  <td className="text-center px-4 tabular-nums align-middle text-gray-900 font-semibold">
                    {weekMoney > 0 ? fmtM(weekMoney) : <span>{fmtH(weekTotal)}<span className="text-xs font-normal text-gray-400">h</span></span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "entry" && (
        <EntryModal
          projectName={modal.projectName}
          label={modal.label}
          currentHours={getH(modal.projectId, modal.date)}
          onSet={(hours) => handleSetHours(modal.projectId, modal.date, hours)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "manage-projects" && (
        <ManageProjectsModal
          projects={state.projects}
          onAdd={(name) => addProjectMut.mutate({ name })}
          onRename={(id, name, rate) => renameProjectMut.mutate({ projectId: id, name, hourlyRate: rate })}
          onDelete={handleDeleteProject}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "manage-locations" && (
        <ManageLocationsModal
          locations={state.locations}
          onAdd={(name) => addLocationMut.mutate({ name })}
          onRename={(id, name) => renameLocationMut.mutate({ locationId: id, name })}
          onDelete={handleDeleteLocation}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "set-location" && (
        <SetLocationModal
          label={modal.label}
          locations={state.locations}
          currentLocationId={state.dayLocations[modal.date] ?? 0}
          onSet={(locId) => handleSetDayLocation(modal.date, locId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.message} onConfirm={modal.onConfirm} onClose={() => setModal(null)} />
      )}
    </section>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function Timesheet(props: TimesheetProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TimesheetInner {...props} />
    </QueryClientProvider>
  )
}
