"use client";

import React, { useState, useEffect } from "react";
import { GlassCard, CardHeader } from "@/components/ui/GlassCard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { usePermissions } from "@/lib/usePermissions";
import { MODULES, ACTIONS } from "@/lib/permissions";

type Expense = {
  id: string;
  category: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  vendorPayee?: string;
};

export default function ExpensesPage() {
  const { can } = usePermissions();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Permission Checks
  const canAdd = can(MODULES.ADMIN_EXPENSES, ACTIONS.ADD);
  const canEdit = can(MODULES.ADMIN_EXPENSES, ACTIONS.EDIT);
  const canDelete = can(MODULES.ADMIN_EXPENSES, ACTIONS.DELETE);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchExpenses();
    } catch (error) {
      console.error(error);
    }
  };

  const columns: Column<Expense>[] = [
    {
      key: "date",
      header: "Date",
      render: (e) => new Date(e.date).toLocaleDateString(),
    },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
    {
      key: "amount",
      header: "Amount",
      render: (e) => <span className="font-bold text-emerald-400">Rs {e.amount.toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <Badge variant={e.status === "PAID" ? "success" : e.status === "PENDING" ? "warning" : "danger"}>
          {e.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(e.id)}
              className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <GlassCard>
        <CardHeader
          title="Expense Management"
          subtitle="Track and manage institutional expenses"
          action={
            canAdd && (
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Add Expense
              </Button>
            )
          }
        />
        
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">Loading expenses...</div>
        ) : (
          <DataTable
            columns={columns}
            data={expenses}
            searchPlaceholder="Search expenses..."
            onSearch={(query) => {
              // Client-side simple search for demo purposes
            }}
          />
        )}
      </GlassCard>
    </div>
  );
}
