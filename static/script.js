document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
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
          showToast(`Archivo "${filename}" creado en "${folder}".`, 'success');
        } else {
          showToast('Error al crear el archivo.', 'error');
        }
      };

      const menuBtn = document.createElement('span');
      menuBtn.textContent = '⋯';
      menuBtn.className = 'add-md-btn';
      menuBtn.title = 'Opciones de carpeta';
      menuBtn.onclick = async (e) => {
        e.stopPropagation();
        const confirmed = await confirmAction(`¿Eliminar la carpeta "${folder}" y su contenido?`);
        if (!confirmed) return;

        fetch(`/api/delete_folder?folder=${folder}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(res => {
            if (res.ok) {
              loadStructure();
              showToast(`Carpeta "${folder}" eliminada.`, 'success');
            } else {
              showToast('Error al eliminar la carpeta.', 'error');
            }
          });
      };

      folderHeader.addEventListener('dragover', (e) => {
        e.preventDefault();
        folderHeader.style.backgroundColor = '#2e2e2e';
      });

      folderHeader.addEventListener('dragleave', () => {
        folderHeader.style.backgroundColor = '';
      });

      folderHeader.addEventListener('drop', async (e) => {
        e.preventDefault();
        folderHeader.style.backgroundColor = '';

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const { filename, fromFolder } = data;
        const toFolder = folder;

        if (fromFolder === toFolder) {
          return showToast("El archivo ya está en esta carpeta.", 'info');
        }

        const res = await fetch('/api/move_file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            file: filename,
            source: fromFolder,
            target: toFolder
          })
        });

        if (res.ok) {
          showToast(`"${filename}" movido a "${toFolder}".`, 'success');
          await loadStructure();
        } else {
          showToast('Error al mover el archivo.', 'error');
        }
      });

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

      const filesRes = await fetch(`/api/files?folder=${folder}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const files = await filesRes.json();

      files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.classList.add('tree-item', 'item-label');
        fileEl.style.display = 'flex';
        fileEl.style.justifyContent = 'space-between';
        fileEl.style.alignItems = 'center';
        fileEl.style.paddingLeft = '20px';
        fileEl.setAttribute('draggable', 'true');
        fileEl.dataset.filename = file;
        fileEl.dataset.folder = folder;

        fileEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            filename: file,
            fromFolder: folder
          }));
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `📄 ${file}`;
        nameSpan.style.cursor = 'pointer';

        nameSpan.addEventListener('click', async () => {
          const fileRes = await fetch(`/data/${folder}/${file}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const content = await fileRes.text();
          viewer.innerHTML = marked.parse(content);
          showToast(`Visualizando "${file}".`);
        });

        const fileMenu = document.createElement('span');
        fileMenu.textContent = '⋯';
        fileMenu.className = 'add-md-btn';
        fileMenu.title = 'Eliminar archivo';
        fileMenu.onclick = async (e) => {
          e.stopPropagation();
          const confirmed = await confirmAction(`¿Eliminar el archivo "${file}"?`);
          if (!confirmed) return;

          fetch(`/api/delete_file?folder=${folder}&file=${file}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
          })
            .then(res => {
              if (res.ok) {
                loadStructure();
                showToast(`Archivo "${file}" eliminado.`, 'success');
              } else {
                showToast('Error al eliminar el archivo.', 'error');
              }
            });
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
