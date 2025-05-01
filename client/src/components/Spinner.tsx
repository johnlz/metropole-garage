import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  color = '#ABFF00',
  text = 'Carregando...'
}) => {
  // Define tamanhos baseado na prop size
  const dimensions = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  };

  // Classe do tamanho específico
  const sizeClass = dimensions[size];
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {/* Spinner exterior */}
        <div 
          className={`${sizeClass} rounded-full border-t-transparent border-lime-green animate-spin`}
          style={{ borderTopColor: 'transparent', borderColor: color }}
        ></div>
        
        {/* Efeito de brilho ao redor do spinner */}
        <div 
          className={`absolute top-0 left-0 ${sizeClass} rounded-full opacity-30 filter blur-sm`}
          style={{ 
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            animation: 'pulse 2s infinite ease-in-out'
          }}
        ></div>
      </div>
      
      {/* Texto abaixo do spinner */}
      {text && (
        <div className="text-center">
          <p className="text-lime-green text-sm font-medium tracking-wider font-orbitron animate-pulse">
            {text}
          </p>
          <div className="mt-2 w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-lime-green to-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default Spinner;