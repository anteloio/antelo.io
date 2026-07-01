import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// Drives the timesheet page: the entry/location dialogs (one shared dialog
// each, filled from the clicked cell's data attributes), the manage dialogs,
// and the week picker. Forms submit through Turbo; the page morphs back in.
export default class extends Controller {
  static targets = [
    "entryDialog", "entryForm", "entryProjectName", "entryLabel",
    "entryProjectId", "entryDate", "entryHours", "entryClear",
    "locationDialog", "locationForm", "locationLabel", "locationDate",
    "locationId", "locationOption", "locationClear",
    "projectsDialog", "locationsDialog", "weekPicker", "manageMenu",
  ]

  connect() {
    this.onSubmitEnd = this.onSubmitEnd.bind(this)
    this.onRender = this.onRender.bind(this)
    document.addEventListener("turbo:submit-end", this.onSubmitEnd)
    document.addEventListener("turbo:render", this.onRender)
  }

  disconnect() {
    document.removeEventListener("turbo:submit-end", this.onSubmitEnd)
    document.removeEventListener("turbo:render", this.onRender)
  }

  // --- Week picker -----------------------------------------------------------

  openWeekPicker() {
    const input = this.weekPickerTarget
    input.showPicker ? input.showPicker() : input.focus()
  }

  navigateToWeek() {
    const value = this.weekPickerTarget.value
    if (!value) return
    const date = new Date(value + "T00:00:00")
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
    const pad = (n) => String(n).padStart(2, "0")
    Turbo.visit(`/timesheet?start=${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`)
  }

  // --- Entry dialog ----------------------------------------------------------

  openEntry(event) {
    const data = event.currentTarget.dataset
    this.entryProjectNameTarget.textContent = data.projectName
    this.entryLabelTarget.textContent = data.label
    this.entryProjectIdTarget.value = data.projectId
    this.entryDateTarget.value = data.date
    const hours = parseFloat(data.hours)
    this.entryHoursTarget.value = hours > 0 ? data.hours : ""
    this.entryClearTarget.classList.toggle("invisible", !(hours > 0))
    this.entryDialogTarget.showModal()
  }

  setQuickHours(event) {
    this.entryHoursTarget.value = event.currentTarget.dataset.hours
    this.entryFormTarget.requestSubmit()
  }

  clearEntry() {
    this.entryHoursTarget.value = 0
    this.entryFormTarget.requestSubmit()
  }

  // --- Day location dialog ---------------------------------------------------

  openDayLocation(event) {
    const data = event.currentTarget.dataset
    const current = parseInt(data.locationId, 10)
    this.locationLabelTarget.textContent = data.label
    this.locationDateTarget.value = data.date
    this.locationOptionTargets.forEach((button) => {
      const active = parseInt(button.dataset.locationId, 10) === current
      button.classList.toggle("border-gray-900", active)
      button.classList.toggle("bg-gray-900", active)
      button.classList.toggle("text-white", active)
      button.classList.toggle("border-gray-200", !active)
    })
    this.locationClearTarget.classList.toggle("invisible", !(current > 0))
    this.locationDialogTarget.showModal()
  }

  setDayLocation(event) {
    this.locationIdTarget.value = event.currentTarget.dataset.locationId
    this.locationFormTarget.requestSubmit()
  }

  clearDayLocation() {
    this.locationIdTarget.value = 0
    this.locationFormTarget.requestSubmit()
  }

  // --- Manage dialogs --------------------------------------------------------

  openProjects() {
    this.closeManageMenu()
    this.projectsDialogTarget.showModal()
  }

  openLocations() {
    this.closeManageMenu()
    this.locationsDialogTarget.showModal()
  }

  closeManageMenu() {
    if (this.hasManageMenuTarget) this.manageMenuTarget.removeAttribute("open")
  }

  // --- Shared dialog plumbing ------------------------------------------------

  closeDialogs() {
    this.dialogs.forEach((dialog) => dialog.open && dialog.close())
  }

  backdropClose(event) {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  submitOnBlur(event) {
    if (event.target.value !== event.target.defaultValue) event.target.form.requestSubmit()
  }

  // Close dialogs before Turbo swaps the page in, so the top layer stays clean.
  // Forms marked data-keep-open reopen their dialog after the new page renders.
  onSubmitEnd(event) {
    if (!event.detail.success) return
    this.reopen = event.detail.formSubmission.formElement.dataset.keepOpen
    this.closeDialogs()
  }

  onRender() {
    if (!this.reopen) return
    const dialog = this.targets.find(this.reopen)
    if (dialog && !dialog.open) dialog.showModal()
    this.reopen = null
  }

  get dialogs() {
    return [this.entryDialogTarget, this.locationDialogTarget, this.projectsDialogTarget, this.locationsDialogTarget]
  }
}
