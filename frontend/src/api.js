import axios from 'axios';

// Allow overriding via Vite env var `VITE_API_BASE`, fallback to localhost:5001
const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE,
});

export const fetchRoutine = async (userId) => {
    const response = await axios.get(`${API_BASE}/routine/${userId}`);
    return response.data;
};

export const updateRoutine = async (userId, routine) => {
    const response = await axios.put(`${API_BASE}/routine/${userId}`, routine);
    return response.data;
};

export const fetchTasks = async (userId) => {
    const response = await axios.get(`${API_BASE}/tasks/${userId}`);
    return response.data;
};

export const fetchTaskDetails = async (taskId) => {
    const response = await axios.get(`${API_BASE}/tasks/details/${taskId}`);
    return response.data;
};

export const createTask = async (task) => {
    const response = await axios.post(`${API_BASE}/tasks`, task);
    return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
    const response = await axios.put(`${API_BASE}/tasks/${taskId}/status`, { status });
    return response.data;
};

export const updateTaskProgress = async (taskId, duration) => {
    const response = await axios.post(`${API_BASE}/tasks/${taskId}/progress`, { duration });
    return response.data;
};

export const generateSchedule = async (userId) => {
    const response = await axios.post(`${API_BASE}/schedule/generate`, { userId });
    return response.data;
};

export const deleteTask = async (taskId) => {
    const response = await axios.delete(`${API_BASE}/tasks/${taskId}`);
    return response.data;
};

export const fetchUser = async (userId) => {
    const response = await axios.get(`${API_BASE}/user/${userId}`);
    return response.data;
};

export const fetchTaskHistory = async (userId) => {
    const response = await axios.get(`${API_BASE}/history/${userId}`);
    return response.data;
};

// ===== ROUTINE BLOCKS API =====
export const fetchRoutineBlocks = async (userId) => {
    const response = await axios.get(`${API_BASE}/routine/blocks/${userId}`);
    return response.data;
};

export const createRoutineBlock = async (blockData) => {
    const response = await axios.post(`${API_BASE}/routine/blocks`, blockData);
    return response.data;
};

export const updateRoutineBlock = async (blockId, blockData) => {
    const response = await axios.put(`${API_BASE}/routine/blocks/${blockId}`, blockData);
    return response.data;
};

export const deleteRoutineBlock = async (blockId) => {
    const response = await axios.delete(`${API_BASE}/routine/blocks/${blockId}`);
    return response.data;
};

export default api;
