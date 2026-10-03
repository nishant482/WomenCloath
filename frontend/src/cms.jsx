import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "./store-context.jsx";
import { productImage } from "./api.js";
export function CmsBanners() {
  const { content } = useStore();
  const banners = content.filter((c) => c.kind === "banner");
  return (
    banners.length > 0 && (
      <section
        className="cms-banners page-width"
        aria-label="Featured collections"
      >
        {banners.map((b) => (
          <article key={b._id}>
            {b.imageUrl && (
              <img src={b.imageUrl} alt={b.alt || b.title} loading="lazy" />
            )}
            <div>
              <div className="eyebrow">THE RAJO EDIT</div>
              <h2>{b.title}</h2>
              {b.body && <p>{b.body}</p>}
              {b.link && (
                <a className="primary" href={b.link.replace(/^#\//, "/")}>
                  Explore <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          </article>
        ))}
      </section>
    )
  );
}
export function BlogPage({ slug }) {
  const { content } = useStore();
  const blogs = content.filter((c) => c.kind === "blog");
  if (slug) {
    const post = blogs.find((p) => p.slug === slug);
    if (!post)
      return (
        <section className="blog-page page-width">
          <h1>Story not found.</h1>
          <a href="/blog">Back to the journal</a>
        </section>
      );
    return (
      <article className="blog-article page-width">
        <a className="text-link" href="/blog">
          Back to the journal
        </a>
        <div className="eyebrow">THE RAJO JOURNAL</div>
        <h1>{post.title}</h1>
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.alt || post.title} />
        )}
        <div className="blog-body">
          {post.body
            .split("\n")
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      </article>
    );
  }
  return (
    <section className="blog-page page-width">
      <div className="eyebrow">INSPIRATION, WITH LOVE</div>
      <h1>The RAJO journal.</h1>
      <p>Stories, styling ideas and a little everyday inspiration.</p>
      {!blogs.length && (
        <div className="journal-empty">
          <img
            src="https://rajo-images.rang-ethnic-storefront.workers.dev/rajo/891a7c10-6620-4c62-be2b-01b77e7b3f81.jpg"
            alt="Ivory saree from the RAJO collection"
          />
          <div>
            <span className="eyebrow">A NEW CHAPTER, COMING SOON</span>
            <h2>
              A little inspiration.
              <br />
              <em>A lot of possibilities.</em>
            </h2>
            <p>
              Our first stories are on their way. Until then, discover colours
              and details to make your own.
            </p>
            <a className="primary" href="/collections/all">
              Explore the collection <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      )}
      <div className="blog-grid">
        {blogs.map((b) => (
          <a key={b._id} href={"/blog/" + b.slug}>
            <img src={productImage(b)} alt={b.alt || b.title} loading="lazy" />
            <h2>{b.title}</h2>
            <p>
              {b.body.slice(0, 140)}
              {b.body.length > 140 ? "…" : ""}
            </p>
            <span className="text-link">
              Read the story <ArrowUpRight size={16} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
