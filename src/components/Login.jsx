import React, { useState } from 'react';
import { ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/auth/login', { username, password });
            window.location.reload(); // Reload to trigger App.jsx re-fetch of /api/me
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] px-4">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl dark:shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                        <ShieldCheck className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Inscript Auth
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Sign in to access your CMS.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <User className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-11 pr-3 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Username"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-3 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Production-grade security enabled.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
