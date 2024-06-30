// Retrieve tasks, nextId from localStorage or initialize if empty
let taskList = JSON.parse(localStorage.getItem("tasks")) || [];
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1;

// Function to generate a unique task id
function generateTaskId() {
    const newId = nextId;
    nextId++;
    localStorage.setItem("nextId", JSON.stringify(nextId));
    return newId;
}

// Function to create a task card (with Bootstrap styling)
function createTaskCard(task) {
    const card = `
        <div class="task card mb-3" data-task-id="${task.id}" data-due-date="${task.dueDate}">
            <div class="card-body">
                <h5 class="card-title">${task.title}</h5>
                <p class="card-text">${task.description}</p>
                <p class="task-due-date">Due: ${dayjs(task.dueDate).format("MMM D, YYYY")}</p>
                <button class="delete-task btn btn-danger">Delete</button>
            </div>
        </div>
    `;
    return card;
}

// Function to render the task list and make cards draggable
function renderTaskList() {
    $("#todo-cards, #in-progress-cards, #done-cards").empty();
    taskList.forEach(task => {
        const card = createTaskCard(task);
        $(`#${task.status}-cards`).append(card);
    });
    $(".task").draggable({
        connectToSortable: ".lane .card-body", 
        revert: "invalid"
    });
    updateTaskColors(); 
}

// Function to handle adding a new task
function handleAddTask(event) {
    event.preventDefault();
    const title = $("#taskTitle").val();
    const description = $("#taskDescription").val();
    const dueDate = $("#taskDueDate").val(); 

    const newTask = {
        id: generateTaskId(),
        title,
        description,
        dueDate,
        status: "to-do" // Start in "To Do" column
    };

    taskList.push(newTask);
    saveTasks(); 
    renderTaskList();
    $('#formModal').modal('hide');  // Close the modal
    $("#addTaskForm")[0].reset(); 
}
// Save Tasks to localStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(taskList));
}
// Load Tasks from localStorage on page load
function loadTasks() { 
    taskList = JSON.parse(localStorage.getItem("tasks")) || [];
    renderTaskList();
}
// Function to handle deleting a task
function handleDeleteTask(event) {
    const taskId = $(this).closest(".task").data("taskId");
    taskList = taskList.filter(task => task.id !== taskId);
    saveTasks();
    renderTaskList();
}

// Function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
    const taskId = ui.item.data("taskId");
    const newStatus = ui.item.parent().parent().attr("id").replace("-cards", ""); 
    const taskIndex = taskList.findIndex(task => task.id === taskId);
    taskList[taskIndex].status = newStatus;
    saveTasks();
    updateTaskColors();
}

// Function to update task colors based on deadlines (using Day.js)
function updateTaskColors() {
    const today = dayjs();
    $(".task").each(function() {
        const dueDate = dayjs($(this).data("dueDate"));
        $(this).removeClass("overdue near-deadline");
        if (dueDate.isBefore(today, 'day')) {
            $(this).addClass("overdue");
        } else if (dueDate.diff(today, 'day') <= 7) {
            $(this).addClass("near-deadline");
        }
    });
}


// Event Listeners
$(document).ready(function () {

    $('#formModal').on('shown.bs.modal', function () {
        $("#addTaskForm").submit(handleAddTask);
    });

    loadTasks(); // Load tasks on page load
    $(".lane .card-body").sortable({
        connectWith: ".lane .card-body",
        receive: handleDrop
    });
    

    $("#taskBoard").on("click", ".delete-task", handleDeleteTask);

    $("#taskDueDate").datepicker({ dateFormat: "yy-mm-dd" });
    setInterval(updateTaskColors, 24 * 60 * 60 * 1000); 
});

