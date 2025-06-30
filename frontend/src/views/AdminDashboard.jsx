import React from 'react'
import Sidebar from '@/components/Sidebar'
import DashboardStatsCards from '@/components/admin/DashboardStatsCards';
import DictionaryAdminPanel from '@/components/admin/DictionaryAdminPanel';
import BadgesAdminPanel from '@/components/admin/BadgesAdminPanel';
import { useTheme } from '@/context/ThemeContext';
import { Routes, Route } from 'react-router-dom';

function AdminDashboard() {
    const { theme } = useTheme();

    return (
        <div className={`flex flex-col sm:flex-row  min-h-[calc(100vh-64px)] ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
            <Sidebar />
            <div className={`flex-1 p-4 ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                <Routes>
                    <Route index element={<DashboardStatsCards />} />
                    <Route path="words" element={<DictionaryAdminPanel />} />
                    <Route path="badges" element={<BadgesAdminPanel />} />
                </Routes>
            </div>
        </div>
    )
}

export default AdminDashboard;