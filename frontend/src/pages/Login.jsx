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
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">
                            StudySync
                        </h1>
                        <p className="text-gray-400 font-medium">
                            {isRegistering ? 'Create your account' : 'Welcome back, Student!'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegistering && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 placeholder-gray-400"
                                    required
                                />
                            </div>
                        )}

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="text"
                                name="student_id"
                                placeholder="Student ID"
                                value={formData.student_id}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 placeholder-gray-400"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 placeholder-gray-400"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            className="text-gray-400 hover:text-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2 mx-auto"
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
