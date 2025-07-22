import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/Context';
import { useNavigate } from 'react-router';

function UserList() {
    const { state, dispatch } = useContext(GlobalContext);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${state.baseUrl}/users`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.status === 401) {
                    dispatch({ type: 'USER_LOGOUT' });
                    navigate('/login');
                    return;
                }
                const data = await response.json();
                if (data.message === 'users found') {
                    setUsers(data.users);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Internal Server Error');
            }
        };
        fetchUsers();
    }, [state.baseUrl, dispatch, navigate]);

    const handleLogout = async () => {
        try {
            await fetch(`${state.baseUrl}/logout`, {
                method: 'GET',
                credentials: 'include'
            });
            dispatch({ type: 'USER_LOGOUT' });
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div>
            <h2>Users</h2>
            <button onClick={handleLogout}>Logout</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {users.map(user => (
                    <li key={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                        <button onClick={() => navigate(`/chat/${user._id}`)}>Chat</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;