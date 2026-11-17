"use client";
import { useContent, ContentText, ContentImage } from "./render-context";
import { ArrowDown, ArrowRight, ArrowUpRight, Mail, Phone, Link2, Camera } from "lucide-react";
import { MotionEffects } from "@/components/motion-effects";
import { SiteHeader } from "@/components/site-header";

const services = [
  ["01", "Selección", "Encontrar personas que conecten con la cultura, los objetivos y el futuro de tu organización."],
  ["02", "Coaching", "Acompañar a líderes y equipos para crecer, decidir y trabajar mejor juntos."],
  ["03", "Estrategia y comunicación", "Transformar desafíos en mensajes claros, vínculos más fuertes y acciones concretas."],
  ["04", "Diagnóstico organizacional", "Escuchar y comprender la cultura para descubrir oportunidades reales de desarrollo."],
  ["05", "Talleres y eventos", "Diseñar experiencias participativas que abran nuevas perspectivas y dejen huella."],
  ["06", "Sostenibilidad", "Crear proyectos de impacto social que conecten a la organización con su comunidad."],
];

const principles = [
  ["01", "Escucha activa", "Cada proyecto empieza por entender lo que hace única a tu organización."],
  ["02", "Vínculos de confianza", "Trabajamos con grandes, medianas y pequeñas empresas, siempre cerca de las personas."],
  ["03", "Creatividad aplicada", "El arte nos ayuda a ver situaciones y soluciones desde otro lugar."],
];

const clientLogos = [
  ["mapei", "Mapei"],
  ["360-energy", "360 Energy"],
  ["camara-argentina-internet", "Cámara Argentina de Internet"],
  ["interpack", "Interpack"],
  ["grupo-hz", "Grupo HZ"],
  ["nacion-seguros", "Nación Seguros"],
  ["hanseatica", "Hanseatica"],
  ["thomson-reuters", "Thomson Reuters"],
  ["utn-ba", "UTN Buenos Aires"],
  ["albaugh", "Albaugh"],
  ["papelera-del-sur", "Papelera del Sur"],
  ["it-patagonia", "IT Patagonia"],
  ["ypf", "YPF"],
  ["celomat", "Celomat"],
  ["integral-cargo", "Integral Cargo"],
  ["hk", "HK"],
  ["vidra", "Vidra"],
  ["bataan-seguridad", "Bataan Seguridad"],
] as const;

export function SitePage() {
 const content = useContent();
  return <>
    <MotionEffects />
    <SiteHeader />
    <main>
      <section id="inicio" className="hero" aria-labelledby="hero-title">
        <ContentImage id="hero.image" className="hero-visual"></ContentImage>
        <div className="hero-copy texture"><div className="hero-copy-inner">
          <h1 id="hero-title" className="sr-only"><ContentText id="landing.text.001" /></h1>
          <div className="hero-logo"><ContentImage id="hero.logo" image width={1448} height={1086} /></div>
          <p className="hero-lede"><ContentText id="hero.description" /></p>
          <div className="hero-actions"><a className="button button-blue reveal-cta" href={content.texts["landing.link.63"]}><ContentText id="landing.text.003" /><span className="cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span></a><a className="text-link light-link" href={content.texts["landing.link.64"]}><ContentText id="landing.text.004" /><ArrowDown size={17} /></a></div>
        </div><span className="hero-side-note"><ContentText id="landing.text.005" /></span></div>
      </section>

      <section id="sobre-lisi" className="about section-pad" aria-labelledby="about-title"><div className="section-shell about-grid">
        <div className="about-copy" data-reveal><p className="eyebrow"><ContentText id="landing.text.006" /></p><h2 id="about-title" className="display-title"><ContentText id="landing.text.007" /><br />{" "}<em><ContentText id="landing.text.008" /></em>{" "}<ContentText id="landing.text.009" /></h2>
          <p className="section-lede"><ContentText id="landing.text.010" /></p>
          <p><ContentText id="landing.text.011" /></p>
          <a className="inline-link reveal-cta" href={content.texts["landing.link.65"]}><ContentText id="landing.text.012" /><span className="cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span></a></div>
        <ContentImage id="about.image" className="about-photo photo-frame"><span className="photo-caption"><ContentText id="landing.text.013" /></span></ContentImage>
      </div></section>

      <section id="servicios" className="services section-pad texture" aria-labelledby="services-title"><div className="section-shell">
        <div className="section-heading" data-reveal><div><p className="eyebrow"><ContentText id="landing.text.014" /></p><h2 id="services-title" className="display-title"><ContentText id="landing.text.015" />{" "}<em><ContentText id="landing.text.016" /></em>{" "}<ContentText id="landing.text.017" /></h2></div><p><ContentText id="landing.text.018" /></p></div>
        <div className="service-list">{services.map(([number]) => <article className="service-row" key={number} data-reveal><span className="service-number"><ContentText id={`services.${number}.number`} /></span><h3><ContentText id={`services.${number}.title`} /></h3><p><ContentText id={`services.${number}.copy`} /></p><ArrowUpRight className="service-arrow" size={22} aria-hidden="true" /></article>)}</div>
      </div></section>

      <section className="image-story" aria-label="Lisi facilitando una actividad en una organización"><ContentImage id="story.image" className="image-story-photo"></ContentImage><div className="image-story-copy"><p className="eyebrow"><ContentText id="landing.text.019" /></p><p><ContentText id="landing.text.020" />{" "}<em><ContentText id="landing.text.021" /></em></p></div></section>

      <section id="experiencias" className="experiences section-pad" aria-labelledby="experiences-title"><div className="section-shell experiences-grid">
        <div className="experiences-heading" data-reveal><p className="eyebrow"><ContentText id="landing.text.022" /></p><h2 id="experiences-title" className="display-title"><ContentText id="landing.text.023" /><br /><ContentText id="landing.text.024" />{" "}<em><ContentText id="landing.text.025" /></em></h2><p className="section-lede"><ContentText id="landing.text.026" /></p><p><ContentText id="landing.text.027" /></p><a className="inline-link reveal-cta" href={content.texts["landing.link.66"]}><ContentText id="landing.text.028" /><span className="cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span></a></div>
        <div className="experience-collage" data-reveal><ContentImage id="experience.main" className="experience-photo-main"></ContentImage><ContentImage id="experience.detail" className="experience-photo-detail"></ContentImage><span className="collage-label"><ContentText id="landing.text.029" /></span></div>
      </div></section>

      <section className="outplacement section-pad texture" aria-labelledby="outplacement-title"><div className="section-shell outplacement-grid">
        <div data-reveal><p className="eyebrow"><ContentText id="landing.text.030" /></p><h2 id="outplacement-title" className="display-title"><ContentText id="landing.text.031" />{" "}<em><ContentText id="landing.text.032" /></em></h2><p className="section-lede"><ContentText id="landing.text.033" /></p><p><ContentText id="landing.text.034" /></p></div>
        <div className="outplacement-card" data-reveal><p className="eyebrow"><ContentText id="landing.text.035" /></p><ul><li><ContentText id="landing.text.036" /></li><li><ContentText id="landing.text.037" /></li><li><ContentText id="landing.text.038" /></li><li><ContentText id="landing.text.039" /></li><li><ContentText id="landing.text.040" /></li></ul></div>
      </div></section>

      <section className="approach section-pad" aria-labelledby="approach-title"><div className="section-shell"><p className="eyebrow" data-reveal><ContentText id="landing.text.041" /></p><h2 id="approach-title" className="display-title" data-reveal><ContentText id="landing.text.042" /><br />{" "}<em><ContentText id="landing.text.043" /></em></h2><div className="approach-grid">{principles.map(([number]) => <article key={number} data-reveal><span><ContentText id={`principles.${number}.number`} /></span><h3><ContentText id={`principles.${number}.title`} /></h3><p><ContentText id={`principles.${number}.copy`} /></p></article>)}</div></div></section>

      <section className="trust section-pad" aria-labelledby="trust-title"><div className="section-shell" data-reveal><p className="eyebrow"><ContentText id="landing.text.044" /></p><h2 id="trust-title" className="display-title"><ContentText id="landing.text.045" />{" "}<em><ContentText id="landing.text.046" /></em></h2><div className="trust-marquee"><div className="trust-marquee-track">{[0, 1].map((copy) => <ul className="trust-marquee-group" key={copy} aria-hidden={copy === 1}>{clientLogos.map(([slug]) => <li className="trust-logo" key={slug}><ContentImage id={`client.${slug}`} image width={220} height={80} decorative={copy === 1} /></li>)}</ul>)}</div></div></div></section>

      <section className="alliance texture" aria-labelledby="alliance-title"><ContentImage id="alliance.image" className="alliance-photo"></ContentImage><div className="alliance-copy" data-reveal><p className="eyebrow"><ContentText id="landing.text.047" /></p><h2 id="alliance-title" className="display-title"><ContentText id="landing.text.048" />{" "}<em><ContentText id="landing.text.049" /></em></h2><p><ContentText id="landing.text.050" /></p><a className="inline-link light-link reveal-cta" href={content.texts["landing.link.67"]}><ContentText id="landing.text.051" /><span className="cta-arrow" aria-hidden="true"><ArrowRight size={18} /></span></a></div></section>

      <section id="contacto" className="contact section-pad" aria-labelledby="contact-title"><div className="contact-circle contact-circle-one" aria-hidden="true" /><div className="contact-circle contact-circle-two" aria-hidden="true" /><div className="section-shell contact-content" data-reveal><p className="eyebrow"><ContentText id="landing.text.052" /></p><h2 id="contact-title"><ContentText id="landing.text.053" /><span><ContentText id="landing.text.054" /></span></h2><p><ContentText id="landing.text.055" /></p><div className="contact-links"><a href={content.texts["landing.link.68"]}><Phone size={21} /><span><ContentText id="landing.text.056" /></span><ArrowUpRight size={16} /></a><a href={content.texts["contact.email.href"]}><Mail size={21} /><span><ContentText id="landing.text.057" /></span><ArrowUpRight size={16} /></a><a href={content.texts["landing.link.69"]} target="_blank" rel="noopener noreferrer"><Link2 size={21} /><span><ContentText id="landing.text.058" /></span><ArrowUpRight size={16} /></a><a href={content.texts["landing.link.70"]} target="_blank" rel="noopener noreferrer"><Camera size={21} /><span><ContentText id="landing.text.059" /></span><ArrowUpRight size={16} /></a></div></div></section>
    </main>
    <footer className="footer"><span><ContentText id="landing.text.060" /></span><span><ContentText id="landing.text.061" /></span><a href={content.texts["landing.link.71"]}><ContentText id="landing.text.062" /><ArrowRight size={15} /></a></footer>
  </>;
}
