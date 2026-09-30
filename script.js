(() => {
  'use strict';

  const STORAGE_KEY = 'taskmate-projects-v1';
  const state = {
    project: null,
    currentView: 'task',
    editingTaskId: null,
    confirmAction: null,
    toastTimer: null,
    lastFocusedElement: null,
  };

  const projectTemplates = {
    reporting: {
      name: 'Reporting',
      tasks: [
        ['PPT Creation', 'Create and organize the presentation slides.'],
        ['Research & Documentation', 'Research the required information and references.'],
        ['Reporting', 'Prepare and deliver the presentation clearly.'],
        ['Q&A Preparation', 'Prepare possible questions and strong answers.'],
        ['Final Checking', 'Review the final presentation and materials.'],
      ],
    },
    research: {
      name: 'Research',
      tasks: [
        ['Topic & Scope', 'Clarify the research focus, objectives, and scope.'],
        ['Literature Review', 'Gather and synthesize relevant references and prior studies.'],
        ['Data Collection', 'Prepare and carry out the chosen data gathering method.'],
        ['Data Analysis', 'Organize, interpret, and summarize collected data.'],
        ['Research Writing', 'Write and revise the research sections.'],
        ['References & Final Review', 'Check citations, formatting, consistency, and completeness.'],
      ],
    },
    capstone: {
      name: 'Capstone Project',
      tasks: [
        ['Front-End Development', 'Build the user interface and client-side interactions.'],
        ['Back-End Development', 'Implement server-side functionality and application logic.'],
        ['Database Development', 'Design, implement, and maintain the database.'],
        ['UI/UX Design', 'Plan and refine the product experience and interface.'],
        ['Documentation', 'Prepare technical and academic project documentation.'],
        ['Testing / QA', 'Test the application, log issues, and verify fixes.'],
        ['Project Integration', 'Combine major project components and prepare the final build.'],
      ],
    },
    software: {
      name: 'Software Development',
      tasks: [
        ['Requirements', 'Define features, constraints, and acceptance criteria.'],
        ['UI/UX', 'Create flows, wireframes, and visual interface decisions.'],
        ['Front-End', 'Implement the user-facing application.'],
        ['Back-End', 'Implement APIs, logic, and server-side behavior.'],
        ['Database', 'Design data structures and persistence.'],
        ['Testing', 'Test features, resolve defects, and verify quality.'],
        ['Deployment & Documentation', 'Prepare the release and supporting documentation.'],
      ],
    },
    presentation: {
      name: 'Presentation',
      tasks: [
        ['Content Planning', 'Organize the presentation flow and key messages.'],
        ['Research', 'Gather facts, examples, references, and supporting material.'],
        ['Slide Design', 'Create clear and consistent presentation slides.'],
        ['Speaking Parts', 'Prepare and rehearse assigned speaking sections.'],
        ['Q&A Preparation', 'Prepare possible audience questions and responses.'],
        ['Final Rehearsal', 'Run through the full presentation and make final improvements.'],
      ],
    },
    assignment: {
      name: 'Group Assignment',
      tasks: [
        ['Requirements Review', 'Review instructions, rubric, and submission requirements.'],
        ['Research', 'Collect information needed to complete the assignment.'],
        ['Drafting', 'Create the main written or practical output.'],
        ['Review & Editing', 'Check clarity, correctness, and consistency.'],
        ['Formatting', 'Prepare the final layout and required format.'],
        ['Submission Check', 'Verify files, references, and submission details.'],
      ],
    },
    'case-study': {
      name: 'Case Study',
      tasks: [
        ['Case Background', 'Summarize the case context and key facts.'],
        ['Problem Analysis', 'Identify central issues, causes, and constraints.'],
        ['Evidence & Research', 'Gather supporting concepts, data, and references.'],
        ['Options / Alternatives', 'Develop possible approaches or solutions.'],
        ['Recommendations', 'Prepare supported recommendations and next steps.'],
        ['Presentation & Review', 'Finalize the output and prepare to discuss the case.'],
      ],
    },
    event: {
      name: 'Event / Organization Task',
      tasks: [
        ['Program Planning', 'Build the event flow, activities, and schedule.'],
        ['Logistics', 'Coordinate venue, materials, equipment, and setup.'],
        ['Design & Publicity', 'Create event visuals and promotional materials.'],
        ['Registration / Participants', 'Manage sign-ups, attendance, and participant communication.'],
        ['Documentation', 'Capture event records, photos, notes, and reports.'],
        ['Hosting / Facilitation', 'Prepare hosts, speakers, and event transitions.'],
        ['Post-Event Review', 'Collect feedback and document outcomes and improvements.'],
      ],
    },
    custom: { name: 'Custom', tasks: [] },
  };

  const el = (id) => document.getElementById(id);
  const screens = ['landingScreen', 'setupScreen', 'workspaceScreen', 'savedScreen'];

  function uid(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showScreen(id) {
    screens.forEach((screenId) => el(screenId).classList.toggle('active', screenId === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => el('mainContent').focus({ preventScroll: true }), 50);
    if (id === 'savedScreen') renderSavedProjects();
  }

  function templateName(type, customTypeName = '') {
    if (type === 'custom' && customTypeName.trim()) return customTypeName.trim();
    return projectTemplates[type]?.name || 'Custom';
  }

  function generateMembers(count, names = []) {
    return Array.from({ length: count }, (_, index) => ({
      id: names[index]?.id || uid('member'),
      name: (typeof names[index] === 'string' ? names[index] : names[index]?.name || '').trim() || `Member ${index + 1}`,
    }));
  }

  function generateTasks(type) {
    const template = projectTemplates[type] || projectTemplates.custom;
    return template.tasks.map(([title, description]) => ({ id: uid('task'), title, description, memberIds: [] }));
  }

  function assignBalanced(project, randomized = false) {
    const members = project.members;
    if (!members.length || !project.tasks.length) return;

    const load = new Map(members.map((member) => [member.id, 0]));
    const tasks = [...project.tasks];

    tasks.forEach((task, taskIndex) => {
      const desired = Math.min(members.length, members.length === 1 ? 1 : taskIndex % 3 === 0 ? 2 : 1);
      const ranked = [...members].sort((a, b) => {
        const loadDiff = load.get(a.id) - load.get(b.id);
        if (loadDiff !== 0) return loadDiff;
        return randomized ? Math.random() - 0.5 : a.name.localeCompare(b.name);
      });
      task.memberIds = ranked.slice(0, desired).map((member) => {
        load.set(member.id, load.get(member.id) + 1);
        return member.id;
      });
    });
  }

  function showToast(message) {
    clearTimeout(state.toastTimer);
    const toast = el('toast');
    toast.textContent = `✓ ${message}`;
    toast.classList.add('show');
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function updateMemberInputs() {
    const count = Math.max(1, Math.min(30, Number(el('memberCount').value) || 1));
    el('memberCount').value = count;
    const current = [...el('memberInputs').querySelectorAll('input')].map((input) => input.value);
    el('memberInputs').innerHTML = Array.from({ length: count }, (_, index) => `
      <div class="member-input-wrap">
        <span>Member ${index + 1}</span>
        <input type="text" maxlength="60" data-member-index="${index}" value="${escapeHtml(current[index] || '')}" placeholder="Optional name" aria-label="Member ${index + 1} name" />
      </div>
    `).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fillSetup(project = null) {
    const existing = project || state.project;
    el('projectTypeError').textContent = '';
    el('memberCountError').textContent = '';
    if (!existing) {
      el('projectForm').reset();
      el('memberCount').value = 5;
      el('projectType').value = '';
      el('customTypeName').value = '';
      el('projectTitle').value = '';
      el('customTypeGroup').classList.add('hidden');
      updateMemberInputs();
      return;
    }
    el('projectType').value = existing.type;
    el('projectTitle').value = existing.title === 'Untitled Project' ? '' : existing.title;
    el('memberCount').value = existing.members.length;
    el('customTypeName').value = existing.customTypeName || '';
    el('customTypeGroup').classList.toggle('hidden', existing.type !== 'custom');
    updateMemberInputs();
    existing.members.forEach((member, index) => {
      const input = el('memberInputs').querySelector(`[data-member-index="${index}"]`);
      if (input) input.value = /^Member \d+$/.test(member.name) ? '' : member.name;
    });
  }

  function validateSetup() {
    let valid = true;
    const type = el('projectType').value;
    const count = Number(el('memberCount').value);
    el('projectTypeError').textContent = '';
    el('memberCountError').textContent = '';
    if (!type) {
      el('projectTypeError').textContent = 'Please select a project type.';
      valid = false;
    }
    if (!Number.isInteger(count) || count < 1) {
      el('memberCountError').textContent = 'Please enter at least 1 member.';
      valid = false;
    }
    return valid;
  }

  function createOrUpdateProjectFromForm() {
    const type = el('projectType').value;
    const count = Math.max(1, Math.min(30, Number(el('memberCount').value) || 1));
    const names = [...el('memberInputs').querySelectorAll('input')].map((input) => input.value.trim());
    const now = new Date().toISOString();

    if (!state.project) {
      state.project = {
        id: uid('project'),
        title: el('projectTitle').value.trim() || 'Untitled Project',
        type,
        customTypeName: type === 'custom' ? el('customTypeName').value.trim() : '',
        members: generateMembers(count, names),
        tasks: generateTasks(type),
        createdAt: now,
        updatedAt: now,
      };
      assignBalanced(state.project);
      return;
    }

    const previousMembers = state.project.members;
    const newMembers = Array.from({ length: count }, (_, index) => ({
      id: previousMembers[index]?.id || uid('member'),
      name: names[index] || (/^Member \d+$/.test(previousMembers[index]?.name || '') ? `Member ${index + 1}` : previousMembers[index]?.name) || `Member ${index + 1}`,
    }));
    const allowedIds = new Set(newMembers.map((member) => member.id));
    state.project.tasks.forEach((task) => {
      task.memberIds = task.memberIds.filter((id) => allowedIds.has(id));
    });
    state.project.title = el('projectTitle').value.trim() || 'Untitled Project';
    state.project.type = type;
    state.project.customTypeName = type === 'custom' ? el('customTypeName').value.trim() : '';
    state.project.members = newMembers;
    state.project.updatedAt = now;
  }

  function renderWorkspace() {
    if (!state.project) return;
    const project = state.project;
    el('workspaceTitle').textContent = project.title;
    el('workspaceType').textContent = templateName(project.type, project.customTypeName).toUpperCase();
    el('workspaceMeta').textContent = `${project.members.length} ${project.members.length === 1 ? 'member' : 'members'} • ${project.tasks.length} ${project.tasks.length === 1 ? 'task' : 'tasks'}`;

    renderSummary();
    renderAssignmentContent();
    renderWorkload();
  }

  function renderSummary() {
    const project = state.project;
    const assignedTasks = project.tasks.filter((task) => task.memberIds.length > 0).length;
    const unassignedTasks = project.tasks.length - assignedTasks;
    const stats = [
      [project.members.length, project.members.length === 1 ? 'Member' : 'Members', false],
      [project.tasks.length, project.tasks.length === 1 ? 'Task' : 'Tasks', false],
      [assignedTasks, 'Assigned Tasks', false],
      [unassignedTasks, 'Unassigned Tasks', unassignedTasks > 0],
    ];
    el('summaryGrid').innerHTML = stats.map(([value, label, alert]) => `
      <div class="summary-card ${alert ? 'needs-attention' : ''}">
        <strong>${value}</strong><span>${label}</span>
      </div>
    `).join('');
  }

  function renderAssignmentContent() {
    el('byTaskButton').classList.toggle('active', state.currentView === 'task');
    el('byTaskButton').setAttribute('aria-pressed', state.currentView === 'task');
    el('byMemberButton').classList.toggle('active', state.currentView === 'member');
    el('byMemberButton').setAttribute('aria-pressed', state.currentView === 'member');
    if (state.currentView === 'task') renderByTask();
    else renderByMember();
  }

  function renderByTask() {
    const project = state.project;
    if (!project.tasks.length) {
      el('workspaceContent').innerHTML = `
        <div class="empty-state">
          <h2>No tasks yet.</h2>
          <p>Add a task to start organizing your project.</p>
          <button class="primary-button" data-action="add-task">+ Add Task</button>
        </div>`;
      return;
    }

    el('workspaceContent').innerHTML = `<div class="task-list">${project.tasks.map((task) => `
      <article class="card task-card" data-task-id="${task.id}">
        <div class="task-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <p class="task-description">${escapeHtml(task.description || 'No description added.')}</p>
          </div>
          <div class="task-actions">
            <button class="secondary-button small-action" data-action="edit-task" data-task-id="${task.id}">Edit</button>
            <button class="secondary-button small-action" data-action="duplicate-task" data-task-id="${task.id}">Duplicate</button>
            <button class="secondary-button small-action" data-action="delete-task" data-task-id="${task.id}" aria-label="Delete ${escapeHtml(task.title)}">Delete</button>
          </div>
        </div>
        <div class="member-selector" aria-label="Assign members to ${escapeHtml(task.title)}">
          ${project.members.map((member) => `
            <label class="member-check">
              <input type="checkbox" data-task-id="${task.id}" data-member-id="${member.id}" ${task.memberIds.includes(member.id) ? 'checked' : ''} />
              <span>${escapeHtml(member.name)}</span>
            </label>
          `).join('')}
        </div>
        ${task.memberIds.length === 0 ? '<p class="unassigned-note">Needs members</p>' : ''}
      </article>
    `).join('')}</div>`;
  }

  function renderByMember() {
    const project = state.project;
    if (!project.members.length) {
      el('workspaceContent').innerHTML = `<div class="empty-state"><h2>No members</h2><p>Add members to organize responsibilities.</p></div>`;
      return;
    }

    el('workspaceContent').innerHTML = `<div class="member-view-list">${project.members.map((member) => {
      const assigned = project.tasks.filter((task) => task.memberIds.includes(member.id));
      return `
        <article class="card member-card">
          <div class="member-card-header">
            <div><h3>${escapeHtml(member.name)}</h3><p class="saved-meta">${assigned.length} ${assigned.length === 1 ? 'task' : 'tasks'}</p></div>
          </div>
          ${assigned.length ? `<ul class="member-task-list">${assigned.map((task) => `<li>${escapeHtml(task.title)}</li>`).join('')}</ul>` : '<p class="no-items">No tasks assigned yet.</p>'}
        </article>`;
    }).join('')}</div>`;
  }

  function renderWorkload() {
    const project = state.project;
    const counts = project.members.map((member) => ({
      member,
      count: project.tasks.filter((task) => task.memberIds.includes(member.id)).length,
    }));
    const max = Math.max(1, ...counts.map((item) => item.count));
    el('workloadList').innerHTML = counts.map(({ member, count }) => `
      <div class="workload-row">
        <strong>${escapeHtml(member.name)}</strong>
        <div class="workload-bar" aria-hidden="true"><span style="width:${Math.round((count / max) * 100)}%"></span></div>
        <span class="workload-count">${count} ${count === 1 ? 'task' : 'tasks'}</span>
      </div>
    `).join('');
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  function getSavedProjects() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCurrentProject() {
    if (!state.project) return;
    state.project.updatedAt = new Date().toISOString();
    const projects = getSavedProjects();
    const index = projects.findIndex((project) => project.id === state.project.id);
    const copy = structuredCloneSafe(state.project);
    if (index >= 0) projects[index] = copy;
    else projects.unshift(copy);
    saveProjects(projects);
    showToast('Project saved successfully.');
  }

  function structuredCloneSafe(value) {
    return window.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function relativeDate(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const day = 86400000;
    if (diff < day && diff >= 0) return 'Updated today';
    if (diff < day * 2 && diff >= 0) return 'Updated yesterday';
    return `Updated ${new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  }

  function renderSavedProjects() {
    const projects = getSavedProjects().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (!projects.length) {
      el('savedProjectsList').innerHTML = `
        <div class="empty-state">
          <h2>No saved projects yet.</h2>
          <p>Create your first project to get started.</p>
          <button class="primary-button" data-action="create-from-empty">Create Project</button>
        </div>`;
      return;
    }
    el('savedProjectsList').innerHTML = projects.map((project) => `
      <article class="card saved-card">
        <div class="saved-card-header">
          <div>
            <h3>${escapeHtml(project.title || 'Untitled Project')}</h3>
            <p class="saved-meta">${escapeHtml(templateName(project.type, project.customTypeName))} • ${project.members?.length || 0} members • ${project.tasks?.length || 0} tasks</p>
          </div>
          <span class="saved-meta">${escapeHtml(relativeDate(project.updatedAt || project.createdAt))}</span>
        </div>
        <div class="saved-card-actions">
          <button class="primary-button small-action" data-action="open-project" data-project-id="${project.id}">Open</button>
          <button class="secondary-button small-action" data-action="duplicate-project" data-project-id="${project.id}">Duplicate</button>
          <button class="secondary-button small-action" data-action="delete-project" data-project-id="${project.id}">Delete</button>
        </div>
      </article>
    `).join('');
  }

  function openTaskModal(taskId = null) {
    state.lastFocusedElement = document.activeElement;
    state.editingTaskId = taskId;
    const task = taskId ? state.project.tasks.find((item) => item.id === taskId) : null;
    el('taskModalTitle').textContent = task ? 'Edit Task' : 'Add Task';
    el('taskSubmitButton').textContent = task ? 'Save Changes' : 'Add Task';
    el('taskName').value = task?.title || '';
    el('taskDescription').value = task?.description || '';
    el('taskNameError').textContent = '';
    el('taskModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => el('taskName').focus(), 30);
  }

  function closeTaskModal() {
    el('taskModal').classList.add('hidden');
    document.body.style.overflow = '';
    state.editingTaskId = null;
    state.lastFocusedElement?.focus?.();
  }

  function openConfirm({ title = 'Are you sure?', message, acceptText = 'Delete', onAccept }) {
    state.lastFocusedElement = document.activeElement;
    state.confirmAction = onAccept;
    el('confirmTitle').textContent = title;
    el('confirmMessage').textContent = message;
    el('confirmAccept').textContent = acceptText;
    el('confirmModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => el('confirmCancel').focus(), 30);
  }

  function closeConfirm() {
    el('confirmModal').classList.add('hidden');
    document.body.style.overflow = '';
    state.confirmAction = null;
    state.lastFocusedElement?.focus?.();
  }

  function updateProjectTimestamp() {
    if (state.project) state.project.updatedAt = new Date().toISOString();
  }

  function copyAssignments() {
    if (!state.project) return;
    const project = state.project;
    const lines = [
      'TaskMate',
      project.title,
      templateName(project.type, project.customTypeName),
      '',
    ];
    project.tasks.forEach((task) => {
      lines.push(task.title);
      if (!task.memberIds.length) lines.push('- Unassigned');
      else task.memberIds.forEach((memberId) => {
        const member = project.members.find((item) => item.id === memberId);
        if (member) lines.push(`- ${member.name}`);
      });
      lines.push('');
    });
    const text = lines.join('\n').trim();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Assignments copied!')).catch(() => fallbackCopy(text));
    } else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Assignments copied!');
    } finally {
      textarea.remove();
    }
  }

  function bindEvents() {
    el('brandButton').addEventListener('click', () => showScreen('landingScreen'));
    el('createProjectButton').addEventListener('click', () => { state.project = null; fillSetup(); showScreen('setupScreen'); });
    el('newProjectNav').addEventListener('click', () => { state.project = null; fillSetup(); showScreen('setupScreen'); });
    el('viewSavedButton').addEventListener('click', () => showScreen('savedScreen'));
    el('savedProjectsNav').addEventListener('click', () => showScreen('savedScreen'));
    el('savedCreateButton').addEventListener('click', () => { state.project = null; fillSetup(); showScreen('setupScreen'); });
    el('cancelSetupButton').addEventListener('click', () => state.project ? (renderWorkspace(), showScreen('workspaceScreen')) : showScreen('landingScreen'));

    el('projectType').addEventListener('change', () => {
      el('customTypeGroup').classList.toggle('hidden', el('projectType').value !== 'custom');
      el('projectTypeError').textContent = '';
    });

    el('memberCount').addEventListener('input', updateMemberInputs);
    el('increaseMembers').addEventListener('click', () => { el('memberCount').value = Math.min(30, Number(el('memberCount').value || 0) + 1); updateMemberInputs(); });
    el('decreaseMembers').addEventListener('click', () => { el('memberCount').value = Math.max(1, Number(el('memberCount').value || 1) - 1); updateMemberInputs(); });

    el('projectForm').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateSetup()) return;
      const wasExisting = Boolean(state.project);
      createOrUpdateProjectFromForm();
      renderWorkspace();
      showScreen('workspaceScreen');
      showToast(wasExisting ? 'Project updated.' : 'Project created.');
    });

    el('editProjectButton').addEventListener('click', () => { fillSetup(state.project); showScreen('setupScreen'); });
    el('saveProjectButton').addEventListener('click', saveCurrentProject);
    el('addTaskButton').addEventListener('click', () => openTaskModal());
    el('shuffleButton').addEventListener('click', () => {
      if (!state.project?.tasks.length || !state.project?.members.length) return;
      assignBalanced(state.project, true);
      updateProjectTimestamp();
      renderWorkspace();
      showToast('Assignments reshuffled.');
    });
    el('copyButton').addEventListener('click', copyAssignments);
    el('printButton').addEventListener('click', () => window.print());

    el('byTaskButton').addEventListener('click', () => { state.currentView = 'task'; renderAssignmentContent(); });
    el('byMemberButton').addEventListener('click', () => { state.currentView = 'member'; renderAssignmentContent(); });

    el('workspaceContent').addEventListener('change', (event) => {
      const checkbox = event.target.closest('input[type="checkbox"][data-task-id][data-member-id]');
      if (!checkbox) return;
      const task = state.project.tasks.find((item) => item.id === checkbox.dataset.taskId);
      if (!task) return;
      if (checkbox.checked && !task.memberIds.includes(checkbox.dataset.memberId)) task.memberIds.push(checkbox.dataset.memberId);
      if (!checkbox.checked) task.memberIds = task.memberIds.filter((id) => id !== checkbox.dataset.memberId);
      updateProjectTimestamp();
      renderWorkspace();
      showToast('Assignment updated.');
    });

    el('workspaceContent').addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const { action, taskId } = target.dataset;
      if (action === 'add-task') openTaskModal();
      if (action === 'edit-task') openTaskModal(taskId);
      if (action === 'duplicate-task') {
        const source = state.project.tasks.find((task) => task.id === taskId);
        if (!source) return;
        state.project.tasks.push({ ...structuredCloneSafe(source), id: uid('task'), title: `${source.title} Copy` });
        updateProjectTimestamp();
        renderWorkspace();
        showToast('Task duplicated.');
      }
      if (action === 'delete-task') {
        const source = state.project.tasks.find((task) => task.id === taskId);
        if (!source) return;
        openConfirm({
          title: 'Delete task?',
          message: `“${source.title}” and its assignments will be removed.`,
          onAccept: () => {
            state.project.tasks = state.project.tasks.filter((task) => task.id !== taskId);
            updateProjectTimestamp();
            renderWorkspace();
            showToast('Task deleted.');
          },
        });
      }
    });

    el('taskForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const title = el('taskName').value.trim();
      if (!title) {
        el('taskNameError').textContent = 'Please enter a task name.';
        el('taskName').focus();
        return;
      }
      const description = el('taskDescription').value.trim();
      if (state.editingTaskId) {
        const task = state.project.tasks.find((item) => item.id === state.editingTaskId);
        if (task) { task.title = title; task.description = description; }
        showToast('Task updated.');
      } else {
        state.project.tasks.push({ id: uid('task'), title, description, memberIds: [] });
        showToast('Task added.');
      }
      updateProjectTimestamp();
      closeTaskModal();
      renderWorkspace();
    });

    el('closeTaskModal').addEventListener('click', closeTaskModal);
    el('cancelTaskModal').addEventListener('click', closeTaskModal);
    el('taskModal').addEventListener('click', (event) => { if (event.target === el('taskModal')) closeTaskModal(); });

    el('confirmCancel').addEventListener('click', closeConfirm);
    el('confirmAccept').addEventListener('click', () => {
      const action = state.confirmAction;
      closeConfirm();
      action?.();
    });

    el('savedProjectsList').addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const { action, projectId } = target.dataset;
      if (action === 'create-from-empty') {
        state.project = null;
        fillSetup();
        showScreen('setupScreen');
        return;
      }
      const projects = getSavedProjects();
      const project = projects.find((item) => item.id === projectId);
      if (!project) return;
      if (action === 'open-project') {
        state.project = structuredCloneSafe(project);
        state.currentView = 'task';
        renderWorkspace();
        showScreen('workspaceScreen');
      }
      if (action === 'duplicate-project') {
        const copy = structuredCloneSafe(project);
        copy.id = uid('project');
        copy.title = `${copy.title} Copy`;
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = copy.createdAt;
        projects.unshift(copy);
        saveProjects(projects);
        renderSavedProjects();
        showToast('Project duplicated.');
      }
      if (action === 'delete-project') {
        openConfirm({
          title: 'Delete project?',
          message: `“${project.title}” will be removed from saved projects on this device.`,
          onAccept: () => {
            saveProjects(projects.filter((item) => item.id !== projectId));
            renderSavedProjects();
            showToast('Project deleted.');
          },
        });
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!el('taskModal').classList.contains('hidden')) closeTaskModal();
      else if (!el('confirmModal').classList.contains('hidden')) closeConfirm();
    });
  }

  updateMemberInputs();
  bindEvents();
})();
