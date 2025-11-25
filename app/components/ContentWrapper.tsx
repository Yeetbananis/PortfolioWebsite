'use client';

import React from 'react';
import { useNavigation } from '../NavigationContext';

const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isNavigating } = useNavigation();
  
  return (
    <div className={`transition-opacity duration-700 ${isNavigating ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {children}
    </div>
  );
};

export default ContentWrapper;