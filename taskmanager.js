var tasks = []; // store all task in memory
var nextId = 1;
var currentMode = 'add'; // switch between add and deit mode
var currentColumn = 'todo';
var currentEditId = null;

// dom selectors
var modalOverlay   = document.getElementById('modal-overlay');
var modalTitle     = document.getElementById('modal-title');
var titleInput     = document.getElementById('task-title-input');
var descInput      = document.getElementById('task-description-input');
var priorityInput  = document.getElementById('task-priority-input');
var dueDateInput   = document.getElementById('task-due-input');
var priorityFilter = document.getElementById('priority-filter');
var taskCounter    = document.getElementById('task-counter');
var todoList       = document.getElementById('todo-list');
var inprogressList = document.getElementById('inprogress-list');
var doneList       = document.getElementById('done-list');

// help to map column identifiers
function getList(columnId) {
  return { todo: todoList, inprogress: inprogressList, done: doneList }[columnId] || null;
}


// updates the task counter
function updateCounter() {
  taskCounter.textContent = tasks.length + ' task' + (tasks.length !== 1 ? 's' : '');
}

// create task card
function createTaskCard(taskObj) {
  var li = document.createElement('li');
  li.id = "task-" + taskObj.id;
  li.setAttribute('data-id', taskObj.id);
  li.setAttribute('data-priority', taskObj.priority);
  li.classList.add('task-card');


  var header = document.createElement('div');
  header.classList.add('task-card-header');

  var titleSpan = document.createElement('span');
  titleSpan.classList.add('task-title');
  titleSpan.textContent = taskObj.title;

  var actions = document.createElement('div');
  actions.classList.add('task-actions');

  var editBtn = document.createElement('button');
  editBtn.classList.add('action-btn', 'edit');
  editBtn.setAttribute('data-action', 'edit');
  editBtn.setAttribute('data-id', taskObj.id);
  editBtn.textContent = 'Edit';

  var delBtn = document.createElement('button');
  delBtn.classList.add('action-btn', 'delete');
  delBtn.setAttribute('data-action', 'delete');
  delBtn.setAttribute('data-id', taskObj.id);
  delBtn.textContent = 'Delete';

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
  header.appendChild(titleSpan);
  header.appendChild(actions);
  li.appendChild(header);

  if (taskObj.description) {
    var desc = document.createElement('p');
    desc.classList.add('task-description');
    desc.textContent = taskObj.description;
    li.appendChild(desc);
  }
  
  // priority + due date
  var footer = document.createElement('div');
  footer.classList.add('task-footer');

  var badge = document.createElement('span');
  badge.classList.add('priority-badge', taskObj.priority);
  badge.textContent = taskObj.priority.charAt(0).toUpperCase() + taskObj.priority.slice(1);
  footer.appendChild(badge);

  if (taskObj.dueDate) {
    var due = document.createElement('span');
    due.classList.add('task-due');
    due.textContent = 'Due: ' + taskObj.dueDate;
    footer.appendChild(due);
  }

  li.appendChild(footer);

  // apply priority filtering
  var f = priorityFilter.value;
  li.classList.toggle('is-hidden', f !== 'all' && f !== taskObj.priority);

  // double click edit title
  titleSpan.addEventListener('dblclick', function () {
    var input = document.createElement('input');
    input.classList.add('task-title-input');
    input.setAttribute('type', 'text');
    input.value = titleSpan.textContent;
    titleSpan.parentNode.replaceChild(input, titleSpan);
    input.focus();
    input.select();

    function commit() {
      var val = input.value.trim();
      if (val) {
        var task = tasks.find(function (x) { return x.id === taskObj.id; });
        if (task) { task.title = val; }
      }

      var newCard = createTaskCard(tasks.find(function (x) { return x.id === taskObj.id; }) || taskObj);
      li.parentNode.replaceChild(newCard, li);
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') input.parentNode.replaceChild(titleSpan, input);
    });
    input.addEventListener('blur', commit);
  });

  return li;
}

// Add task
function addTask(columnId, taskObj) {
  tasks.push(taskObj);
  var list = getList(columnId);
  if (list) list.appendChild(createTaskCard(taskObj));
  updateCounter();
}

// Delete task
function deleteTask(taskId) {
  var li = document.querySelector('[data-id="' + taskId + '"]');
  if (!li) return;
  li.classList.add('fade-out'); // css transition making it look smooth
  li.addEventListener('transitionend', function () {
    li.remove();
    tasks = tasks.filter(function (t) { return t.id !== taskId; });
    updateCounter();
  }, { once: true });
}

// Edit task
function editTask(taskId) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;
  currentMode = 'edit';
  currentEditId = taskId;
  modalTitle.textContent = 'Edit Task';
  titleInput.value    = task.title;
  descInput.value     = task.description;
  priorityInput.value = task.priority;
  dueDateInput.value  = task.dueDate;
  modalOverlay.classList.remove('hidden');
  titleInput.focus();
}

// Update existing tasks
function updateTask(taskId, updatedData) {
  var task = tasks.find(function (t) { return t.id === taskId; });
  if (!task) return;
  task.title = updatedData.title;
  task.description = updatedData.description;
  task.priority = updatedData.priority;
  task.dueDate = updatedData.dueDate;
  var old = document.querySelector('[data-id="' + taskId + '"]');
  if (old) old.parentNode.replaceChild(createTaskCard(task), old);
}

// opens the modal to add task
function openModal(columnId) {
  currentMode = 'add';
  currentColumn = columnId;
  currentEditId = null;
  modalTitle.textContent = 'Add Task';
  titleInput.value = '';
  descInput.value = '';
  priorityInput.value = 'medium';
  dueDateInput.value = '';
  modalOverlay.classList.remove('hidden');
  titleInput.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

// save button logics
function handleSave() {
  var title = titleInput.value.trim();
  if (!title) { titleInput.focus(); return; }
  if (currentMode === 'add') {
    addTask(currentColumn, {
      id: nextId++, title: title,
      description: descInput.value.trim(),
      priority: priorityInput.value,
      dueDate: dueDateInput.value
    });
  } else {
    updateTask(currentEditId, {
      title: title, description: descInput.value.trim(),
      priority: priorityInput.value, dueDate: dueDateInput.value
    });
  }
  closeModal();
}

//only show whats wanted
function applyFilter() {
  var f = priorityFilter.value;
  document.querySelectorAll('.task-card').forEach(function (card) {
    card.classList.toggle('is-hidden', f !== 'all' && f !== card.getAttribute('data-priority'));
  });
}

//remove all task under Done with staggered animation
function clearDoneTasks() {
  doneList.querySelectorAll('.task-card').forEach(function (card, i) {
    setTimeout(function () {
      card.classList.add('fade-out');
      card.addEventListener('transitionend', function () {
        var id = parseInt(card.getAttribute('data-id'), 10);
        card.remove();
        tasks = tasks.filter(function (t) { return t.id !== id; });
        updateCounter();
      }, { once: true });
    }, i * 100);
  });
}


function attachColumnListener(list) {
  list.addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-action');
    var id     = parseInt(e.target.getAttribute('data-id'), 10);
    if (!action || !id) return;
    if (action === 'delete') deleteTask(id);
    if (action === 'edit')   editTask(id);
  });
}

attachColumnListener(todoList);
attachColumnListener(inprogressList);
attachColumnListener(doneList);


// event listeners
document.querySelector('.board').addEventListener('click', function (e) {
  var btn = e.target.closest('.add-task-btn');
  if (btn) openModal(btn.getAttribute('data-column'));
});


document.getElementById('modal-save-btn').addEventListener('click', handleSave);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
titleInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSave(); });


document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) closeModal();
});

priorityFilter.addEventListener('change', applyFilter);
document.getElementById('clear-done-btn').addEventListener('click', clearDoneTasks);

