"use client";

import { useState }         from "react";
import { updateTotalDays }  from "@/actions/leave-balance.action";
import { useRouter }        from "next/navigation";

interface Props {
  employeeId:   string;
  year:         number;
  currentTotal: number;
}

export function AdjustBalanceForm({ employeeId, year, currentTotal }: Props) {
  const router   = useRouter();
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(currentTotal);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await updateTotalDays(employeeId, year, value);
      router.refresh();
      setEditing(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi.");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Sửa
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0} max={365}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="input text-xs py-1 px-2 w-16"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-xs text-green-600 hover:underline font-medium"
      >
        {loading ? "..." : "✓"}
      </button>
      <button
        onClick={() => { setEditing(false); setValue(currentTotal); }}
        className="text-xs text-gray-400 hover:underline"
      >
        ✕
      </button>
    </div>
  );
}
