(function () {
  const data = window.DUMargContent;
  const page = document.body.dataset.page || "home";

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const linkFor = (key) => {
    const value = data.links[key];
    if (key === "email") return `mailto:${value}`;
    if (key === "phone") return `tel:${value.replaceAll(" ", "")}`;
    return value;
  };

  const submitLead = async (form) => {
    const note = form.querySelector(".form-note");
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const supabase = data.supabase || {};

    if (!supabase.url || !supabase.anonKey) {
      note.textContent = data.guidance.missingConfigText;
      return;
    }

    const payload = {
      full_name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      current_stage: String(formData.get("stage") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      source_page: document.body.dataset.page || "unknown",
      page_url: window.location.href
    };

    submitButton.disabled = true;
    note.textContent = "Submitting...";

    try {
      const response = await fetch(`${supabase.url.replace(/\/$/, "")}/rest/v1/${supabase.table}`, {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Supabase insert failed with ${response.status}`);
      }

      note.textContent = data.guidance.successText;
      form.reset();
    } catch (error) {
      note.textContent = data.guidance.errorText;
    } finally {
      submitButton.disabled = false;
    }
  };

  const brand = () => `
    <a class="brand" href="index.html" aria-label="${escapeHtml(data.brand.name)} home">
      <span class="brand-mark">${escapeHtml(data.brand.mark)}</span>
      <span>${escapeHtml(data.brand.name)}</span>
    </a>
  `;

  const sectionHead = ({ eyebrow, title, text }) => `
    <div class="section-head">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p>${escapeHtml(text)}</p>
    </div>
  `;

  const header = () => `
    <header class="site-header">
      <nav class="nav" aria-label="Main navigation">
        ${brand()}
        <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="nav-links" id="navLinks">
          ${data.nav.map((item) => `
            <a class="${item.page === page ? "active" : ""}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
          `).join("")}
          <a class="nav-cta ${page === "guidance" ? "active" : ""}" href="guidance.html">Book Guidance</a>
        </div>
      </nav>
    </header>
  `;

  const footer = () => `
    <footer class="site-footer">
      <div class="footer-inner">
        ${brand()}
        <p>${escapeHtml(data.brand.footerText)}</p>
        <p class="credits">
          Campus imagery credits:
          ${data.credits.map((credit) => `<a href="${escapeHtml(credit.url)}" target="_blank" rel="noopener">${escapeHtml(credit.label)}</a>`).join(", ")}.
        </p>
      </div>
    </footer>
  `;

  const floatingActions = () => `
    <div class="floating-actions" aria-label="Quick community links">
      <a class="float-btn float-whatsapp" href="${escapeHtml(data.links.whatsapp)}" target="_blank" rel="noopener" aria-label="Open WhatsApp community">WhatsApp</a>
      <a class="float-btn float-telegram" href="${escapeHtml(data.links.telegram)}" target="_blank" rel="noopener" aria-label="Open Telegram community">Telegram</a>
    </div>
  `;

  const card = (item, index) => `
    <article class="card">
      <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `;

  const guidanceForm = () => `
    <form class="lead-form" data-lead-form>
      <label>
        ${escapeHtml(data.guidance.fields.name)}
        <input type="text" name="name" placeholder="Your name" required>
      </label>
      <label>
        ${escapeHtml(data.guidance.fields.phone)}
        <input type="tel" name="phone" placeholder="+91 98765 43210" required>
      </label>
      <label>
        ${escapeHtml(data.guidance.fields.stage)}
        <select name="stage" required>
          <option value="">Select one</option>
          ${data.guidance.stages.map((stage) => `<option>${escapeHtml(stage)}</option>`).join("")}
        </select>
      </label>
      <label>
        ${escapeHtml(data.guidance.fields.message)}
        <textarea name="message" placeholder="Tell us about your question"></textarea>
      </label>
      <button class="btn btn-primary" type="submit">${escapeHtml(data.guidance.submitText)}</button>
      <p class="form-note" aria-live="polite"></p>
    </form>
  `;

  const renderHome = () => {
    const home = data.home;
    return `
      <section class="hero" aria-label="Hero Section">
        <div class="section-inner hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(home.hero.eyebrow)}</p>
            <h1>${escapeHtml(home.hero.title)}</h1>
            <p>${escapeHtml(home.hero.text)}</p>
            <div class="actions">
              <a class="btn btn-primary" href="guidance.html">${escapeHtml(home.hero.primaryCta)}</a>
              <a class="btn btn-secondary" href="toolkit.html">${escapeHtml(home.hero.secondaryCta)}</a>
            </div>
            <div class="stat-grid">
              ${home.hero.stats.map((item) => `
                <article class="stat-card">
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.text)}</span>
                </article>
              `).join("")}
            </div>
          </div>
          <figure class="hero-image">
            <img src="${escapeHtml(data.images.hero)}" alt="Delhi University North Campus street">
            <figcaption>${escapeHtml(home.hero.badge)}</figcaption>
          </figure>
        </div>
      </section>

      <section class="section-white">
        <div class="section-inner">
          ${sectionHead(home.about)}
          <div class="split-grid">
            <article class="panel">
              <h3>${escapeHtml(home.about.cardTitle)}</h3>
              <p>${escapeHtml(home.about.cardText)}</p>
            </article>
            <figure class="image-panel">
              <img src="${escapeHtml(data.images.arts)}" alt="Shri Ram College of Commerce at Delhi University">
            </figure>
          </div>
        </div>
      </section>

      <section>
        <div class="section-inner">
          ${sectionHead(home.why)}
          <div class="cards-3">${home.why.items.map(card).join("")}</div>
        </div>
      </section>

      <section class="section-white">
        <div class="section-inner">
          ${sectionHead(home.teach)}
          <div class="cards-3">${home.teach.items.map(card).join("")}</div>
        </div>
      </section>

      <section class="reviews">
        <div class="section-inner">
          ${sectionHead(home.reviews)}
        </div>
        <div class="review-window" aria-label="Student reviews carousel">
          <div class="review-track">
            ${[...home.reviews.items, ...home.reviews.items].map((review) => `
              <article class="review-card">
                <p>"${escapeHtml(review.quote)}"</p>
                <strong>${escapeHtml(review.name)}</strong>
                <span>${escapeHtml(review.detail)}</span>
              </article>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  };

  const renderAbout = () => {
    const about = data.about;
    return `
      <section class="page-hero">
        <div class="section-inner page-hero-grid">
          <div>
            <p class="eyebrow">${escapeHtml(about.eyebrow)}</p>
            <h1>${escapeHtml(about.title)}</h1>
            <p>${escapeHtml(about.intro)}</p>
          </div>
          <figure class="image-panel">
            <img src="${escapeHtml(data.images.miranda)}" alt="Hindu College at Delhi University">
          </figure>
        </div>
      </section>

      <section class="section-white">
        <div class="section-inner story-grid">
          <article class="panel">
            <p class="eyebrow">${escapeHtml(about.storyTitle)}</p>
            <h2>${escapeHtml(about.storyTitle)}</h2>
            <p>${escapeHtml(about.storyText)}</p>
          </article>
          <div class="cards-2">
            <article class="card">
              <h3>${escapeHtml(about.missionTitle)}</h3>
              <p>${escapeHtml(about.missionText)}</p>
            </article>
            <article class="card">
              <h3>${escapeHtml(about.visionTitle)}</h3>
              <p>${escapeHtml(about.visionText)}</p>
            </article>
          </div>
        </div>
      </section>

      <section>
        <div class="section-inner">
          ${sectionHead(about.beliefs)}
          <div class="cards-3">${about.beliefs.items.map(card).join("")}</div>
        </div>
      </section>

      <section class="section-white">
        <div class="section-inner">
          ${sectionHead(about.help)}
          <div class="cards-2">${about.help.items.map(card).join("")}</div>
        </div>
      </section>

      <section>
        <div class="section-inner split-grid">
          <article class="panel">
            <p class="eyebrow">${escapeHtml(about.promise.eyebrow)}</p>
            <h2>${escapeHtml(about.promise.title)}</h2>
            <p>${escapeHtml(about.promise.text)}</p>
          </article>
          <article class="panel">
            <ul class="check-list check-list-panel">
              ${about.promise.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </article>
        </div>
      </section>

      <section>
        <div class="section-inner">
          ${sectionHead(about.different)}
          <div class="cards-3">${about.different.items.map(card).join("")}</div>
        </div>
      </section>
    `;
  };

  const renderToolkit = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.toolkit.eyebrow)}</p>
          <h1>${escapeHtml(data.toolkit.title)}</h1>
          <p>${escapeHtml(data.toolkit.text)}</p>
        </div>
        <figure class="image-panel">
          <img src="${escapeHtml(data.images.daulatRam)}" alt="Hansraj College at Delhi University">
        </figure>
      </div>
    </section>

    <section class="section-white">
      <div class="section-inner">
        <div class="tool-grid">
          ${data.toolkit.items.map((item) => `
            <article class="tool-card">
              <span class="status">${escapeHtml(item.status)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section>
      <div class="section-inner guidance-band">
        <div class="guidance-copy">
          <p class="eyebrow">${escapeHtml(data.toolkit.formIntro.eyebrow)}</p>
          <h2>${escapeHtml(data.toolkit.formIntro.title)}</h2>
          <p>${escapeHtml(data.toolkit.formIntro.text)}</p>
          <a class="text-link" href="guidance.html">Open full Book Guidance page</a>
        </div>
        ${guidanceForm()}
      </div>
    </section>
  `;

  const renderCommunity = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.community.eyebrow)}</p>
          <h1>${escapeHtml(data.community.title)}</h1>
          <p>${escapeHtml(data.community.text)}</p>
        </div>
        <figure class="image-panel">
          <img src="${escapeHtml(data.images.campus)}" alt="Delhi University campus greenery">
        </figure>
      </div>
    </section>

    <section class="section-white">
      <div class="section-inner">
        <div class="cards-2">
          ${data.community.items.map((item) => `
            <article class="community-card">
              <span class="community-icon">${escapeHtml(item.icon)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
              <a class="text-link" href="${escapeHtml(linkFor(item.linkKey))}" target="_blank" rel="noopener">${escapeHtml(item.cta)}</a>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section>
      <div class="section-inner">
        ${sectionHead(data.community.contact)}
        <div class="contact-grid">
          ${data.community.contact.items.map((item) => {
            const href = linkFor(item.linkKey);
            const value = data.links[item.linkKey];
            const target = href.startsWith("http") ? "_blank" : "_self";
            return `
              <article class="contact-card">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
                <a class="text-link" href="${escapeHtml(href)}" target="${target}" rel="noopener">${escapeHtml(value)}</a>
              </article>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;

  const renderGuidance = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.guidance.eyebrow)}</p>
          <h1>${escapeHtml(data.guidance.title)}</h1>
          <p>${escapeHtml(data.guidance.text)}</p>
          <ul class="check-list">
            ${data.guidance.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
        </div>
        <figure class="image-panel">
          <img src="${escapeHtml(data.images.sports)}" alt="Delhi University Sports Complex">
        </figure>
      </div>
    </section>

    <section class="section-white">
      <div class="section-inner guidance-band guidance-page-band">
        <div class="guidance-copy">
          <p class="eyebrow">Personal Guidance</p>
          <h2>Tell us where you are stuck.</h2>
          <p>The form is intentionally simple. You can connect it to Google Forms, WhatsApp, email, or a CRM later.</p>
        </div>
        ${guidanceForm()}
      </div>
    </section>
  `;

  const pages = {
    home: renderHome,
    about: renderAbout,
    toolkit: renderToolkit,
    community: renderCommunity,
    guidance: renderGuidance
  };

  document.querySelector("#site").innerHTML = `
    ${header()}
    <main>${(pages[page] || pages.home)()}</main>
    ${floatingActions()}
    ${footer()}
  `;

  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector("#navLinks");

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitLead(form);
    });
  });
})();
