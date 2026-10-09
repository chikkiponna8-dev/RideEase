
"use strict";

/* =========================================================
   RIDEEASE — VEHICLE RENTAL SYSTEM
   Vehicle loading, booking, history, details and animations
   Edit and Cancel booking features removed
   ========================================================= */

const grid = document.getElementById("vehicleGrid");
const select = document.getElementById("vehicleSelect");
const filter = document.getElementById("filterType");
const form = document.getElementById("bookingForm");
const message = document.getElementById("bookingMessage");

let vehicles = [];
let animationObserver = null;


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatBookingDate(date) {
  if (!date) return "-";

  const datePart = String(date).substring(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) return escapeHTML(date);

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  if (
    !year ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return escapeHTML(date);
  }

  return `${day} ${months[month - 1]} ${year}`;
}

function showMessage(text, color = "#dc2626") {
  if (!message) return;
  message.textContent = text;
  message.style.color = color;
}


/* =========================================================
   ADVANCED SCROLL REVEAL
   ========================================================= */

if ("IntersectionObserver" in window) {
  animationObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("motion-visible");
        entry.target.classList.remove("motion-hidden");
        animationObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });
}

function observeMotionElements(elements) {
  elements.forEach(element => {
    if (element.dataset.motionReady) return;

    element.dataset.motionReady = "true";

    if (animationObserver) {
      element.classList.add("motion-hidden");
      animationObserver.observe(element);
    } else {
      element.classList.add("motion-visible");
    }
  });
}


/* =========================================================
   LOAD VEHICLES
   ========================================================= */

async function loadVehicles() {
  if (!grid || !select) {
    console.error(
      "Missing vehicleGrid or vehicleSelect in index.html."
    );
    return;
  }

  grid.innerHTML = '<div class="loading">Loading vehicles...</div>';

  try {
    const response = await fetch("/api/vehicles");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load vehicles.");
    }

    if (!Array.isArray(data)) {
      throw new Error("The vehicle API did not return a list.");
    }

    vehicles = data;

    renderVehicles();

    select.innerHTML =
      '<option value="">Select vehicle</option>' +
      vehicles.map(vehicle => `
        <option value="${escapeHTML(vehicle.id)}">
          ${escapeHTML(vehicle.name)} - ₹${formatMoney(vehicle.price_per_day)}/day
        </option>
      `).join("");

  } catch (error) {
    console.error("Vehicle loading error:", error);

    grid.innerHTML = `
      <div class="loading">
        Could not load vehicles.
        <br>
        ${escapeHTML(error.message)}
      </div>
    `;

    select.innerHTML =
      '<option value="">Vehicles unavailable</option>';
  }
}


/* =========================================================
   RENDER VEHICLE CARDS
   ========================================================= */

function renderVehicles() {
  if (!grid || !filter) return;

  const selectedType = filter.value;

  const list = selectedType === "all" || !selectedType
    ? vehicles
    : vehicles.filter(vehicle => vehicle.type === selectedType);

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="loading">No vehicles found in this category.</div>
    `;
    return;
  }

  grid.innerHTML = list.map(vehicle => `
    <article class="vehicle-card">
      <img
        src="${escapeHTML(vehicle.image || "")}"
        alt="${escapeHTML(vehicle.name)}"
        loading="lazy"
        onerror="this.style.display='none'">

      <div class="vehicle-info">
        <p class="eyebrow">${escapeHTML(vehicle.type)}</p>

        <h3>
          ${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.name)}
        </h3>

        <div class="meta">
          <span class="tag">${escapeHTML(vehicle.seats)} Seats</span>
          <span class="tag">${escapeHTML(vehicle.fuel)}</span>
          <span class="tag">${escapeHTML(vehicle.transmission)}</span>
        </div>

        <div class="price">
          <div>
            <strong>₹${formatMoney(vehicle.price_per_day)}</strong>
            <small>/ day</small>
          </div>

          <button
            class="book-btn"
            type="button"
            onclick="chooseVehicle(${Number(vehicle.id)})">
            Book
          </button>
        </div>
      </div>
    </article>
  `).join("");

  observeMotionElements(grid.querySelectorAll(".vehicle-card"));
}

if (filter) {
  filter.addEventListener("change", renderVehicles);
}


/* =========================================================
   CHOOSE VEHICLE
   ========================================================= */

function chooseVehicle(id) {
  if (!select) return;

  select.value = String(id);

  const bookingSection = document.getElementById("booking");

  if (bookingSection) {
    bookingSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


/* =========================================================
   BOOKING FORM
   ========================================================= */

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();

    showMessage("Processing your booking...", "#2563eb");

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const data = Object.fromEntries(
        new FormData(form).entries()
      );

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create booking."
        );
      }

      showMessage(
        `${result.message || "Booking successful!"} ` +
        `Booking ID: #${result.bookingId}. ` +
        `Total: ₹${formatMoney(result.total)}`,
        "#15803d"
      );

      form.reset();

      setDateMinimums();

      await loadBookingHistory();

    } catch (error) {
      console.error("Booking error:", error);
      showMessage(error.message || "Booking failed.");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}


/* =========================================================
   DATE SETTINGS
   ========================================================= */

function getTodayDate() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().split("T")[0];
}

function setDateMinimums() {
  const pickup = document.getElementById("pickupDate");
  const returnDate = document.getElementById("returnDate");

  if (!pickup || !returnDate) return;

  const today = getTodayDate();

  pickup.min = today;
  returnDate.min = pickup.value || today;
}

const pickupInput = document.getElementById("pickupDate");
const returnInput = document.getElementById("returnDate");

setDateMinimums();

if (pickupInput && returnInput) {
  pickupInput.addEventListener("change", () => {
    returnInput.min = pickupInput.value || getTodayDate();

    if (
      returnInput.value &&
      returnInput.value < pickupInput.value
    ) {
      returnInput.value = "";
    }
  });
}


/* =========================================================
   BOOKING HISTORY — VIEW ONLY
   ========================================================= */

async function loadBookingHistory() {
  const history = document.getElementById("bookingHistory");

  if (!history) return;

  history.innerHTML =
    '<div class="loading">Loading booking history...</div>';

  try {
    const response = await fetch("/api/bookings");
    const bookings = await response.json();

    if (!response.ok) {
      throw new Error(
        bookings.error || "Unable to load booking history."
      );
    }

    if (!Array.isArray(bookings) || bookings.length === 0) {
      history.innerHTML = `
        <div class="empty-history">
          <div class="empty-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Your bookings will appear here.</p>
          <a href="#booking" class="primary-btn">Book a Vehicle</a>
        </div>
      `;
      return;
    }

    history.innerHTML = `
      <div class="history-list">
        ${bookings.map(booking => `
          <article
            class="history-card"
            tabindex="0"
            role="button"
            aria-label="View booking ${escapeHTML(booking.id)}"
            onclick="openBookingDetails(${Number(booking.id)})"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openBookingDetails(${Number(booking.id)})}">

            <div class="history-top">
              <div>
                <p class="history-label">BOOKING ID</p>
                <h3>#${escapeHTML(booking.id)}</h3>
              </div>

              <span class="booking-status">
                ${escapeHTML(booking.status || "Confirmed")}
              </span>
            </div>

            <div class="history-main">
              <div class="history-vehicle">
                <div class="vehicle-icon">🚗</div>
                <div>
                  <p class="history-label">VEHICLE</p>
                  <h3>${escapeHTML(booking.vehicle_name || "Vehicle")}</h3>
                  <span>${escapeHTML(booking.type || "")}</span>
                </div>
              </div>

              <div class="history-detail">
                <p class="history-label">CUSTOMER</p>
                <strong>${escapeHTML(booking.customer_name || "-")}</strong>
                <span>${escapeHTML(booking.phone || "-")}</span>
              </div>

              <div class="history-detail">
                <p class="history-label">PICKUP</p>
                <strong>${formatBookingDate(booking.pickup_date)}</strong>
              </div>

              <div class="history-detail">
                <p class="history-label">RETURN</p>
                <strong>${formatBookingDate(booking.return_date)}</strong>
              </div>

              <div class="history-total">
                <p class="history-label">TOTAL</p>
                <strong>₹${formatMoney(booking.total_amount)}</strong>
              </div>
            </div>

          </article>
        `).join("")}
      </div>
    `;

    observeMotionElements(
      history.querySelectorAll(".history-card")
    );

  } catch (error) {
    console.error("Booking history error:", error);

    history.innerHTML = `
      <div class="empty-history">
        <h3>Unable to load booking history</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   BOOKING DETAILS POPUP
   ========================================================= */

async function openBookingDetails(id) {
  closeBookingDetails();

  try {
    const response = await fetch("/api/bookings");
    const bookings = await response.json();

    if (!response.ok || !Array.isArray(bookings)) {
      throw new Error("Unable to load booking details.");
    }

    const booking = bookings.find(
      item => Number(item.id) === Number(id)
    );

    if (!booking) {
      alert("Booking details not found.");
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "booking-detail-overlay";

    overlay.innerHTML = `
      <div class="booking-detail-panel" role="dialog"
           aria-modal="true" aria-label="Booking details">

        <button
          class="booking-detail-close"
          type="button"
          aria-label="Close booking details">
          ×
        </button>

        <div class="detail-glow"></div>

        <p class="detail-eyebrow">RIDEEASE • BOOKING DETAILS</p>

        <div class="detail-header">
          <div>
            <span class="detail-label">BOOKING ID</span>
            <h2>#${escapeHTML(booking.id)}</h2>
          </div>

          <span class="detail-status">
            ● ${escapeHTML(booking.status || "Confirmed")}
          </span>
        </div>

        <div class="detail-vehicle">
          <div class="detail-vehicle-icon">🚗</div>
          <div>
            <span class="detail-label">YOUR VEHICLE</span>
            <h3>${escapeHTML(booking.vehicle_name || "Vehicle")}</h3>
            <p>${escapeHTML(booking.type || "")}</p>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-box">
            <span>👤 CUSTOMER</span>
            <strong>${escapeHTML(booking.customer_name || "-")}</strong>
            <small>${escapeHTML(booking.phone || "-")}</small>
          </div>

          <div class="detail-box">
            <span>📅 PICKUP</span>
            <strong>${formatBookingDate(booking.pickup_date)}</strong>
          </div>

          <div class="detail-box">
            <span>🏁 RETURN</span>
            <strong>${formatBookingDate(booking.return_date)}</strong>
          </div>

          <div class="detail-box detail-price">
            <span>💰 TOTAL AMOUNT</span>
            <strong>₹${formatMoney(booking.total_amount)}</strong>
          </div>
        </div>

        <div class="booking-timeline">
          <div class="timeline-step active">
            <div class="timeline-dot">✓</div>
            <span>BOOKED</span>
          </div>

          <div class="timeline-line"></div>

          <div class="timeline-step active">
            <div class="timeline-dot">🚗</div>
            <span>PICKUP</span>
          </div>

          <div class="timeline-line"></div>

          <div class="timeline-step">
            <div class="timeline-dot">🏁</div>
            <span>RETURN</span>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".booking-detail-close")
      .addEventListener("click", closeBookingDetails);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        closeBookingDetails();
      }
    });

    document.addEventListener("keydown", handlePopupEscape);

    requestAnimationFrame(() => {
      overlay.classList.add("detail-open");

      setTimeout(createBookingParticles, 300);
    });

  } catch (error) {
    console.error("Booking details error:", error);
    alert(error.message || "Unable to load booking details.");
  }
}

function handlePopupEscape(event) {
  if (event.key === "Escape") {
    closeBookingDetails();
  }
}

function closeBookingDetails() {
  document.removeEventListener("keydown", handlePopupEscape);

  document.querySelectorAll(".booking-detail-overlay")
    .forEach(overlay => {
      overlay.classList.remove("detail-open");
      setTimeout(() => overlay.remove(), 300);
    });
}


/* =========================================================
   BOOKING POPUP PARTICLES
   ========================================================= */

function createBookingParticles() {
  const panel = document.querySelector(".booking-detail-panel");

  if (!panel || panel.querySelector(".booking-particles")) return;

  const container = document.createElement("div");
  container.className = "booking-particles";

  for (let i = 0; i < 25; i++) {
    const particle = document.createElement("span");
    particle.className = "booking-particle";

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 4}s`;
    particle.style.animationDuration = `${3 + Math.random() * 5}s`;

    container.appendChild(particle);
  }

  panel.appendChild(container);
}


/* =========================================================
   MAGNETIC BUTTONS
   ========================================================= */

function setupMagneticButtons() {
  document.querySelectorAll(
    ".primary-btn, .secondary-btn, .nav-btn, .book-btn"
  ).forEach(button => {
    if (button.dataset.magneticReady) return;

    button.dataset.magneticReady = "true";

    button.addEventListener("mousemove", event => {
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      button.style.transform =
        `translate(${x * 0.08}px, ${y * 0.08}px) scale(1.03)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

setupMagneticButtons();


/* =========================================================
   VEHICLE CARD 3D TILT
   ========================================================= */

document.addEventListener("mousemove", event => {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.querySelectorAll(".vehicle-card").forEach(card => {
    const rect = card.getBoundingClientRect();

    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) {
      card.style.transform = "";
      return;
    }

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateY = (x / rect.width - 0.5) * 8;
    const rotateX = (y / rect.height - 0.5) * -8;

    card.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) ` +
      `rotateY(${rotateY}deg) translateY(-6px)`;
  });
});


/* =========================================================
   MOUSE-FOLLOWING LIGHT
   ========================================================= */

const cursorLight = document.createElement("div");
cursorLight.className = "cursor-light";
cursorLight.setAttribute("aria-hidden", "true");
document.body.appendChild(cursorLight);

document.addEventListener("mousemove", event => {
  cursorLight.style.left = `${event.clientX}px`;
  cursorLight.style.top = `${event.clientY}px`;
});


/* =========================================================
   HOLOGRAPHIC BOOKING PANEL
   ========================================================= */

document.addEventListener("mousemove", event => {
  const panel = document.querySelector(".booking-detail-panel");

  if (!panel || window.matchMedia("(pointer: coarse)").matches) return;

  const rect = panel.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
    panel.style.transform = "";
    return;
  }

  const rotateY = (x / rect.width - 0.5) * 5;
  const rotateX = (y / rect.height - 0.5) * -5;

  panel.style.transform =
    `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});


/* =========================================================
   HISTORY CARD SPOTLIGHT
   ========================================================= */

document.addEventListener("mousemove", event => {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  document.querySelectorAll(".history-card").forEach(card => {
    const rect = card.getBoundingClientRect();

    if (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      card.style.setProperty(
        "--spot-x",
        `${event.clientX - rect.left}px`
      );

      card.style.setProperty(
        "--spot-y",
        `${event.clientY - rect.top}px`
      );
    }
  });
});


/* =========================================================
   START APPLICATION
   ========================================================= */

loadVehicles();
loadBookingHistory();

observeMotionElements(document.querySelectorAll(
  ".booking-section, .stats, .features article, .booking-card"
));

