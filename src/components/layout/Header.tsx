import React from 'react';
import { ActiveTab } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs: ActiveTab[] = ["Dashboard", "Trades", "Analysis", "Settings"];

  return (
    <header className="header">
      <div className="logo">
        <h1>TradeLog</h1>
      </div>
      <nav className="nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`nav-button ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className="user-menu">
        <div className="user-avatar"></div>
      </div>
    </header>
  );
};

export default Header;
