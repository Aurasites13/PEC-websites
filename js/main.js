// PEC — Private Education Concierge — shared behavior

(function () {
  "use strict";

  // ---------- Language toggle ----------
  var LANG_KEY = "pec_lang";

  function getPreferredLang() {
    var stored = null;
    try { stored = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (stored === "en" || stored === "ja") return stored;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("ja") === 0 ? "ja" : "en";
  }

  function setLang(lang) {
    document.documentElement.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    document.querySelectorAll(".lang-toggle-mobile button").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    var titleEl = document.querySelector("title[data-en]");
    if (titleEl) {
      var val = lang === "ja" ? titleEl.getAttribute("data-ja") : titleEl.getAttribute("data-en");
      if (val) document.title = val;
    }
    document.querySelectorAll("img[data-alt-en]").forEach(function (img) {
      var altVal = lang === "ja" ? img.getAttribute("data-alt-ja") : img.getAttribute("data-alt-en");
      if (altVal !== null) img.alt = altVal;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setLang(getPreferredLang());

    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });

    // ---------- FAQ / Q&A accordion ----------
    // Shared by faq.html's accordion and the homepage Q&A section (both use
    // the same .faq-item/.faq-q/.faq-a markup). Native <button> already
    // gives keyboard operability (Enter/Space); this adds the aria wiring
    // a screen reader needs to announce open/closed state correctly.
    var faqAutoId = 0;
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if (!q || !a) return;
      faqAutoId += 1;
      if (!a.id) a.id = "faq-answer-" + faqAutoId;
      q.setAttribute("aria-expanded", "false");
      q.setAttribute("aria-controls", a.id);
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item.open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("open");
            openItem.querySelector(".faq-a").style.maxHeight = null;
            openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          }
        });
        if (isOpen) {
          item.classList.remove("open");
          a.style.maxHeight = null;
          q.setAttribute("aria-expanded", "false");
        } else {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
          q.setAttribute("aria-expanded", "true");
        }
      });
    });

    // ---------- Reveal on scroll ----------
    var revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -60px 0px" });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }

    // ---------- Site menu (hamburger -> slide-in panel) ----------
    // The menu's contents live in ONE place (PEC_MENU below) — every page
    // gets the identical menu injected by this script, so there's nothing
    // to keep in sync by hand across pages. Interaction pattern (rounded
    // hamburger -> right-side slide-in panel, dark fill, expandable
    // sub-item, closes via X/Esc/outside-click/link-click) follows MMBH's
    // own site menu (see docs/mmbh-analysis.md); markup, copy, and code
    // are PEC's own.
    var PEC_MENU = [
      { en: "TOP", ja: "TOP", href: "index.html" },
      { en: "What is PEC", ja: "PECとは", href: "index.html#japan" },
      {
        en: "Courses", ja: "コース一覧", expandable: true,
        children: [
          { en: "Private Academic Tutoring", ja: "プライベート・アカデミック・チュータリング", href: "services.html#tutoring" },
          { en: "Exam Preparation", ja: "資格試験対策", href: "services.html#exam" },
          { en: "Personal Education Concierge", ja: "パーソナル・エデュケーション・コンシェルジュ", href: "services.html#concierge" },
          { en: "International Education Advisory", ja: "海外進学・教育戦略", href: "services.html#intl-advisory" },
          { en: "Swiss Education Advisory", ja: "スイス留学・進学戦略", href: "services.html#swiss-advisory" },
          { en: "Application Execution", ja: "出願実行サポート", href: "services.html#execution" },
          { en: "Swiss Post-Enrollment Concierge", ja: "スイス入学後・年間教育コンシェルジュ", href: "services.html#swiss-post" }
        ]
      },
      { en: "About Our Lessons", ja: "授業について", href: "lessons.html" },
      { en: "Results", ja: "合格実績", href: "results.html" },
      { en: "Pricing", ja: "料金", href: "pricing.html" },
      { en: "FAQ", ja: "よくある質問", href: "faq.html" },
      { en: "Company", ja: "会社概要", href: "about.html" },
      { en: "Careers", ja: "採用情報", href: "careers.html" },
      { en: "Contact", ja: "お問い合わせ", href: "contact.html" }
    ];

    (function initSiteMenu() {
      var navRight = document.querySelector(".nav-right");
      if (!navRight) return;
      var currentPath = (window.location.pathname.split("/").pop() || "index.html");

      function linkHtml(item, extraClass) {
        var hrefPath = item.href.split("#")[0];
        var isActive = hrefPath === currentPath || (hrefPath === "index.html" && currentPath === "");
        return '<a href="' + item.href + '" class="' + (extraClass || "") + (isActive ? " active" : "") + '">' +
          '<span data-lang-inline="en">' + item.en + '</span>' +
          '<span data-lang-inline="ja">' + item.ja + '</span>' +
        '</a>';
      }

      var itemsHtml = PEC_MENU.map(function (item) {
        if (item.expandable) {
          var subHtml = item.children.map(function (child) {
            return '<li>' + linkHtml(child, "site-menu-sublink") + '</li>';
          }).join("");
          return '<li class="site-menu-item has-children">' +
            '<button type="button" class="site-menu-expand" aria-expanded="false">' +
              '<span data-lang-inline="en">' + item.en + '</span>' +
              '<span data-lang-inline="ja">' + item.ja + '</span>' +
              '<svg class="site-menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>' +
            '</button>' +
            '<ul class="site-menu-sublist">' + subHtml + '</ul>' +
          '</li>';
        }
        return '<li class="site-menu-item">' + linkHtml(item, "site-menu-link") + '</li>';
      }).join("");

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.id = "pecMenuToggle";
      toggle.className = "site-menu-toggle";
      toggle.setAttribute("aria-label", "Menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "pecSiteMenu");
      toggle.innerHTML = "<span></span><span></span><span></span>";
      navRight.appendChild(toggle);

      var menu = document.createElement("div");
      menu.id = "pecSiteMenu";
      menu.className = "site-menu";
      menu.setAttribute("role", "dialog");
      menu.setAttribute("aria-modal", "true");
      menu.setAttribute("aria-label", "Site menu");
      menu.innerHTML =
        '<div class="site-menu-scrim" data-menu-close></div>' +
        '<div class="site-menu-panel">' +
          '<button type="button" class="site-menu-close" data-menu-close aria-label="Close menu">&times;</button>' +
          '<ul class="site-menu-list">' + itemsHtml + '</ul>' +
        '</div>';
      document.body.appendChild(menu);

      var panel = menu.querySelector(".site-menu-panel");

      function openMenu() {
        menu.classList.add("open");
        toggle.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");
        menu.querySelector(".site-menu-close").focus();
        document.addEventListener("keydown", onKeydown);
      }
      function closeMenu() {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
        toggle.focus();
        document.removeEventListener("keydown", onKeydown);
      }
      function onKeydown(e) {
        if (e.key === "Escape") closeMenu();
      }
      toggle.addEventListener("click", function () {
        if (menu.classList.contains("open")) closeMenu(); else openMenu();
      });
      menu.querySelectorAll("[data-menu-close]").forEach(function (el) {
        el.addEventListener("click", closeMenu);
      });
      // Click outside the panel (but still inside the open menu) closes it;
      // the scrim already covers this, but guard clicks that land on the
      // menu's own background too.
      menu.addEventListener("click", function (e) {
        if (!panel.contains(e.target)) closeMenu();
      });
      menu.querySelectorAll(".site-menu-link, .site-menu-sublink").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
      menu.querySelectorAll(".site-menu-expand").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = btn.closest(".site-menu-item");
          var isOpen = item.classList.contains("expanded");
          item.classList.toggle("expanded", !isOpen);
          btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        });
      });
    })();

    // ---------- Floating consultation sign ----------
    // Injected once here (not hand-copied into all pages) so every page
    // gets identical markup/behavior. Pattern follows the MMBH analysis
    // (docs/mmbh-analysis.md): a fixed element that stays pinned through
    // scroll, right-edge vertical tab on desktop, bottom full-width bar
    // on mobile.
    (function initFloatingCta() {
      var cta = document.createElement("a");
      cta.id = "pecFloatCta";
      cta.href = "contact.html";
      cta.className = "float-cta";
      cta.innerHTML =
        '<span data-lang-inline="en">Free Counseling</span>' +
        '<span data-lang-inline="ja">無料カウンセリング</span>';
      document.body.appendChild(cta);
    })();

    // ---------- Footer year ----------
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // ---------- Counseling application form (contact.html) ----------
    // Submits via Netlify Forms (works automatically once deployed to
    // Netlify, no backend code needed). FormData grabs every field in the
    // form generically, so every input/select/textarea/checkbox gets
    // submitted without needing to list fields here by name.
    var form = document.querySelector("#counseling-form");
    if (form) {
      // "Other" radio groups: the free-text field next to each group only
      // makes sense once its "Other" option is selected, so it stays
      // hidden/non-required until then.
      form.querySelectorAll("[data-other-group]").forEach(function (fieldset) {
        var otherRadio = fieldset.querySelector('input[type="radio"][value="その他"]');
        var otherField = fieldset.querySelector(".form-other-field");
        var otherInput = otherField ? otherField.querySelector("input") : null;
        if (!otherRadio || !otherField || !otherInput) return;
        fieldset.querySelectorAll('input[type="radio"]').forEach(function (radio) {
          radio.addEventListener("change", function () {
            var show = otherRadio.checked;
            otherField.hidden = !show;
            otherInput.required = show;
            if (!show) otherInput.value = "";
          });
        });
      });

      var coursesFieldset = form.querySelector("#coursesFieldset");
      var courseInputs = coursesFieldset ? coursesFieldset.querySelectorAll('input[name="coursesInterest"]') : [];

      function validateCourses() {
        if (!coursesFieldset) return true;
        var checked = Array.prototype.some.call(courseInputs, function (c) { return c.checked; });
        coursesFieldset.classList.toggle("has-error", !checked);
        return checked;
      }
      courseInputs.forEach(function (c) {
        c.addEventListener("change", validateCourses);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var coursesOk = validateCourses();
        var nativeOk = form.checkValidity();
        if (!nativeOk) { form.reportValidity(); return; }
        if (!coursesOk) {
          if (coursesFieldset) coursesFieldset.scrollIntoView({ block: "center", behavior: "smooth" });
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var status = form.querySelector(".form-status");
        var data = new FormData(form);
        var encoded = new URLSearchParams(data).toString();

        function showStatus(ok) {
          if (!status) return;
          var lang = document.documentElement.getAttribute("lang");
          status.className = "form-status" + (ok ? " form-success" : "");
          if (ok) {
            status.textContent = lang === "ja"
              ? "お申し込みありがとうございます。担当より［プレースホルダー：対応時間未確定］以内にご連絡いたします。"
              : "Thank you for applying. We've received your application and will reply within [placeholder: response time not yet confirmed].";
          } else {
            status.textContent = lang === "ja"
              ? "送信中に問題が発生しました。info.pec.jp@gmail.com までメールにてご連絡ください。"
              : "Something went wrong sending this. Please email us at info.pec.jp@gmail.com instead.";
          }
          status.style.display = "block";
        }

        if (submitBtn) submitBtn.disabled = true;
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encoded
        }).then(function () {
          showStatus(true);
          form.reset();
          form.querySelectorAll(".form-other-field").forEach(function (f) { f.hidden = true; });
          if (coursesFieldset) coursesFieldset.classList.remove("has-error");
        }).catch(function () {
          showStatus(false);
        }).finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
      });
    }
  });
})();
