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
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); });
      });
    }

    // ---------- FAQ accordion ----------
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item.open").forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove("open");
            openItem.querySelector(".faq-a").style.maxHeight = null;
          }
        });
        if (isOpen) {
          item.classList.remove("open");
          a.style.maxHeight = null;
        } else {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
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
