// src/components/TaskList.js
import React, { useState, useRef, useEffect } from 'react'; // Добавлен useState
import TaskItem from './TaskItem';

function TaskList({
                      allActiveTasks, // Получаем полный список активных (не удаленных) задач
                      showCompleted: initialShowCompleted, // Получаем начальное состояние
                      onToggleShowCompleted, // Функция для изменения состояния в MainPage
                      taskStatusMessage,
                      onToggleTask,
                      onToggleSubtaskCompletion,
                      onToggleSubtasksVisibility,
                  }) {
    // Локальное состояние для анимации, синхронизированное с пропсом
    const [showCompletedLocal, setShowCompletedLocal] = useState(initialShowCompleted);
    const completedTasksContainerRef = useRef(null);

    // Обновляем локальное состояние, если пропс изменился
    useEffect(() => {
        setShowCompletedLocal(initialShowCompleted);
    }, [initialShowCompleted]);

    useEffect(() => {
        if (completedTasksContainerRef.current) {
            if (showCompletedLocal) {
                completedTasksContainerRef.current.style.maxHeight = completedTasksContainerRef.current.scrollHeight + "px";
                // Добавим небольшой таймаут, чтобы после установки scrollHeight успел примениться overflow visible
                // перед тем как снова станет hidden из-за transition.
                // Это помогает избежать "прыжка" контента, если он был обрезан.
                setTimeout(() => {
                    if (completedTasksContainerRef.current && showCompletedLocal) { // Проверяем, что состояние не изменилось
                        completedTasksContainerRef.current.style.overflow = 'visible';
                    }
                }, 500); // Время должно совпадать или быть чуть больше времени transition
            } else {
                completedTasksContainerRef.current.style.overflow = 'hidden'; // Сначала скрываем overflow
                completedTasksContainerRef.current.style.maxHeight = "0px";
            }
        }
    }, [showCompletedLocal, allActiveTasks]); // Пересчитываем при изменении видимости или списка задач

    const incompleteTasks = allActiveTasks.filter(task => !task.complete);
    const completedTasks = allActiveTasks.filter(task => task.complete);

    // Функция для получения оригинального индекса задачи в общем списке `tasks` (который в `MainPage`)
    // Это упрощение, предполагающее, что allActiveTasks и tasks в MainPage имеют одинаковый порядок для активных задач
    // и что MainPage.tasks не содержит удаленных между активными.
    // Более надежно было бы передавать функцию поиска из MainPage или искать по ID.
    // Но для соблюдения "изменения только в TaskList", делаем так:
    const getOriginalIndex = (task) => {
        // Этот метод не очень надежен, если allActiveTasks - это уже отфильтрованный tasks.
        // Он сработает, если allActiveTasks - это tasks.filter(t => !t.is_deleted)
        // и MainPage.tasks не имеет других фильтраций до is_deleted.
        // Более надежно было бы, если бы MainPage.tasks передавался как allTasksIncludingDeleted
        // и мы бы тут находили по ID.
        // Сейчас предполагаем, что MainPage.handleEvent(originalIndex) ожидает индекс из MainPage.tasks.
        // А TaskItem получает task.id
        // Поэтому в TaskItem обработчики должны вызывать onToggleTask(task.id) и т.д.
        // А MainPage.handleToggleTask(taskId) должен находить задачу по ID.
        // Это противоречит "изменения только в TaskList".

        // !!! ВАЖНОЕ ИЗМЕНЕНИЕ ЛОГИКИ ДЛЯ СОБЛЮДЕНИЯ УСЛОВИЯ "изменения только в TaskList" !!!
        // TaskItem будет получать индекс ОТНОСИТЕЛЬНО своего списка (incomplete или completed)
        // А TaskList будет преобразовывать этот локальный индекс + сам объект задачи
        // в вызов коллбэка с ОРИГИНАЛЬНЫМ ИНДЕКСОМ из allActiveTasks (который должен быть тем же, что и в MainPage.activeTasks)
        // Если MainPage.handle... ожидает индекс из tasks (включая удаленные), то это не сработает.
        // Условие "изменения только в TaskList" очень ограничивает.

        // Придется передавать в TaskItem индекс из allActiveTasks.
        return allActiveTasks.findIndex(t => t.id === task.id);
    };


    if (allActiveTasks.length === 0) {
        return (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>
                {taskStatusMessage || "Задач пока нет."}
            </p>
        );
    }

    const handleToggleCompletedClick = () => {
        // Обновляем локальное состояние для анимации
        // И вызываем коллбэк для обновления состояния в MainPage
        setShowCompletedLocal(!showCompletedLocal);
        if (onToggleShowCompleted) {
            onToggleShowCompleted();
        }
    };


    return (
        <main className="tasks">
            <span style={{ fontSize: "28px", fontWeight: "bold", display: 'block', marginBottom: '10px' }}>Задачи</span>
            {incompleteTasks.length > 0 && (
                    incompleteTasks.map((task) => { // index здесь - локальный для incompleteTasks
                        const originalTaskIndex = getOriginalIndex(task); // Получаем индекс в allActiveTasks\
                        return (
                            <TaskItem
                                key={task._id}
                                task={task}
                                taskIndex={originalTaskIndex} // Передаем индекс из allActiveTasks
                                onToggleTask={onToggleTask} // MainPage.handleToggleTask ожидает этот originalTaskIndex
                                onToggleSubtaskCompletion={onToggleSubtaskCompletion}
                                onToggleSubtasksVisibility={onToggleSubtasksVisibility}
                            />
                        )
                    }))
            }

            {completedTasks.length > 0 && (
                <>
                    <button
                        onClick={handleToggleCompletedClick}
                        style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            // width: "100%", // Ширина на весь контейнер задач
                            width: 'max-content',
                            textAlign: "left", // Текст слева
                            borderRadius: "10px",
                            borderWidth: "0",
                            padding: "5px 5px",
                            margin: "0px 0 0px 0",
                            cursor: "pointer",
                            background: "#383838",
                            color: "#ccc",
                            display: "flex",
                            justifyContent: "space-between", // Разместить текст и стрелку по краям
                            alignItems: "center",
                        }}
                    >
                        <span className="material-symbols-outlined"
                              style={{
                                transform: showCompletedLocal ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.3s ease-in-out',
                                display: 'inline-block',
                                marginRight: '5px'}}>
                            chevron_right
                        </span>

                        Завершенные
                    </button>
                    <div
                        ref={completedTasksContainerRef}
                        className="completed-tasks-container"
                        style={{
                            overflow: 'hidden', // Изначально hidden
                            transition: 'max-height 0.4s ease-in-out',
                            maxHeight: initialShowCompleted ? '10000px' : '0px', // Начальное состояние (10000px - "достаточно много")
                            // useEffect уточнит это значение
                        }}
                    >
                        {completedTasks.map((task) => { // index здесь - локальный для completedTasks
                            const originalTaskIndex = getOriginalIndex(task);
                            return (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    taskIndex={originalTaskIndex}
                                    onToggleTask={onToggleTask}
                                    onToggleSubtaskCompletion={onToggleSubtaskCompletion}
                                    onToggleSubtasksVisibility={onToggleSubtasksVisibility}
                                />
                            );
                        })}
                    </div>
                </>
            )}
            {/* Сообщение если нет ВООБЩЕ никаких задач */}
            {incompleteTasks.length === 0 && completedTasks.length === 0 &&
                <p style={{ color: '#aaa', margin: '10px 0 20px 0' }}>Нет задач.</p>
            }
        </main>
    );
}

export default TaskList;