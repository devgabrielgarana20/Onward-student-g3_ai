// ============================================================
//  BLOCO DE ESTUDOS - APLICAÇÃO COMPLETA
// ============================================================

// ----- ELEMENTOS -----
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

// Telas
const listView = document.getElementById('listView');
const notebookView = document.getElementById('notebookView');
const backToListBtn = document.getElementById('backToList');
const notebookTitle = document.getElementById('notebookTitle');
const notebookDate = document.getElementById('notebookDate');
const notebookContent = document.getElementById('notebookContent');
const saveNotebookBtn = document.getElementById('saveNotebook');
const wordCount = document.getElementById('wordCount');

// Modais
const notebookModal = document.getElementById('notebookModal');
const modalTitle = document.getElementById('modalTitle');
const modalSubmitText = document.getElementById('modalSubmitText');
const notebookForm = document.getElementById('notebookForm');
const editId = document.getElementById('editId');
const modalTitleInput = document.getElementById('modalTitleInput');
const modalDescription = document.getElementById('modalDescription');
const modalDate = document.getElementById('modalDate');
const closeModal = document.getElementById('closeModal');

const aboutModal = document.getElementById('aboutModal');
const closeAbout = document.getElementById('closeAbout');

// Menu
const menuToggle = document.getElementById('menuToggle');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const closeDrawer = document.getElementById('closeDrawer');
const addNotebookBtn = document.getElementById('addNotebookBtn');

// Itens do menu
const drawerConfig = document.getElementById('drawerConfig');
const drawerExport = document.getElementById('drawerExport');
const drawerImport = document.getElementById('drawerImport');
const drawerRedirect = document.getElementById('drawerRedirect');
const drawerAbout = document.getElementById('drawerAbout');
const importFileInput = document.getElementById('importFileInput');

// ----- ESTADO -----
let notebooks = [];          // Array de objetos { id, title, description, date, content }
let currentNotebookId = null; // ID do bloco aberto no caderno
let isNewNotebook = false;

// ----- CARREGAR DADOS -----
function loadNotebooks() {
    const stored = localStorage.getItem('studyNotebooks');
    if (stored) {
        try {
            notebooks = JSON.parse(stored);
        } catch (e) {
            notebooks = [];
        }
    } else {
        // Dados de exemplo
        notebooks = [
            {
                id: Date.now() + 1,
                title: 'Matemática - Funções',
                description: 'Revisão de funções quadráticas',
                date: new Date().toISOString().split('T')[0],
                content: 'Estudei funções quadráticas, vértice, raízes e gráficos. Fiz vários exercícios.'
            },
            {
                id: Date.now() + 2,
                title: 'História - Revolução Francesa',
                description: 'Causas e fases',
                date: new Date().toISOString().split('T')[0],
                content: 'Li sobre as causas sociais, econômicas e políticas. Assisti a um documentário.'
            }
        ];
        saveNotebooks();
    }
    renderNotebooks();
}

function saveNotebooks() {
    localStorage.setItem('studyNotebooks', JSON.stringify(notebooks));
}

// ----- RENDERIZAR LISTA -----
function renderNotebooks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortValue = sortSelect.value;

    let filtered = notebooks.filter(nb => {
        return nb.title.toLowerCase().includes(searchTerm) ||
               (nb.description && nb.description.toLowerCase().includes(searchTerm));
    });

    // Ordenação
    switch (sortValue) {
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            break;
    }

    if (filtered.length === 0) {
        notesContainer.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:#888; padding:2rem 0;">
                <i class="fas fa-book-open" style="font-size:2.5rem; color:#b3d9ff;"></i>
                <p>Nenhum bloco encontrado. Crie seu primeiro bloco!</p>
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(nb => {
        const preview = nb.content ? nb.content.substring(0, 80) + (nb.content.length > 80 ? '...' : '') : 'Sem conteúdo';
        html += `
            <div class="note-card" data-id="${nb.id}">
                <h3>${escapeHtml(nb.title)}</h3>
                ${nb.description ? `<p class="note-description">${escapeHtml(nb.description)}</p>` : ''}
                <div class="note-date"><i class="far fa-calendar-alt"></i> ${formatDate(nb.date)}</div>
                <div class="note-preview">${escapeHtml(preview)}</div>
                <div class="card-actions">
                    <button class="open-btn" data-id="${nb.id}"><i class="fas fa-book"></i> Abrir</button>
                    <button class="edit-meta-btn" data-id="${nb.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${nb.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });

    notesContainer.innerHTML = html;

    // Event listeners dos botões
    document.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openNotebook(id);
        });
    });
    document.querySelectorAll('.edit-meta-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            openEditModal(id);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (confirm('Tem certeza que deseja excluir este bloco?')) {
                deleteNotebook(id);
            }
        });
    });
    // Clicar no card abre o bloco (exceto se clicar em botão)
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const id = parseInt(card.dataset.id);
            openNotebook(id);
        });
    });
}

// ----- FUNÇÕES AUXILIARES -----
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', options);
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ----- CRUD -----
function deleteNotebook(id) {
    notebooks = notebooks.filter(nb => nb.id !== id);
    saveNotebooks();
    renderNotebooks();
}

function openEditModal(id) {
    const nb = notebooks.find(n => n.id === id);
    if (!nb) return;
    editId.value = nb.id;
    modalTitleInput.value = nb.title;
    modalDescription.value = nb.description || '';
    modalDate.value = nb.date;
    modalTitle.textContent = 'Editar Bloco';
    modalSubmitText.textContent = 'Atualizar';
    notebookModal.classList.add('active');
}

function closeModalFn() {
    notebookModal.classList.remove('active');
    notebookForm.reset();
    editId.value = '';
    modalTitle.textContent = 'Novo Bloco';
    modalSubmitText.textContent = 'Criar';
}

function submitNotebookForm(e) {
    e.preventDefault();
    const id = editId.value ? parseInt(editId.value) : null;
    const title = modalTitleInput.value.trim();
    const description = modalDescription.value.trim();
    const date = modalDate.value;

    if (!title || !date) {
        alert('Preencha título e data.');
        return;
    }

    if (id) {
        // Edição
        const index = notebooks.findIndex(n => n.id === id);
        if (index !== -1) {
            notebooks[index].title = title;
            notebooks[index].description = description;
            notebooks[index].date = date;
        }
    } else {
        // Novo
        const newNb = {
            id: generateId(),
            title,
            description,
            date,
            content: ''
        };
        notebooks.push(newNb);
    }
    saveNotebooks();
    closeModalFn();
    renderNotebooks();
}

// ----- ABRIR CADERNO -----
function openNotebook(id) {
    const nb = notebooks.find(n => n.id === id);
    if (!nb) return;
    currentNotebookId = id;
    isNewNotebook = false;
    notebookTitle.textContent = nb.title;
    notebookDate.textContent = formatDate(nb.date);
    notebookContent.value = nb.content || '';
    updateWordCount();
    listView.style.display = 'none';
    notebookView.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Foco no textarea
    setTimeout(() => notebookContent.focus(), 100);
}

function closeNotebook() {
    notebookView.style.display = 'none';
    listView.style.display = 'block';
    document.body.style.overflow = '';
    currentNotebookId = null;
    renderNotebooks(); // atualiza preview
}

function saveNotebookContent() {
    if (currentNotebookId === null) return;
    const index = notebooks.findIndex(n => n.id === currentNotebookId);
    if (index === -1) return;
    notebooks[index].content = notebookContent.value;
    saveNotebooks();
    // Feedback
    saveNotebookBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
    setTimeout(() => {
        saveNotebookBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }, 1500);
    updateWordCount();
}

function updateWordCount() {
    const text = notebookContent.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    wordCount.textContent = `${words} palavra${words !== 1 ? 's' : ''}`;
}

// ----- EXPORT / IMPORT -----
function exportData() {
    const dataStr = JSON.stringify(notebooks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocos_estudo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                if (confirm(`Deseja substituir todos os blocos atuais (${notebooks.length}) pelos importados (${data.length})?`)) {
                    notebooks = data;
                    saveNotebooks();
                    renderNotebooks();
                    alert('Importação concluída!');
                }
            } else {
                alert('Arquivo inválido.');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ----- MENU LATERAL -----
function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeDrawerFn() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ----- INICIALIZAÇÃO -----
function init() {
    loadNotebooks();

    // Eventos do formulário de bloco
    notebookForm.addEventListener('submit', submitNotebookForm);
    closeModal.addEventListener('click', closeModalFn);
    window.addEventListener('click', (e) => {
        if (e.target === notebookModal) closeModalFn();
        if (e.target === aboutModal) aboutModal.classList.remove('active');
    });

    // Botão Novo Bloco (header)
    addNotebookBtn.addEventListener('click', () => {
        editId.value = '';
        modalTitleInput.value = '';
        modalDescription.value = '';
        modalDate.value = new Date().toISOString().split('T')[0];
        modalTitle.textContent = 'Novo Bloco';
        modalSubmitText.textContent = 'Criar';
        notebookModal.classList.add('active');
    });

    // Caderno
    backToListBtn.addEventListener('click', closeNotebook);
    saveNotebookBtn.addEventListener('click', saveNotebookContent);
    notebookContent.addEventListener('input', updateWordCount);

    // Busca e ordenação
    searchInput.addEventListener('input', renderNotebooks);
    sortSelect.addEventListener('change', renderNotebooks);

    // Menu
    menuToggle.addEventListener('click', openDrawer);
    closeDrawer.addEventListener('click', closeDrawerFn);
    overlay.addEventListener('click', closeDrawerFn);

    // Itens do menu
    drawerConfig.addEventListener('click', () => {
        alert('Configurações em desenvolvimento.');
        closeDrawerFn();
    });
    drawerExport.addEventListener('click', () => {
        exportData();
        closeDrawerFn();
    });
    drawerImport.addEventListener('click', () => {
        importFileInput.click();
        closeDrawerFn();
    });
    importFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
        }
        e.target.value = '';
    });
    drawerRedirect.addEventListener('click', () => {
        window.location.href = 'https://exemplo.com/outra-pagina';
        closeDrawerFn();
    });
    drawerAbout.addEventListener('click', () => {
        aboutModal.classList.add('active');
        closeDrawerFn();
    });
    closeAbout.addEventListener('click', () => {
        aboutModal.classList.remove('active');
    });

    // Data padrão no modal
    if (!modalDate.value) {
        modalDate.value = new Date().toISOString().split('T')[0];
    }
}

document.addEventListener('DOMContentLoaded', init);