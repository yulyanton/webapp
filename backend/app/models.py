# app/models.py
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from datetime import date, datetime, timezone
from bson import ObjectId

from .database import PyObjectId # Импортируем наш кастомный PyObjectId

class NoteBase(BaseModel):
    user_id: int = Field(..., description="ID пользователя Telegram")
    text: str = Field(..., min_length=1, description="Текст заметки")
    subtasks: Dict[str, bool] = Field(default_factory=dict, description="Подзадачи: {'текст подзадачи': True/False}")
    due_date: Optional[date] = Field(None, description="Срок выполнения заметки")
    complete: bool = Field(False, description="Статус выполнения заметки")

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)
    subtasks: Optional[Dict[str, bool]] = None
    due_date: Optional[date] = None
    complete: Optional[bool] = None

class NoteInDBBase(NoteBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = Field(False, description="Находится ли заметка в корзине")

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

# Модель для ответа клиенту (ID в виде строки)
class NoteResponse(NoteInDBBase):
    id: str = Field(..., alias="_id") # Переопределяем id как строку

    @field_validator('id', mode='before')
    @classmethod
    def convert_id_to_str(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v
