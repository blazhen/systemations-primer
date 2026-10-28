import React from "react";

export function Pill({
  children,
  variant = "violet",
}: {
  children: React.ReactNode;
  variant?: "violet" | "blue";
}) {
  const isBlue = variant === "blue";
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[14px] font-medium"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        border: "1px solid var(--sys-pill-border)",
        color: isBlue ? "var(--sys-blue-dark)" : "var(--sys-violet-dark)",
        boxShadow: "0 2px 4px rgba(20, 33, 61, 0.02)",
      }}
    >
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="sys-divider-fade mx-auto max-w-[1120px]" />;
}

export function SectionHeader({
  pill,
  pillVariant = "violet",
  navyTitle,
  gradientTitle,
  sub,
}: {
  pill: string;
  pillVariant?: "violet" | "blue";
  navyTitle: string;
  gradientTitle?: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-[820px] text-center">
      <Pill variant={pillVariant}>{pill}</Pill>
      <h2
        className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "var(--sys-navy)",
        }}
      >
        {navyTitle}
        {gradientTitle ? (
          <>
            {" "}
            <span className="sys-gradient-text">{gradientTitle}</span>
          </>
        ) : null}
      </h2>
      {sub ? (
        <p
          className="mt-4 text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--sys-body)" }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}
