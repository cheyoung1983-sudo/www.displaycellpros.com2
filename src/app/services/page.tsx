"use client";

import React from 'react';
import { ServicesView } from '@/components/ServicesView';

export default function Services() {
  return (
    <ServicesView
      onBookClick={() => {
        // Trigger AI Widget
      }}
    />
  );
}
