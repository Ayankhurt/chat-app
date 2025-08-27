import React, { createContext, useReducer } from 'react';
import { reducer } from './Reducer';

export const GlobalContext = createContext("Initial Value");

let data = {
    user: {},
    isLogin: null,
    baseUrl: 'http://localhost:5005/api/v1',
    baseSocketIo: 'http://localhost:5005'
};

export default function ContextProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, data);
    return (
        <GlobalContext.Provider value={{ state, dispatch }}>
            {children}
        </GlobalContext.Provider>
    );
}