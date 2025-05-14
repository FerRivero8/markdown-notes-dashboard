document.addEventListener('DOMContentLoaded', async () => {
  const folderContainer = document.querySelector('.folder-structure');
  const viewer = document.getElementById('markdown-viewer');

  const sidebarToggle = document.getElementById('toggle-sidebar');
  sidebarToggle?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    sidebarToggle.innerHTML = isCollapsed ? '❯' : '❮';
  });

  document.querySelector('.sidebar-btn:nth-child(1)').addEventListener('click', async () => {
    const folder = prompt('Nombre de la nueva carpeta:');
    if (!folder) return;

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, filename: '.empty', content: '' })
    });

    if (res.ok) loadStructure();
  });

  document.querySelector('.sidebar-btn:nth-child(2)').addEventListener('click', async () => {
    const folder = prompt('¿En qué carpeta quieres subir el archivo?');
    const filename = prompt('Nombre del archivo (con .md):');
    const content = prompt('Pega el contenido Markdown aquí:');
    if (!folder || !filename.endsWith('.md')) return;

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, filename, content })
    });

    if (res.ok) loadStructure();
  });

  async function loadStructure() {
    folderContainer.innerHTML = '';
    const folderRes = await fetch('/api/folders');
    const folders = await folderRes.json();

    for (const folder of folders) {
      const folderEl = document.createElement('div');

      const folderHeader = document.createElement('div');
      folderHeader.classList.add('tree-item', 'item-label');
      folderHeader.style.display = 'flex';
      folderHeader.style.alignItems = 'center';
      folderHeader.style.justifyContent = 'space-between';
      folderHeader.style.padding = '4px';
      folderHeader.style.borderRadius = '4px';
      folderHeader.style.cursor = 'pointer';

      const folderName = document.createElement('span');
      folderName.innerHTML = `📁 <strong>${folder}</strong>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const addBtn = document.createElement('span');
      addBtn.textContent = '+';
      addBtn.className = 'add-md-btn';
      addBtn.title = 'Añadir archivo .md a esta carpeta';
      addBtn.onclick = async (e) => {
        e.stopPropagation();
        const filename = prompt('Nombre del nuevo archivo .md:');
        if (!filename?.endsWith('.md')) return;
        const content = prompt('Contenido inicial (opcional):') || '';
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder, filename, content })
        });
        if (res.ok) loadStructure();
      };

      const menuBtn = document.createElement('span');
      menuBtn.textContent = '⋯';
      menuBtn.className = 'add-md-btn';
      menuBtn.title = 'Opciones de carpeta';
      menuBtn.onclick = (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(`¿Eliminar la carpeta "${folder}" y su contenido?`);
        if (!confirmDelete) return;

        fetch(`/api/delete_folder?folder=${folder}`, { method: 'DELETE' })
          .then(res => res.ok && loadStructure());
      };

      actions.appendChild(addBtn);
      actions.appendChild(menuBtn);
      folderHeader.appendChild(folderName);
      folderHeader.appendChild(actions);
      folderEl.appendChild(folderHeader);

      const filesWrapper = document.createElement('div');
      filesWrapper.style.display = 'none';
      filesWrapper.style.marginLeft = '10px';

      folderHeader.addEventListener('click', () => {
        const isVisible = filesWrapper.style.display === 'block';
        filesWrapper.style.display = isVisible ? 'none' : 'block';
        folderName.innerHTML = `${isVisible ? '📁' : '📂'} <strong>${folder}</strong>`;
      });

      const filesRes = await fetch(`/api/files?folder=${folder}`);
      const files = await filesRes.json();

      files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.classList.add('tree-item', 'item-label');
        fileEl.style.display = 'flex';
        fileEl.style.justifyContent = 'space-between';
        fileEl.style.alignItems = 'center';
        fileEl.style.paddingLeft = '20px';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `📄 ${file}`;
        nameSpan.style.cursor = 'pointer';

        nameSpan.addEventListener('click', async () => {
          const fileRes = await fetch(`/data/${folder}/${file}`);
          const content = await fileRes.text();
          viewer.innerHTML = marked.parse(content);
        });

        const fileMenu = document.createElement('span');
        fileMenu.textContent = '⋯';
        fileMenu.className = 'add-md-btn';
        fileMenu.title = 'Eliminar archivo';
        fileMenu.onclick = (e) => {
          e.stopPropagation();
          const confirmDelete = confirm(`¿Eliminar el archivo "${file}"?`);
          if (!confirmDelete) return;

          fetch(`/api/delete_file?folder=${folder}&file=${file}`, { method: 'DELETE' })
            .then(res => res.ok && loadStructure());
        };

        fileEl.appendChild(nameSpan);
        fileEl.appendChild(fileMenu);
        filesWrapper.appendChild(fileEl);
      });

      folderEl.appendChild(filesWrapper);
      folderContainer.appendChild(folderEl);
    }
  }

  loadStructure();
});
