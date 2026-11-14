import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';
import './ChatSystem.css';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;
const SOCKET_URL = CONFIG.SOCKET_URL;

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize Socket and fetch history ONLY when the chat is opened by the user
    useEffect(() => {
        if (!isOpen || !user || !user._id) return;

        // Fetch History
        api.get('/messages')
            .then(res => setMessages(res.data || []))
            .catch(err => {
                // Silently handle if server or messages are unavailable
                console.warn("Chat history unavailable:", err?.response?.data?.message || err.message);
            });

        const isVercel = window.location.hostname.includes('vercel.app');
        if (isVercel) {
            return;
        }

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnectionAttempts: 3,
            timeout: 3000
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_chat', { name: user?.name, id: user?._id });
        });

        newSocket.on('connect_error', () => {
            // Gracefully handle socket connection errors without crashing
        });

        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, [isOpen, user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!newMessage.trim() || !socket) return;

        const msgData = {
            sender: user._id,
            senderName: user.name,
            content: newMessage,
            room: 'general',
            createdAt: new Date()
        };

        socket.emit('send_message', msgData);
        setNewMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!user) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button className="chat-toggle-btn" onClick={() => setIsOpen(true)} aria-label="Open Chat">
                    <MessageSquare size={20} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <h3>Team Discussion</h3>
                        <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => {
                            const isMe = msg.sender === user._id || msg.senderName === user.name;
                            return (
                                <div key={index} className={`message-bubble ${isMe ? 'my-message' : 'other-message'}`}>
                                    <div className="message-sender">{msg.senderName}</div>
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            id="chat-input"
                            name="chat-input"
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={handleSend} aria-label="Send Message">
                            <Send size={15} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
