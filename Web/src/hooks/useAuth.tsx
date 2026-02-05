import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    email: string;
    memberId?: string;
    roles: string[];
    permissions: string[];
}

interface AuthContextData {
    user: User | null;
    signIn: (accessToken: string, refreshToken: string) => void;
    signOut: () => void;
    signed: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('@FamilyFinance:token');
        if (savedToken) {
            decodeAndSetUser(savedToken);
        }
        setLoading(false);
    }, []);

    function decodeAndSetUser(token: string) {
        try {
            const decoded: any = jwtDecode(token);

            const user: User = {
                id: decoded.sub || decoded.accountId,
                email: decoded.email,
                memberId: decoded.memberId,
                roles: Array.isArray(decoded.role) ? decoded.role : (decoded.role ? [decoded.role] : []),
                permissions: Array.isArray(decoded.permission) ? decoded.permission : (decoded.permission ? [decoded.permission] : []),
            };

            setUser(user);
            localStorage.setItem('@FamilyFinance:token', token);
        } catch (error) {
            console.error('Error decoding token', error);
            signOut();
        }
    }

    function signIn(accessToken: string, refreshToken: string) {
        localStorage.setItem('@FamilyFinance:refreshToken', refreshToken);
        decodeAndSetUser(accessToken);
    }

    function signOut() {
        setUser(null);
        localStorage.removeItem('@FamilyFinance:token');
        localStorage.removeItem('@FamilyFinance:refreshToken');
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, signed: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
