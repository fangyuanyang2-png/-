const form = document.getElementById('resume-form');
const resultBox = document.getElementById('result');

function showResult(message, isError) {
  resultBox.textContent = message;
  resultBox.hidden = false;
  resultBox.className = `result ${isError ? 'error' : 'success'}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  resultBox.hidden = true;

  try {
    const formData = new FormData(form);
    const response = await fetch('/api/submissions', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      showResult(data.error || '提交失败,请重试', true);
      return;
    }

    showResult('提交成功!感谢您的投递,我们会尽快查看您的简历。', false);
    form.reset();
  } catch (err) {
    showResult('网络错误,请稍后重试', true);
  } finally {
    submitButton.disabled = false;
  }
});
