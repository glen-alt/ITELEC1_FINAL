const searchInput = document.getElementById("search-input");
const categorySelect = document.getElementById("search-category");
const orderSelect = document.getElementById("search-order");
const usersSection = document.getElementById("users-section");

// Escape values before putting them in innerHTML
const escapeHTML = (str) =>
  String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

async function searchUsers() {
  try {
    const params = new URLSearchParams({
      q: searchInput.value,
      category: categorySelect.value,
      order: orderSelect.value,
    });

    const response = await fetch(`http://localhost:3000/api/users/search?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.users.length === 0) {
      usersSection.innerHTML = "<p>No users found.</p>";
      return;
    }

    let html = "";
    for (const user of data.users) {
      html += `
        <div class="user-card">
          <div class="user-header">
            <span>${escapeHTML(user.username)}</span>
            <span>${escapeHTML(user.department)}-${escapeHTML(user.year)}${escapeHTML(user.section)}</span>
          </div>
          <div class="user-content">
            <div class="user-image">
              <img src="../images/profile.jpg" alt="${escapeHTML(user.username)}'s profile">
            </div>
            <div class="user-events">
              <h4>${escapeHTML(user.role)}</h4>
            </div>
          </div>
        </div>`;
    }
    usersSection.innerHTML = html;
  } catch (error) {
    console.error("Error searching users:", error);
  }
}

// Wait 300ms after the last keystroke so you don't hit the server on every letter
let timer;
searchInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(searchUsers, 300);
});

categorySelect.addEventListener("change", searchUsers);
orderSelect.addEventListener("change", searchUsers);

searchUsers(); // load everyone on page open