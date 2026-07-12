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

  const submitAccommodation = async (form) => {
    const note = form.querySelector(".form-note");
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const supabase = data.supabase || {};
    const requiredFields = [
      { name: "name", label: "your name" },
      { name: "gender", label: "your gender" },
      { name: "phone", label: "your phone number" },
      { name: "college", label: "your college name" },
      { name: "campus", label: "your campus preference" },
      { name: "budget", label: "your monthly budget" }
    ];

    note.classList.remove("error");

    for (const field of requiredFields) {
      const value = String(formData.get(field.name) || "").trim();
      if (!value) {
        note.textContent = `Please enter ${field.label}.`;
        note.classList.add("error");
        form.querySelector(`[name='${field.name}']`)?.focus();
        return;
      }
    }

    if (!supabase.url || !supabase.anonKey) {
      note.textContent = data.accommodation.missingConfigText;
      note.classList.add("error");
      return;
    }

    const campusValue = String(formData.get("campus") || "").trim();
    const referralValue = String(formData.get("referral") || "").trim();
    const additionalValue = String(formData.get("additional") || "").trim();
    const additionalParts = [`Campus: ${campusValue}`];

    if (referralValue) {
      additionalParts.push(`Referral: ${referralValue}`);
    }

    if (additionalValue) {
      additionalParts.push(additionalValue);
    }

    const combinedAdditional = additionalParts.join("\n");

    const payload = {
      name: String(formData.get("name") || "").trim(),
      gender: String(formData.get("gender") || "").trim(),
      phone_number: String(formData.get("phone") || "").trim(),
      college_name: String(formData.get("college") || "").trim(),
      campus: campusValue,
      referral: referralValue,
      monthly_budget: String(formData.get("budget") || "").trim(),
      additional_requirements: combinedAdditional
    };

    submitButton.disabled = true;
    note.textContent = "Submitting...";

    try {
      const table = supabase.accommodationTable || "accommodation_enquiries";
      const response = await fetch(`${supabase.url.replace(/\/$/, "")}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok && response.status === 400) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.campus;
        delete fallbackPayload.referral;
        const fallbackResponse = await fetch(`${supabase.url.replace(/\/$/, "")}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            apikey: supabase.anonKey,
            Authorization: `Bearer ${supabase.anonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(fallbackPayload)
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Supabase insert failed with ${fallbackResponse.status}`);
        }

        note.textContent = data.accommodation.successText;
        showAccommodationSuccess();
        form.reset();
        return;
      }

      if (!response.ok) {
        throw new Error(`Supabase insert failed with ${response.status}`);
      }

      note.textContent = data.accommodation.successText;
      showAccommodationSuccess();
      form.reset();
    } catch (error) {
      note.textContent = data.accommodation.errorText;
      note.classList.add("error");
    } finally {
      submitButton.disabled = false;
    }
  };

  const showAccommodationSuccess = () => {
    const modal = document.querySelector("[data-accommodation-success]");
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    modal.querySelector("[data-modal-close]")?.focus();
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

  const badgeStrip = (items = data.badges) => `
    <div class="badge-strip" aria-label="Trust badges">
      ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
  `;

  const metricBand = () => `
    <section class="metric-band" aria-label="DU Marg trust metrics">
      <div class="section-inner metric-grid">
        ${data.metrics.map((metric) => `
          <article class="metric-card">
            <strong><span class="metric-value" data-count="${escapeHtml(metric.value)}">${escapeHtml(metric.value)}</span>${escapeHtml(metric.suffix)}</strong>
            <span>${escapeHtml(metric.label)}</span>
          </article>
        `).join("")}
      </div>
    </section>
  `;

  const successStories = () => `
    <section>
      <div class="section-inner">
        ${sectionHead(data.successStories)}
        <div class="cards-3 success-grid">${data.successStories.items.map(card).join("")}</div>
      </div>
    </section>
  `;

  const faqSection = () => `
    <section class="section-white">
      <div class="section-inner">
        ${sectionHead(data.faq)}
        <div class="faq-grid">
          ${data.faq.items.map((item) => `
            <details class="faq-item">
              <summary>${escapeHtml(item.question)}</summary>
              <p>${escapeHtml(item.answer)}</p>
            </details>
          `).join("")}
        </div>
      </div>
    </section>
  `;

  const exploreCta = () => `
    <section>
      <div class="section-inner premium-cta">
        <div>
          <p class="eyebrow">Next Step</p>
          <h2>${escapeHtml(data.finalCta.title)}</h2>
          <p>${escapeHtml(data.finalCta.text)}</p>
        </div>
        <div class="actions">
          <a class="btn btn-primary" href="accommodation.html">${escapeHtml(data.finalCta.primary)}</a>
          <a class="btn btn-secondary" href="community.html">${escapeHtml(data.finalCta.secondary)}</a>
        </div>
      </div>
    </section>
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
          <a class="nav-cta ${page === "accommodation" ? "active" : ""}" href="accommodation.html">Accommodations</a>
        </div>
      </nav>
    </header>
  `;

  const footer = () => `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-main">
          <div>
            ${brand()}
            <p>${escapeHtml(data.brand.footerText)}</p>
            ${badgeStrip(["Verified", "Trusted", "Student Friendly"])}
          </div>
          <div class="footer-links">
            <h3>Explore</h3>
            ${data.nav.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}
            <a href="accommodation.html">Accommodations</a>
          </div>
          <div class="footer-links">
            <h3>Connect</h3>
            <div class="footer-social">
              <a href="${escapeHtml(linkFor("whatsapp"))}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>
              <a href="${escapeHtml(linkFor("instagram"))}" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
              <a href="${escapeHtml(linkFor("email"))}" aria-label="Email">@</a>
            </div>
            <a href="${escapeHtml(linkFor("whatsapp"))}" target="_blank" rel="noopener">WhatsApp</a>
            <a href="${escapeHtml(linkFor("instagram"))}" target="_blank" rel="noopener">Instagram</a>
            <a href="${escapeHtml(linkFor("email"))}">${escapeHtml(data.links.email)}</a>
          </div>
        </div>
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
    </div>
  `;

  const accommodationSuccessModal = () => `
    <div class="success-modal" data-accommodation-success aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="accommodationSuccessTitle">
      <div class="success-modal-backdrop" data-modal-close></div>
      <article class="success-modal-card">
        <button class="success-modal-close" type="button" data-modal-close aria-label="Close success message">×</button>
        <span class="success-modal-icon">🏠</span>
        <h2 id="accommodationSuccessTitle">We got u covered!!</h2>
        <p>Our team shall contact u shortly!!</p>
        <p>${escapeHtml(data.accommodation.successWhatsappText)}</p>
        <a class="btn btn-primary accommodation-highlight" href="${escapeHtml(data.links.whatsapp)}" target="_blank" rel="noopener">${escapeHtml(data.accommodation.successWhatsappCta)}</a>
      </article>
    </div>
  `;

  const card = (item, index) => `
    <article class="card">
      <span class="${item.icon ? "card-icon" : "card-index"}">${item.icon ? escapeHtml(item.icon) : String(index + 1).padStart(2, "0")}</span>
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
      <section class="accommodation-alert" aria-label="Accommodation highlight">
        <div class="section-inner accommodation-alert-inner">
          <div>
            <span class="alert-badge">Hot</span>
            <h2>${escapeHtml(home.accommodationBanner.title)}</h2>
          </div>
          <a class="btn btn-primary accommodation-highlight" href="accommodation.html">${escapeHtml(home.accommodationBanner.cta)}</a>
        </div>
      </section>

      <section class="hero" aria-label="Hero Section">
        <div class="section-inner hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(home.hero.eyebrow)}</p>
            <h1>${escapeHtml(home.hero.title)}</h1>
            <p>${escapeHtml(home.hero.text)}</p>
            ${badgeStrip()}
            <div class="actions">
              <a class="btn btn-primary accommodation-highlight" href="accommodation.html">${escapeHtml(home.hero.primaryCta)}</a>
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

      ${metricBand()}

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

      ${successStories()}

      <section class="reviews">
        <div class="section-inner">
          ${sectionHead(home.reviews)}
        </div>
        <div class="review-window" aria-label="Student reviews carousel">
          <div class="review-track">
            ${[...home.reviews.items, ...home.reviews.items].map((review) => `
              <article class="review-card">
                <div class="review-top">
                  <span class="review-avatar">${escapeHtml(review.name.charAt(0))}</span>
                  <span class="stars">★★★★★</span>
                </div>
                <p>"${escapeHtml(review.quote)}"</p>
                <strong>${escapeHtml(review.name)}</strong>
                <span>${escapeHtml(review.detail)}</span>
              </article>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="home-accommodation-cta">
        <div class="section-inner home-accommodation-cta-inner">
          <div>
            <span class="alert-badge">PG Help</span>
            <h2>${escapeHtml(home.accommodationCta.title)}</h2>
            <p>${escapeHtml(home.accommodationCta.text)}</p>
          </div>
          <a class="btn btn-primary accommodation-highlight" href="accommodation.html">${escapeHtml(home.accommodationCta.cta)}</a>
        </div>
      </section>
      ${faqSection()}
      ${exploreCta()}
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
            ${badgeStrip(["Student-led", "Context-first", "Practical"])}
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
      ${metricBand()}
      ${exploreCta()}
    `;
  };

  const renderToolkit = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.toolkit.eyebrow)}</p>
          <h1>${escapeHtml(data.toolkit.title)}</h1>
          <p>${escapeHtml(data.toolkit.text)}</p>
          ${badgeStrip(["Editable Resources", "Student Friendly", "Actionable"])}
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
    ${faqSection()}
    ${exploreCta()}
  `;

  const renderCommunity = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.community.eyebrow)}</p>
          <h1>${escapeHtml(data.community.title)}</h1>
          <p>${escapeHtml(data.community.text)}</p>
          ${badgeStrip(["Updates", "Peer Support", "Resource Drops"])}
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
    ${metricBand()}
    ${exploreCta()}
  `;

  const renderGuidance = () => `
    <section class="page-hero">
      <div class="section-inner page-hero-grid">
        <div>
          <p class="eyebrow">${escapeHtml(data.guidance.eyebrow)}</p>
          <h1>${escapeHtml(data.guidance.title)}</h1>
          <p>${escapeHtml(data.guidance.text)}</p>
          ${badgeStrip(["Personal Plan", "Clear Tradeoffs", "No Pressure"])}
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
    ${successStories()}
    ${faqSection()}
  `;

  const accommodationForm = () => `
    <form class="lead-form accommodation-form" data-accommodation-form novalidate>
      <label>
        ${escapeHtml(data.accommodation.fields.name)}
        <input type="text" name="name" placeholder="Your name" required>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.gender)}
        <select name="gender" required>
          <option value="">Select gender</option>
          ${data.accommodation.genderOptions.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.phone)}
        <input type="tel" name="phone" placeholder="+91 98765 43210" required>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.college)}
        <input type="text" name="college" placeholder="Your college name" required>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.campus)}
        <select name="campus" required>
          <option value="">Select campus</option>
          ${data.accommodation.campusOptions.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.budget)}
        <input type="text" name="budget" placeholder="Example: ₹12,000 - ₹18,000" required>
      </label>
      <label>
        ${escapeHtml(data.accommodation.fields.referral)}
        <input type="text" name="referral" placeholder="Example: Friend, senior, Instagram, WhatsApp group">
      </label>
      <label class="form-full">
        ${escapeHtml(data.accommodation.fields.additional)}
        <textarea name="additional" placeholder="Mention any preferences or requirements"></textarea>
      </label>
      <button class="btn btn-primary form-full" type="submit">${escapeHtml(data.accommodation.submitText)}</button>
      <p class="form-note form-full" aria-live="polite"></p>
    </form>
  `;

  const iconCard = (item) => `
    <article class="card icon-card">
      <span class="amenity-icon">${escapeHtml(item.icon)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `;

  const renderAccommodation = () => `
    <section class="page-hero accommodation-hero">
      <div class="section-inner accommodation-intro">
        <p class="eyebrow">Accommodation</p>
        <h1>${escapeHtml(data.accommodation.title)}</h1>
        <p>${escapeHtml(data.accommodation.text)}</p>
        ${badgeStrip(["Verified PGs", "No Brokerage", "Senior Recommended"])}
        ${accommodationForm()}
      </div>
    </section>

    <section class="section-white">
      <div class="section-inner">
        <div class="accommodation-gallery">
          ${data.accommodation.gallery.map((image) => `
            <figure class="pg-image">
              <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">
            </figure>
          `).join("")}
        </div>
      </div>
    </section>

    <section>
      <div class="section-inner">
        ${sectionHead(data.accommodation.why)}
        <div class="cards-3">${data.accommodation.why.items.map(card).join("")}</div>
      </div>
    </section>

    <section class="section-white">
      <div class="section-inner">
        ${sectionHead(data.accommodation.amenities)}
        <div class="amenities-grid">${data.accommodation.amenities.items.map(iconCard).join("")}</div>
      </div>
    </section>

    <section>
      <div class="section-inner">
        ${sectionHead(data.accommodation.howItWorks)}
        <div class="process-grid">
          ${data.accommodation.howItWorks.items.map((item, index) => `
            <article class="process-card">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section>
      <div class="section-inner accommodation-cta">
        <h2>${escapeHtml(data.accommodation.cta.title)}</h2>
        <p>${escapeHtml(data.accommodation.cta.text)}</p>
      </div>
    </section>
  `;

  const pages = {
    home: renderHome,
    about: renderAbout,
    toolkit: renderToolkit,
    community: renderCommunity,
    guidance: renderGuidance,
    accommodation: renderAccommodation
  };

  document.querySelector("#site").innerHTML = `
    <div class="page-loader" aria-hidden="true"><span>DU</span></div>
    ${header()}
    <main>${(pages[page] || pages.home)()}</main>
    ${floatingActions()}
    ${accommodationSuccessModal()}
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

  const closeAccommodationSuccess = () => {
    const modal = document.querySelector("[data-accommodation-success]");
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", closeAccommodationSuccess);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAccommodationSuccess();
    }
  });

  document.querySelectorAll("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitLead(form);
    });
  });

  document.querySelectorAll("[data-accommodation-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAccommodation(form);
    });
  });

  const revealItems = document.querySelectorAll("main section, .card, .tool-card, .community-card, .contact-card, .metric-card, .pg-image, .faq-item, .process-card");
  revealItems.forEach((item) => item.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const animateCounters = () => {
    document.querySelectorAll(".metric-value").forEach((element) => {
      const target = Number(element.dataset.count || "0");
      const hasDecimal = !Number.isInteger(target);
      const start = performance.now();
      const duration = 1200;

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        element.textContent = hasDecimal ? value.toFixed(1) : String(Math.round(value));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  };

  setTimeout(() => {
    document.body.classList.add("page-ready");
    animateCounters();
  }, 120);
})();
