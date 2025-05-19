# app/crud.py
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from pymongo import ReturnDocument # <--- ИЗМЕНЕНИЕ: Импортируем ReturnDocument из pymongo

from .database import notes_collection
from .models import NoteCreate, NoteUpdate, NoteInDBBase, NoteResponse
# import motor.motor_asyncio # Этот импорт больше не нужен здесь для ReturnDocument

# Вспомогательная функция для преобразования документа MongoDB в модель Pydantic
# и обработки due_date
def db_note_to_response_model(db_note: dict) -> NoteResponse:
    if db_note.get("due_date") and isinstance(db_note["due_date"], datetime):
        db_note["due_date"] = db_note["due_date"].date()
    return NoteResponse(**db_note)


async def create_note(note_data: NoteCreate) -> Optional[NoteResponse]:
    note_dict = note_data.model_dump()
    note_dict["created_at"] = datetime.now(timezone.utc)
    note_dict["updated_at"] = datetime.now(timezone.utc)
    note_dict["is_deleted"] = False

    if note_dict.get("due_date"):
        note_dict["due_date"] = datetime.combine(note_dict["due_date"], datetime.min.time(), tzinfo=timezone.utc)

    result = await notes_collection.insert_one(note_dict)
    created_note_db = await notes_collection.find_one({"_id": result.inserted_id})
    if created_note_db:
        return db_note_to_response_model(created_note_db)
    return None

async def get_notes_by_user_id(user_id: int, include_deleted: bool = False) -> List[NoteResponse]:
    query = {"user_id": user_id}
    if not include_deleted:
        query["is_deleted"] = False

    notes_cursor = notes_collection.find(query)
    notes_list = []
    async for note_db in notes_cursor:
        notes_list.append(db_note_to_response_model(note_db))
    return notes_list

async def get_note_by_id_and_user(note_id: str, user_id: int) -> Optional[NoteInDBBase]:
    try:
        obj_id = ObjectId(note_id)
    except Exception:
        return None
    note_db = await notes_collection.find_one({"_id": obj_id, "user_id": user_id})
    if note_db:
        return NoteInDBBase(**note_db)
    return None

async def update_note_by_id(note_id: str, user_id: int, note_update_data: NoteUpdate) -> Optional[NoteResponse]:
    try:
        obj_id = ObjectId(note_id)
    except Exception:
        return None

    update_data = note_update_data.model_dump(exclude_unset=True)
    if not update_data:
        return None

    update_data["updated_at"] = datetime.now(timezone.utc)
    if "due_date" in update_data and update_data["due_date"] is not None:
        update_data["due_date"] = datetime.combine(update_data["due_date"], datetime.min.time(), tzinfo=timezone.utc)
    elif "due_date" in update_data and update_data["due_date"] is None:
        update_data["due_date"] = None

    updated_note_db = await notes_collection.find_one_and_update(
        {"_id": obj_id, "user_id": user_id, "is_deleted": False},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER # <--- ИЗМЕНЕНИЕ: Используем ReturnDocument напрямую
    )
    if updated_note_db:
        return db_note_to_response_model(updated_note_db)
    return None

async def set_note_deleted_status(note_id: str, user_id: int, is_deleted: bool) -> Optional[NoteResponse]:
    try:
        obj_id = ObjectId(note_id)
    except Exception:
        return None

    current_status_condition = not is_deleted

    updated_note_db = await notes_collection.find_one_and_update(
        {"_id": obj_id, "user_id": user_id, "is_deleted": current_status_condition},
        {"$set": {"is_deleted": is_deleted, "updated_at": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER # <--- ИЗМЕНЕНИЕ: Используем ReturnDocument напрямую
    )
    if updated_note_db:
        return db_note_to_response_model(updated_note_db)
    return None

async def delete_note_permanently_by_id(note_id: str, user_id: int) -> bool:
    try:
        obj_id = ObjectId(note_id)
    except Exception:
        return False

    delete_result = await notes_collection.delete_one({"_id": obj_id, "user_id": user_id})
    return delete_result.deleted_count > 0