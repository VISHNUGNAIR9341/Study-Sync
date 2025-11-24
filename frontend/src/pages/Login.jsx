import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setUserId }) => {
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        // For demo, we just use a seed user or create one
        // Here we will just fetch the default user "Student" or create if not exists
        // Since we don't have a login API, we'll just use the seed ID if available or ask user to run seed.
        // Actually, let's just create a user with this name.

        // Hack: We don't have a "get user by name" endpoint.
        // We will just use the hardcoded ID from the seed script if name is "Student"
        // or just generate a random one for now if we can't connect.

        // Better approach for this demo:
        // Just set the ID to the one from the seed script output if known, 
        // or just use a fixed UUID for "Student".
        // Let's assume the seed script created a user and we want to use it.
        // I'll just use a hardcoded ID for simplicity as I can't easily query by name without adding an endpoint.

        // Let's add a quick endpoint to backend to "login" by name? No, too much work.
        // I'll just use a fixed ID for the demo user.

        const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'; // We need to make sure this exists or just use what's in DB.

        // Real fix: I'll just set the userId to a placeholder and let the backend handle it? 
        // No, backend needs valid UUID.

        // Let's just ask the user to enter their ID or just "Login as Student"

        // I will just use a random UUID for now if I can't find one? No, FK constraints.
        // I will update the seed script to use a specific UUID so I can hardcode it here.

        setUserId('123e4567-e89b-12d3-a456-426614174000'); // Fixed UUID from seed script
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
            <div className="p-10 bg-white rounded-3xl shadow-2xl w-96 transform hover:scale-105 transition-all">
                <h1 className="text-4xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500">
                    StudySync
                </h1>
                <p className="text-center text-gray-600 mb-6 font-medium">Sync your success!</p>
                <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white p-4 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 font-bold text-lg"
                >
                    Login as Student
                </button>
            </div>
        </div>
    );
};

export default Login;
