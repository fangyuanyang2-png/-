const tbody = document.getElementById('submissions-body');
const resultBox = document.getElementById('result');
const refreshBtn = document.getElementById('refresh-btn');

const STATUS_LABELS = {
  new: '新提交',
  reviewed: '已查看',
  accepted: '已录用',
  rejected: '未通过',
};

function showError(message) {
  resultBox.textContent = message;
  resultBox.hidden = false;
  resultBox.className = 'result error';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN');
}

function buildStatusSelect(submission) {
  const select = document.createElement('select');
  for (const [value, label] of Object.entries(STATUS_LABELS)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === submission.status) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener('change', async () => {
    select.disabled = true;
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: select.value }),
      });
      if (!res.ok) {
        const data = await res.json();
        showError(data.error || '更新状态失败');
      }
    } catch (err) {
      showError('网络错误,更新状态失败');
    } finally {
      select.disabled = false;
    }
  });
  return select;
}

function buildRow(submission) {
  const tr = document.createElement('tr');

  const cells = [
    formatDate(submission.createdAt),
    submission.name,
    submission.email,
    submission.phone || '-',
    submission.position || '-',
    submission.message || '-',
  ];

  for (const value of cells) {
    const td = document.createElement('td');
    td.textContent = value;
    tr.appendChild(td);
  }

  const resumeTd = document.createElement('td');
  const link = document.createElement('a');
  link.href = `/api/submissions/${submission.id}/resume`;
  link.textContent = submission.resumeOriginalName;
  link.className = 'download-link';
  resumeTd.appendChild(link);
  tr.appendChild(resumeTd);

  const statusTd = document.createElement('td');
  statusTd.appendChild(buildStatusSelect(submission));
  tr.appendChild(statusTd);

  return tr;
}

async function loadSubmissions() {
  resultBox.hidden = true;
  tbody.innerHTML = '';
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) {
      showError('加载失败,请检查登录信息');
      return;
    }
    const submissions = await res.json();
    if (submissions.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8;
      td.textContent = '暂无投递记录';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    for (const submission of submissions) {
      tbody.appendChild(buildRow(submission));
    }
  } catch (err) {
    showError('网络错误,加载失败');
  }
}

refreshBtn.addEventListener('click', loadSubmissions);
loadSubmissions();
