import React, { useContext, useEffect } from 'react';
import { GlobalContext } from './context/Context';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router';
import Login from './components/login';
import Signup from './components/signup';
import UserList from './components/UserList';
import Chat from './components/Chat';

function App() {
    const { state, dispatch } = useContext(GlobalContext);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${state.baseUrl}/profile`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    dispatch({ type: 'USER_LOGIN', user: data.user });
                } else if (response.status === 401) {
                    dispatch({ type: 'USER_LOGOUT' });
                }
            } catch (err) {
                console.error('Auth check failed:', err);
            }
        };
        if (state.isLogin === null) {
            checkAuth();
        }
    }, [state.baseUrl, state.isLogin, dispatch]);

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={state.isLogin ? <Navigate to="/users" /> : <Login />}
                />
                <Route
                    path="/signup"
                    element={state.isLogin ? <Navigate to="/users" /> : <Signup />}
                />
                <Route
                    path="/users"
                    element={state.isLogin ? <UserList /> : <Navigate to="/login" />}
                />
                <Route
                    path="/chat/:id"
                    element={state.isLogin ? <Chat /> : <Navigate to="/login" />}
                />
                <Route
                    path="/"
                    element={<Navigate to={state.isLogin ? "/users" : "/login"} />}
                />
            </Routes>
        </Router>
    );
}

export default App;