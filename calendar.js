// Calendar functionality
const TIME_SLOTS = ['7-11', '11-15', '15-19'];

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedSlots = new Set(); // mehrere Einträge pro Tag: 7-11, 11-15, 15-19
        this.availableDates = this.generateAvailableDates();
        this.init();
    }

    init() {
        this.renderCalendar();
        this.updateTimeSlotsDisplay();
        this.attachEventListeners();
    }

    generateAvailableDates() {
        // Generate available dates for the next 3 months
        // In a real application, this would come from a server/API
        const availableDates = new Set();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 3);

        // Make most weekdays available (Monday-Friday)
        // Exclude weekends and some random dates for demonstration
        const current = new Date(today);
        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            // Monday = 1, Friday = 5
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Randomly exclude 20% of dates to simulate booked dates
                if (Math.random() > 0.2) {
                    const dateStr = this.formatDateKey(current);
                    availableDates.add(dateStr);
                }
            }
            current.setDate(current.getDate() + 1);
        }

        // Always make today and next few days available if they're weekdays
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() + i);
            const dayOfWeek = checkDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateStr = this.formatDateKey(checkDate);
                availableDates.add(dateStr);
            }
        }

        return availableDates;
    }

    formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    formatDateDisplay(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('de-DE', options);
    }

    isDateAvailable(date) {
        const dateStr = this.formatDateKey(date);
        return this.availableDates.has(dateStr);
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isPastDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    }

    renderCalendar() {
        const monthYearEl = document.getElementById('currentMonthYear');
        const daysEl = document.getElementById('calendarDays');

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update month/year display
        const monthNames = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];
        monthYearEl.textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        // Convert Sunday (0) to 7 for easier calculation
        const startingDay = startingDayOfWeek === 0 ? 7 : startingDayOfWeek;

        // Clear previous days
        daysEl.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 1; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            daysEl.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;

            // Check if date is available
            const isAvailable = this.isDateAvailable(date);
            const isToday = this.isToday(date);
            const isPast = this.isPastDate(date);

            if (isPast) {
                dayCell.classList.add('past');
            } else if (isToday) {
                dayCell.classList.add('today');
                if (isAvailable) {
                    dayCell.classList.add('available');
                } else {
                    dayCell.classList.add('unavailable');
                }
            } else if (isAvailable) {
                dayCell.classList.add('available');
                dayCell.setAttribute('tabindex', '0');
                dayCell.setAttribute('role', 'button');
                dayCell.setAttribute('aria-label', `Wählen Sie ${day}. ${monthNames[month]} ${year}`);
            } else {
                dayCell.classList.add('unavailable');
            }

            // Check if this date is selected
            if (this.selectedDate) {
                const selectedStr = this.formatDateKey(this.selectedDate);
                const currentStr = this.formatDateKey(date);
                if (selectedStr === currentStr) {
                    dayCell.classList.add('selected');
                }
            }

            // Add click event for available dates
            if (isAvailable && !isPast) {
                dayCell.addEventListener('click', () => this.selectDate(date));
                dayCell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectDate(date);
                    }
                });
            }

            daysEl.appendChild(dayCell);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedSlots.clear();
        this.updateSelectedDateDisplay();
        this.updateTimeSlotsDisplay();
        this.renderCalendar(); // Re-render to show selection
        this.updateConfirmButton();
    }

    updateSelectedDateDisplay() {
        const displayEl = document.getElementById('selectedDateDisplay');
        if (this.selectedDate) {
            displayEl.innerHTML = `
                <div class="selected-date-content">
                    <div class="selected-date-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div class="selected-date-text">
                        <p class="selected-date-label">Gewähltes Datum:</p>
                        <p class="selected-date-value">${this.formatDateDisplay(this.selectedDate)}</p>
                    </div>
                </div>
            `;
        } else {
            displayEl.innerHTML = '<p class="no-selection">Bitte wählen Sie ein Datum aus</p>';
        }
    }

    updateTimeSlotsDisplay() {
        const hintEl = document.getElementById('timeSlotsHint');
        const listEl = document.getElementById('timeSlotsList');
        if (!hintEl || !listEl) return;

        if (this.selectedDate) {
            hintEl.textContent = 'Wählen Sie ein oder mehrere Zeitfenster:';
            hintEl.classList.remove('time-slots-hint-disabled');
            TIME_SLOTS.forEach(slotId => {
                const btn = document.querySelector(`.time-slot[data-slot="${slotId}"]`);
                if (btn) {
                    btn.disabled = false;
                    btn.classList.toggle('time-slot-selected', this.selectedSlots.has(slotId));
                }
            });
        } else {
            hintEl.textContent = 'Bitte wählen Sie zuerst ein Datum aus';
            hintEl.classList.add('time-slots-hint-disabled');
            TIME_SLOTS.forEach(slotId => {
                const btn = document.querySelector(`.time-slot[data-slot="${slotId}"]`);
                if (btn) {
                    btn.disabled = true;
                    btn.classList.remove('time-slot-selected');
                }
            });
        }
    }

    toggleTimeSlot(slotId) {
        if (!this.selectedDate) return;
        if (this.selectedSlots.has(slotId)) {
            this.selectedSlots.delete(slotId);
        } else {
            this.selectedSlots.add(slotId);
        }
        this.updateTimeSlotsDisplay();
        this.updateConfirmButton();
    }

    updateConfirmButton() {
        const confirmBtn = document.getElementById('confirmDate');
        if (confirmBtn) {
            confirmBtn.disabled = !(this.selectedDate && this.selectedSlots.size > 0);
        }
    }

    confirmAppointment() {
        if (!this.selectedDate || this.selectedSlots.size === 0) return;

        const formattedDate = this.formatDateDisplay(this.selectedDate);
        const slotsText = Array.from(this.selectedSlots).map(s => s.replace('-', '–') + ' Uhr').join(', ');
        const message = `Vielen Dank! Termin(e) am ${formattedDate} für ${slotsText} ausgewählt. Wir melden uns zur Bestätigung.`;

        this.showMessage(message, 'success');

        const slotsParam = encodeURIComponent(Array.from(this.selectedSlots).join(','));
        setTimeout(() => {
            window.location.href = `index.html#contact?date=${this.formatDateKey(this.selectedDate)}&slots=${slotsParam}`;
        }, 2000);
    }

    showMessage(message, type) {
        // Remove existing message if any
        const existingMessage = document.querySelector('.calendar-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `calendar-message calendar-message-${type}`;
        messageEl.textContent = message;

        // Insert message at the top of calendar section
        const calendarSection = document.querySelector('.calendar-section');
        const container = calendarSection.querySelector('.container');
        container.insertBefore(messageEl, container.firstChild);

        // Remove message after 5 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transition = 'opacity 0.3s ease';
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }

    attachEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        TIME_SLOTS.forEach(slotId => {
            const btn = document.querySelector(`.time-slot[data-slot="${slotId}"]`);
            if (btn) {
                btn.addEventListener('click', () => this.toggleTimeSlot(slotId));
            }
        });

        const confirmBtn = document.getElementById('confirmDate');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmAppointment());
        }
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
});
