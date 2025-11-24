import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const Login = ({ setUserId }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({
        student_id: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isRegistering ? '/api/user/register' : '/api/user/login';
        const payload = isRegistering
            ? formData
            : { student_id: formData.student_id, password: formData.password };

        try {
            // Use relative URL assuming proxy is set up in vite.config.js or use full URL
            // Checking vite.config.js might be good, but usually it's localhost:5000
            const API_URL = 'http://localhost:5001';
            const res = await axios.post(`${API_URL}${endpoint}`, payload);

            if (res.data.id) {
                setUserId(res.data.id);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2">
                            StudySync
                        </h1>
                        <p className="text-gray-300 font-medium">
                            {isRegistering ? 'Create your account' : 'Welcome back, Student!'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegistering && (
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-gray-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                            <input
                                type="text"
                                name="student_id"
                                placeholder="Student ID"
                                value={formData.student_id}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-gray-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={20} />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-gray-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-500"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center animate-pulse">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-purple-500/30 transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    {isRegistering ? 'Sign Up' : 'Login'}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                        >
                            {isRegistering ? (
                                <>
                                    <LogIn size={16} />
                                    Already have an account? Login
                                </>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Don't have an account? Sign Up
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
