(function() {
        const app = document.getElementById('app');
        let state = {
            screen: 'tasks', // 'login' | 'register' | 'tasks'
            currentUser: null,
            users: null,
            tasks: null,
            loading: true,
            loginError: '',
            regError: '',
            showModal: false,
        };

        // ---------- storage helpers ----------
        async function getOrNull(key, shared) {
            try {
                const r = await window.storage.get(key, shared);
                return r ? JSON.parse(r.value) : null;
            } catch (e) {
                return null;
            }
        }
        async function set(key, value, shared) {
            try {
                await window.storage?.set(key, JSON.stringify(value), shared);
            } catch (e) { console.error('storage set failed', e); }
        }

        async function init() {
            let users = await getOrNull('users', true);
            if (!users) {
                users = [{ username: 'joao', password: '1234', name: 'João' }];
                await set('users', users, true);
            }
            let tasks = await getOrNull('tasks', true);
            if (!tasks) {
                tasks = [
                    { id: cryptoId(), title: 'Repor estoque de pão', time: '', completed: false, order: 0 },
                    { id: cryptoId(), title: 'Conferir pedidos do dia', time: '', completed: false, order: 1 },
                ];
                await set('tasks', tasks, true);
            }
            state.users = users;
            state.tasks = tasks.sort((a, b) => a.order - b.order);
            state.loading = false;
            render();
        }

        function cryptoId() {
            return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        }

        function titleCase(str) {
            return str.replace(/(^|[\s-])\S/g, c => c.toUpperCase());
        }

        function todayLabel() {
            const d = new Date();
            const raw = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
            return titleCase(raw);
        }

        // ---------- icons ----------
        const icoList = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h9"/><circle cx="4" cy="6" r="1.4" fill="#fff" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="#fff" stroke="none"/><path d="M3.2 17.5l1 1.4 2-2.4" /></svg>`;
        const icoLogout = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/></svg>`;
        const icoTrash = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
        const icoGrip = `<svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor"><circle cx="5" cy="4" r="1.6"/><circle cx="11" cy="4" r="1.6"/><circle cx="5" cy="10" r="1.6"/><circle cx="11" cy="10" r="1.6"/><circle cx="5" cy="16" r="1.6"/><circle cx="11" cy="16" r="1.6"/></svg>`;
        const icoPlus = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
        const icoCheck = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;

        // ---------- render ----------
        function render() {
            if (state.loading) {
                app.innerHTML = `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:14px;">Carregando…</div>`;
                return;
            }
            if (state.screen === 'login') return renderLogin();
            if (state.screen === 'register') return renderRegister();
            if (state.screen === 'tasks') return renderTasks();
        }

        function renderLogin() {
            app.innerHTML = `
      <div class="login-screen">
        <div class="brand-icon">${icoList}</div>
        <h1 class="brand-title">MinhaLista</h1>
        <p class="brand-sub">Organize o dia da sua equipe com clareza</p>
        <div class="login-card">
          <label class="field-label">Usuário</label>
          <input class="field-input" id="loginUser" placeholder="Digite seu usuário" autocomplete="off" />
          <label class="field-label">Senha</label>
          <input class="field-input" id="loginPass" type="password" placeholder="Digite sua senha" />
          <div class="error-msg">${state.loginError}</div>
          <button class="btn-primary" id="btnEntrar">Entrar</button>
          <button class="link-btn" id="btnCriarConta">Criar conta</button>
        </div>
        <div class="hint-box">Acesso de teste<br/>Usuário: <b>joao</b> &nbsp;|&nbsp; Senha: <b>1234</b></div>
      </div>
    `;
            document.getElementById('btnEntrar').onclick = doLogin;
            document.getElementById('btnCriarConta').onclick = () => {
                state.screen = 'register';
                state.regError = '';
                render();
            };
            const passEl = document.getElementById('loginPass');
            passEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
        }



        function doLogin() {
            const u = document.getElementById('loginUser').value.trim().toLowerCase();
            const p = document.getElementById('loginPass').value;
            const found = state.users.find(x => x.username.toLowerCase() === u && x.password === p);
            if (!found) {
                state.loginError = 'Usuário ou senha inválidos.';
                render();
                return;
            }
            state.currentUser = found;
            state.loginError = '';
            state.screen = 'tasks';
            render();
        }

        function renderRegister() {
            app.innerHTML = `
      <div class="login-screen">
        <div class="brand-icon">${icoList}</div>
        <h1 class="brand-title">Criar conta</h1>
        <p class="brand-sub">Junte-se à sua equipe no MinhaLista</p>
        <div class="login-card">
          <label class="field-label">Seu nome</label>
          <input class="field-input" id="regName" placeholder="Nome" />
          <label class="field-label">Usuário</label>
          <input class="field-input" id="regUser" placeholder="Escolha um usuário" autocomplete="off" />
          <label class="field-label">Senha</label>
          <input class="field-input" id="regPass" type="password" placeholder="Crie uma senha" />
          <div class="error-msg">${state.regError}</div>
          <button class="btn-primary" id="btnCadastrar">Cadastrar</button>
          <button class="link-btn" id="btnVoltarLogin">Já tenho conta</button>
        </div>
      </div>
    `;
            document.getElementById('btnVoltarLogin').onclick = () => {
                state.screen = 'login';
                state.loginError = '';
                render();
            };
            document.getElementById('btnCadastrar').onclick = doRegister;
        }

        async function doRegister() {
            const name = document.getElementById('regName').value.trim();
            const user = document.getElementById('regUser').value.trim().toLowerCase();
            const pass = document.getElementById('regPass').value;
            if (!name || !user || !pass) {
                state.regError = 'Preencha todos os campos.';
                render();
                return;
            }
            if (state.users.find(x => x.username.toLowerCase() === user)) {
                state.regError = 'Esse usuário já existe.';
                render();
                return;
            }
            const newUser = { username: user, password: pass, name };
            state.users.push(newUser);
            await set('users', state.users, true);
            state.currentUser = newUser;
            state.screen = 'tasks';
            render();
        }

        function priorityClass(p) { return 'priority-' + p; }

        function nextPriority(p) {
            if (p === 'baixa') return 'média';
            if (p === 'média') return 'alta';
            return 'baixa';
        }

        function renderTasks() {
            const tasks = state.tasks.slice().sort((a, b) => a.order - b.order);
            const pendentes = tasks.filter(t => !t.completed).length;
            const concluidas = tasks.filter(t => t.completed).length;

            app.innerHTML = `
      <div class="task-screen">
        <div class="task-header">
          <div class="header-top">
            <div>
              <div class="header-date">${todayLabel()}</div>
              <div class="header-title">Minhas Tarefas</div>
              <div class="header-greet"></div>
            </div>
            <button class="logout-btn" id="btnLogout" title="Sair">${icoLogout}</button>
          </div>
          <div class="stats-row">
            <div class="stat-card"><div class="stat-num">${pendentes}</div><div class="stat-label">Pendentes</div></div>
            <div class="stat-card"><div class="stat-num">${concluidas}</div><div class="stat-label">Concluídas</div></div>
            <div class="stat-card"><div class="stat-num">${tasks.length}</div><div class="stat-label">Total</div></div>
          </div>
        </div>

        <div class="task-body">
          <div class="section-row">
            <div class="section-label">A FAZER</div>
            <div class="section-hint">Arraste para reordenar</div>
          </div>
          <div class="task-list" id="taskList">
            ${tasks.length ? tasks.filter(t => !t.completed).map(taskCardHtml).join('') : `<div class="empty-state">Nenhuma tarefa ainda.<br/>Toque em "Nova tarefa" para começar.</div>`}
          </div>
          <div class="fab-wrap">
            <button class="fab-btn" id="btnNovaTarefa">${icoPlus} Nova tarefa</button>
          </div>
          <div class="task-list" id="taskList">
            ${tasks.length ? tasks.filter(t => t.completed).map(taskCardHtml).join('') : `<div class="empty-state">Nenhuma tarefa ainda.<br/>Toque em "Nova tarefa" para começar.</div>`}
          </div>
        </div>

        <div class="toast" id="toast"></div>
        ${state.showModal ? modalHtml() : ''}
      </div>
    `;

    document.getElementById('btnLogout').onclick = ()=>{
      state.currentUser = null;
      state.screen = 'login';
      render();
    };
    document.getElementById('btnNovaTarefa').onclick = ()=>{ state.showModal = true; render(); };

    // task interactions
    tasks.forEach(t=>{
      const card = document.getElementById('card-'+t.id);
      if(!card) return;
      card.querySelector('.checkbox').onclick = ()=> toggleComplete(t.id);
      card.querySelector('.delete-btn').onclick = ()=> deleteTask(t.id);
      const info = card.querySelector('.task-info');
      info.addEventListener('pointerdown', (e)=> startDrag(e, t.id));
    });

    if(state.showModal){
      wireModal();
    }
  }

  function taskCardHtml(t){
    return `
      <div class="task-card${t.completed?' completed':''}" id="card-${t.id}" data-id="${t.id}">
        <div class = "task-status">
        <div class="checkbox${t.completed?' checked':''}">${t.completed?icoCheck:''}</div>
        </div>
        <div class="task-info">
          <p class="task-title">${escapeHtml(t.title)}</p>
          <span class="task-time">${t.completed? escapeHtml(t.time||'' ): ''}</span>
        </div>
        <div class = "task-actions">
        <button class="delete-btn">${icoTrash}</button>
        </div>
      </div>
    `;
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function persistTasks(){
    await set('tasks', state.tasks, true);
  }

  function toggleComplete(id){
    const t = state.tasks.find(x=>x.id===id);
    t.completed = !t.completed;
    if(t.completed){
        const hora = new Date();
        t.time = hora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    persistTasks();
    render();
  }
  function cyclePriority(id){
    const t = state.tasks.find(x=>x.id===id);
    t.priority = nextPriority(t.priority);
    persistTasks();
    render();
  }
  function deleteTask(id){
    state.tasks = state.tasks.filter(x=>x.id!==id);
    state.tasks.forEach((t,i)=>t.order=i);
    persistTasks();
    render();
    showToast('Tarefa removida');
  }
  function showToast(msg){
    setTimeout(()=>{
      const el = document.getElementById('toast');
      if(!el) return;
      el.textContent = msg;
      el.classList.add('show');
      setTimeout(()=> el.classList.remove('show'), 1600);
    }, 10);
  }

  // ---------- drag & drop reorder (fixed-position ghost, never escapes viewport) ----------
  let drag = null;

  function startDrag(e, id){
    e.preventDefault();
    const list = document.getElementById('taskList');
    const card = document.getElementById('card-'+id);
    const rect = card.getBoundingClientRect();

    const ghost = card.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    document.body.appendChild(ghost);

    card.classList.add('placeholder-hidden');

    drag = {
      id,
      list,
      ghost,
      grabOffsetY: e.clientY - rect.top,
      order: Array.from(list.querySelectorAll('.task-card')).map(c => c.dataset.id),
    };

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
    window.addEventListener('pointercancel', onDragEnd);
  }

  function onDragMove(e){
    if(!drag) return;

    // keep the ghost fully inside the viewport vertically
    const gh = drag.ghost.getBoundingClientRect();
    let top = e.clientY - drag.grabOffsetY;
    top = Math.max(8, Math.min(window.innerHeight - gh.height - 8, top));
    drag.ghost.style.top = top + 'px';

    // figure out which slot we're hovering over, based on the real (non-ghost) cards
    const cards = Array.from(drag.list.querySelectorAll('.task-card'));
    const pointerY = e.clientY;
    let targetIndex = drag.order.length - 1;
    for(let i=0;i<cards.length;i++){
      const r = cards[i].getBoundingClientRect();
      const mid = r.top + r.height/2;
      if(pointerY < mid){
        targetIndex = drag.order.indexOf(cards[i].dataset.id);
        break;
      }
    }
    const fromIndex = drag.order.indexOf(drag.id);
    if(targetIndex !== fromIndex){
      drag.order.splice(fromIndex,1);
      drag.order.splice(targetIndex,0,drag.id);
      drag.order.forEach(cardId=>{
        const el = document.getElementById('card-'+cardId);
        if(el) drag.list.appendChild(el);
      });
    }
  }

  function onDragEnd(){
    if(!drag) return;
    drag.order.forEach((id,i)=>{
      const t = state.tasks.find(x=>x.id===id);
      if(t) t.order = i;
    });
    state.tasks.sort((a,b)=>a.order-b.order);

    drag.ghost.remove();
    const realCard = document.getElementById('card-'+drag.id);
    if(realCard) realCard.classList.remove('placeholder-hidden');

    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    window.removeEventListener('pointercancel', onDragEnd);

    persistTasks();
    drag = null;
  }

  // ---------- modal ----------
  function modalHtml(){
    return `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-sheet">
          <h3 class="modal-title">Nova tarefa</h3>
          <label class="field-label">Título</label>
          <input class="field-input" id="newTitle" placeholder="Ex: Organizar prateleiras" />
          <div class="modal-actions">
            <button class="btn-secondary" id="btnCancelar">Cancelar</button>
            <button class="btn-primary" id="btnSalvarTarefa">Adicionar tarefa</button>
          </div>
        </div>
      </div>
    `;
  }

  function wireModal(){
    document.getElementById('modalOverlay').addEventListener('click', (e)=>{
      if(e.target.id === 'modalOverlay'){ state.showModal=false; render(); }
    });
    document.getElementById('btnCancelar').onclick = ()=>{ state.showModal=false; render(); };
    document.getElementById('btnSalvarTarefa').onclick = addTask;
      const newTitle = document.getElementById('newTitle');
      newTitle.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  }

  async function addTask(){
    let title = document.getElementById('newTitle').value.trim();
    if(!title) return;
      title = title.substring(0, 1).toUpperCase()+title.substring(1)
    state.tasks.push({
      id: cryptoId(), title,
      completed:false, order: state.tasks.length
    });
    state.showModal = false;
    await persistTasks();
    render();
    showToast('Tarefa adicionada');
  }

  init();
})();