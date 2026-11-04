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
  }

  document.addEventListener("DOMContentLoaded", function () {
    setLang(getPreferredLang());

    document.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });

    // ---------- Mobile nav ----------
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("open");
        var expanded = links.classList.contains("open");
        toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
        toggle.classList.toggle("open", expanded);
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.classList.remove("open");
        });
      });
    }

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

    // ---------- Active nav link ----------
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path) a.classList.add("active");
    });

    // ---------- Floating consultation sign + media side-toggle ----------
    // Injected once here (not hand-copied into all 11 pages) so every page
    // gets identical markup/behavior and there's one place to edit later.
    // Pattern follows the MMBH analysis (docs/mmbh-analysis.md): a fixed
    // element that stays pinned through scroll, right-edge vertical tab on
    // desktop, bottom full-width bar on mobile.
    (function initFloatingChrome() {
      var cta = document.createElement("a");
      cta.id = "pecFloatCta";
      cta.href = "contact.html";
      cta.className = "float-cta";
      cta.innerHTML =
        '<span data-lang-inline="en">Free Consultation</span>' +
        '<span data-lang-inline="ja">無料相談</span>';
      document.body.appendChild(cta);

      var toggle = document.createElement("button");
      toggle.id = "pecMediaToggle";
      toggle.type = "button";
      toggle.className = "media-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "pecMediaDrawer");
      toggle.innerHTML =
        '<span data-lang-inline="en">Media</span>' +
        '<span data-lang-inline="ja">メディア</span>';
      document.body.appendChild(toggle);

      var drawer = document.createElement("div");
      drawer.id = "pecMediaDrawer";
      drawer.className = "media-drawer";
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      drawer.setAttribute("aria-labelledby", "pecMediaDrawerTitle");
      drawer.innerHTML =
        '<div class="media-drawer-scrim" data-media-close></div>' +
        '<div class="media-drawer-panel">' +
          '<button type="button" class="media-drawer-close" data-media-close aria-label="Close">&times;</button>' +
          '<h3 id="pecMediaDrawerTitle">' +
            '<span data-lang-inline="en">Media &amp; Appearances</span>' +
            '<span data-lang-inline="ja">メディア掲載・出演情報</span>' +
          '</h3>' +
          '<p class="media-drawer-note">' +
            '<span data-lang-inline="en">Placeholder section — no media appearances, press coverage, or logos have been added yet. This space is reserved for real coverage once confirmed.</span>' +
            '<span data-lang-inline="ja">プレースホルダーです。メディア出演・掲載実績はまだ確定しておらず、確認が取れ次第こちらに掲載予定です。</span>' +
          '</p>' +
          '<div class="media-drawer-grid">' +
            Array.from({ length: 6 }).map(function () {
              return '<div class="media-placeholder-tile">' +
                '<span data-lang-inline="en">Logo placeholder</span>' +
                '<span data-lang-inline="ja">ロゴ・プレースホルダー</span>' +
              '</div>';
            }).join("") +
          '</div>' +
        '</div>';
      document.body.appendChild(drawer);

      function openDrawer() {
        drawer.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        drawer.querySelector(".media-drawer-close").focus();
        document.addEventListener("keydown", onKeydown);
      }
      function closeDrawer() {
        drawer.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
        document.removeEventListener("keydown", onKeydown);
      }
      function onKeydown(e) {
        if (e.key === "Escape") closeDrawer();
      }
      toggle.addEventListener("click", function () {
        if (drawer.classList.contains("open")) closeDrawer(); else openDrawer();
      });
      drawer.querySelectorAll("[data-media-close]").forEach(function (el) {
        el.addEventListener("click", closeDrawer);
      });
    })();

    // ---------- Footer year ----------
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // ---------- Contact form ----------
    // Submits via Netlify Forms (works automatically once deployed to Netlify —
    // no backend code needed). Falls back to a friendly inline message either way.
    var form = document.querySelector("#contact-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var status = form.querySelector(".form-status");
        var data = new FormData(form);
        var encoded = new URLSearchParams(data).toString();

        function showStatus(ok) {
          if (!status) return;
          var lang = document.documentElement.getAttribute("lang");
          if (ok) {
            status.textContent = lang === "ja"
              ? "送信ありがとうございます。担当より2営業日以内にご連絡いたします。"
              : "Thank you — we've received your message and will reply within 2 business days.";
          } else {
            status.textContent = lang === "ja"
              ? "送信中に問題が発生しました。LINEまたはWhatsAppからもご連絡いただけます。"
              : "Something went wrong sending this. Please reach us via LINE or WhatsApp instead.";
          }
          status.style.display = "block";
        }

        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encoded
        }).then(function () {
          showStatus(true);
          form.reset();
        }).catch(function () {
          showStatus(false);
        });
      });
    }
  });
})();
