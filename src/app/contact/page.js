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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({
        name: false,
        email: false,
        message: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear validation error when user types
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: false
            }));
        }
    };

    const validateForm = () => {
        const errors = {
            name: !formData.name,
            email: !formData.email || !/\S+@\S+\.\S+/.test(formData.email),
            message: !formData.message
        };
        
        setFormErrors(errors);
        return !Object.values(errors).some(Boolean); // returns true if no errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Veuillez remplir tous les champs obligatoires correctement.');
            return;
        }
        
        setIsSubmitting(true);

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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header/>
            <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <form 
                    onSubmit={handleSubmit}
                    className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
                    aria-labelledby="contact-heading"
                    noValidate
                >
                    <h1 id="contact-heading" className="text-2xl font-bold mb-4 text-center" tabIndex="-1">Contactez-nous</h1>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700 mb-2">
                            Nom <span aria-label="requis">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                            aria-required="true"
                            aria-invalid={formErrors.name}
                            aria-describedby={formErrors.name ? "name-error" : undefined}
                        />
                        {formErrors.name && (
                            <p id="name-error" className="text-red-500 text-xs mt-1" role="alert">
                                Le nom est requis
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 mb-2">
                            Email <span aria-label="requis">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                            aria-required="true"
                            aria-invalid={formErrors.email}
                            aria-describedby={formErrors.email ? "email-error" : undefined}
                        />
                        {formErrors.email && (
                            <p id="email-error" className="text-red-500 text-xs mt-1" role="alert">
                                Veuillez entrer une adresse email valide
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="message" className="block text-gray-700 mb-2">
                            Message <span aria-label="requis">*</span>
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="4"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.message ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                            aria-required="true"
                            aria-invalid={formErrors.message}
                            aria-describedby={formErrors.message ? "message-error" : undefined}
                        ></textarea>
                        {formErrors.message && (
                            <p id="message-error" className="text-red-500 text-xs mt-1" role="alert">
                                Le message est requis
                            </p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                    </button>
                </form>
            </main>
        </>
    );
}