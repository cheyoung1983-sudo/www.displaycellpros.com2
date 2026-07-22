"use client";

import React from 'react';
import { HomeView } from '@/components/HomeView';

export default function Welcome() {
  return (
    <HomeView
      onBookClick={() => {
        // AI widget is handled by LayoutWrapper
      }}
      onLabClick={() => {
        window.location.href = '/lab';
      }}
    />
  );
}
