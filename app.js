
const store = {
  get: k => JSON.parse(localStorage.getItem(k) || '[]'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  getObj: k => JSON.parse(localStorage.getItem(k) || 'null'),
  setObj: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const KEYS = {
  users:      'fms_users',
  faculty:    'fms_faculty',
  students:   'fms_students',
  courses:    'fms_courses',
  timetable:  'fms_timetable',
  attendance: 'fms_attendance',
  grades:     'fms_grades',
  session:    'fms_session',
};

let currentUser = store.getObj(KEYS.session);

function isValidCNIC(cnic) {
  if (cnic.length !== 15) return false;
  for (let i = 0; i < 15; i++) {
    if (i === 5 || i === 13) {
      if (cnic[i] !== '-') return false;
    } else {
      if (!/\d/.test(cnic[i])) return false;
    }
  }
  return true;
}

function encrypt(text) {
  return text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join('');
}

let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sec = btn.dataset.section;
    navigateTo(sec, btn.textContent.trim());
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (window.innerWidth < 900) {
      document.getElementById('sidebar').classList.remove('open');
    }
  });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function navigateTo(section, title) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('section-' + section);
  if (el) el.classList.add('active');
  document.getElementById('page-title').textContent = title || section;

  if (section === 'view-faculty')   renderFacultyTable();
  if (section === 'view-students')  renderStudentTable();
  if (section === 'add-course')     renderCourseTable();
  if (section === 'timetable')      renderTimetable();
  if (section === 'attendance')     renderAttendanceTable();
  if (section === 'grades')         renderGradeTable();
  if (section === 'dashboard')      updateDashboard();
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = 'tab-' + tab.dataset.tab;
    const parent = tab.closest('section');

    parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    tab.classList.add('active');
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');

    if (tab.dataset.tab === 'view-att')  renderAttendanceTable();
    if (tab.dataset.tab === 'result-sheet') renderGradeTable();
  });
});

function updateDate() {
  const d = new Date();
  document.getElementById('topbar-date').textContent =
    d.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
updateDate();

function updateSessionUI() {
  const dot   = document.getElementById('user-dot');
  const label = document.getElementById('user-label');
  if (currentUser) {
    dot.classList.add('online');
    label.textContent = currentUser;
  } else {
    dot.classList.remove('online');
    label.textContent = 'Not Logged In';
  }
}
updateSessionUI();

function registerUser() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (!username) { toast('Username cannot be empty.', 'error'); return; }
  if (!password || password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
  if (password !== confirm) { toast('Passwords do not match.', 'error'); return; }

  const users = store.get(KEYS.users);
  if (users.find(u => u.username === username)) {
    toast(`Username "${username}" already exists.`, 'error'); return;
  }

  users.push({ username, password: encrypt(password) });
  store.set(KEYS.users, users);
  toast('User registered successfully!', 'success');

  document.getElementById('reg-username').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-confirm').value  = '';
}

function loginUser() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const users = store.get(KEYS.users);
  const user  = users.find(u => u.username === username && u.password === encrypt(password));

  if (user) {
    currentUser = username;
    store.setObj(KEYS.session, username);
    updateSessionUI();
    toast(`Welcome, ${username}!`, 'success');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  } else {
    toast('Invalid username or password.', 'error');
  }
}

function addFaculty() {
  const id     = document.getElementById('fac-id').value.trim();
  const name   = document.getElementById('fac-name').value.trim();
  const cnic   = document.getElementById('fac-cnic').value.trim();
  const dept   = document.getElementById('fac-dept').value.trim();
  const cont   = document.getElementById('fac-contact').value.trim();
  const email  = document.getElementById('fac-email').value.trim();
  const qual   = document.getElementById('fac-qual').value.trim();
  const hours  = document.getElementById('fac-hours').value.trim();
  const desig  = document.getElementById('fac-desig').value.trim();

  if (!id || !name || !cnic || !dept || !cont || !email || !qual || !hours || !desig) {
    toast('All fields are required.', 'error'); return;
  }
  if (!isValidCNIC(cnic)) {
    toast('Invalid CNIC. Format: XXXXX-XXXXXXX-X', 'error'); return;
  }

  const list = store.get(KEYS.faculty);
  if (list.find(f => f.id === id)) {
    toast(`Faculty ID "${id}" already exists.`, 'error'); return;
  }

  list.push({ id, name, cnic, dept, contact: cont, email, qual, hours, desig, joinDate: new Date().toISOString().split('T')[0] });
  store.set(KEYS.faculty, list);
  toast('Faculty saved successfully!', 'success');

  ['fac-id','fac-name','fac-cnic','fac-dept','fac-contact','fac-email','fac-qual','fac-hours','fac-desig']
    .forEach(id => document.getElementById(id).value = '');
  updateDashboard();
}

function renderFacultyTable() {
  const q    = (document.getElementById('faculty-search')?.value || '').toLowerCase();
  const list = store.get(KEYS.faculty).filter(f =>
    f.id.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('faculty-tbody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No faculty records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(f => `
    <tr>
      <td>${f.id}</td>
      <td>${f.name}</td>
      <td>${f.dept}</td>
      <td>${f.desig}</td>
      <td>${f.email}</td>
      <td>
        <button class="btn-icon" onclick="viewFaculty('${f.id}')">View</button>
        <button class="btn-danger" onclick="deleteFaculty('${f.id}')">Del</button>
      </td>
    </tr>
  `).join('');
}

function viewFaculty(id) {
  const f = store.get(KEYS.faculty).find(x => x.id === id);
  if (!f) return;

  const rows = [
    ['Faculty ID', f.id],
    ['Name', f.name],
    ['CNIC', f.cnic],
    ['Department', f.dept],
    ['Contact', f.contact],
    ['Email', f.email],
    ['Qualification', f.qual],
    ['Office Hours', f.hours],
    ['Designation', f.desig],
    ['Join Date', f.joinDate],
  ];

  document.getElementById('faculty-modal-content').innerHTML =
    rows.map(([l, v]) => `
      <div class="profile-row">
        <span class="profile-label">${l}</span>
        <span class="profile-val">${v}</span>
      </div>
    `).join('');

  document.getElementById('faculty-modal').classList.add('open');
}

function deleteFaculty(id) {
  if (!confirm(`Delete faculty "${id}"?`)) return;
  let list = store.get(KEYS.faculty).filter(f => f.id !== id);
  store.set(KEYS.faculty, list);
  renderFacultyTable();
  updateDashboard();
  toast('Faculty record deleted.', 'info');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function addStudent() {
  const id   = document.getElementById('stu-id').value.trim();
  const name = document.getElementById('stu-name').value.trim();
  const cnic = document.getElementById('stu-cnic').value.trim();
  const sem  = document.getElementById('stu-sem').value.trim();
  const dept = document.getElementById('stu-dept').value.trim();
  const email= document.getElementById('stu-email').value.trim();

  if (!id || !name || !cnic || !sem || !dept || !email) {
    toast('All fields are required.', 'error'); return;
  }
  if (!isValidCNIC(cnic)) {
    toast('Invalid CNIC. Format: XXXXX-XXXXXXX-X', 'error'); return;
  }

  const list = store.get(KEYS.students);
  if (list.find(s => s.id === id)) {
    toast(`Student ID "${id}" already exists.`, 'error'); return;
  }

  list.push({ id, name, cnic, sem, dept, email, enrollDate: new Date().toISOString().split('T')[0] });
  store.set(KEYS.students, list);
  toast('Student saved successfully!', 'success');

  ['stu-id','stu-name','stu-cnic','stu-sem','stu-dept','stu-email']
    .forEach(id => document.getElementById(id).value = '');
  updateDashboard();
}

function renderStudentTable() {
  const q    = (document.getElementById('student-search')?.value || '').toLowerCase();
  const list = store.get(KEYS.students).filter(s =>
    s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
  const tbody = document.getElementById('student-tbody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg">No student records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.sem}</td>
      <td>${s.dept}</td>
      <td>${s.email}</td>
      <td>${s.enrollDate}</td>
    </tr>
  `).join('');
}

function addCourse() {
  const id      = document.getElementById('crs-id').value.trim();
  const name    = document.getElementById('crs-name').value.trim();
  const faculty = document.getElementById('crs-faculty').value.trim();
  const credits = document.getElementById('crs-credits').value.trim();
  const sem     = document.getElementById('crs-sem').value.trim();

  if (!id || !name || !faculty || !credits || !sem) {
    toast('All fields are required.', 'error'); return;
  }

  const list = store.get(KEYS.courses);
  list.push({ id, name, faculty, credits, sem });
  store.set(KEYS.courses, list);
  toast('Course assigned successfully!', 'success');

  ['crs-id','crs-name','crs-faculty','crs-credits','crs-sem']
    .forEach(id => document.getElementById(id).value = '');
  renderCourseTable();
  updateDashboard();
}

function renderCourseTable() {
  const list  = store.get(KEYS.courses);
  const tbody = document.getElementById('course-tbody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No courses found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.faculty}</td>
      <td>${c.credits}</td>
      <td>${c.sem}</td>
    </tr>
  `).join('');
}

function addTimetable() {
  const course = document.getElementById('tt-course').value.trim();
  const day    = document.getElementById('tt-day').value;
  const start  = document.getElementById('tt-start').value;
  const end    = document.getElementById('tt-end').value;
  const room   = document.getElementById('tt-room').value.trim();

  if (!course || !day || !start || !end || !room) {
    toast('All fields are required.', 'error'); return;
  }

  const list = store.get(KEYS.timetable);
  list.push({ course, day, start, end, room });
  store.set(KEYS.timetable, list);
  toast('Timetable entry saved!', 'success');

  document.getElementById('tt-course').value = '';
  document.getElementById('tt-day').value    = '';
  document.getElementById('tt-start').value  = '';
  document.getElementById('tt-end').value    = '';
  document.getElementById('tt-room').value   = '';
  renderTimetable();
  updateDashboard();
}

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function renderTimetable() {
  const list = store.get(KEYS.timetable);
  const grid = document.getElementById('timetable-grid');

  if (!list.length) {
    grid.innerHTML = `<p class="empty-msg">No timetable entries yet.</p>`;
    return;
  }

  const sorted = [...list].sort((a, b) =>
    DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day) || a.start.localeCompare(b.start)
  );

  grid.innerHTML = sorted.map(t => `
    <div class="tt-card">
      <div class="tt-course">${t.course}</div>
      <div class="tt-detail">
        📅 ${t.day}<br>
        🕐 ${t.start} – ${t.end}<br>
        🚪 ${t.room}
      </div>
    </div>
  `).join('');
}

function markAttendance() {
  const stu    = document.getElementById('att-stu').value.trim();
  const crs    = document.getElementById('att-crs').value.trim();
  const date   = document.getElementById('att-date').value;
  const status = document.getElementById('att-status').value;

  if (!stu || !crs || !date) {
    toast('All fields are required.', 'error'); return;
  }

  const list = store.get(KEYS.attendance);
  list.push({ stu, crs, date, status });
  store.set(KEYS.attendance, list);
  toast('Attendance marked!', 'success');

  document.getElementById('att-stu').value  = '';
  document.getElementById('att-crs').value  = '';
  document.getElementById('att-date').value = '';
  updateDashboard();
}

function renderAttendanceTable() {
  const list  = store.get(KEYS.attendance);
  const tbody = document.getElementById('att-tbody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">No attendance records.</td></tr>`;
    return;
  }

  tbody.innerHTML = [...list].reverse().map(a => `
    <tr>
      <td>${a.stu}</td>
      <td>${a.crs}</td>
      <td>${a.date}</td>
      <td><span class="${a.status === 'P' ? 'badge-present' : 'badge-absent'}">${a.status === 'P' ? 'Present' : 'Absent'}</span></td>
    </tr>
  `).join('');
}

function attendanceSummary() {
  const sid  = document.getElementById('att-summary-id').value.trim();
  const div  = document.getElementById('att-summary-result');

  if (!sid) { toast('Enter a Student ID.', 'error'); return; }

  const list   = store.get(KEYS.attendance).filter(a => a.stu === sid);
  if (!list.length) {
    div.innerHTML = `<p class="empty-msg">No attendance records for "${sid}".</p>`;
    return;
  }

  const total   = list.length;
  const present = list.filter(a => a.status === 'P').length;
  const absent  = total - present;
  const pct     = ((present / total) * 100).toFixed(1);
  const pctColor = parseFloat(pct) >= 75 ? 'var(--success)' : 'var(--danger)';

  div.innerHTML = `
    <div class="att-summary-box">
      <div class="att-row"><span>Student ID</span><span>${sid}</span></div>
      <div class="att-row"><span>Total Classes</span><span>${total}</span></div>
      <div class="att-row"><span>Present</span><span style="color:var(--success)">${present}</span></div>
      <div class="att-row"><span>Absent</span><span style="color:var(--danger)">${absent}</span></div>
      <div class="att-row"><span>Attendance %</span><span style="color:${pctColor};font-weight:700">${pct}%</span></div>
      <div class="pct-bar"><div class="pct-fill" style="width:${pct}%;background:${pctColor}"></div></div>
      ${parseFloat(pct) < 75 ? `<div class="att-warning">⚠ Below 75% attendance threshold!</div>` : ''}
    </div>
  `;
}

function calculateGrade(total) {
  if (total >= 85) return 'A';
  if (total >= 80) return 'A-';
  if (total >= 75) return 'B+';
  if (total >= 70) return 'B';
  if (total >= 65) return 'B-';
  if (total >= 60) return 'C+';
  if (total >= 55) return 'C';
  if (total >= 50) return 'C-';
  if (total >= 45) return 'D';
  return 'F';
}

function gradeClass(g) {
  if (g.startsWith('A')) return 'grade-A';
  if (g.startsWith('B')) return 'grade-B';
  if (g.startsWith('C')) return 'grade-C';
  if (g === 'D')         return 'grade-D';
  return 'grade-F';
}

['gr-assign','gr-mid','gr-final'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateMarksPreview);
});

function updateMarksPreview() {
  const assign = parseFloat(document.getElementById('gr-assign').value) || 0;
  const mid    = parseFloat(document.getElementById('gr-mid').value)    || 0;
  const final  = parseFloat(document.getElementById('gr-final').value)  || 0;

  if (assign === 0 && mid === 0 && final === 0) {
    document.getElementById('marks-preview').className = 'marks-preview';
    return;
  }

  const total = (assign * 0.20) + (mid * 0.30) + (final * 0.50);
  const grade = calculateGrade(total);

  document.getElementById('marks-preview').className = 'marks-preview visible';
  document.getElementById('marks-preview').innerHTML = `
    <span>Total: <strong>${total.toFixed(1)}</strong></span>
    <span>Grade: <span class="grade-badge ${gradeClass(grade)}">${grade}</span></span>
  `;
}

function enterMarks() {
  const stu    = document.getElementById('gr-stu').value.trim();
  const crs    = document.getElementById('gr-crs').value.trim();
  const assign = parseFloat(document.getElementById('gr-assign').value);
  const mid    = parseFloat(document.getElementById('gr-mid').value);
  const final  = parseFloat(document.getElementById('gr-final').value);

  if (!stu || !crs) { toast('Student ID and Course ID required.', 'error'); return; }
  if (isNaN(assign) || assign < 0 || assign > 20) { toast('Assignment: 0–20', 'error'); return; }
  if (isNaN(mid)    || mid    < 0 || mid    > 30) { toast('Mid: 0–30', 'error'); return; }
  if (isNaN(final)  || final  < 0 || final  > 50) { toast('Final: 0–50', 'error'); return; }

  const total = (assign * 0.20) + (mid * 0.30) + (final * 0.50);
  const grade = calculateGrade(total);

  const list = store.get(KEYS.grades);
  list.push({ stu, crs, assign, mid, final, total: +total.toFixed(1), grade });
  store.set(KEYS.grades, list);

  toast(`Marks saved! Total: ${total.toFixed(1)} | Grade: ${grade}`, 'success');

  ['gr-stu','gr-crs','gr-assign','gr-mid','gr-final'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('marks-preview').className = 'marks-preview';
  updateDashboard();
}

function renderGradeTable() {
  const list  = store.get(KEYS.grades);
  const tbody = document.getElementById('grade-tbody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-msg">No grade records.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(g => `
    <tr>
      <td>${g.stu}</td>
      <td>${g.crs}</td>
      <td>${g.assign}</td>
      <td>${g.mid}</td>
      <td>${g.final}</td>
      <td>${g.total}</td>
      <td><span class="grade-badge ${gradeClass(g.grade)}">${g.grade}</span></td>
    </tr>
  `).join('');
}

function studentGPA() {
  const sid = document.getElementById('gpa-id').value.trim();
  const div = document.getElementById('gpa-result');

  if (!sid) { toast('Enter Student ID.', 'error'); return; }

  const records = store.get(KEYS.grades).filter(g => g.stu === sid);
  if (!records.length) {
    div.innerHTML = `<p class="empty-msg">No grade records for "${sid}".</p>`;
    return;
  }

  const avg = records.reduce((s, g) => s + g.total, 0) / records.length;
  const bestGrade = calculateGrade(avg);

  div.innerHTML = `
    <div class="gpa-box">
      <div style="font-size:0.75rem;color:var(--muted);font-family:var(--mono)">STUDENT ID</div>
      <div style="font-size:1rem;font-weight:700;margin:4px 0 12px">${sid}</div>
      <div style="font-size:0.75rem;color:var(--muted);font-family:var(--mono)">COURSES TAKEN</div>
      <div style="font-size:1.4rem;font-weight:700;margin:4px 0 12px">${records.length}</div>
      <div style="font-size:0.75rem;color:var(--muted);font-family:var(--mono)">AVERAGE MARKS</div>
      <div class="gpa-score">${avg.toFixed(1)}</div>
      <div style="margin-top:8px"><span class="grade-badge ${gradeClass(bestGrade)}">${bestGrade}</span></div>
    </div>
  `;
}

function departmentReport() {
  const list = store.get(KEYS.faculty);
  const div  = document.getElementById('dept-report');

  if (!list.length) {
    div.innerHTML = `<p class="empty-msg">No faculty data.</p>`;
    return;
  }

  const map = {};
  list.forEach(f => { map[f.dept] = (map[f.dept] || 0) + 1; });

  div.innerHTML = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, cnt]) => `
      <div class="dept-row">
        <span>${dept}</span>
        <span class="dept-count">${cnt}</span>
      </div>
    `).join('');
}

function systemSummary() {
  const div = document.getElementById('system-summary');

  const rows = [
    ['Faculty Records',   store.get(KEYS.faculty).length],
    ['Student Records',   store.get(KEYS.students).length],
    ['Course Records',    store.get(KEYS.courses).length],
    ['Grade Records',     store.get(KEYS.grades).length],
    ['Attendance Logs',   store.get(KEYS.attendance).length],
    ['Timetable Entries', store.get(KEYS.timetable).length],
  ];

  div.innerHTML = rows.map(([label, val]) => `
    <div class="summary-row">
      <span>${label}</span>
      <span class="summary-val">${val}</span>
    </div>
  `).join('');
}

function updateDashboard() {
  document.getElementById('stat-faculty').textContent    = store.get(KEYS.faculty).length;
  document.getElementById('stat-students').textContent   = store.get(KEYS.students).length;
  document.getElementById('stat-courses').textContent    = store.get(KEYS.courses).length;
  document.getElementById('stat-attendance').textContent = store.get(KEYS.attendance).length;
  document.getElementById('stat-grades').textContent     = store.get(KEYS.grades).length;
  document.getElementById('stat-timetable').textContent  = store.get(KEYS.timetable).length;

  const fList = store.get(KEYS.faculty).slice(-5).reverse();
  const fDiv  = document.getElementById('dash-recent-faculty');
  fDiv.innerHTML = fList.length
    ? fList.map(f => `<div class="row"><span>${f.name}</span><span style="color:var(--muted);font-family:var(--mono);font-size:0.75rem">${f.dept}</span></div>`).join('')
    : `<p class="empty-msg">No faculty records yet.</p>`;

  const sList = store.get(KEYS.students).slice(-5).reverse();
  const sDiv  = document.getElementById('dash-recent-students');
  sDiv.innerHTML = sList.length
    ? sList.map(s => `<div class="row"><span>${s.name}</span><span style="color:var(--muted);font-family:var(--mono);font-size:0.75rem">Sem ${s.sem}</span></div>`).join('')
    : `<p class="empty-msg">No student records yet.</p>`;
}

updateDashboard();
