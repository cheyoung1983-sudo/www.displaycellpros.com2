"use client";

import React from 'react';
import { PrivacyPolicyView } from '@/components/PrivacyPolicyView';

export default function Privacy() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <PrivacyPolicyView
        onBackToHome={() => {
          window.location.href = '/';
        }}
        onNavigateToLab={() => {
          window.location.href = '/lab';
        }}
      />
    </div>
  );
}
