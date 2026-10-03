import { CONTACT_EMAIL } from "./brand-config.js";
import { useStore } from "./store-context.jsx";
import { CommunityLinks } from "./community.jsx";
import { BrandLogo } from "./brand-story.jsx";
import React from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import "./home-extras.css";

export function HomeExtras() {
  const { content } = useStore();
  const photos = content
    .filter((p) => p.kind === "family" && p.imageUrl)
    .slice(0, 3)
    .map((p) => [p.imageUrl, p.title, p.alt || p.title]);
  return (
    <section className="family-preview page-width">
      <div className="section-heading">
        <div>
          <div className="eyebrow">MORE THAN THREADS. A LITTLE FAMILY.</div>
          <h2>
            Real women. <em>Beautiful connections.</em>
          </h2>
          <p>
            From our exhibition stalls to your special moments. This is the
            heart of RAJO.
          </p>
        </div>
        <a className="text-link" href="/rajo-family">
          Meet the RAJO family <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="family-preview-grid">
        {photos.map(([file, caption, alt]) => (
          <a key={file} href="/rajo-family">
            <div>
              <img src={file} alt={alt} loading="lazy" />
            </div>
            <span>
              {caption}
              <ArrowUpRight size={18} />
            </span>
          </a>
        ))}
      </div>
      <div className="family-signoff">
        <Heart size={17} />
        <span>
          Small beginnings. Meaningful connections. A story we’re writing
          together.
        </span>
      </div>
    </section>
  );
}

const footerGroups = [
  [
    "SHOP",
    [
      ["Sarees", "/collections/sarees"],
      ["Kurta sets", "/collections/kurta-sets"],
      ["Lehengas", "/collections/lehengas"],
      ["New arrivals", "/collections/new-arrivals"],
    ],
  ],
  [
    "DISCOVER RAJO",
    [
      ["Our story", "/about"],
      ["Journal", "/blog"],
      ["My account", "/account"],
      ["The RAJO family", "/rajo-family"],
      ["All collections", "/collections/all"],
    ],
  ],
  [
    "WE’RE HERE TO HELP",
    [
      ["Contact us", "/contact"],
      ["Shipping & returns", "/shipping"],
      ["Care for your saree", "/product/1"],
    ],
  ],
];

export function SiteFooter() {
  const { settings } = useStore();
  const contactEmail = settings.contactEmail || CONTACT_EMAIL;
  return (
    <footer className="site-footer refined-footer">
      <div className="footer-layout">
        <div className="footer-identity">
          <div className="footer-brandline">
            <BrandLogo footer />
            <div>
              <span>RAJO THREADS</span>
              <p>
                Where tradition
                <br />
                <em>meets the trend.</em>
              </p>
            </div>
          </div>
          <p className="footer-description">
            Thoughtfully chosen styles.
            <br />
            For every woman and her beautiful moments.
          </p>
          <div className="footer-contact"><a href={"mailto:" + contactEmail}>{contactEmail}</a><a href="https://wa.me/919716422466" target="_blank" rel="noopener noreferrer">WhatsApp · +91 97164 22466</a></div>
          <div className="footer-connect">
            <span>STAY CLOSE</span>
            <CommunityLinks />
          </div>
        </div>
        {footerGroups.map(([title, links]) => (
          <nav className="footer-link-group" aria-label={title} key={title}>
            <h2>{title}</h2>
            {links.map(([label, path]) => (
              <a key={label} href={path}>
                {label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="footer-lastline">
        <span>
          © {new Date().getFullYear()} RAJO Threads. All rights reserved.
        </span>
        <span className="footer-heartline">
          A little tradition. A lot of heart.{" "}
          <Heart size={13} aria-hidden="true" />
        </span>
        <a href="/contact">
          Let’s talk <ArrowUpRight size={14} />
        </a>
      </div>
    </footer>
  );
}
