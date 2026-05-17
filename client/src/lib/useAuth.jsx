import { createContext, useContext, useEffect, useState } from 'react';
import axios from './axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({matchesPlayed: 0, matchesWon: 0});

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/users/profile', {
        withCredentials: true,
      });
      // console.log(data);
      if (data.success === false) {
        console.log('Not authenticated');
        setUser(null);
        return;
      }
      setUser(data.user);
      setUserStats({
        matchesPlayed: data.matchesPlayed || 0,
        matchesWon: data.matchesWon || 0,
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    await axios.post('/users/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, userStats, loading, logout, setUser, refetch: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
