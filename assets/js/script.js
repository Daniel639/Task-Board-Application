// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1;

// Function to generate a unique task id
function generateTaskId() {
    localStorage.setItem("nextId", JSON.stringify(nextId + 1));
    return nextId++;
}

// Function to format date to mm/dd/yyyy
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Function to create a task card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'card task-card mb-3';
    card.setAttribute('data-id', task.id);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const title = document.createElement('h5');
    title.className = 'card-title';
    title.textContent = task.title;

    const description = document.createElement('p');
    description.className = 'card-text';
    description.textContent = task.description;

    const deadline = document.createElement('p');
    deadline.className = 'card-text';
    deadline.textContent = `Deadline: ${formatDate(task.deadline)}`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger btn-sm float-end';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('data-task-id', task.id);
    deleteButton.onclick = handleDeleteTask;

    cardBody.appendChild(title);
    cardBody.appendChild(description);
    cardBody.appendChild(deadline);
    cardBody.appendChild(deleteButton);
    card.appendChild(cardBody);

    return card;
}

// Function to render the task list and make cards draggable
function renderTaskList() {
    const todoList = document.getElementById('todo-cards');
    const inProgressList = document.getElementById('in-progress-cards');
    const doneList = document.getElementById('done-cards');
    
    if (!todoList || !inProgressList || !doneList) {
        console.error("Could not find one or more task list elements. Please check your HTML.");
        return;
    }
    
    // Clear existing tasks to prevent duplication
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';
    
    if (!Array.isArray(taskList) || taskList.length === 0) {
        console.log("No tasks to render or tasks is not an array.");
        return;
    }
    
    // Loop through each task and create a card
    taskList.forEach(task => {
        const taskCard = createTaskCard(task);
        // Add task to appropriate list based on its status
        switch(task.status) {
            case 'to-do':
            case 'todo':
                todoList.appendChild(taskCard);
                break;
            case 'in-progress':
                inProgressList.appendChild(taskCard);
                break;
            case 'done':
                doneList.appendChild(taskCard);
                break;
            default:
                console.error(`Unknown task status: ${task.status}`);
                // Default to 'to-do' if status is unknown
                todoList.appendChild(taskCard);
        }
    });

    initializeDragAndDrop();
    updateTaskColors();
}

function handleAddTask(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('taskTitle').value.trim();
    const descriptionInput = document.getElementById('taskDescription').value.trim();
    const deadlineInput = document.getElementById('taskDeadline').value;
    
    if (titleInput && descriptionInput && deadlineInput) {
        const newTask = {
            id: generateTaskId(),
            title: titleInput,
            description: descriptionInput,
            deadline: deadlineInput,
            status: 'to-do'
        };
    
        taskList.push(newTask);
        localStorage.setItem("tasks", JSON.stringify(taskList));
    
        renderTaskList();
    
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDeadline').value = '';
        
        $('#formModal').modal('hide');
    } else {
        alert('Please fill in all fields to add a task.');
    }
}

function handleDeleteTask(event) {
    const taskId = event.target.getAttribute('data-task-id');

    if (taskId) {
        taskList = taskList.filter(task => task.id.toString() !== taskId);
        localStorage.setItem("tasks", JSON.stringify(taskList));
        renderTaskList();
    } else {
        console.error('Task ID not found.');
    }
}

function handleDrop(event, ui) {
    const taskId = ui.draggable.attr('data-id');
    let targetStatus = $(event.target).attr('id').replace('-cards', '');
    
    // Convert 'todo' to 'to-do' if necessary
    if (targetStatus === 'todo') {
        targetStatus = 'to-do';
    }

    if (taskId && targetStatus) {
        const taskIndex = taskList.findIndex(task => task.id.toString() === taskId);
        if (taskIndex !== -1) {
            taskList[taskIndex].status = targetStatus;
            localStorage.setItem("tasks", JSON.stringify(taskList));
            renderTaskList();
        } else {
            console.error('Task not found.');
        }
    } else {
        console.error('Missing task ID or target status.');
    }
}

function updateTaskColors() {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

    taskList.forEach(task => {
        const taskElement = document.querySelector(`.task-card[data-id="${task.id}"]`);
        if (taskElement) {
            const deadline = new Date(task.deadline);
            
            if (deadline < today) {
                taskElement.classList.add('overdue');
                taskElement.classList.remove('near-deadline');
            } else if (deadline <= threeDaysFromNow) {
                taskElement.classList.add('near-deadline');
                taskElement.classList.remove('overdue');
            } else {
                taskElement.classList.remove('near-deadline', 'overdue');
            }
        }
    });
}

function initializeDragAndDrop() {
    $('.task-card').draggable({
        connectToSortable: '.card-body',
        cursor: 'move',
        helper: 'clone',
        revert: 'invalid'
    });

    $('.card-body').sortable({
        connectWith: '.card-body',
        cursor: 'move',
        placeholder: 'card-placeholder',
        forcePlaceholderSize: true,
        remove: function(_event, ui) {
            ui.item.clone().appendTo(this);
            $(this).sortable('cancel');
        },
        receive: function(_event, ui) {
            ui.sender.sortable('cancel');
        }
    }).droppable({
        accept: '.task-card',
        drop: handleDrop
    });
}

$(document).ready(function () {
    renderTaskList();
    $('#taskForm').submit(handleAddTask);
});