import React from 'react';
import { Tag, Receipt, FileText, UserCheck, BarChart3, Cpu, CreditCard } from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const c = category.toLowerCase();

  if (c.includes('invoice') || c.includes('bill')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
        <Receipt className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  if (c.includes('contract') || c.includes('agreement') || c.includes('legal')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
        <FileText className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  if (c.includes('resume') || c.includes('cv')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
        <UserCheck className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  if (c.includes('financial') || c.includes('report') || c.includes('balance')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
        <BarChart3 className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  if (c.includes('tech') || c.includes('spec') || c.includes('architecture')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
        <Cpu className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  if (c.includes('id') || c.includes('identity') || c.includes('passport')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">
        <CreditCard className="w-3.5 h-3.5" />
        {category}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
      <Tag className="w-3.5 h-3.5" />
      {category}
    </span>
  );
};

