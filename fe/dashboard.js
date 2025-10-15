let allUsers = [];
let filteredUsers = [];

async function fetchUsers() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; return; }
  const res = await fetch("/api/admin/getUsers", { headers: { "Authorization": token } });
  if (!res.ok) { document.getElementById("msg").innerText = "Failed to load users."; return; }
  allUsers = await res.json();
  filterAndRender('init', 7); 
}
fetchUsers();

function filterByDays(users, days) {
  const now = new Date();
  return users.filter(u => {
    if (!u.created_at) return false;
    const regDate = new Date(u.created_at);
    return (now - regDate) / (1000*60*60*24) <= days;
  });
}
function filterByMonth(users) {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth()-1, now.getDate());
  return users.filter(u => {
    if (!u.created_at) return false;
    const regDate = new Date(u.created_at);
    return regDate >= prevMonth && regDate <= now;
  });
}
function filterByYear(users) {
  const now = new Date();
  const prevYear = new Date(now.getFullYear()-1, now.getMonth(), now.getDate());
  return users.filter(u => {
    if (!u.created_at) return false;
    const regDate = new Date(u.created_at);
    return regDate >= prevYear && regDate <= now;
  });
}
function filterBySingleDate(users, date) {
  if (!date) return users;
  return users.filter(u => {
    return u.created_at && u.created_at.split('T')[0] === date;
  });
}

function renderTable(users) {
  const table = document.querySelector(".user-table-body");
  table.innerHTML = "";
  users.forEach(user => {
    table.innerHTML += `<tr>
      <td>${user.username || ""}</td>
      <td>${user.email || ""}</td>
      <td>${user.created_at ? user.created_at.split("T")[0] : ""}</td>
    </tr>`;
  });
}

function drawChart(users, period) {
  let filtered = [];
  let label = "";

  if (period === 'year') {
    filtered = filterByYear(users);
    label = 'Last 1 Year';
  } else if (period === 'month') {
    filtered = filterByMonth(users);
    label = 'Last 1 Month';
  } else if (typeof period === 'number') {
    filtered = filterByDays(users, period);
    label = `Last ${period} Days`;
  } else {
    filtered = users;
    label = 'All Time';
  }

  filteredUsers = filtered;
  renderTable(filteredUsers);

  //Group users by registration date
  const countsByDate = {};
  filtered.forEach(u => {
    if (!u.created_at) return;
    const date = u.created_at.split('T')[0];
    countsByDate[date] = (countsByDate[date] || 0) + 1;
  });

  //Generate all dates between min and max
  const dates = Object.keys(countsByDate).sort();
  if (dates.length === 0) {
    const ctx = document.getElementById('userChart').getContext('2d');
    if (window.userChartInstance) window.userChartInstance.destroy();
    window.userChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: { plugins: { title: { display: true, text: 'No data available' } } }
    });
    return;
  }

  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);
  const allDates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toISOString().split('T')[0]);
  }

  //Fill 0 for missing dates
  const dailyCounts = allDates.map(date => countsByDate[date] || 0);

  //Draw the chart
  const ctx = document.getElementById('userChart').getContext('2d');
  if (window.userChartInstance) window.userChartInstance.destroy();
  window.userChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allDates,
      datasets: [{
        label: `Registrations (${label})`,
        data: dailyCounts,
        backgroundColor: 'rgba(13,110,253,0.2)',
        borderColor: '#0d6efd',
        fill: true,
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        x: {
          title: { display: true, text: "Date" },
          ticks: { maxRotation: 90, minRotation: 45 }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Registrations" }
        }
      }
    }
  });
}


function applyChartFilter(period) {
  document.getElementById("singleDate").value = "";
  drawChart(allUsers, period);
}

document.getElementById("singleDate").addEventListener("change", function() {
  const selectedDate = this.value;
  if (selectedDate) {
    const usersOnDate = filterBySingleDate(allUsers, selectedDate);
    filteredUsers = usersOnDate;
    renderTable(filteredUsers);
    drawChart(filteredUsers, null);
  } else {
    filterAndRender('init', 7);
  }
});
document.getElementById("resetSingleDateBtn").onclick = function() {
  document.getElementById("singleDate").value = "";
  filterAndRender('init', 7);
};

function filterAndRender(type, period) {
  drawChart(allUsers, period);
}

document.getElementById("logoutBtnTop").onclick = logout;
function logout() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; return; }
  fetch("/api/admin/logout", {
    method: "POST",
    headers: { "Authorization": token }
  }).then(() => {
    localStorage.removeItem("token");
    window.location.href = "register.html";
  });
}

document.getElementById("downloadBtn").onclick = function() {
  const users = filteredUsers && filteredUsers.length ? filteredUsers : allUsers;
  if (!users.length) return;
  let csv = 'Name,Email,Registration Date\n';
  users.forEach(u => {
    const name = (u.username || '').replace(/"/g, '""');
    const mail = (u.email || '').replace(/"/g, '""');
    const date = (u.created_at ? "'" + u.created_at.split("T")[0] : '');
    csv += `"${name}","${mail}","${date}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById("signUpDayPicker").addEventListener("change", function() {
  const selectedDate = this.value;
  if (!selectedDate || !allUsers.length) {
    document.getElementById("signUpDayCount").innerText = '';
    return;
  }
  const count = allUsers.filter(u => u.created_at && u.created_at.split('T')[0] === selectedDate).length;
  document.getElementById("signUpDayCount").innerText = `${count} new user${count !== 1 ? 's' : ''}`;
});
