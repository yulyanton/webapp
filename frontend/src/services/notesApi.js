// src/services/notesApi.js
import { API_BASE_URL } from '../constants';

async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        console.error('API Error:', errorData, 'Status:', response.status);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

export const mapToBackendNoteCreate = (taskData, userId) => { // taskData теперь будет содержать { ..., complete: boolean, ... }
    const backendSubtasks = {};
    if (taskData.subtasksArray && Array.isArray(taskData.subtasksArray)) {
        taskData.subtasksArray.forEach(sub => {
            if (sub.text && sub.text.trim() !== "") {
                backendSubtasks[sub.text.trim()] = sub.completed || false;
            }
        });
    }

    return {
        user_id: userId,
        text: taskData.text,
        subtasks: backendSubtasks,
        due_date: taskData.date || null,
        complete: taskData.complete || false, // Используем taskData.complete
    };
};

export const mapToBackendNoteUpdate = (taskChanges) => { // taskChanges теперь будет содержать { ..., complete: boolean, ... }
    const backendUpdate = {};
    if (taskChanges.text !== undefined) backendUpdate.text = taskChanges.text;

    if (taskChanges.subtasksArray !== undefined && Array.isArray(taskChanges.subtasksArray)) {
        // ... (логика для subtasksArray)
    } else if (taskChanges.subtasks !== undefined) {
        backendUpdate.subtasks = taskChanges.subtasks;
    }

    if (taskChanges.date !== undefined) backendUpdate.due_date = taskChanges.date;
    if (taskChanges.complete !== undefined) backendUpdate.complete = taskChanges.complete; // Используем taskChanges.complete

    return backendUpdate;
};

// ... (fetchNotes, createNote, updateNote, etc. остаются без изменений)
// ...
export const fetchNotes = async (userId, includeDeleted = false) => {
    const response = await fetch(`${API_BASE_URL}/notes/user/${userId}/?include_deleted=${includeDeleted}`);
    return handleResponse(response);
};

export const createNote = async (noteData) => {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
    });
    return handleResponse(response);
};

export const updateNote = async (noteId, requestingUserId, noteUpdateData) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/?requesting_user_id=${requestingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteUpdateData),
    });
    return handleResponse(response);
};

export const moveToTrash = async (noteId, requestingUserId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/trash/?requesting_user_id=${requestingUserId}`, {
        method: 'PATCH',
    });
    return handleResponse(response);
};

export const restoreFromTrash = async (noteId, requestingUserId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/restore/?requesting_user_id=${requestingUserId}`, {
        method: 'PATCH',
    });
    return handleResponse(response);
};

export const deletePermanently = async (noteId, requestingUserId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/?requesting_user_id=${requestingUserId}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};