// src/pages/MainPage.js
import React, { useState, useEffect, useCallback } from 'react';
import TaskList from '../components/TaskList';
import AddTaskButton from '../components/AddTaskButton';
import { ICON_MENU, USER_ID } from '../constants';
import * as notesApi from '../services/notesApi';

function MainPage() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCompletedTasks, setShowCompletedTasks] = useState(true); // Состояние для завершенных

    const mapBackendNoteToFrontendTask = useCallback((note) => {
        const subtasksArray = Object.entries(note.subtasks || {}).map(([text, completed]) => ({
            text,
            completed
        }));
        return {
            id: note._id,
            text: note.text || "",
            date: note.due_date || null,
            subtasks: note.subtasks || {},
            subtasksArray: subtasksArray,
            complete: note.complete || false,
            is_deleted: note.is_deleted || false,
            subtasksVisible: true,
        };
    }, []);

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const backendNotes = await notesApi.fetchNotes(USER_ID, false);
            setTasks(backendNotes.map(mapBackendNoteToFrontendTask));
        } catch (err) {
            setError(err.message);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    }, [mapBackendNoteToFrontendTask]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // Обработчики ожидают индекс из списка activeTasks (неудаленные задачи)
    const handleUpdateTaskFields = useCallback(async (taskId, changesForBackend) => {
        // ... (без изменений, находит задачу по taskId)
        const originalTasks = JSON.parse(JSON.stringify(tasks));
        setTasks(prevTasks => prevTasks.map(t => {
            if (t.id === taskId) {
                const updatedFrontendTask = { ...t };
                if (changesForBackend.complete !== undefined) {
                    updatedFrontendTask.complete = changesForBackend.complete;
                }
                if (changesForBackend.due_date !== undefined) {
                    updatedFrontendTask.date = changesForBackend.due_date;
                }
                if (changesForBackend.subtasks) {
                    updatedFrontendTask.subtasks = changesForBackend.subtasks;
                    updatedFrontendTask.subtasksArray = Object.entries(changesForBackend.subtasks)
                        .map(([text, completed]) => ({ text, completed }));
                }
                return updatedFrontendTask;
            }
            return t;
        }));
        try {
            const backendPayload = notesApi.mapToBackendNoteUpdate(changesForBackend);
            const updatedNoteFromBackend = await notesApi.updateNote(taskId, USER_ID, backendPayload);
            setTasks(prevTasks => prevTasks.map(t => {
                if (t.id === taskId) {
                    const freshData = mapBackendNoteToFrontendTask(updatedNoteFromBackend);
                    return { ...freshData, subtasksVisible: t.subtasksVisible };
                }
                return t;
            }));
        } catch (err) {
            setError(`Ошибка обновления: ${err.message}`);
            setTasks(originalTasks);
        }
    }, [tasks, mapBackendNoteToFrontendTask]);

    const handleToggleTask = useCallback((originalIndex) => { // originalIndex - индекс в общем списке tasks
        const task = tasks[originalIndex];
        if (!task) return;
        const newCompleteStatus = !task.complete;
        const newSubtasksDict = {};
        Object.keys(task.subtasks).forEach(key => {
            newSubtasksDict[key] = newCompleteStatus;
        });
        handleUpdateTaskFields(task.id, { complete: newCompleteStatus, subtasks: newSubtasksDict });
    }, [tasks, handleUpdateTaskFields]);

    const handleToggleSubtaskCompletion = useCallback((originalIndex, subtaskText) => { // originalIndex
        const task = tasks[originalIndex];
        if (!task) return;
        const newSubtasks = { ...task.subtasks };
        if (newSubtasks.hasOwnProperty(subtaskText)) {
            newSubtasks[subtaskText] = !newSubtasks[subtaskText];
            handleUpdateTaskFields(task.id, { subtasks: newSubtasks });
        }
    }, [tasks, handleUpdateTaskFields]);

    const handleToggleSubtasksVisibility = useCallback((originalIndex) => { // originalIndex
        const task = tasks[originalIndex];
        if (!task) return;
        setTasks(prevTasks => prevTasks.map((t, idx) =>
            idx === originalIndex ? { ...t, subtasksVisible: !t.subtasksVisible } : t
        ));
    }, [tasks]);


    const handleNavigateToAddTaskPage = () => {
        console.log("Переход на страницу добавления задачи (реализовать навигацию)");
        alert("Функционал добавления задачи будет на отдельной странице.");
    };

    if (isLoading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка задач...</p>;

    const activeTasks = tasks.filter(task => !task.is_deleted); // Все активные (не удаленные)
    const taskStatusMessage = activeTasks.filter(t => !t.complete).length === 0 && activeTasks.filter(t => t.complete).length === 0 ?
        "Активных задач нет." :
        `Активных задач: ${activeTasks.filter(t => !t.complete).length}` + (activeTasks.filter(t => t.complete).length > 0 ? ` (выполнено: ${activeTasks.filter(t => t.complete).length})` : "");


    return (
        <>
            <img src={ICON_MENU} alt="Меню" className="menu-icon" />
            {error && <p style={{ textAlign: 'center', color: 'red', background: '#500', padding: '10px', margin: '10px' }}>{error}</p>}
            {/*<div style={{ textAlign: 'center', margin: '10px 0 20px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>*/}
            {/*    <button onClick={loadTasks} style={{padding: '8px 15px', cursor: 'pointer', background: '#4a4a4a', color: '#ddd', border:'1px solid #666', borderRadius: '5px'}}>*/}
            {/*        Обновить список*/}
            {/*    </button>*/}
            {/*</div>*/}
            <TaskList
                allActiveTasks={activeTasks} // Передаем весь список активных задач
                showCompleted={showCompletedTasks}
                onToggleShowCompleted={() => setShowCompletedTasks(!showCompletedTasks)}
                taskStatusMessage={taskStatusMessage}
                onToggleTask={handleToggleTask}
                onToggleSubtaskCompletion={handleToggleSubtaskCompletion}
                onToggleSubtasksVisibility={handleToggleSubtasksVisibility}
            />
            <AddTaskButton onAddTask={handleNavigateToAddTaskPage} />
        </>
    );
}

export default MainPage;