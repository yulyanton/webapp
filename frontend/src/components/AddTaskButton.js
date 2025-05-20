// src/components/AddTaskButton.js
import React from 'react';

function AddTaskButton({ onAddTask }) {
    return (
        <div className="add-task">
            <button
                aria-label="Добавить новую задачу"
                onClick={onAddTask}
            >
                {/* SVG for plus is in CSS background */}
            </button>
        </div>
    );
}

export default AddTaskButton;