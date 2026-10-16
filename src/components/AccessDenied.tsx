import React from 'react';

export function AccessDenied({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white border border-rose-200 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="text-5xl">🚫</div>
        <h1 className="text-xl font-bold text-rose-700 mt-3">Access denied</h1>
        <p className="text-sm text-slate-700 mt-3">
          You are not allowed to access this site.
        </p>
        {email && (
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-semibold">{email}</span> is not on the list.
          </p>
        )}
        <p className="text-sm text-slate-600 mt-4 italic">
          Nice try though. Truly impressive effort. Now hit the road, dude. 🚶💨
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 w-full px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold cursor-pointer"
        >
          Sign out &amp; hit the road
        </button>
      </div>
    </div>
  );
}
