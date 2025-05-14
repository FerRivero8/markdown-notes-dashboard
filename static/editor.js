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

// Marcar línea activa visualmente
editor.addEventListener('input', highlightCurrentLine);
editor.addEventListener('click', highlightCurrentLine);
editor.addEventListener('keydown', highlightCurrentLine);

function highlightCurrentLine() {
  const value = editor.value;
  const lines = value.split('\n');
  const pos = editor.selectionStart;

  let charCount = 0;
  let currentLine = 0;

  for (let i = 0; i < lines.length; i++) {
    if (charCount + lines[i].length >= pos) {
      currentLine = i;
      break;
    }
    charCount += lines[i].length + 1;
  }

  const highlighted = lines.map((line, index) => {
    return index === currentLine
      ? `<div style="background-color: #2a2a2a; padding: 2px 0;">${line || '&nbsp;'}</div>`
      : `<div>${line || '&nbsp;'}</div>`;
  }).join('');

  preview.innerHTML = marked.parse(value);

  // Optional: show raw lines with highlighting for debug
  // preview.innerHTML = highlighted;
}

// Formatear selección o línea actual
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.type;
    applyMarkdown(type);
    preview.innerHTML = marked.parse(editor.value);
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
        const url = prompt('Introduce la URL:', 'https://');
        if (!url) return;
        insertText = `[${selected || 'enlace'}](${url})`;
        break;
      }
      case 'image': {
        const url = prompt('Introduce la URL de la imagen:');
        if (!url) return;
        insertText = `![${selected || 'descripción'}](${url})`;
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
      case 'link': {
        const url = prompt('Introduce la URL:', 'https://');
        if (!url) return;
        insertText = `[enlace](${url})`;
        break;
      }
      case 'image': {
        const url = prompt('Introduce la URL de la imagen:');
        if (!url) return;
        insertText = `![descripción](${url})`;
        break;
      }
    }
    editor.setRangeText(insertText, start, start, 'end');
  }

  editor.focus();
}


document.getElementById('save-to-dashboard').addEventListener('click', async () => {
  const folder = prompt('¿En qué carpeta quieres guardar este archivo?');
  const filename = prompt('Nombre del archivo (ej: nota.md):');

  if (!folder || !filename.endsWith('.md')) {
    alert('Carpeta requerida y el archivo debe terminar en .md');
    return;
  }

  const content = editor.value; // el contenido del <textarea>

  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, filename, content })
  });

  const data = await res.json();
  if (data.status === 'ok') {
    alert('¡Archivo guardado con éxito en el dashboard!');
  } else {
    alert('Error al guardar el archivo.');
  }
});
