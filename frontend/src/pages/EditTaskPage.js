import React, {useEffect, useRef, useState} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './EditTaskPage.css';
import * as notesApi from '../services/notesApi';
import { USER_ID } from '../constants';
import { ICON_TASK } from '../constants';

function EditTaskPage() {
    const [taskText, setTaskText] = useState('');
    const [reminder, setReminder] = useState(null);
    const [dueDate, setDueDate] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const navigate = useNavigate();
    const { noteId } = useParams();  // Get the noteId from the URL
    console.log(noteId);

    useEffect(() => {
        const loadTask = async () => {
            try {
                const note = await notesApi.fetchNotes(USER_ID);
                const findTask = note.find(item => item._id === noteId)
                setTaskText(findTask.text);
                setReminder(findTask.reminder_date || null);
                setDueDate(findTask.due_date || null);
                setSubtasks(Object.entries(findTask.subtasks).map(([text, completed]) => ({ text, completed })));
            } catch (error) {
                console.error('Error loading task:', error);
            }
        };
        loadTask();
    }, [noteId]);

    const handleReminderChange = (e) => {
        setReminder(e.target.value);
        console.log("Reminder selected:", e.target.value);
    };

    const handleDueDateChange = (e) => {
        setDueDate(e.target.value);
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

    const handleMoveToTrash = async () => {
        try {
            await notesApi.moveToTrash(noteId, USER_ID);
            console.log('Task moved to trash successfully');
            navigate("/");
        } catch (error) {
            console.error('Error moving task to trash:', error);
        }
    };

    const handleSubmit = async () => {
        const taskData = {
            text: taskText,
            due_date: dueDate,
            reminder_date: reminder,
            subtasksArray: subtasks.filter(subtask => subtask.text.trim() !== '')
        };

        try {
            const backendNote = notesApi.mapToBackendNoteUpdate(taskData);
            console.log(taskData)
            console.log(backendNote);
            await notesApi.updateNote(noteId, USER_ID, backendNote);
            console.log('Task updated successfully');
            navigate("/");
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };
    const textareaRef = useRef(null);

    const autoGrow = () => {
        const element = textareaRef.current;
        if (element) {
            element.style.height = "5px";
            element.style.height = (element.scrollHeight) + "px";
        }
    };

    useEffect(() => {
        autoGrow();
    }, []);

    const handleInput = () => {
        autoGrow();
    };
    return (
        <div className="edit-task-page">
            <div className="header">
                <Link to="/" className="back-button">
                    ←
                </Link>
            </div>

            <div className="task-input">
                <img src={ICON_TASK} alt={"Задача"}/>
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
                    <input type="datetime-local" id="reminder" onChange={handleReminderChange} value={reminder || ''}/>
                </div>

                <div className="option-row">
          <span className="option-icon">
            <span className="material-symbols-outlined">calendar_month</span>
          </span>
                    <label htmlFor="due-date">Установить срок задачи:</label>
                    <input type="date" id="due-date" onChange={handleDueDateChange} value={dueDate || ''}/>
                </div>
            </div>
            <div className="buttons-container">
                <div className="buttons-inner">
                    <div className="submit-edit-button" onClick={handleSubmit}>
                    </div>
                    <div className="trash-button" onClick={handleMoveToTrash}>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditTaskPage;