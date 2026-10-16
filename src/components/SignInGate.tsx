import React from 'react';

export function SignInGate({ onSignIn, error }: { onSignIn: () => void; error?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
        <h1 className="text-xl font-bold text-slate-900">ImportOps Tracker</h1>
        <p className="text-sm text-slate-500 mt-2">
          Sign in with Google to see and edit the shared import sheet.
        </p>
        <button
          onClick={onSignIn}
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold cursor-pointer"
        >
          Sign in with Google
        </button>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}
