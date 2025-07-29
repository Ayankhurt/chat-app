import React, { useContext, useEffect, useState, useRef } from 'react';
import { GlobalContext } from '../context/Context';
import { useParams, useNavigate } from 'react-router';
import io from 'socket.io-client';

function Chat() {
    const { state, dispatch } = useContext(GlobalContext);
    const { id } = useParams(); // Receiver ID
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [receiver, setReceiver] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Data fetch karne ke liye useEffect
    useEffect(() => {
        const newSocket = io(state.baseSocketIo, { withCredentials: true });
        setSocket(newSocket);

        const fetchReceiver = async () => {
            const response = await fetch(`${state.baseUrl}/profile?user_id=${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setReceiver(data.user);
            }
        };

        const fetchConversation = async () => {
            const response = await fetch(`${state.baseUrl}/conversation/${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.status === 401) {
                dispatch({ type: 'USER_LOGOUT' });
                navigate('/login');
                throw new Error('User not authenticated'); // Stop further execution
            }
            if (response.ok) {
                const data = await response.json();
                if (data.message === 'Message Found') {
                    setMessages(data.conversation);
                }
            }
        };

        const loadInitialData = async () => {
            try {
                // Promise.all dono functions ke poora hone ka intezar karega
                await Promise.all([fetchReceiver(), fetchConversation()]);
            } catch (error) {
                console.error("Failed to load initial chat data:", error);
            } finally {
                // Jab sab kuch ho jaye, chahe success ya fail, loading band kar dein
                setIsLoading(false);
            }
        };

        loadInitialData();

        // Socket listeners ko setup karein
        newSocket.on(`${state.user.user_id}-${id}`, (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        newSocket.on(`personal-channel-${state.user.user_id}`, (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Cleanup function
        return () => newSocket.disconnect();
    }, [state.baseUrl, state.baseSocketIo, state.user.user_id, id, dispatch, navigate]);

    // New messages aane par neeche scroll karein
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Baaki functions (sendMessage, getInitials, etc.) waise hi rahenge...
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            await fetch(`${state.baseUrl}/chat/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message })
            });
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };
    
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // UI render karne ka code
    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-spin" style={{ height: '3rem', width: '3rem', border: '4px solid #c7d2fe', borderTopColor: '#4f46e5', borderRadius: '50%' }}></div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <header className="chat-header">
                <button onClick={() => navigate('/users')} style={{background: 'none', border: 'none', marginRight: '1rem', cursor: 'pointer'}}>
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '1.5rem', height: '1.5rem', color: '#4b5563'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="user-avatar" style={{height: '2.5rem', width: '2.5rem', fontSize: '1rem', marginRight: '0.75rem', background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'}}>
                    <span>{getInitials(receiver?.first_name, receiver?.last_name)}</span>
                </div>
                <div style={{flexGrow: 1}}>
                    <h1 style={{fontWeight: '600', color: '#111827'}}>{receiver?.first_name} {receiver?.last_name}</h1>
                    <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Online</p>
                </div>
            </header>

            <div className="chat-messages-container">
                {messages.map((msg, index) => {
                    const isOwnMessage = msg.from === state.user.user_id;
                    return (
                        <div key={index} className={`chat-bubble ${isOwnMessage ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
                            <div className="chat-message-text">{msg.text}</div>
                            <div className="chat-message-time">{formatTime(msg.createdOn)}</div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                />
                <button type="submit" disabled={!message.trim()} className="chat-send-btn">
                    <svg fill="currentColor" viewBox="0 0 24 24" style={{width: '1.5rem', height: '1.5rem'}}>
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                    </svg>
                </button>
            </form>
        </div>
    );
}

export default Chat;