import React from 'react';
import Accordion from '@/components/Accordion';
import RandomWordCard from '@/components/RandomWordCard';

function Homepage() {

    return (

        <div className='min-h-auto my-20'>
            <section className='flex justify-center min-h-96 items-center max-h-2/4 bg-gray-200 p-4'> 
                {/*
                 // TODO: Proximamente preview del juego
                */}
                <p className='text-gray-500'>Próximamente: Preview del juego...</p> 
            </section>

            <section className='flex justify-around m-20 gap-20 flex-wrap-reverse items-end'>
                <div className='block max-w-md p-6 bg-[var(--color-bg-card)] shadow-lg border border-[var(--color-bg-secondary)] rounded-lg justify-self-start '> 
                    <RandomWordCard />
                </div>
                <div className="block max-w-md p-6 bg-[var(--color-bg-card)] shadow-lg border rounded-lg border-[var(--color-bg-secondary)]"> 
                    <Accordion />
                </div>
            </section>
        </div>
    );
}

export default Homepage;