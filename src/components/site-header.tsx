"use client";

import { useState } from "react";
import { useContent, ContentText } from "@/modules/content/render-context";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#sobre-lisi", label: "Sobre Lisi" },
  { href: "#servicios", label: "Servicios" },
  { href: "#experiencias", label: "Experiencias" },
  { href: "#contacto", label: "Contacto" },
];

export function SiteHeader() {
 const content = useContent();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      <nav id="main-nav" className={cn("main-nav", open && "is-open")} aria-label="Navegación principal">
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}><ContentText id={`navbar.${link.href}`} /></a>
        ))}
        <a className="nav-cta reveal-cta" href={content.texts["contact.email.href"]} onClick={() => setOpen(false)}><ContentText id="navbar.text.072" /><span className="cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span></a>
      </nav>
    </header>
  );
}
