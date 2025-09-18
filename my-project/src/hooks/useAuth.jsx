"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook para gestionar el estado de autenticación del usuario.
 * Lee el token y los datos del usuario desde localStorage.
 * 
 * @returns {{user: object|null, token: string|null, loading: boolean}}
 * - `user`: Objeto con la información del usuario o null si no está autenticado.
 * - `token`: El token de autenticación o null.
 * - `loading`: Booleano que es true mientras se verifica el estado de autenticación.
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Error al leer la información de autenticación desde localStorage", error);
        } finally {
            setLoading(false);
        }
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

    return { user, token, loading };
};
