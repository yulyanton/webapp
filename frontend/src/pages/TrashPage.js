import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './TrashPage.css';
import * as notesApi from '../services/notesApi';
import { USER_ID } from '../constants';

function TrashPage() {
    const [deletedNotes, setDeletedNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDeletedNotes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const notes = await notesApi.fetchNotes(USER_ID, true); // Fetch ALL notes, including deleted
            // Filter to show only notes that are marked as is_deleted: true
            const onlyDeletedNotes = notes.filter(note => note.is_deleted === true);
            setDeletedNotes(onlyDeletedNotes);
        } catch (err) {
            setError(err.message);
            setDeletedNotes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDeletedNotes();
    }, [loadDeletedNotes]);

    const handleRestore = async (noteId) => {
        try {
            await notesApi.restoreFromTrash(noteId, USER_ID);
            console.log('Note restored successfully:', noteId);
            loadDeletedNotes(); // Refresh the list
        } catch (err) {
            setError(`Ошибка восстановления: ${err.message}`);
        }
    };

    if (isLoading) {
        return <p className="loading">Загрузка...</p>;
    }

    if (error) {
        return <p className="error">Ошибка: {error}</p>;
    }

    if (deletedNotes.length === 0) {
        return (
            <div className="trash-page">
                <div className="header">
                    <Link to="/" className="back-button">
                        ←
                    </Link>
                    <h1>Корзина</h1>
                </div>
                <p className="empty-message">В корзине нет удаленных задач.</p>
            </div>
        );
    }

    return (
        <div className="trash-page">
            <div className="header">
                <Link to="/" className="back-button">
                    ←
                </Link>
                <h1>Корзина</h1>
            </div>

            <div className="deleted-notes">
                {deletedNotes.map(note => (
                    <div className="deleted-note" key={note._id}>
                        <p className="note-text">{note.text}</p>
                        <button className="restore-button" onClick={() => handleRestore(note._id)}>
                            Восстановить
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TrashPage;