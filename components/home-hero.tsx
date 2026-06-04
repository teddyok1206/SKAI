"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguagePreference } from "@/components/language-toggle";
import { getCopy } from "@/lib/i18n";

export function HomeHero({ firstProblemHref }: { firstProblemHref: string }) {
  const { locale } = useLanguagePreference();

  return (
    <section className="home-hero">
      <h1 className="home-hero-title">
        <span className="home-hero-title-line">{getCopy("home.hero.line1", locale)}</span>
        <span className="home-hero-title-line">{getCopy("home.hero.line2", locale)}</span>
      </h1>
      <div className="hero-actions">
        <Link className="button primary" href={firstProblemHref}>
          {getCopy("home.cta.firstProblem", locale)} <ArrowRight size={17} />
        </Link>
        <a className="button quiet" href="#problems">
          {getCopy("home.cta.viewProblems", locale)}
        </a>
      </div>
    </section>
  );
}

