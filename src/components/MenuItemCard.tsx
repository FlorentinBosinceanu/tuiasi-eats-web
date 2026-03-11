import React from 'react';
import { Plus, Heart } from 'lucide-react';

export interface MenuItemCardProps {
  name: string;
  price: number;
  gramaj: string;
  imageUrl?: string;
  onAdd: () => void;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  name,
  price,
  gramaj,
  imageUrl,
  onAdd,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const formattedPrice = price.toFixed(2);

  return (
    <div
      onClick={onClick}
      className={`w-full bg-white rounded-2xl shadow-sm border border-gray-100/80 p-3.5 flex items-center gap-3.5 transition-all duration-200 hover:shadow-md hover:border-orange-100 active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
    >
      
      {/* Left Side: Image */}
      <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl overflow-hidden flex items-center justify-center relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-2xl">🍽️</span>
        )}
        {/* Favorite Heart */}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={13}
              className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}
            />
          </button>
        )}
      </div>

      {/* Middle: Details */}
      <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate" title={name}>
          {name}
        </h3>
        <span className="text-xs text-gray-400 mt-0.5">
          {gramaj}
        </span>
        <span className="text-sm font-bold text-orange-500 mt-1">
          {formattedPrice} <span className="text-[10px] font-semibold text-gray-400">RON</span>
        </span>
      </div>

      {/* Right Side: ADD Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="flex-shrink-0 w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 active:scale-90 text-white flex items-center justify-center transition-all duration-200 shadow-sm shadow-orange-200"
        aria-label={`Add ${name} to cart`}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
      
    </div>
  );
};

export default MenuItemCard;