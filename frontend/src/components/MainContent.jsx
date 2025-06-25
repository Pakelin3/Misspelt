import React from 'react';
import Header from './Header';
import ChatArea from './ChatArea';

function MainContent({ toggleSidebar }) {
    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out`}>
            <Header toggleSidebar={toggleSidebar} />
            <ChatArea />
        </div>
    );
}

export default MainContent;