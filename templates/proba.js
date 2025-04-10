// Wait until the HTML document is fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {

    // --- Data from Backend (simulated with refined structure) ---
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
        text: 'Купить продукты',
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
        paragraphs: [], // Пустые подзадачи
        status: true,
        subtasksVisible: true
      },
      {
        text: 'Записаться к врачу',
        date: 'пн 15.04',
        paragraphs: [], // Пустые подзадачи
        status: false,
        subtasksVisible: true
      }
    ];

    // --- DOM Elements ---
    const tasksListContainer = document.querySelector('.tasks');
    const addTaskButton = document.querySelector('.add-task button');
    const menuIcon = document.querySelector('.menu-icon'); // Element selected, but no listener

    // --- Constants for Icons (Paths relative to index.html) ---
    const ICON_TASK = '../assets/icons/task.svg';
    const ICON_TASK_DONE = '../assets/icons/task-completed.svg'; // Updated path
    const ICON_PLUS = '../assets/icons/plus.svg';
    const ICON_MINUS = '../assets/icons/minus.svg';

    // --- Dynamically Inject CSS for Completed State ---
    function injectStyles() {
        const styleSheet = document.styleSheets[0];
        let ruleExists = false;
        const rule1Selector = '.task-container.completed .task-text, .subtasks.completed > span';
        const rule2Selector = '.task-container.completed';
        try {
            for(let i=0; i<styleSheet.cssRules.length; i++) {
                if(styleSheet.cssRules[i].selectorText === rule1Selector) {
                    ruleExists = true;
                    break;
                }
            }
        } catch (e) { console.warn("Could not access CSS rules to check for 'completed' style."); }

        if (!ruleExists) {
            try {
                styleSheet.insertRule(`${rule1Selector} { text-decoration: line-through; opacity: 0.6; }`, styleSheet.cssRules.length);
                styleSheet.insertRule(`${rule2Selector} { background-color: #303030 !important; filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.2)) !important; }`, styleSheet.cssRules.length);
                styleSheet.insertRule(`.task-container.completed .task-icon, .subtasks.completed > img:first-of-type { opacity: 0.6; }`, styleSheet.cssRules.length);
            } catch (e) { console.error("Could not insert CSS rules for completed state.", e); }
        }
    }
    injectStyles();

    // --- Event Delegation for Task Interactions ---
    tasksListContainer.addEventListener('click', (event) => {
        const target = event.target;
        const taskContainer = target.closest('.task-container');
        if (!taskContainer) return;

        const taskIndex = parseInt(taskContainer.dataset.taskIndex, 10);
        if (isNaN(taskIndex)) return;

        const action = target.dataset.action;

        switch (action) {
            case 'toggle-task':
                toggleTaskComplete(taskIndex);
                break;
            case 'edit-task':
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
                        // После изменения подзадачи, проверяем статус родителя (если есть авто-статус)
                        // checkAndUpdateParentStatus(taskIndex); // Раскомментируйте, если нужна логика авто-статуса
                        // renderTasks(); // Перерисовываем, чтобы обновить UI
                    }
                }
                break;
            }
            case 'edit-subtask': {
                const subtaskDiv = target.closest('.subtasks');
                if (subtaskDiv && !target.querySelector('input.edit-input')) {
                    const paragraphIndex = parseInt(subtaskDiv.dataset.paragraphIndex, 10);
                    if (!isNaN(paragraphIndex)) {
                        makeEditable(target, taskIndex, paragraphIndex, 'text');
                    }
                }
                break;
            }
            case 'toggle-subtasks': // Footer icon click
                 // Эта функция сама разберется, добавлять или сворачивать/разворачивать
                handleFooterIconClick(taskIndex);
                break;
        }
    });

    // --- Function to Handle Footer Icon Click ---
    // Эта функция вызывается ТОЛЬКО если иконка была добавлена (т.е. paragraphs.length > 0)
    // ИЛИ если пользователь КЛИКНУЛ на иконку [+] у задачи без подзадач (в старой версии кода)
    // В НОВОЙ ВЕРСИИ эта функция будет вызвана ТОЛЬКО для задач с подзадачами.
    function handleFooterIconClick(taskIndex) {
        const notion = notions[taskIndex];
        if (!notion) return;

        // Проверка на пустой массив здесь больше не нужна, т.к. иконка не будет создана
        // Но оставим ее для надежности, если вдруг вызовется в нештатной ситуации
        if (!notion.paragraphs || notion.paragraphs.length === 0) {
             // Этого не должно произойти с новой логикой createTaskElement
             console.warn("handleFooterIconClick called for task without paragraphs.");
             // Можно все равно попробовать добавить подзадачу, как раньше
             // addSubtask(taskIndex);
             return;
        }

        // Если подзадачи есть, просто переключаем видимость
        notion.subtasksVisible = !notion.subtasksVisible;
        renderTasks(); // Перерисовываем, чтобы показать/скрыть и сменить иконку +/-
    }


    // --- Function to Create a Single Task Element (Matching Original CSS) ---
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
        taskIcon.alt = notion.status ? 'Отмечено' : 'Отметить';
        taskIcon.style.cursor = 'pointer';
        taskIcon.dataset.action = 'toggle-task';

        const taskBody = document.createElement('div');
        taskBody.className = 'task-body';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = notion.text;
        taskText.style.cursor = 'pointer';
        taskText.dataset.action = 'edit-task';

        taskBody.appendChild(taskText);
        taskDiv.appendChild(taskIcon);
        taskDiv.appendChild(taskBody);
        taskContainer.appendChild(taskDiv);

        // --- Subtasks Block (conditionally visible, one div per subtask) ---
        if (notion.paragraphs && notion.paragraphs.length > 0 && notion.subtasksVisible) {
            notion.paragraphs.forEach((paragraph, pIndex) => {
                const subtasksDiv = document.createElement('div');
                subtasksDiv.className = 'subtasks';
                subtasksDiv.dataset.paragraphIndex = pIndex;

                if (paragraph.completed) {
                    subtasksDiv.classList.add('completed');
                }

                const subtaskIcon = document.createElement('img');
                subtaskIcon.src = paragraph.completed ? ICON_TASK_DONE : ICON_TASK;
                subtaskIcon.alt = paragraph.completed ? 'Отмечено' : 'Отметить';
                subtaskIcon.style.cursor = 'pointer';
                subtaskIcon.dataset.action = 'toggle-subtask';

                const subtaskText = document.createElement('span');
                subtaskText.textContent = paragraph.text;
                subtaskText.style.cursor = 'pointer';
                subtaskText.dataset.action = 'edit-subtask';

                subtasksDiv.appendChild(subtaskIcon);
                subtasksDiv.appendChild(subtaskText);
                taskContainer.appendChild(subtasksDiv);
            });
        }

        // --- Task Footer Block --- ИЗМЕНЕННЫЙ БЛОК ---
        const taskFooter = document.createElement('div');
        taskFooter.className = 'task-footer';

        // Дата и прогресс всегда отображаются
        const taskDateSpan = document.createElement('span');
        taskDateSpan.className = 'task-date';
        const completedSubtasks = notion.paragraphs?.filter(p => p.completed).length || 0;
        const totalSubtasks = notion.paragraphs?.length || 0;
        const progressText = totalSubtasks > 0 ? ` ${completedSubtasks} из ${totalSubtasks}` : '';
        taskDateSpan.textContent = (notion.date || 'Нет даты') + progressText;
        taskFooter.appendChild(taskDateSpan); // Добавляем дату

        // Добавляем иконку [+] или [-] ТОЛЬКО если есть подзадачи
        if (totalSubtasks > 0) {
            const footerIcon = document.createElement('img'); // Создаем иконку ВНУТРИ условия
            footerIcon.src = notion.subtasksVisible ? ICON_MINUS : ICON_PLUS;
            footerIcon.alt = notion.subtasksVisible ? 'Свернуть подзадачи' : 'Развернуть подзадачи';
            footerIcon.style.cursor = 'pointer';
            footerIcon.dataset.action = 'toggle-subtasks'; // Действие для сворачивания/разворачивания
            taskFooter.appendChild(footerIcon); // Добавляем иконку ВНУТРИ условия
        }
        // Если totalSubtasks === 0, иконка не создается и не добавляется

        taskContainer.appendChild(taskFooter); // Футер добавляется всегда

        return taskContainer;
    }


    // --- Function to make an element editable ---
    function makeEditable(element, taskIndex, paragraphIndex, propertyKey) {
        const originalText = element.textContent;
        const isSubtask = paragraphIndex !== null;
        const placeholder = isSubtask ? "Подзадача" : "Задача";
        element.innerHTML = '';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'edit-input';
        input.style.width = 'calc(100% - 8px)';
        input.style.boxSizing = 'border-box';
        input.style.backgroundColor = '#555';
        input.style.color = '#eee';
        input.style.border = '1px solid #777';
        input.style.padding = '1px 3px';
        input.style.fontFamily = 'inherit';
        input.style.fontSize = 'inherit';
        input.style.outline = 'none';

        const saveChanges = () => {
            const newText = input.value.trim() || placeholder;
            if (newText !== originalText) {
                if (isSubtask) {
                    // Обновляем текст подзадачи в массиве notions
                    notions[taskIndex].paragraphs[paragraphIndex][propertyKey] = newText;
                } else {
                    // Обновляем текст основной задачи в массиве notions
                    notions[taskIndex][propertyKey] = newText;
                }
                console.log('Updated notions:', notions); // Показываем обновленный массив
                element.textContent = newText; // Обновляем текст в HTML
                // renderTasks(); // НЕ вызываем полный рендер здесь, чтобы не прерывать ввод
            } else {
                element.textContent = originalText; // Восстанавливаем, если не изменилось
            }
             input.removeEventListener('blur', saveChanges);
             input.removeEventListener('keydown', handleKeyDown);
             // Безопасное удаление input
             if (element && element.contains(input)) {
                try { element.removeChild(input); } catch(e) {}
             }
             // Восстанавливаем текст, если элемент остался пустым
             if (element && !element.textContent) {
                 element.textContent = originalText;
             }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Сохраняем по Enter
            } else if (e.key === 'Escape') {
                 element.textContent = originalText; // Отмена по Escape
                 // Удаляем обработчики и input
                 input.removeEventListener('blur', saveChanges);
                 input.removeEventListener('keydown', handleKeyDown);
                 if (element && element.contains(input)) {
                    try { element.removeChild(input); } catch(e) {}
                 }
            }
        };

        input.addEventListener('blur', saveChanges, { once: true });
        input.addEventListener('keydown', handleKeyDown);

        element.appendChild(input);
        input.focus();
        input.select();
    }

    // --- Data Manipulation Functions ---

    function toggleTaskComplete(taskIndex) {
        const notion = notions[taskIndex];
        if (notion) {
            notion.status = !notion.status;
            // Если есть подзадачи, возможно, нужно обновить и их статус? (Зависит от логики)
            // if (notion.paragraphs && notion.paragraphs.length > 0) {
            //     notion.paragraphs.forEach(p => p.completed = notion.status);
            // }
            renderTasks(); // Перерисовываем для обновления UI
        }
    }

    function toggleSubtaskComplete(taskIndex, paragraphIndex) {
        const paragraph = notions[taskIndex]?.paragraphs?.[paragraphIndex];
        if (paragraph) {
            paragraph.completed = !paragraph.completed;
            // Возможно, нужно обновить статус родителя, если все подзадачи выполнены?
            // checkAndUpdateParentStatus(taskIndex); // Раскомментируйте, если нужна эта логика
            renderTasks(); 
        }
    }

     function addSubtask(taskIndex) {
        const notion = notions[taskIndex];
        if (notion) {
             const newSubtask = { text: 'Новая подзадача', completed: false };
             // Убедимся, что массив paragraphs существует
             if (!notion.paragraphs) {
                 notion.paragraphs = [];
             }
             notion.paragraphs.push(newSubtask);
             notion.subtasksVisible = true; // Показать подзадачи при добавлении
             // Возможно, нужно обновить статус родителя
             // checkAndUpdateParentStatus(taskIndex);
             renderTasks(); // Перерисовать, чтобы показать новую подзадачу и иконку [-]

             // --- Логика для фокуса на новой подзадаче ---
             // Используем setTimeout, чтобы DOM успел обновиться после renderTasks
             setTimeout(() => {
                 const taskContainer = tasksListContainer.querySelector(`[data-task-index="${taskIndex}"]`);
                 // Ищем последнюю подзадачу
                 const subtaskElements = taskContainer?.querySelectorAll('.subtasks');
                 if(subtaskElements && subtaskElements.length > 0) {
                     const lastSubtaskElement = subtaskElements[subtaskElements.length - 1];
                     const newSubtaskIndex = parseInt(lastSubtaskElement.dataset.paragraphIndex, 10); // Получаем реальный индекс
                     const newSubtaskTextElement = lastSubtaskElement.querySelector('span');
                      if (newSubtaskTextElement && !isNaN(newSubtaskIndex)) {
                          console.log(`Focusing subtask ${newSubtaskIndex} in task ${taskIndex}`);
                          makeEditable(newSubtaskTextElement, taskIndex, newSubtaskIndex, 'text');
                      }
                 }
             }, 0); // Запускаем после текущего цикла событий
        }
    }

    function addNewTask() {
        const newTask = {
            text: 'Новая задача',
            date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            paragraphs: [], // Новая задача без подзадач
            status: false,
            subtasksVisible: true // Не имеет значения, т.к. paragraphs пуст
        };
        notions.push(newTask);
        renderTasks(); // Перерисовываем, новая задача появится без иконки +/-

        // --- Логика фокуса ---
        setTimeout(() => {
            const newTaskIndex = notions.length - 1;
            const newTaskElement = tasksListContainer.querySelector(`[data-task-index="${newTaskIndex}"]`);
            if (newTaskElement) {
                newTaskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Изменено на nearest
                const newTaskTextElement = newTaskElement.querySelector('.task-text');
                if (newTaskTextElement) {
                    makeEditable(newTaskTextElement, newTaskIndex, null, 'text');
                }
            }
        }, 0);
    }

    // --- Function to Render All Tasks ---
    function renderTasks() {
        const currentScroll = window.scrollY; // Сохраняем прокрутку
        tasksListContainer.innerHTML = ''; // Clear

        if (notions.length === 0) {
             tasksListContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 50px;">Задач пока нет. Нажмите "+" чтобы добавить.</p>';
        } else {
            // Перед рендером можно проверить консистентность статусов (если нужна авто-логика)
            // notions.forEach((_, index) => checkAndUpdateParentStatus(index));

            notions.forEach((notion, index) => {
                const taskElement = createTaskElement(notion, index);
                tasksListContainer.appendChild(taskElement);
            });
        }
        window.scrollTo(0, currentScroll); // Восстанавливаем прокрутку
    }

    // --- Initial Rendering ---
    renderTasks(); // Первый рендер при загрузке

    // --- Add Event Listeners ---
    if (addTaskButton) {
        addTaskButton.addEventListener('click', addNewTask);
    }

}); // End of DOMContentLoaded