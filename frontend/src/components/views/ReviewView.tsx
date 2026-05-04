import React, { useState } from 'react';
import { Star, MessageSquare, ChevronLeft, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';

interface ReviewViewProps {
  product: Product;
  onBack: () => void;
  onSubmit: (review: any) => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({ product, onBack, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment, productId: product.id });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="text-gray-400 font-bold text-sm flex items-center hover:text-primary transition-colors mb-8"
      >
        <ChevronLeft size={16} className="mr-1" /> Quay lại Đơn hàng
      </button>

      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-yellow-50 text-yellow-500 rounded-full mb-6">
            <Sparkles size={32} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">Chia sẻ trải nghiệm</h1>
        <p className="text-gray-500 font-medium italic">Phản hồi của bạn giúp người khác đưa ra lựa chọn tốt hơn.</p>
      </div>

      <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-primary/5">
         <div className="flex items-center space-x-6 mb-10 pb-10 border-b border-gray-50">
            <div className="h-24 w-24 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{product.subCategory}</div>
                <h3 className="text-xl font-black text-gray-900 leading-tight mb-2">{product.name}</h3>
                <div className="text-sm font-bold text-gray-400">{product.origin}</div>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-10">
            <div className="text-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6">Chất lượng sản phẩm như thế nào?</label>
                <div className="flex justify-center space-x-3">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="transition-all transform hover:scale-125"
                        >
                            <Star 
                                size={48} 
                                className={star <= rating ? 'text-yellow-400' : 'text-gray-100'} 
                                fill={star <= rating ? 'currentColor' : 'none'} 
                                strokeWidth={star <= rating ? 0 : 2}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 ml-1">Viết đánh giá của bạn</label>
                <div className="relative">
                    <textarea 
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Cho chúng tôi biết bạn thích hoặc chưa hài lòng về điều gì..."
                        className="w-full bg-gray-50 border-none rounded-3xl p-6 text-base font-medium focus:ring-2 focus:ring-primary transition-all outline-none resize-none h-40"
                        required
                    />
                    <MessageSquare className="absolute right-6 bottom-6 text-gray-200" size={32} />
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-primary text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center hover:opacity-90 shadow-xl shadow-primary/20 transition-all transition-transform active:scale-95"
            >
                Gửi đánh giá <Send size={18} className="ml-2" />
            </button>
         </form>
      </div>
    </div>
  );
};

export default ReviewView;
