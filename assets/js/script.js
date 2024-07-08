// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1;

// Function to generate a unique task id
function generateTaskId() {
    nextId++;
    localStorage.setItem("nextId", JSON.stringify(nextId));
    return nextId;
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

    cardBody.append(title, description, deadline, deleteButton);
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

    [todoList, inProgressList, doneList].forEach(list => list.innerHTML = '');

    taskList.forEach(task => {
        const taskCard = createTaskCard(task);
        switch(task.status.toLowerCase()) {  // Handle case-insensitivity
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
        }
    });
   initializeDragAndDrop();
   updateTaskColors();
}

// Function to handle adding a task
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
            status: 'to-do' // Start in 'to-do'
        };

        taskList.push(newTask);
        localStorage.setItem("tasks", JSON.stringify(taskList));
        renderTaskList();
        $('#formModal').modal('hide');
        // Clear the input fields
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDescription").value = "";
        document.getElementById("taskDeadline").value = "";
    } else {
        alert('Please fill in all fields to add a task.');
    }
}
// ... (Your code for deleting tasks, updating colors, and other functions)

// Function to handle task drop
function handleDrop(event, ui) {
    const taskId = ui.draggable.attr('data-id');
    let targetStatus = $(event.target).attr('id').replace('-cards', '');
    if (targetStatus === 'todo') {
        targetStatus = 'to-do'; // Normalize 'todo' to 'to-do'
    }
    
    if (taskId && targetStatus) {
        // Delay the removal of the task card using setTimeout to ensure it's attached to the DOM
        setTimeout(() => {
            updateTaskStatus(taskId, targetStatus);
            if (ui.draggable.length) {
                ui.draggable.remove();
            } else {
                console.error('Dragged element not found in the DOM.'); // Optional error handling
            }
        }, 0); // A minimal delay (0ms) is usually enough
    } else {
        console.error('Missing task ID or target status.');
    }
}

// Document ready function
$(document).ready(function () {
    renderTaskList();
    initializeSortable();
    $('#taskForm').submit(handleAddTask);

    initializeDragAndDrop(); 
});

// Function to initialize drag and drop functionality
function initializeDragAndDrop() {
    $('.task-card').draggable({
        opacity: 0.7,
        zIndex: 100,
        helper: 'clone',
        appendTo: 'body',
        connectToSortable: '.card-body',
        start: function(_event, ui) {
            $(ui.helper).addClass('ui-draggable-helper');
        },
        stop: function(_event, ui) {
            ui.helper.remove();
        }
    });
}

// Function to initialize sortable functionality
function initializeSortable() {
    $('.card-body').sortable({
        connectWith: '.card-body',
        cursor: 'move',
        placeholder: 'card-placeholder',
        forcePlaceholderSize: true,
        receive: function(_event, ui) {
            const taskId = ui.item.attr('data-id');
            const newStatus = $(this).attr('id').replace('-cards', '');
            updateTaskStatus(taskId, newStatus);
        }
    }).droppable({
        accept: '.task-card',
        drop: handleDrop
    });
}

// Function to update task status after drag and drop
function updateTaskStatus(taskId, newStatus) {
    const taskIndex = taskList.findIndex(task => task.id.toString() === taskId);
    if (taskIndex !== -1) {
        taskList[taskIndex].status = newStatus;
        localStorage.setItem("tasks", JSON.stringify(taskList));
        renderTaskList();
    }
}

// Function to handle deleting a task
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


// Function to update task colors based on deadlines
function updateTaskColors() {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

    taskList.forEach(task => {
        const taskElement = document.querySelector(`.task-card[data-id="${task.id}"]`);
        if (taskElement) {
            const deadline = new Date(task.deadline);
            taskElement.classList.remove('near-deadline', 'overdue');
            if (deadline < today) {
                taskElement.classList.add('overdue');
            } else if (deadline <= threeDaysFromNow) {
                taskElement.classList.add('near-deadline');
            }
        }
    });
}
