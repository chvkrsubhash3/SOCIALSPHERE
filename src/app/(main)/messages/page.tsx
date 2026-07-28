'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTraining] = useState(process.env.NEXT_PUBLIC_MODE === 'training');

  const conversations = [
    { id: 3, username: 'alice', displayName: 'Alice Johnson', lastMessage: 'Hey! How are you?' },
    { id: 4, username: 'bob', displayName: 'Bob Martinez', lastMessage: 'Did you see that sunset?' },
    { id: 7, username: 'eve', displayName: 'Eve Wilson', lastMessage: 'Found a new bug bounty!' },
  ];

  const loadMessages = async (userId: number) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data.messages);
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await api.post(`/messages/${selectedUser.id}`, { content: newMessage });
      setNewMessage('');
      loadMessages(selectedUser.id);
    } catch {}
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-0 glass-card overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-white mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input placeholder="Search conversations..." className="input-dark pl-9 text-sm py-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setSelectedUser(conv); loadMessages(conv.id); }}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-surface-3/50 transition-colors border-b border-border/50 ${
                selectedUser?.id === conv.id ? 'bg-surface-3' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold flex-shrink-0">
                {conv.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{conv.displayName}</div>
                <div className="text-xs text-gray-500 truncate">{conv.lastMessage}</div>
              </div>
            </button>
          ))}

          {isTraining && (
            <div className="p-4 text-xs text-amber-400 border-t border-border">
              ⚠️ Lab: Try accessing <code>/api/messages/10</code> (victim's messages)
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold">
              {selectedUser.displayName[0]}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{selectedUser.displayName}</div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                No messages yet. Say hello! 👋
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender_id === user?.id ? (
                  <div className="message-bubble-out">{msg.content}</div>
                ) : (
                  <div className="message-bubble-in">{msg.content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="input-dark flex-1"
            />
            <button
              onClick={sendMessage}
              className="btn-brand px-4"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <div className="font-semibold text-white">Select a conversation</div>
            <div className="text-sm mt-1">Choose from your existing messages</div>
          </div>
        </div>
      )}
    </div>
  );
}
