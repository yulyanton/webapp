import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import BotCommandScopeType
from aiogram.types import BotCommand
from aiogram.filters import CommandStart

# Токен вашего бота (получите у BotFather)
BOT_TOKEN = "7803228193:AAFzjKmwh9fnQvnHzhWZsT6ZIspqQVACDvM"

# URL вашего Flask-приложения (где оно будет доступно)
WEB_APP_URL = "https://898b-89-169-54-148.ngrok-free.app/"  # Например, "https://yourdomain.com" или "http://localhost:5000"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Обработчик команды /start
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    # Создаем inline-кнопку для открытия веб-приложения
    keyboard_builder = InlineKeyboardBuilder()
    keyboard_builder.button(text="Открыть веб-приложение", web_app=types.WebAppInfo(url=WEB_APP_URL))

    # Отправляем сообщение с кнопкой
    await message.reply(
        "Привет! Нажми на кнопку ниже, чтобы открыть веб-приложение:",
        reply_markup=keyboard_builder.as_markup(),
    )


# Запуск бота (в режиме Long Polling)
async def main():

    # Запускаем Long Polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
