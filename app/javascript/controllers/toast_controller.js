import { Controller } from "@hotwired/stimulus"

// Auto-dismiss flash toasts, mirroring the old react-hot-toast behavior.
export default class extends Controller {
  connect() {
    this.timeout = setTimeout(() => this.element.remove(), 2200)
  }

  disconnect() {
    clearTimeout(this.timeout)
  }
}
