import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2, Maximize2, BotMessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatWithAIService } from '../services/aiService';
import type { Product } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  products?: Product[];
}

const ChatAI: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 384, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Chào Anh/Chị! Em là trợ lý ảo của BECShop. Em có thể giúp gì cho Anh/Chị ạ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !chatWindowRef.current) return;

      const rect = chatWindowRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const newHeight = rect.bottom - e.clientY;

      setDimensions({
        width: Math.min(Math.max(newWidth, 320), window.innerWidth * 0.9),
        height: Math.min(Math.max(newHeight, 400), window.innerHeight * 0.85)
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Tìm products của tin nhắn model cuối cùng
      const lastModelMessage = [...messages].reverse().find(m => m.role === 'model' && m.products && m.products.length > 0);
      const contextProductIds = lastModelMessage?.products?.map(p => p.id) || undefined;

      // Gọi AI Service qua API Gateway
      const { answer, products } = await chatWithAIService(userMessage.text, contextProductIds);
      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: answer, products }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: 'Xin lỗi, em đang bận một chút. Anh/Chị thử lại sau nhé!' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 pointer-events-none">
      <div className="pointer-events-auto relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={chatWindowRef}
              initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                width: dimensions.width,
                height: dimensions.height
              }}
              transition={isResizing ? { duration: 0 } : undefined}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-w-[95vw] max-h-[90vh]"
            >
              {/* Resize Handle - Top Left */}
              <div 
                onMouseDown={startResizing}
                className="absolute top-0 left-0 w-8 h-8 cursor-nw-resize z-[60] flex items-center justify-center group"
              >
                <div className="w-4 h-4 border-t-2 border-l-2 border-gray-300 rounded-tl-md group-hover:border-primary transition-colors" />
              </div>

              {/* Header */}
              <div className="bg-primary p-4 text-white flex items-center justify-between cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Trợ lý BECShop</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Trực tuyến</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setDimensions({ width: window.innerWidth > 640 ? 550 : 320, height: 700 })}
                    title="Phóng to tối đa"
                    className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block"
                  >
                    <Maximize2 size={18} />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <div className="w-4 h-0.5 bg-white rounded-full" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                        msg.role === 'user' ? 'bg-accent text-white' : 'bg-primary text-white'
                      }`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={`p-3 rounded-2xl text-xs font-medium shadow-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-accent text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        {msg.text || (isLoading && msg.role === 'model' && <Loader2 size={14} className="animate-spin" />)}
                        {msg.role === 'model' && msg.products && msg.products.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-[10px] font-bold text-gray-500 mb-1">Gợi ý sản phẩm:</div>
                            <div className="space-y-1">
                              {msg.products.slice(0, 3).map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => navigate(`/products/${product.id}`)}
                                  className="block text-[11px] text-primary truncate hover:underline text-left"
                                >
                                  - {product.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-4 pr-12 text-xs focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2 font-medium italic">
                  Powered by BECShop Intelligence
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
          }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isOpen ? 'bg-gray-100 text-gray-600' : 'bg-primary'
          } border-4 border-white`}
        >
          {isOpen ? <X size={24} /> : <BotMessageSquare size={24} color='#fff'/>}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ChatAI;
