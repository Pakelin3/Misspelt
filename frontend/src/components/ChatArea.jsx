import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useTheme } from '@/context/ThemeContext'; 

function ChatArea() {
    const { theme } = useTheme(); 
    const [messages, setMessages] = useState([
        { id: 1, text: "Hola, soy Gemini-Clone. ¿En qué puedo ayudarte hoy?", sender: 'ai' },
        { id: 2, text: "Me gustaria saber las diferentes maneras de usar get como verbo frasal", sender: 'user' },
        { id: 3, text: `¡Claro! El verbo "get" es extremadamente versátil y forma muchísimos phrasal verbs en inglés. 
            Aquí te presento algunas de las formas más comunes y sus significados:\n\n1. Get up: Levantarse de la cama o 
            de una superficie.\n   * Ejemplo: "I usually get up at 7 AM." (Normalmente me levanto a las 7 AM.)\n\n2. Get on/off: 
            Subir/bajar de un transporte público (bus, tren, avión).\n   * Ejemplo: "Let's get on the bus." (Vamos a subir al autobús.) 
            / "Be careful when you get off the train." (Ten cuidado al bajar del tren.)\n\n3. Get along (with): Llevarse bien con alguien.\n   
            * Ejemplo: "Do you get along with your colleagues?" (¿Te llevas bien con tus colegas?)\n\n4. Get over: Superar (una enfermedad, una 
            ruptura, un problema).\n   * Ejemplo: "It took her a long time to get over the flu." (Le tomó mucho tiempo recuperarse de la gripe.)\n\n5. 
            Get by: Arreglárselas, apañárselas (generalmente con recursos limitados).\n   * Ejemplo: "I don't earn much, but we get by." 
            (No gano mucho, pero nos las arreglamos.)\n\n6. Get away (from): Escaparse, alejarse de un lugar o situación.\n   * Ejemplo: 
            "I need to get away from the city for a while." (Necesito alejarme de la ciudad por un tiempo.)\n\n7. Get across: Comunicar 
            o hacer entender una idea.\n   * Ejemplo: "It was hard to get my idea across to the team." (Fue difícil hacer entender mi idea 
            al equipo.)\n\n8. Get around: Moverse de un lugar a otro; también significa evadir o evitar algo.\n   * Ejemplo: "It's easy to 
            get around London by Tube." (Es fácil moverse por Londres en metro.)\n\n9. Get through: Terminar o completar algo; superar un 
            período difícil.\n   * Ejemplo: "I have a lot of work to get through today." (Tengo mucho trabajo que terminar hoy.)\n\n10. 
            Get back: Regresar a un lugar.\n    * Ejemplo: "What time did you get back last night?" (¿A qué hora regresaste anoche 
            anoche?)\n\nEs importante recordar que el significado de un phrasal verb a menudo no se puede deducir de las palabras individuales. 
            ¡La práctica y la exposición son clave! ¿Te gustaría que te diera ejemplos más específicos o que exploráramos otro phrasal verb?`, sender: 'ai' },
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (text) => {
        if (text.trim()) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: prevMessages.length + 1, text: text, sender: 'user' },
            ]);
            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { id: prevMessages.length + 1, text: `"${text}" - Interesante. Déjame procesar eso...`, sender: 'ai' },
                ]);
            }, 1000);
        }
    };

    return (
        <div className={`flex flex-col flex-1 pt-4 px-4 overflow-y-auto custom-scrollbar relative
            ${theme === 'light' ? 'bg-[var(--color-bg-main)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
            <div className="flex-1 pb-4 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className={`sticky bottom-0 w-full py-4 bg-gradient-to-b from-transparent
                ${theme === 'light'
                    ? 'via-[var(--color-bg-main)] to-[var(--color-bg-main)]'
                    : 'via-[var(--color-dark-bg-main)] to-[var(--color-dark-bg-main)]'
                }`}>
                <div className={`max-w-3xl mt-6 mx-auto w-full
                    ${theme === 'light' ? 'bg-[var(--color-bg-main)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                    <ChatInput onSendMessage={handleSendMessage} />
                </div>
                <p className={`text-center text-xs mt-2
                    ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                        La IA puede cometer errores, así que comprueba sus respuestas.
                    </p>
            </div>
        </div>
    );
}

export default ChatArea;