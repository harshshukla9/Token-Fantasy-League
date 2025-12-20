'use client';

import { Navbar } from '@/components/Navbar';
import Squares from '@/components/Squares';
import { useState } from 'react';

export default function BookDemoPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col relative overflow-hidden">
            <div className="relative z-10">
                <Navbar />
            </div>

            <div className="absolute inset-0 z-0">
                <Squares
                    speed={0.5}
                    squareSize={40}
                    direction='diagonal'
                    borderColor='#00E5FF22'
                    hoverFillColor='#222'
                />
            </div>

            <main className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 mt-12">
                <div className="w-full max-w-md bg-[#121212] backdrop-blur-md border border-gray-800 rounded-2xl p-8 animate-fade-in-up">

                    {submitted ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-warm-white mb-2">Request Received!</h3>
                            <p className="text-gray-400">We&apos;ll be in touch with you soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none text-warm-white placeholder-gray-500 transition-all"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none text-warm-white placeholder-gray-500 transition-all"
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                    Message (Optional)
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none text-warm-white placeholder-gray-500 transition-all resize-none"
                                    placeholder="Tell us about your project..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors relative overflow-hidden group"
                            >
                                <span className="relative">Submit Request</span>
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <footer className="relative z-10 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
                <div className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
                    <p>Built for Monad Testnet • Powered by Parallel EVM</p>
                </div>
            </footer>
        </div>
    );
}
