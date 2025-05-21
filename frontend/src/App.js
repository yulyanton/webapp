import logo from './logo.svg';
import './App.css';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Main from "./pages/MainPage";
import AddTaskPage from "./pages/AddTaskPage";
import EditTaskPage from "./pages/EditTaskPage";
import SettingsPage from "./pages/SettingsPage";
import TrashPage from "./pages/TrashPage"; // Import the new component

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/add-task" element={<AddTaskPage />} /> {/* Route to AddTaskPage */}
                <Route path="/edit-task/:noteId" element={<EditTaskPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/trash" element={<TrashPage/>} /> {/* Route for TrashPage */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;