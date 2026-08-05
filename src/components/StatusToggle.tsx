"use client";
import { useTransition } from "react";

export function StatusToggle({ 
  id, 
  isActive, 
  onToggle 
}: { 
  id: string; 
  isActive: boolean; 
  onToggle: (id: string, status: boolean) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => startTransition(async () => { await onToggle(id, !isActive); })}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <span className="text-xs mt-1 font-medium text-gray-500">{isActive ? "Active" : "Deactivated"}</span>
    </div>
  );
}
