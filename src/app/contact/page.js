'use client'

import React, { useState } from 'react';
import {toast} from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Header from '@/components/Header.js'

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Message envoyé avec succès!');
                setFormData({
                    name: '',
                    email: '',
                    message: ''
                });
            } else {
                toast.error('Erreur lors de l\'envoi du message.');
            }
        } catch (error) {
            toast.error('Une erreur est survenue.');
            console.error(error);
        }
    };

    return (
        <>
            <Header/>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <form onSubmit={handleSubmit}
                      className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-center">Contactez-nous</h1>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700 mb-2">Nom *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 mb-2">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="message" className="block text-gray-700 mb-2">Message *</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                    >
                        Envoyer le message
                    </button>
                </form>
            </div>
        </>
    );
}