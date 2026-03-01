"use client";

import React from "react";

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl2 bg-card shadow-soft border border-white/10 " + className}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-white/10">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle ? <div className="text-sm text-text2 mt-1">{subtitle}</div> : null}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"px-5 py-4 " + className}>{children}</div>;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl2 px-4 py-2 font-medium transition border";
  const styles =
    variant === "primary"
      ? "bg-accent text-black border-accent hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100"
      : "bg-transparent text-white border-white/15 hover:border-white/30 hover:bg-white/5 disabled:opacity-60";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <div className="text-sm text-text2 mb-1">{label}</div>
      <input
        {...props}
        className="w-full rounded-xl2 bg-black/20 border border-white/15 px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-text2 mb-1">{label}</div>
      <select
        {...props}
        className="w-full rounded-xl2 bg-black/20 border border-white/15 px-3 py-2 outline-none focus:border-accent"
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={"inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/90 " + className}>
      {children}
    </span>
  );
}
