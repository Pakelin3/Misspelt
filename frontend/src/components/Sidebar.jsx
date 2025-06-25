import React from 'react'
import { BookA, Gem, ChartColumnBig } from 'lucide-react';

function Sidebar() {
    return (
        <>
            <button
                data-drawer-target="separator-sidebar"
                data-drawer-toggle="separator-sidebar"
                aria-controls="separator-sidebar"
                type="button"
                className="inline-flex items-center bg-[var(--color-pink-500)] p-2 mt-2 ms-3 text-sm text-gray-100 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-[var(--color-pink-600)] dark:focus:ring-gray-200"
            >
                <span className="sr-only">Open sidebar</span>
                <svg
                    className="w-6 h-6  dark:text-white"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                    />
                </svg>
            </button>
            <aside
                id="separator-sidebar"
                className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-[var(--color-teal-400)] border-r border-gray-200 sm:translate-x-0"
                aria-label="Sidebar"
            >
                <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-[var(--color-teal-400)]">
                    <ul className="space-y-2 font-medium">
                        <li>
                            <a
                                href="#"
                                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-[var(--color-pink-500)] group"
                            >
                                <ChartColumnBig className="w-5 h-5 text-gray-500 transition duration-75 dark:text-[var(--color-pink-500)] group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span className="ms-3">Dashboard</span>
                            </a>
                        </li>
                    </ul>
                    <ul className="pt-4 mt-4 space-y-2 font-medium border-t border-gray-200 dark:border-[var(--color-pink-500)]">
                        <li>
                            <a
                                href="#"
                                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-[var(--color-pink-500)] group"
                            >
                                <BookA className="w-5 h-5 text-gray-500 transition duration-75 dark:text-[var(--color-pink-500)] group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span className="ms-3">Diccionario</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-[var(--color-pink-500)] group"
                            >
                                <Gem className="w-5 h-5 text-gray-500 transition duration-75 dark:text-[var(--color-pink-500)] group-hover:text-gray-900 dark:group-hover:text-white" />
                                <span className="ms-3">Insignias</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </aside >
        </>

    )
}

export default Sidebar