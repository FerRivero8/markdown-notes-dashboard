// script.js actualizado con menú contextual para carpetas y archivos

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = '/login';
    return;
  }

  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');

  if (avatarEl) avatarEl.src = '/static/' + user.avatar;
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }

  const folderContainer = document.querySelector('.folder-structure');
  const viewer = document.getElementById('markdown-viewer');

  const sidebarToggle = document.getElementById('toggle-sidebar');
  sidebarToggle?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    sidebarToggle.innerHTML = isCollapsed ? '❯' : '❮';
    document.body.classList.toggle('sidebar-hidden', isCollapsed);
  });

  document.querySelector('.sidebar-btn:nth-child(1)').addEventListener('click', async () => {
    const folder = await askUser('Nombre de la nueva carpeta:');
    if (!folder) return;

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ folder, filename: '.empty', content: '' })
    });

    if (res.ok) {
      loadStructure();
      showToast(`Carpeta "${folder}" creada.`, 'success');
    } else {
      showToast('Error al crear la carpeta.', 'error');
    }
  });

  const contextMenu = document.getElementById('context-menu');
  const renameOption = document.getElementById('rename-option');
  const deleteOption = document.getElementById('delete-option');

  let selectedFile = null;
  let selectedFolder = null;
  let isFolderContext = false;

  document.addEventListener('click', () => {
    contextMenu.classList.add('hidden');
  });

  async function loadStructure() {
    folderContainer.innerHTML = '';
    const folderRes = await fetch('/api/folders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const folders = await folderRes.json();

    for (const folder of folders) {
      const folderEl = document.createElement('div');
      const folderHeader = document.createElement('div');
      folderHeader.classList.add('tree-item', 'item-label');
      folderHeader.style.display = 'flex';
      folderHeader.style.alignItems = 'center';
      folderHeader.style.justifyContent = 'space-between';

      const folderName = document.createElement('span');
      folderName.innerHTML = `📁 <strong>${folder}</strong>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const addBtn = document.createElement('span');
      addBtn.textContent = '+';
      addBtn.className = 'add-md-btn';
      addBtn.title = 'Añadir archivo .md';
      addBtn.onclick = async (e) => {
        e.stopPropagation();
        const filename = await askUser('Nombre del nuevo archivo .md:');
        if (!filename?.endsWith('.md')) return;
        const content = await askUser('Contenido inicial (opcional):') || '';
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ folder, filename, content })
        });
        if (res.ok) {
          loadStructure();
          showToast(`Archivo "${filename}" creado.`, 'success');
        } else {
          showToast('Error al crear archivo.', 'error');
        }
      };

      const menuBtn = document.createElement('span');
      menuBtn.textContent = '⋯';
      menuBtn.className = 'add-md-btn';
      menuBtn.title = 'Opciones de carpeta';
      menuBtn.onclick = (e) => {
        e.stopPropagation();
        selectedFolder = folder;
        selectedFile = null;
        isFolderContext = true;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.classList.remove('hidden');
      };

      folderHeader.addEventListener('dragover', e => e.preventDefault());
      folderHeader.addEventListener('drop', async e => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const res = await fetch('/api/move_file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ file: data.filename, source: data.fromFolder, target: folder })
        });
        if (res.ok) {
          showToast(`Archivo movido a "${folder}"`, 'success');
          loadStructure();
        } else {
          showToast('Error al mover archivo.', 'error');
        }
      });

      actions.appendChild(addBtn);
      actions.appendChild(menuBtn);
      folderHeader.appendChild(folderName);
      folderHeader.appendChild(actions);
      folderEl.appendChild(folderHeader);

      const filesWrapper = document.createElement('div');
      filesWrapper.style.display = 'none';
      folderHeader.addEventListener('click', () => {
        const visible = filesWrapper.style.display === 'block';
        filesWrapper.style.display = visible ? 'none' : 'block';
        folderName.innerHTML = `${visible ? '📁' : '📂'} <strong>${folder}</strong>`;
      });

      const filesRes = await fetch(`/api/files?folder=${folder}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const files = await filesRes.json();

      files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.classList.add('tree-item', 'item-label');
        fileEl.style.justifyContent = 'space-between';
        fileEl.style.paddingLeft = '20px';
        fileEl.setAttribute('draggable', 'true');

        fileEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ filename: file, fromFolder: folder }));
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `📄 ${file}`;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = async () => {
          const fileRes = await fetch(`/data/${folder}/${file}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const content = await fileRes.text();
          viewer.innerHTML = marked.parse(content);
          showToast(`Visualizando "${file}".`);
        };

        const fileMenu = document.createElement('span');
        fileMenu.textContent = '⋯';
        fileMenu.className = 'add-md-btn';
        fileMenu.onclick = (e) => {
          e.stopPropagation();
          selectedFile = file;
          selectedFolder = folder;
          isFolderContext = false;
          contextMenu.style.top = `${e.clientY}px`;
          contextMenu.style.left = `${e.clientX}px`;
          contextMenu.classList.remove('hidden');
        };

        fileEl.appendChild(nameSpan);
        fileEl.appendChild(fileMenu);
        filesWrapper.appendChild(fileEl);
      });

      folderEl.appendChild(filesWrapper);
      folderContainer.appendChild(folderEl);
    }
  }

  renameOption.addEventListener('click', async () => {
    contextMenu.classList.add('hidden');
    const newName = await askUser(`Nuevo nombre para ${isFolderContext ? 'la carpeta' : 'el archivo'}:`);
    if (!newName || (!isFolderContext && !newName.endsWith('.md'))) {
      showToast('Nombre inválido', 'error');
      return;
    }
    const endpoint = isFolderContext ? '/api/rename_folder' : '/api/rename_file';
    const body = isFolderContext
      ? { old_name: selectedFolder, new_name: newName }
      : { folder: selectedFolder, old_name: selectedFile, new_name: newName };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok && data.status === 'renamed') {
      showToast(`${isFolderContext ? 'Carpeta' : 'Archivo'} renombrado a "${newName}"`, 'success');
      await loadStructure();
    } else {
      showToast(data.message || 'Error al renombrar', 'error');
    }
  });

  deleteOption.addEventListener('click', async () => {
    contextMenu.classList.add('hidden');
    const confirmed = await confirmAction(`¿Eliminar ${isFolderContext ? 'la carpeta' : 'el archivo'} "${isFolderContext ? selectedFolder : selectedFile}"?`);
    if (!confirmed) return;
    const res = await fetch(
      isFolderContext
        ? `/api/delete_folder?folder=${selectedFolder}`
        : `/api/delete_file?folder=${selectedFolder}&file=${selectedFile}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      }
    );
    if (res.ok) {
      showToast(`${isFolderContext ? 'Carpeta' : 'Archivo'} eliminado`, 'success');
      loadStructure();
    } else {
      showToast('Error al eliminar', 'error');
    }
  });

  loadStructure();
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast');
  if (type === 'error') toast.style.borderLeftColor = '#f44336';
  if (type === 'success') toast.style.borderLeftColor = '#4caf50';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

function askUser(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const msg = document.getElementById('modal-message');
    const input = document.getElementById('modal-input');
    const btnOk = document.getElementById('modal-ok');
    const btnCancel = document.getElementById('modal-cancel');

    msg.textContent = message;
    input.value = '';
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

function confirmAction(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const msg = document.getElementById('modal-message');
    const input = document.getElementById('modal-input');
    const btnOk = document.getElementById('modal-ok');
    const btnCancel = document.getElementById('modal-cancel');

    msg.textContent = message;
    input.classList.add('hidden');
    modal.classList.remove('hidden');

    function closeModal() {
      modal.classList.add('hidden');
      input.classList.remove('hidden');
      btnOk.removeEventListener('click', handleOk);
      btnCancel.removeEventListener('click', handleCancel);
    }

    function handleOk() {
      closeModal();
      resolve(true);
    }

    function handleCancel() {
      closeModal();
      resolve(false);
    }

    btnOk.addEventListener('click', handleOk);
    btnCancel.addEventListener('click', handleCancel);
  });
}
