// src/components/TaskItem.js
import React from 'react';
import {
    ICON_TASK, ICON_TASK_DONE, ICON_PLUS, ICON_MINUS
} from '../constants';

function TaskItem({
                      task,
                      taskIndex,
                      onToggleTask,
                      onToggleSubtaskCompletion,
                      onToggleSubtasksVisibility
                  }) {
    const subtasksArray = Object.entries(task.subtasks || {}).map(([text, completed]) => ({
        text,
        completed // Это поле уже называется 'completed' для подзадач
    }));

    const hasSubtasks = subtasksArray.length > 0;
    const completedSubtasksCount = subtasksArray.filter(s => s.completed).length;
    const progressText = hasSubtasks ? ` (${completedSubtasksCount}/${subtasksArray.length})` : '';

    const footerIconStyle = {
        width: '12px',
        height: '12px',
        cursor: 'pointer',
        opacity: 0.7,
    };

    return (
        <div
            className={`task-container ${task.complete ? 'completed' : ''} ${task.is_deleted ? 'deleted-task-visual' : ''}`} // Используем task.complete
            data-task-id={task.id}
        >
            <div className="task">
                <img
                    src={task.complete ? ICON_TASK_DONE : ICON_TASK} // Используем task.complete
                    alt={task.complete ? 'Выполнено' : 'Отметить'} // Используем task.complete
                    className="task-icon"
                    onClick={() => !task.is_deleted && onToggleTask(taskIndex)}
                />
                <div className="task-body">
          <span className="task-text" style={{ whiteSpace: 'pre-wrap', cursor: 'default' }}>
            {task.text || "Нет текста задачи"}
          </span>
                </div>
            </div>

            {hasSubtasks && task.subtasksVisible && subtasksArray.map((subtask, sIndex) => (
                <div
                    key={`${task.id}-sub-${subtask.text.replace(/\s+/g, '-')}-${sIndex}`}
                    className={`subtasks ${subtask.completed ? 'completed' : ''}`} // Подзадачи уже используют 'completed'
                >
                    <img
                        src={subtask.completed ? ICON_TASK_DONE : ICON_TASK}
                        alt={subtask.completed ? 'Выполнено' : 'Отметить'}
                        onClick={() => !task.is_deleted && onToggleSubtaskCompletion(taskIndex, subtask.text)}
                    />
                    <span style={{ flexGrow: 1, cursor: 'default', lineHeight: '1.4' }}>{subtask.text}</span>
                </div>
            ))}

            <div className="task-footer">
        <span className="task-date">
          {task.date ? new Date(task.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'Без даты'}
            {progressText}
        </span>
                <div className="task-actions">
                    {hasSubtasks && !task.is_deleted && (
                        <img
                            src={task.subtasksVisible ? ICON_MINUS : ICON_PLUS}
                            alt={task.subtasksVisible ? 'Свернуть' : 'Развернуть'}
                            style={footerIconStyle}
                            onClick={() => onToggleSubtasksVisibility(taskIndex)}
                            title={task.subtasksVisible ? 'Свернуть подзадачи' : 'Развернуть подзадачи'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskItem;