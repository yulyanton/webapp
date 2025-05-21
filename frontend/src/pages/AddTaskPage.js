import React, {useEffect, useRef, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AddTaskPage.css';
import * as notesApi from '../services/notesApi';
import {ICON_TASK} from '../constants';
import {initData} from "@telegram-apps/sdk-react";

function AddTaskPage() {
    const USER_ID = initData.user().id;
    const [taskText, setTaskText] = useState('');
    const [reminder, setReminder] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [subtasks, setSubtasks] = useState([]); // Subtasks
    const navigate = useNavigate();

    const handleReminderChange = (e) => {
        setReminder(e.target.value); // Store the reminder value
        console.log("Reminder selected:", e.target.value);
    };

    const handleDueDateChange = (e) => {
        setDueDate(e.target.value); // Store the due date value
        console.log("Due Date selected:", e.target.value);
    };

    const handleSubtaskChange = (index, event) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index].text = event.target.value;
        setSubtasks(newSubtasks);
    };

    const addSubtask = () => {
        setSubtasks([...subtasks, { text: '', completed: false }]);
    };

    const removeSubtask = (index) => {
        const newSubtasks = [...subtasks];
        newSubtasks.splice(index, 1);
        setSubtasks(newSubtasks);
    };

    const handleSubmit = async () => {
        const taskData = {
            text: taskText,
            due_date: dueDate,
            reminder_date: reminder,
            subtasksArray: subtasks.filter(subtask => subtask.text.trim() !== '') // Remove empty subtasks
        };
        console.log(taskData);
        try {
            const backendNote = notesApi.mapToBackendNoteCreate(taskData, USER_ID);
            const newNote = await notesApi.createNote(backendNote);
            console.log('Task created successfully:', newNote);
            navigate("/"); // Redirect to main page after successful creation
        } catch (error) {
            console.error('Error creating task:', error);
            // Handle error (show message, etc.)
        }
    };
    const textareaRef = useRef(null);

    const autoGrow = () => {
        const element = textareaRef.current;
        if (element) {
            element.style.height = "5px"; // Reset height to calculate correctly
            element.style.height = (element.scrollHeight) + "px";
        }
    };

    useEffect(() => {
        // Initial grow on mount, in case the initial value is long
        autoGrow();
    }, []); // Run only once after initial render

    const handleInput = () => {
        autoGrow(); // Call autoGrow on every change
    };

    return (
        <div className="add-task-page">
            <div className="header">
                <Link to="/" className="back-button">
                    ←
                </Link>
            </div>

            <div className="task-input">
                {/*<span className="task-icon-wrapper">*/}
                {/*  <span className="material-symbols-outlined">task</span>*/}
                {/*</span>*/}
                <img src={ICON_TASK} alt={"Задача"}></img>
                <textarea
                    placeholder="Напишите свои планы..."
                    ref={textareaRef}
                    value={taskText}
                    onInput={handleInput}
                    onChange={(e) => setTaskText(e.target.value)}
                    className="task-text-area"
                />
            </div>
            <div className="subtasks">
                {subtasks.map((subtask, index) => (
                    <div key={index} className="subtask-row">
                        <input
                            type="text"
                            placeholder={`Подзадача ${index + 1}`}
                            value={subtask.text}
                            onChange={(e) => handleSubtaskChange(index, e)}
                        />
                        <button type="button" onClick={() => removeSubtask(index)}>
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addSubtask} className="add-subtask-button">
                    <span className="material-symbols-outlined">add</span> Добавить подзадачу
                </button>
            </div>

            <div className="options">
                <div className="option-row">
          <span className="option-icon">
            <span className="material-symbols-outlined">notifications</span>
          </span>
                    <label htmlFor="reminder">Установить напоминание:</label>
                    <input type="datetime-local" id="reminder" onChange={handleReminderChange} />
                </div>

                <div className="option-row">
          <span className="option-icon">
            <span className="material-symbols-outlined">calendar_month</span>
          </span>
                    <label htmlFor="due-date">Установить срок задачи:</label>
                    <input type="date" id="due-date" onChange={handleDueDateChange} />
                </div>

            </div>




            <div className="submit-button">
                <button
                    aria-label="Добавить новую задачу"
                    onClick={handleSubmit}
                >
                    {/* SVG for plus is in CSS background */}
                </button>
            </div>
        </div>
    );
}

export default AddTaskPage;