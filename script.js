const STORAGE_KEY = 'form_tracker_v1';
let forms = [];

async function load() {
  try {
    const r = await window.localStorage.getItem(STORAGE_KEY);
    if (r) forms = JSON.parse(r);
  } catch(e) { forms = []; }
  render();
}

async function save() {
  try { await window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forms)); } catch(e) {}
}

function toggleAdd() {
  const el = document.getElementById('add-form');
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) {
    document.getElementById('inp-name').focus();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inp-deadline').value = '';
  }
}

function addForm() {
  const name = document.getElementById('inp-name').value.trim();
  if (!name) { document.getElementById('inp-name').focus(); return; }
  const f = {
    id: Date.now().toString(),
    name,
    url: document.getElementById('inp-url').value.trim(),
    deadline: document.getElementById('inp-deadline').value,
    submitted: false,
    submittedAt: null,
    createdAt: new Date().toISOString()
  };
  forms.unshift(f);
  save();
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-url').value = '';
  document.getElementById('inp-deadline').value = '';
  document.getElementById('add-form').classList.add('hidden');
  render();
}

function markSubmitted(id) {
  const f = forms.find(x => x.id === id);
  if (!f) return;
  f.submitted = true;
  f.submittedAt = new Date().toISOString();
  save(); render();
}

function markUnsubmitted(id) {
  const f = forms.find(x => x.id === id);
  if (!f) return;
  f.submitted = false;
  f.submittedAt = null;
  save(); render();
}

function deleteForm(id) {
  forms = forms.filter(x => x.id !== id);
  save(); render();
}

function getStatus(f) {
  if (f.submitted) return 'done';
  if (f.deadline) {
    const d = new Date(f.deadline + 'T23:59:59');
    if (new Date() > d) return 'overdue';
  }
  return 'pending';
}

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function render() {
  const total = forms.length;
  const done = forms.filter(f => getStatus(f) === 'done').length;
  const overdue = forms.filter(f => getStatus(f) === 'overdue').length;

  document.getElementById('stats').innerHTML = `
    <div class="stat bg-white p-5 rounded-2xl"><div class="stat-num text-2xl">${total}</div><div class="stat-label text-sm">Total forms</div></div>
    <div class="stat bg-white p-5 rounded-2xl"><div class="stat-num text-2xl" style="color:#3B6D11">${done}</div><div class="stat-label text-sm">Submitted</div></div>
  `;

  if (!forms.length) {
    document.getElementById('forms-list').innerHTML = '<div class="empty text-center py-3">No forms yet. Click "+ Add form" to get started.</div>';
    return;
  }

  const sorted = [...forms].sort((a,b) => {
    const order = {overdue:0, pending:1, done:2};
    return order[getStatus(a)] - order[getStatus(b)];
  });

  document.getElementById('forms-list').innerHTML = sorted.map(f => {
    const status = getStatus(f);
    const badgeClass = status === 'done' ? 'badge-done' : status === 'overdue' ? 'badge-overdue' : 'badge-pending';
    const badgeLabel = status === 'done' ? '✓ Submitted' : status === 'overdue' ? '! Overdue' : '○ Pending';
    const meta = [];
    if (f.deadline) meta.push('Due ' + fmt(f.deadline));
    if (f.submitted && f.submittedAt) meta.push('Submitted ' + fmt(f.submittedAt));
    return `
      <div class="flex flex-col bg-white/70 p-5 rounded-xl">
        <div class="item">
          <div class="item-info">
            <div class="item-name font-semibold text-lg">${f.name}</div>
            <div class="item-meta">${meta.join(' · ')}</div>
            ${f.url ? `<a href="${f.url}" class="link text-sm text-blue-500" target="_blank">Open form ↗</a>` : ''}
          </div>
          <div class="item-actions">
            <span class="badge ${badgeClass}">${badgeLabel}</span>
          </div>
        </div>
        <hr class="divider" />
        <div style="flex gap-8 flex-wrap">
          ${status !== 'done'
            ? `<button class="p-2 rounded-lg cursor-pointer transition duration-300 ease-in-out hover:bg-black/5 active:bg-black/10 border-2 border-gray-100" onclick="markSubmitted('${f.id}')">Mark as submitted</button>`
            : `<button class="p-2 rounded-lg cursor-pointer transition duration-300 ease-in-out hover:bg-black/5 active:bg-black/10 border-2 border-gray-100" onclick="markUnsubmitted('${f.id}')">Undo submission</button>`
          }
          <button class="btn-danger" onclick="deleteForm('${f.id}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

load();
