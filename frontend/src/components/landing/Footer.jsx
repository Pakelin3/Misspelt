import React from "react";

export function Footer() {
  return (
    <footer className="bg-card border-t-4 border-foreground py-12">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h3 className="font-mono text-lg mb-2">Word Farm</h3>
          <p className="font-sans text-xl text-muted-foreground">Aprendiendo inglés, un píxel a la vez.</p>
        </div>
        <div className="font-sans text-lg text-muted-foreground">
          &copy; {new Date().getFullYear()} Tesis Project.
        </div>
      </div>
    </footer>
  );
}