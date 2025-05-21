import React from 'react';
import { Link } from 'react-router-dom';
import './SettingsPage.css';

function SettingsPage() {
    return (
        <div className="settings-page">
            <div className="header">
                <Link to="/" className="back-button">
                    ← {/* Unicode character for left arrow */}
                </Link>
                <h1>Настройки</h1>
            </div>

            <div className="setting-options">
                <div className="setting-row">
          <span className="setting-icon">
            <span className="material-symbols-outlined">brightness_medium</span>
          </span>
                    <span>Сменить тему</span>
                    {/* TODO: Theme toggle control */}
                </div>

                <Link to="/trash" className="setting-row">
                      <span className="setting-icon">
                        <span className="material-symbols-outlined">delete</span>
                      </span>
                    <span>Корзина</span>
                </Link>
            </div>
        </div>
    );
}

export default SettingsPage;