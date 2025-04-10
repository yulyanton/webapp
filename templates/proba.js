// Wait until the HTML document is fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {

    // --- Data from Backend (simulated) ---
    let notions = [
      {
        text: 'Позвонить в сервис',
        date: 'вт 09.04',
        paragraphs: [
            { text: 'Узнать стоимость', completed: false },
            { text: 'Спросить сроки', completed: true }
        ],
        status: false,
        subtasksVisible: true
      },
      {
        text: 'Купить продукты', // Changed example text
        date: 'ср 10.04',
        paragraphs: [
            { text: 'Молоко', completed: false },
            { text: 'Хлеб', completed: false },
            { text: 'Яйца', completed: true }
        ],
        status: false,
        subtasksVisible: true
      },
      {
        text: 'Закончить отчет "Альфа"',
        date: 'пт 12.04',
        paragraphs: [], // Empty subtasks
        status: true,
        subtasksVisible: true // This property doesn't have much effect when paragraphs is empty
      },
      {
        text: 'Записаться к врачу',
        date: 'пн 15.04',
        paragraphs: [], // Empty subtasks
        status: false,
        subtasksVisible: true
      }
    ];

    // --- DOM Elements ---
    const tasksListContainer = document.querySelector('.tasks');
    const addTaskButton = document.querySelector('.add-task button');
    // const menuIcon = document.querySelector('.menu-icon'); // No functionality currently attached

    // --- Constants for Icons ---
    const ICON_TASK = '../assets/icons/task.svg';
    const ICON_TASK_DONE = '../assets/icons/task-completed.svg';
    const ICON_PLUS = '../assets/icons/plus.svg';
    const ICON_MINUS = '../assets/icons/minus.svg';

    // --- Event Delegation for Task Interactions ---
    tasksListContainer.addEventListener('click', (event) => {
        const target = event.target;
        // Find the closest ancestor which is a task container or a subtask element
        const taskContainer = target.closest('.task-container');
        if (!taskContainer) return; // Click wasn't inside a task container

        const taskIndex = parseInt(taskContainer.dataset.taskIndex, 10);
        if (isNaN(taskIndex)) return; // Should not happen if data-task-index is always set

        const action = target.dataset.action;
        if (!action) return; // Clicked element doesn't have a data-action

        switch (action) {
            case 'toggle-task':
                toggleTaskComplete(taskIndex);
                break;
            case 'edit-task':
                // Prevent re-triggering edit if already editing (input exists)
                if (!target.querySelector('input.edit-input')) {
                    makeEditable(target, taskIndex, null, 'text');
                }
                break;
            case 'toggle-subtask': {
                const subtaskDiv = target.closest('.subtasks');
                if (subtaskDiv) {
                    const paragraphIndex = parseInt(subtaskDiv.dataset.paragraphIndex, 10);
                    if (!isNaN(paragraphIndex)) {
                        toggleSubtaskComplete(taskIndex, paragraphIndex);
                        // Optional: Update parent status based on children completion
                        // checkAndUpdateParentStatus(taskIndex);
                    }
                }
                break;
            }
            case 'edit-subtask': {
                const subtaskDiv = target.closest('.subtasks');
                // Prevent re-triggering edit if already editing
                if (subtaskDiv && !target.querySelector('input.edit-input')) {
                    const paragraphIndex = parseInt(subtaskDiv.dataset.paragraphIndex, 10);
                    if (!isNaN(paragraphIndex)) {
                        // target should be the span containing the text
                        makeEditable(target, taskIndex, paragraphIndex, 'text');
                    }
                }
                break;
            }
            case 'toggle-subtasks': // Footer icon click (only exists if paragraphs.length > 0)
                toggleSubtasksVisibility(taskIndex);
                break;
        }
    });

    // --- Function to Toggle Subtask Visibility ---
    function toggleSubtasksVisibility(taskIndex) {
        const notion = notions[taskIndex];
        // This function is only called if the icon exists, which means paragraphs exist.
        if (notion && notion.paragraphs && notion.paragraphs.length > 0) {
            notion.subtasksVisible = !notion.subtasksVisible;
            renderTasks(); // Redraw to show/hide subtasks and update +/- icon
        } else {
             console.warn("toggleSubtasksVisibility called unexpectedly for task without subtasks or invalid index:", taskIndex);
        }
    }


    // --- Function to Create a Single Task Element ---
    function createTaskElement(notion, index) {
        const taskContainer = document.createElement('div');
        taskContainer.className = 'task-container';
        taskContainer.dataset.taskIndex = index;
        if (notion.status) {
            taskContainer.classList.add('completed');
        }

        // --- Main Task Block ---
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';

        const taskIcon = document.createElement('img');
        taskIcon.className = 'task-icon';
        taskIcon.src = notion.status ? ICON_TASK_DONE : ICON_TASK;
        taskIcon.alt = notion.status ? 'Выполнено' : 'Отметить как выполненное'; // Improved alt text
        taskIcon.dataset.action = 'toggle-task'; // Action on the icon

        const taskBody = document.createElement('div');
        taskBody.className = 'task-body';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = notion.text;
        taskText.dataset.action = 'edit-task'; // Action on the text

        taskBody.appendChild(taskText);
        taskDiv.appendChild(taskIcon);
        taskDiv.appendChild(taskBody);
        taskContainer.appendChild(taskDiv);

        // --- Subtasks Block (Conditionally Rendered) ---
        const hasSubtasks = notion.paragraphs && notion.paragraphs.length > 0;
        if (hasSubtasks && notion.subtasksVisible) {
            notion.paragraphs.forEach((paragraph, pIndex) => {
                const subtasksDiv = document.createElement('div');
                subtasksDiv.className = 'subtasks';
                subtasksDiv.dataset.paragraphIndex = pIndex;
                if (paragraph.completed) {
                    subtasksDiv.classList.add('completed');
                }

                const subtaskIcon = document.createElement('img');
                subtaskIcon.src = paragraph.completed ? ICON_TASK_DONE : ICON_TASK;
                subtaskIcon.alt = paragraph.completed ? 'Выполнено' : 'Отметить как выполненное';
                subtaskIcon.dataset.action = 'toggle-subtask'; // Action on subtask icon

                const subtaskText = document.createElement('span');
                subtaskText.textContent = paragraph.text;
                subtaskText.dataset.action = 'edit-subtask'; // Action on subtask text

                subtasksDiv.appendChild(subtaskIcon);
                subtasksDiv.appendChild(subtaskText);
                taskContainer.appendChild(subtasksDiv);
            });
        }

        // --- Task Footer Block ---
        const taskFooter = document.createElement('div');
        taskFooter.className = 'task-footer';

        // Date and Progress
        const taskDateSpan = document.createElement('span');
        taskDateSpan.className = 'task-date';
        const completedSubtasks = notion.paragraphs?.filter(p => p.completed).length || 0;
        const totalSubtasks = notion.paragraphs?.length || 0;
        const progressText = totalSubtasks > 0 ? ` (${completedSubtasks}/${totalSubtasks})` : ''; // Changed format
        taskDateSpan.textContent = (notion.date || 'Без даты') + progressText;
        taskFooter.appendChild(taskDateSpan);

        // Toggle Icon (only if subtasks exist)
        if (hasSubtasks) {
            const footerIcon = document.createElement('img');
            footerIcon.src = notion.subtasksVisible ? ICON_MINUS : ICON_PLUS;
            footerIcon.alt = notion.subtasksVisible ? 'Свернуть подзадачи' : 'Развернуть подзадачи';
            footerIcon.dataset.action = 'toggle-subtasks'; // Action on footer icon
            taskFooter.appendChild(footerIcon);
        }
        // If no subtasks, the footer will just have the date/empty progress

        taskContainer.appendChild(taskFooter);

        return taskContainer;
    }


    // --- Function to make an element editable ---
    // proba.js

// --- Function to make an element editable ---
function makeEditable(element, taskIndex, paragraphIndex, propertyKey) {
    const originalText = element.textContent;
    const isSubtask = paragraphIndex !== null;
    const placeholder = isSubtask ? "Подзадача..." : "Задача...";
    element.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.value = originalText;
    textarea.className = 'edit-input';
    textarea.placeholder = placeholder;
    // textarea.rows = 1; // rows больше не нужен, высота управляется JS

    let hasSaved = false;

    // --- Функция авто-изменения размера ---
    const resizeTextarea = () => {
        // Сначала получаем реальные стили, чтобы точно рассчитать высоту строки и макс высоту
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        const borderTopWidth = parseFloat(computedStyle.borderTopWidth);
        const borderBottomWidth = parseFloat(computedStyle.borderBottomWidth);

        // Рассчитываем максимальную высоту в пикселях (~6 строк)
        const maxHeight = (lineHeight * 6) + paddingTop + paddingBottom + borderTopWidth + borderBottomWidth;

        // Сбрасываем высоту для корректного измерения scrollHeight
        textarea.style.height = 'auto'; // или '1px'

        const scrollHeight = textarea.scrollHeight;

        // Применяем высоту
        if (scrollHeight <= maxHeight) {
            textarea.style.height = scrollHeight + 'px';
            textarea.style.overflowY = 'hidden'; // Скроллбар не нужен
        } else {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'scroll'; // Показываем скроллбар
        }
    };
    // --------------------------------------

    const saveChanges = () => {
        // ... (код saveChanges остается без изменений) ...
        if (hasSaved) return;
        hasSaved = true;
        const newText = textarea.value.trim() || (isSubtask ? "Подзадача" : "Задача");
        if (newText !== originalText) {
             if (isSubtask) {
                 notions[taskIndex].paragraphs[paragraphIndex][propertyKey] = newText;
             } else {
                 notions[taskIndex][propertyKey] = newText;
             }
             element.textContent = newText; // Помним про white-space: pre-wrap в CSS для span
             console.log('Updated notions:', notions);
        } else {
             element.textContent = originalText;
        }
        cleanup();
    };

    const cancelChanges = () => {
        // ... (код cancelChanges остается без изменений) ...
        element.textContent = originalText;
        cleanup();
    };

    const handleKeyDown = (e) => {
        // ... (код handleKeyDown остается без изменений, Enter не сохраняет) ...
        if (e.key === 'Escape') {
            cancelChanges();
        }
    };

    const cleanup = () => {
        // !!! Удаляем обработчик 'input' !!!
        textarea.removeEventListener('input', resizeTextarea);
        textarea.removeEventListener('blur', saveChanges);
        textarea.removeEventListener('keydown', handleKeyDown);
        if (element && element.contains(textarea)) {
            try { element.removeChild(textarea); } catch (e) { /* Ignore */ }
        }
        if (element && !element.textContent) {
            element.textContent = originalText;
        }
    };

    // Добавляем обработчики
    // !!! Добавляем обработчик 'input' для авто-ресайза !!!
    textarea.addEventListener('input', resizeTextarea);
    textarea.addEventListener('blur', saveChanges);
    textarea.addEventListener('keydown', handleKeyDown);

    element.appendChild(textarea);

    // !!! Вызываем resizeTextarea сразу после добавления для установки начальной высоты !!!
    resizeTextarea();

    textarea.focus();
    textarea.setSelectionRange(originalText.length, originalText.length);
}

    // --- Data Manipulation Functions ---

    function toggleTaskComplete(taskIndex) {
        const notion = notions[taskIndex];
        if (notion) {
            notion.status = !notion.status;
            // Optional: Sync subtask completion state? Depends on desired logic.
            if (notion.paragraphs) {
               notion.paragraphs.forEach(p => p.completed = notion.status);
            }
            renderTasks(); // Redraw to update UI
        }
    }

    function toggleSubtaskComplete(taskIndex, paragraphIndex) {
        const paragraph = notions[taskIndex]?.paragraphs?.[paragraphIndex];
        if (paragraph) {
            paragraph.completed = !paragraph.completed;
            // Optional: Update parent status based on children completion
            // checkAndUpdateParentStatus(taskIndex);
            renderTasks(); // Redraw needed to update parent footer progress
        }
    }

    // Note: addSubtask function exists but is not directly triggered by the default UI
    // It could be wired to a new button or context menu in the future.
    function addSubtask(taskIndex) {
        const notion = notions[taskIndex];
        if (notion) {
             const newSubtask = { text: 'Новая подзадача', completed: false };
             if (!notion.paragraphs) {
                 notion.paragraphs = []; // Initialize if it doesn't exist
             }
             notion.paragraphs.push(newSubtask);
             notion.subtasksVisible = true; // Ensure subtasks are visible when adding
             // Optional: Update parent status (e.g., uncomplete parent if adding a task)
             // notion.status = false;
             // checkAndUpdateParentStatus(taskIndex);
             renderTasks();

             // Focus the newly added subtask for immediate editing
             setTimeout(() => {
                 const taskContainer = tasksListContainer.querySelector(`[data-task-index="${taskIndex}"]`);
                 const subtaskElements = taskContainer?.querySelectorAll('.subtasks'); // Get all subtask divs
                 if(subtaskElements && subtaskElements.length > 0) {
                     const lastSubtaskElement = subtaskElements[subtaskElements.length - 1]; // Target the last one
                     const newSubtaskIndex = parseInt(lastSubtaskElement.dataset.paragraphIndex, 10);
                     const newSubtaskTextElement = lastSubtaskElement.querySelector('span[data-action="edit-subtask"]'); // Target the text span
                      if (newSubtaskTextElement && !isNaN(newSubtaskIndex)) {
                          console.log(`Focusing new subtask ${newSubtaskIndex} in task ${taskIndex}`);
                          makeEditable(newSubtaskTextElement, taskIndex, newSubtaskIndex, 'text');
                      }
                 }
             }, 0); // Delay ensures DOM is updated after renderTasks
        }
    }

    function addNewTask() {
        const newTask = {
            text: 'Новая задача', // Default text
            date: new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' }), // Formatted date
            paragraphs: [],
            status: false,
            subtasksVisible: true // Doesn't matter visually until paragraphs are added
        };
        // Add to the beginning or end? Let's add to the end for now.
        notions.push(newTask);
        const newTaskIndex = notions.length - 1; // Get index *before* rendering

        renderTasks(); // Redraw list with the new task

        // Focus the new task for immediate editing
        setTimeout(() => {
            const newTaskElement = tasksListContainer.querySelector(`[data-task-index="${newTaskIndex}"]`);
            if (newTaskElement) {
                // Scroll into view smoothly
                newTaskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const newTaskTextElement = newTaskElement.querySelector('.task-text[data-action="edit-task"]');
                if (newTaskTextElement) {
                    makeEditable(newTaskTextElement, newTaskIndex, null, 'text');
                }
            }
        }, 50); // Small delay might help ensure scrollIntoView works after render
    }

    // --- Function to Render All Tasks ---
    function renderTasks() {
        // Preserve scroll position to avoid jarring jumps during re-render
        const scrollY = window.scrollY;

        tasksListContainer.innerHTML = ''; // Clear previous tasks

        if (notions.length === 0) {
             // Display a message if there are no tasks
             tasksListContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 50px;">Задач пока нет. Нажмите "+" чтобы добавить.</p>';
        } else {
            // Optional: Update parent statuses before rendering if needed
            // notions.forEach((_, index) => checkAndUpdateParentStatus(index));

            // Create and append each task element
            notions.forEach((notion, index) => {
                const taskElement = createTaskElement(notion, index);
                tasksListContainer.appendChild(taskElement);
            });
        }

        // Restore scroll position
        window.scrollTo(0, scrollY);
    }

    // --- Initial Rendering ---
    renderTasks(); // Render tasks when the page loads

    // --- Add Event Listeners ---
    if (addTaskButton) {
        addTaskButton.addEventListener('click', addNewTask);
    }

}); // End of DOMContentLoaded