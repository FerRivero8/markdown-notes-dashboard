const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const buttons = document.querySelectorAll('.toolbar button');

// Split.js setup
Split(['#editor', '#preview'], {
  sizes: [50, 50],
  minSize: 200,
  gutterSize: 6,
  cursor: 'col-resize'
});

// Vista previa en tiempo real
editor.addEventListener('input', () => {
  preview.innerHTML = marked.parse(editor.value);
});
editor.dispatchEvent(new Event('input'));

// Formatear texto seleccionado
buttons.forEach(button => {
  button.addEventListener('click', async () => {
    const type = button.dataset.type;
    if (type) {
      applyMarkdown(type);
      preview.innerHTML = marked.parse(editor.value);
    } else if (button.id === 'save-to-dashboard') {
      const folder = await askUser('¿En qué carpeta quieres guardar el archivo?');
      const filename = await askUser('Nombre del archivo (ej: nota.md):');
      if (!folder || !filename.endsWith('.md')) {
        showToast('Carpeta requerida y archivo debe terminar en .md', 'error');
        return;
      }

      const content = editor.value;

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, filename, content })
      });

      const data = await res.json();
      if (data.status === 'ok') {
        showToast('¡Archivo guardado con éxito!', 'success');
      } else {
        showToast('Error al guardar el archivo.', 'error');
      }
    }
  });
});

function applyMarkdown(type) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;
  const selected = value.substring(start, end);
  let insertText = '';

  if (selected.length > 0) {
    switch (type) {
      case 'h1': insertText = `# ${selected}`; break;
      case 'h2': insertText = `## ${selected}`; break;
      case 'bold': insertText = `**${selected}**`; break;
      case 'italic': insertText = `*${selected}*`; break;
      case 'quote': insertText = `> ${selected}`; break;
      case 'ul': insertText = `- ${selected}`; break;
      case 'ol': insertText = `1. ${selected}`; break;
      case 'code': insertText = `\n\`\`\`\n${selected}\n\`\`\`\n`; break;
      case 'inline-code': insertText = `\`${selected}\``; break;
      case 'link': {
        insertText = `[${selected || 'enlace'}](https://)`;
        break;
      }
      case 'image': {
        insertText = `![${selected || 'descripción'}](https://)`;
        break;
      }
    }
    editor.setRangeText(insertText, start, end, 'end');
  } else {
    switch (type) {
      case 'h1': insertText = `# `; break;
      case 'h2': insertText = `## `; break;
      case 'bold': insertText = `**`; break;
      case 'italic': insertText = `*`; break;
      case 'quote': insertText = `> `; break;
      case 'ul': insertText = `- `; break;
      case 'ol': insertText = `1. `; break;
      case 'code': insertText = '\n```\n\n```\n'; break;
      case 'inline-code': insertText = '`'; break;
      case 'link': insertText = `[enlace](https://)`; break;
      case 'image': insertText = `![descripción](https://)`; break;
    }
    editor.setRangeText(insertText, start, start, 'end');
  }

  editor.focus();
}

// Toasts
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast');

  if (type === 'error') {
    toast.style.borderLeftColor = '#f44336';
  } else if (type === 'success') {
    toast.style.borderLeftColor = '#4caf50';
  }

  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4500);
}

// Modal input
function askUser(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const msg = document.getElementById('modal-message');
    const input = document.getElementById('modal-input');
    const btnOk = document.getElementById('modal-ok');
    const btnCancel = document.getElementById('modal-cancel');

    msg.textContent = message;
    input.value = '';
    input.classList.remove('hidden');
    modal.classList.remove('hidden');
    input.focus();

    function closeModal() {
      modal.classList.add('hidden');
      btnOk.removeEventListener('click', handleOk);
      btnCancel.removeEventListener('click', handleCancel);
    }

    function handleOk() {
      closeModal();
      resolve(input.value.trim());
    }

    function handleCancel() {
      closeModal();
      resolve(null);
    }

    btnOk.addEventListener('click', handleOk);
    btnCancel.addEventListener('click', handleCancel);
  });
}
