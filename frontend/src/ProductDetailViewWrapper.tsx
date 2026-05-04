import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetailView from './components/views/ProductDetailView';
import { fetchProductById } from './services/productService';
import { Product } from './types';

const ProductDetailViewWrapper = ({ handleAddToCart, currentUser, cart, handleLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (e) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải chi tiết sản phẩm...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Không tìm thấy sản phẩm.</div>;

  return (
    <ProductDetailView
      product={product}
      onBack={() => navigate(-1)}
      onAddToCart={handleAddToCart}
      onBuyNow={(p, q) => { handleAddToCart(p, q); navigate('/cart'); }}
      relatedProducts={[]}
    />
  );
};

export default ProductDetailViewWrapper;
