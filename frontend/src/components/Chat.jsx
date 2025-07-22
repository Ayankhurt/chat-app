import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/Context';
import { useParams, useNavigate } from 'react-router';
import io from 'socket.io-client';

function Chat() {
    const { state, dispatch } = useContext(GlobalContext);
    const { id } = useParams(); // Receiver ID
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Socket.IO
        const newSocket = io(state.baseSocketIo, { withCredentials: true });
        setSocket(newSocket);

        // Fetch conversation
        const fetchConversation = async () => {
            try {
                const response = await fetch(`${state.baseUrl}/conversation/${id}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.status === 401) {
                    dispatch({ type: 'USER_LOGOUT' });
                    navigate('/login');
                    return;
                }
                const data = await response.json();
                if (data.message === 'Message Found') {
                    setMessages(data.conversation);
                }
            } catch (err) {
                console.error('Error fetching conversation:', err);
            }
        };
        penetration();
        fetchConversation();

        // Listen for new messages
        newSocket.on(`${state.user.user_id}-${id}`, (msg) => {
            setMessages((prev) => [...prev, msg]);
        });
        newSocket.on(`personal-channel-${state.user.user_id}`, (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => newSocket.disconnect();
    }, [state.baseSocketIo, state.user.user_id, id, dispatch, navigate]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const response = await fetch(`${state.baseUrl}/chat/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message })
            });
            if (response.status === 401) {
                dispatch({ type: 'USER_LOGOUT' });
                navigate('/login');
                return;
            }
            const data = await response.json();
            if (data.message === 'Message Sent') {
                setMessage('');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div>
            <h2>Chat</h2>
            <button onClick={() => navigate('/users')}>Back to Users</button>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.from.firstName}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message"
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default Chat;