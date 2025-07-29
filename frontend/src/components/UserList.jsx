import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/Context';
import { useNavigate } from 'react-router';

function UserList() {
    const { state, dispatch } = useContext(GlobalContext);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
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
                    setFilteredUsers(data.users);
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [state.baseUrl, dispatch, navigate]);

    useEffect(() => {
        const filtered = users.filter(user =>
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const handleLogout = async () => {
        // ... (logout logic remains same)
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-spin" style={{ height: '3rem', width: '3rem', border: '4px solid #c7d2fe', borderTopColor: '#4f46e5', borderRadius: '50%' }}></div>
            </div>
        );
    }

    return (
        <div className="user-list-page">
            <header className="user-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>Contacts</h1>
                    <p style={{ color: '#6b7280' }}>Select a user to start chatting</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '500' }}>{state.user?.first_name} {state.user?.last_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Online</div>
                    </div>
                    <button onClick={handleLogout} className="primary-btn" style={{backgroundColor: '#ef4444', background: 'linear-gradient(135deg, #f87171, #ef4444)'}}>Logout</button>
                </div>
            </header>

            <main style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="user-list-search"
                    />
                </div>
                
                {filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.map(user => (
                            <div
                                key={user._id}
                                className="user-card"
                                onClick={() => navigate(`/chat/${user._id}`)}
                            >
                                <div className="user-avatar" style={{background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'}}>
                                    <span>{getInitials(user.firstName, user.lastName)}</span>
                                </div>
                                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: '#111827'}}>{user.firstName} {user.lastName}</h3>
                                <p style={{color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user.email}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center" style={{padding: '3rem 0'}}>
                        <h3 style={{fontSize: '1.25rem', fontWeight: '600'}}>No Users Found</h3>
                        <p style={{color: '#6b7280', marginTop: '0.5rem'}}>
                            {searchTerm ? 'Your search returned no results. Try different keywords.' : 'There are no users to display.'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default UserList;