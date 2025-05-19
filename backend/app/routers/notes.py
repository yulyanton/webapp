# app/routers/notes.py
from fastapi import APIRouter, HTTPException, Body, Path, Query
from typing import List
from bson import ObjectId # для проверки note_id перед вызовом crud

from .. import crud
from ..models import NoteCreate, NoteUpdate, NoteResponse, NoteInDBBase

router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)

async def get_note_or_404(note_id: str, user_id: int) -> NoteInDBBase:
    try:
        ObjectId(note_id) 
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note_id format")

    note = await crud.get_note_by_id_and_user(note_id, user_id)
    if not note:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found or you don't have permission.")
    return note

@router.post("/", response_model=NoteResponse, status_code=201)
async def create_new_note(note_data: NoteCreate = Body(...)):
    created_note = await crud.create_note(note_data)
    if not created_note:
        raise HTTPException(status_code=500, detail="Note could not be created")
    return created_note

@router.get("/user/{user_id}/", response_model=List[NoteResponse])
async def read_user_notes(
    user_id: int = Path(..., description="ID пользователя Telegram"),
    include_deleted: bool = Query(False, description="Включить заметки из корзины")
):
    return await crud.get_notes_by_user_id(user_id, include_deleted)

@router.put("/{note_id}/", response_model=NoteResponse)
async def update_existing_note(
    note_id: str = Path(..., description="ID заметки"),
    note_update_data: NoteUpdate = Body(...),
    requesting_user_id: int = Query(..., description="ID пользователя, выполняющего запрос")
):
    note_to_update = await get_note_or_404(note_id, requesting_user_id)
    if note_to_update.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted note. Restore it first.")

    updated_note = await crud.update_note_by_id(note_id, requesting_user_id, note_update_data)
    if not updated_note:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found or update failed.")
    return updated_note

@router.patch("/{note_id}/trash/", response_model=NoteResponse)
async def move_note_to_trash_endpoint(
    note_id: str = Path(..., description="ID заметки для перемещения в корзину"),
    requesting_user_id: int = Query(..., description="ID пользователя, выполняющего запрос")
):
    note_to_check = await get_note_or_404(note_id, requesting_user_id)
    if note_to_check.is_deleted:
        raise HTTPException(status_code=400, detail="Note is already in trash.")

    trashed_note = await crud.set_note_deleted_status(note_id, requesting_user_id, is_deleted=True)
    if not trashed_note:
        raise HTTPException(status_code=500, detail="Could not move note to trash.")
    return trashed_note

@router.patch("/{note_id}/restore/", response_model=NoteResponse)
async def restore_note_from_trash_endpoint(
    note_id: str = Path(..., description="ID заметки для восстановления из корзины"),
    requesting_user_id: int = Query(..., description="ID пользователя, выполняющего запрос")
):
    note_to_check = await get_note_or_404(note_id, requesting_user_id)
    if not note_to_check.is_deleted:
        raise HTTPException(status_code=400, detail="Note is not in trash.")

    restored_note = await crud.set_note_deleted_status(note_id, requesting_user_id, is_deleted=False)
    if not restored_note:
        raise HTTPException(status_code=500, detail="Could not restore note from trash.")
    return restored_note

@router.delete("/{note_id}/", status_code=204)
async def delete_note_permanently_endpoint(
    note_id: str = Path(..., description="ID заметки для полного удаления"),
    requesting_user_id: int = Query(..., description="ID пользователя, выполняющего запрос")
):
    note_to_delete = await get_note_or_404(note_id, requesting_user_id) 

    deleted = await crud.delete_note_permanently_by_id(note_id, requesting_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Note with id {note_id} not found or could not be deleted.")
    return None
