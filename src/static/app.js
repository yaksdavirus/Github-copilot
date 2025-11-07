document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // force fresh data to avoid cached responses so UI reflects recent signups/unregisters
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section HTML (include remove button per participant)
        const participantsHTML =
          details.participants && details.participants.length
            ? `<div class="participants-section">
                   <h5>Participants (${details.participants.length})</h5>
                   <ul class="participants-list">
                     ${details.participants
                       .map(
                         (p) =>
                           `<li class="participant-item" data-email="${p}"><span class="participant-email">${p}</span> <button class="remove-btn" title="Unregister participant" aria-label="Unregister ${p}">✖</button></li>`
                       )
                       .join("")}
                   </ul>
                 </div>`
            : `<div class="participants-section">
                   <h5>Participants (0)</h5>
                   <p class="no-participants">No participants yet — be the first!</p>
                 </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

  activitiesList.appendChild(activityCard);
  // Store activity name on the card for event delegation handlers
  activityCard.dataset.activity = name;

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities so participants and availability update immediately
        await fetchActivities();

        // show success after refresh so UI change is visible
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click events on activitiesList to handle remove/unregister actions
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest && e.target.closest(".remove-btn");
    if (!btn) return;

    const li = btn.closest("li.participant-item");
    if (!li) return;

    const email = li.dataset.email;
    const card = btn.closest(".activity-card");
    const activityName = card ? card.dataset.activity : null;
    if (!activityName || !email) return;

    // Confirm before unregistering
    if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await resp.json();

      if (resp.ok) {
        // Refresh to show updated participants and counts
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
