// src/components/EditableText.js
// Без изменений по сравнению с предыдущей версией.
// Он не будет использоваться для отображения основного текста задачи или подзадач.
// Может использоваться для поля ввода при добавлении новой подзадачи.
import React, { useState, useEffect, useRef } from 'react';

function EditableText({
                          initialText,
                          onSave,
                          placeholder = "Введите текст...",
                          className = "",
                          tag: Tag = 'span',
                          isTextarea = false,
                          onCancel,
                          isReadOnly = false,
                          autoFocus = false
                      }) {
    const [isEditing, setIsEditing] = useState(autoFocus && !isReadOnly);
    const [text, setText] = useState(initialText);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setText(initialText);
        if (autoFocus && !isReadOnly) {
            setIsEditing(true);
        }
    }, [initialText, autoFocus, isReadOnly]);

    useEffect(() => {
        if (isEditing && !isReadOnly) {
            const currentRef = isTextarea ? textareaRef.current : inputRef.current;
            if (currentRef) {
                currentRef.focus();
                currentRef.setSelectionRange(currentRef.value.length, currentRef.value.length);
                if (isTextarea) {
                    resizeTextarea();
                }
            }
        }
    }, [isEditing, isTextarea, isReadOnly]);

    const handleSave = () => {
        if (isReadOnly) return;
        const newText = text.trim(); // Не используем placeholder как значение по умолчанию
        if (newText !== initialText.trim()) { // Сохраняем, если текст изменился
            onSave(newText); // Передаем чистое значение
        } else if (newText === "" && initialText.trim() !== "") { // Если текст был очищен
            onSave("");
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (isReadOnly) return;
        setText(initialText);
        setIsEditing(false);
        if (onCancel) onCancel(initialText);
    };

    const handleKeyDown = (e) => {
        if (isReadOnly) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const resizeTextarea = () => {
        if (!textareaRef.current || isReadOnly) return;
        const textarea = textareaRef.current;
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || (parseFloat(computedStyle.fontSize) * 1.4);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        const borderTopWidth = parseFloat(computedStyle.borderTopWidth);
        const borderBottomWidth = parseFloat(computedStyle.borderBottomWidth);

        const maxHeight = (lineHeight * 6) + paddingTop + paddingBottom + borderTopWidth + borderBottomWidth;

        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;

        if (scrollHeight <= maxHeight) {
            textarea.style.height = scrollHeight + 'px';
            textarea.style.overflowY = 'hidden';
        } else {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'scroll';
        }
    };

    const startEditing = () => {
        if (!isReadOnly) {
            setIsEditing(true);
        }
    };

    if (isEditing && !isReadOnly) {
        if (isTextarea) {
            return (
                <textarea
                    ref={textareaRef}
                    className="edit-input"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        resizeTextarea();
                    }}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
            );
        } else {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    className="edit-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                />
            );
        }
    }

    return (
        <Tag
            className={className}
            onClick={startEditing}
            style={{
                cursor: isReadOnly ? 'default' : 'pointer',
                whiteSpace: isTextarea ? 'pre-wrap' : 'normal'
            }}
            role={isReadOnly ? undefined : "button"}
            tabIndex={isReadOnly ? -1 : 0}
            onKeyDown={(e) => { if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) startEditing();}}
        >
            {text || (isReadOnly && initialText === "" ? "" : (placeholder && !isEditing ? placeholder : ""))}
        </Tag>
    );
}
export default EditableText;