import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('foundry_token'));
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure dynamic API base URL for deployment platforms (like Vercel)
  useEffect(() => {
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
  }, []);

  // Setup Axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('foundry_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('foundry_token');
    }
  }, [token]);

  // Sync active team header
  useEffect(() => {
    if (currentTeam) {
      axios.defaults.headers.common['X-Team-ID'] = currentTeam._id;
      localStorage.setItem('foundry_last_team_id', currentTeam._id);
    } else {
      delete axios.defaults.headers.common['X-Team-ID'];
      localStorage.removeItem('foundry_last_team_id');
    }
  }, [currentTeam]);

  // Load user data on startup
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userRes = await axios.get('/api/auth/me');
        setUser(userRes.data);
        
        // Fetch teams
        const teamsRes = await axios.get('/api/teams');
        setTeams(teamsRes.data);

        // Try to restore last active team
        const lastTeamId = localStorage.getItem('foundry_last_team_id');
        if (lastTeamId && teamsRes.data.length > 0) {
          const matched = teamsRes.data.find(t => t._id === lastTeamId);
          if (matched) {
            setCurrentTeam(matched);
          } else {
            setCurrentTeam(teamsRes.data[0]);
          }
        } else if (teamsRes.data.length > 0) {
          setCurrentTeam(teamsRes.data[0]);
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
        // Clear session on authentication failure
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Try a different email.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTeams([]);
    setCurrentTeam(null);
    setError(null);
    localStorage.removeItem('foundry_token');
    localStorage.removeItem('foundry_last_team_id');
  };

  const createTeam = async (name) => {
    setError(null);
    try {
      const res = await axios.post('/api/teams/create', { name });
      setTeams((prev) => [...prev, res.data]);
      setCurrentTeam(res.data);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create workspace.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const joinTeam = async (inviteCode) => {
    setError(null);
    try {
      const res = await axios.post('/api/teams/join', { inviteCode });
      setTeams((prev) => {
        // Prevent duplicate append
        if (prev.some((t) => t._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      setCurrentTeam(res.data);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to join workspace with code.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const updateMemberRole = async (targetUserId, newRole) => {
    if (!currentTeam) return;
    try {
      const res = await axios.put(`/api/teams/${currentTeam._id}/role`, {
        targetUserId,
        newRole
      });
      
      // Update local state teams lists
      setTeams((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      setCurrentTeam(res.data);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update member role.';
      throw new Error(errMsg);
    }
  };

  const removeMember = async (targetUserId) => {
    if (!currentTeam) return;
    try {
      const res = await axios.delete(`/api/teams/${currentTeam._id}/members/${targetUserId}`);
      
      // If we left the team ourselves, remove from list and update active team
      const isSelf = user.id === targetUserId || user._id === targetUserId;
      if (isSelf) {
        const remaining = teams.filter((t) => t._id !== currentTeam._id);
        setTeams(remaining);
        setCurrentTeam(remaining.length > 0 ? remaining[0] : null);
      } else {
        setTeams((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
        setCurrentTeam(res.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to remove member.';
      throw new Error(errMsg);
    }
  };

  const regenerateInviteCode = async () => {
    if (!currentTeam) return;
    try {
      const res = await axios.post(`/api/teams/${currentTeam._id}/invite-code`);
      const updated = { ...currentTeam, inviteCode: res.data.inviteCode };
      setTeams((prev) => prev.map((t) => (t._id === currentTeam._id ? updated : t)));
      setCurrentTeam(updated);
      return res.data.inviteCode;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to regenerate invite code.';
      throw new Error(errMsg);
    }
  };

  const activeUserRole = () => {
    if (!currentTeam || !user) return 'Member';
    const member = currentTeam.members.find(
      (m) => m.user._id === user.id || m.user._id === user._id || m.user === user.id
    );
    return member ? member.role : 'Member';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        teams,
        currentTeam,
        loading,
        error,
        userRole: activeUserRole(),
        login,
        register,
        logout,
        createTeam,
        joinTeam,
        setCurrentTeam,
        updateMemberRole,
        removeMember,
        regenerateInviteCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
