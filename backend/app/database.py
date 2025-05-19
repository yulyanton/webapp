# app/database.py
import motor.motor_asyncio
from bson import ObjectId
from pydantic import GetJsonSchemaHandler # Изменилось для Pydantic v2
from pydantic_core import core_schema # Изменилось для Pydantic v2

from .config import settings

# --- MongoDB Client ---
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_DETAILS)
database = client[settings.DATABASE_NAME]
notes_collection = database.get_collection(settings.NOTES_COLLECTION_NAME)

# --- Вспомогательный класс для ObjectId MongoDB ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field): # Добавил field
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema_obj: core_schema.CoreSchema, handler: GetJsonSchemaHandler): # Изменилось для Pydantic v2
        json_schema = handler(core_schema_obj)
        json_schema.update(type="string")
        return json_schema

# Индексация для ускорения запросов по user_id и is_deleted
async def create_indexes():
    await notes_collection.create_index([("user_id", 1), ("is_deleted", 1)])
    print("Indexes created for notes_collection.")
