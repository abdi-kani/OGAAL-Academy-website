(function () {
  var PAGES = ["home", "about", "training", "admissions", "certification", "faq", "contact"];
  var FAQ = __FAQ_DATA__;
  var pending = { topic: null, type: null };

  function pageEl(key) { return document.querySelector('.pv-page[data-page="' + key + '"]'); }
  function current() { return document.querySelector(".pv-page:not([hidden])"); }

  function show(key, anchor) {
    PAGES.forEach(function (k) { pageEl(k).hidden = k !== key; });
    closeMenus();
    var target = anchor && pageEl(key).querySelector("#" + CSS.escape(anchor));
    if (target) requestAnimationFrame(function () { target.scrollIntoView({ block: "start" }); });
    else window.scrollTo(0, 0);
    if (key === "contact") {
      var cp = pageEl("contact");
      if (pending.topic) {
        var msg = cp.querySelector("#enq-message");
        if (msg && !msg.value) msg.value = "I would like to know more about: " + pending.topic + ".\n\n";
      }
      if (pending.type) {
        var radio = cp.querySelector('input[name="enquiryType"][value="' + pending.type + '"]');
        if (radio && !cp.querySelector('input[name="enquiryType"]:checked')) { radio.checked = true; radio.dispatchEvent(new Event("change", { bubbles: true })); }
      }
    }
    pending.topic = pending.type = null;
  }

  function route(href) {
    var u = new URL(href, "http://x");
    var key = u.pathname === "/" ? "home" : u.pathname.replace(/^\//, "").split("/")[0];
    if (key === "faqs") key = "faq";
    if (PAGES.indexOf(key) === -1) return null;
    return { key: key, anchor: u.hash ? u.hash.slice(1) : null, topic: u.searchParams.get("topic"), type: u.searchParams.get("type") };
  }

  function wireLinks(scope) {
    scope.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var r = route(a.getAttribute("href"));
      if (!r) return;
      a.dataset.pvKey = r.key;
      if (r.anchor) a.dataset.pvAnchor = r.anchor;
      if (r.topic) a.dataset.pvTopic = r.topic;
      if (r.type) a.dataset.pvType = r.type;
      a.setAttribute("href", "#" + (r.anchor || r.key));
    });
  }
  wireLinks(document);

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-pv-key]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.pvTopic) pending.topic = a.dataset.pvTopic;
    if (a.dataset.pvType) pending.type = a.dataset.pvType;
    try { history.pushState(null, "", "#" + (a.dataset.pvAnchor || a.dataset.pvKey)); } catch (_) {}
    show(a.dataset.pvKey, a.dataset.pvAnchor || null);
  });

  document.querySelectorAll('a[href="#main"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); current().querySelector("main").focus(); });
  });

  function fromHash() {
    var h = (location.hash || "").slice(1);
    if (!h) return show("home");
    if (PAGES.indexOf(h) > -1) return show(h);
    for (var i = 0; i < PAGES.length; i++) if (pageEl(PAGES[i]).querySelector("#" + CSS.escape(h))) return show(PAGES[i], h);
    show("home");
  }
  window.addEventListener("popstate", fromHash);

  /* ---------------- Mobile menu ---------------- */
  var MENU_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>';
  var X_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  function setMenu(page, open) {
    var btn = page.querySelector('button[aria-controls="mobile-menu"]');
    var panel = page.querySelector("#mobile-menu");
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    btn.innerHTML = open ? X_SVG : MENU_SVG;
    panel.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var f = panel.querySelector("a"); if (f) f.focus(); }
  }
  function closeMenus() { document.querySelectorAll(".pv-page").forEach(function (p) { setMenu(p, false); }); }
  document.querySelectorAll('button[aria-controls="mobile-menu"]').forEach(function (btn) {
    btn.addEventListener("click", function () { setMenu(btn.closest(".pv-page"), btn.getAttribute("aria-expanded") !== "true"); });
  });
  document.addEventListener("keydown", function (e) {
    var page = current();
    var btn = page.querySelector('button[aria-controls="mobile-menu"][aria-expanded="true"]');
    if (!btn) return;
    if (e.key === "Escape") { setMenu(page, false); btn.focus(); }
    if (e.key === "Tab") {
      var items = [btn].concat(Array.prototype.slice.call(page.querySelectorAll("#mobile-menu a")));
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener("scroll", function () {
    var h = current().querySelector("header"), on = window.scrollY > 8;
    ["border-line", "bg-white/85", "backdrop-blur-xl", "shadow-[0_8px_30px_-18px_rgb(8_27_58/0.35)]"].forEach(function (c) { h.classList.toggle(c, on); });
    ["border-transparent", "bg-white/60", "backdrop-blur-md"].forEach(function (c) { h.classList.toggle(c, !on); });
  }, { passive: true });

  /* ---------------- Accordion ---------------- */
  function setItem(btn, open) {
    var card = btn.closest(".card");
    var existing = card.querySelector('[role="region"]');
    btn.setAttribute("aria-expanded", String(open));
    card.classList.toggle("border-blue-100", open);
    card.classList.toggle("shadow-[var(--shadow-lift)]", open);
    var icon = btn.querySelector("span[aria-hidden]");
    ["rotate-45", "bg-blue", "text-white"].forEach(function (c) { icon.classList.toggle(c, open); });
    ["bg-blue-50", "text-blue"].forEach(function (c) { icon.classList.toggle(c, !open); });
    if (open && !existing) {
      var q = btn.innerText.trim();
      var region = document.createElement("div");
      region.id = btn.getAttribute("aria-controls");
      region.setAttribute("role", "region");
      region.setAttribute("aria-labelledby", btn.id);
      region.className = "overflow-hidden";
      var p = document.createElement("p");
      p.className = "px-5 pb-6 sm:px-7";
      p.textContent = FAQ[q] || "";
      region.appendChild(p);
      card.appendChild(region);
    } else if (!open && existing) existing.remove();
  }
  document.querySelectorAll('main button[aria-controls][aria-expanded]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      var group = btn.closest(".space-y-3");
      group.querySelectorAll("button[aria-controls]").forEach(function (b) { setItem(b, false); });
      if (open) setItem(btn, true);
    });
  });

  /* ---------------- Enquiry forms (preview: validation only, nothing is sent) ---------------- */
  var LABELS = { fullName: "Full Name", email: "Email Address", phone: "Phone Number", enquiryType: "Enquiry Type", applicantType: "Individual or Organisation", organisationName: "Organisation Name", message: "Message", consent: "Consent" };
  var ERR_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';

  document.querySelectorAll("main form").forEach(function (form) {
    var kind = form.querySelector('[id^="adm-"]') ? "admissions" : "contact";
    var P = kind === "admissions" ? "adm-" : "enq-";
    var touched = {};
    var submitted = false;
    function el(id) { return form.querySelector("#" + P + id); }
    function val(id) { var e = el(id); return e ? e.value : ""; }
    function checked(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ""; }
    function values() {
      return { fullName: val("fullName"), email: val("email"), phone: val("phone"), enquiryType: checked("enquiryType"), applicantType: checked("applicantType"), organisationName: val("organisationName"), message: val("message"), consent: el("consent").checked };
    }
    function validate(v) {
      var e = {};
      if (v.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
      if (!v.email.trim()) e.email = "Please enter your email address.";
      else if (!/^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/.test(v.email.trim())) e.email = "Please enter a valid email address, for example name@example.com.";
      if (kind === "admissions" && !v.phone.trim()) e.phone = "Please enter a phone number so the admissions team can reach you.";
      else if (v.phone.trim() && !/^\+?[0-9\s()-]{7,20}$/.test(v.phone.trim())) e.phone = "Please enter a valid phone number using digits, spaces, or a leading +.";
      if (kind === "contact") { if (!v.enquiryType) e.enquiryType = "Please choose an enquiry type."; }
      else {
        if (!v.applicantType) e.applicantType = "Please choose Individual or Organisation.";
        if (v.applicantType === "Organisation" && v.organisationName.trim().length < 2) e.organisationName = "Please enter your organisation’s name.";
      }
      if (v.message.trim().length < 10) e.message = "Please enter a message of at least 10 characters.";
      if (!v.consent) e.consent = "Please confirm that the academy may contact you about this enquiry.";
      return e;
    }
    function hostFor(k) {
      if (k === "enquiryType" || k === "applicantType") { var r = form.querySelector('input[name="' + k + '"]'); return r && r.closest("fieldset"); }
      var c = el(k); if (!c) return null;
      return k === "consent" ? c.closest("label").parentElement : c.parentElement;
    }
    function render(errs) {
      Object.keys(LABELS).forEach(function (k) {
        var host = hostFor(k); if (!host) return;
        var old = host.querySelector("#" + P + k + "-error"); if (old) old.remove();
        var showIt = (touched[k] || submitted) && errs[k];
        var ctrl = el(k);
        if (ctrl && k !== "consent") {
          ctrl.setAttribute("aria-invalid", showIt ? "true" : "false");
          ["border-red-700", "focus:border-red-700", "focus:ring-red-700/15"].forEach(function (c) { ctrl.classList.toggle(c, !!showIt); });
          ["border-[#cdd8e8]", "focus:border-blue", "focus:ring-blue/15"].forEach(function (c) { ctrl.classList.toggle(c, !showIt); });
        }
        if (ctrl) {
          var ids = (ctrl.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== P + k + "-error"; });
          if (showIt) ids.push(P + k + "-error");
          if (ids.length) ctrl.setAttribute("aria-describedby", ids.join(" ")); else ctrl.removeAttribute("aria-describedby");
        }
        if (showIt) {
          var p = document.createElement("p");
          p.id = P + k + "-error";
          p.className = "mt-2 flex items-start gap-1.5 text-sm font-semibold text-red-700";
          p.innerHTML = ERR_ICON;
          p.appendChild(document.createTextNode(errs[k]));
          host.appendChild(p);
        }
      });
    }
    function setStatus(html) { var s = form.querySelector('[aria-live="polite"]'); s.innerHTML = html; if (html) s.focus(); }
    function styleChoices(name) {
      form.querySelectorAll('input[name="' + name + '"]').forEach(function (x) {
        var l = x.closest("label");
        ["border-blue", "bg-blue-50"].forEach(function (c) { l.classList.toggle(c, x.checked); });
        ["border-[#cdd8e8]", "bg-white"].forEach(function (c) { l.classList.toggle(c, !x.checked); });
      });
    }
    ["fullName", "email", "phone", "message"].forEach(function (k) {
      var c = el(k); if (!c) return;
      c.addEventListener("blur", function () { if (!c.value.trim()) return; touched[k] = true; render(validate(values())); });
      c.addEventListener("input", function () { if (touched[k] || submitted) render(validate(values())); });
    });
    el("consent").addEventListener("change", function () { touched.consent = true; render(validate(values())); });
    form.querySelectorAll('input[name="enquiryType"]').forEach(function (r) {
      r.addEventListener("change", function () { touched.enquiryType = true; styleChoices("enquiryType"); render(validate(values())); });
    });
    // Organisation name appears only for organisations (admissions)
    var orgTemplate = null;
    form.querySelectorAll('input[name="applicantType"]').forEach(function (r) {
      r.addEventListener("change", function () {
        touched.applicantType = true; styleChoices("applicantType");
        var fs = r.closest("fieldset");
        var existing = form.querySelector("#adm-organisationName");
        if (r.value === "Organisation" && r.checked && !existing) {
          var wrap = document.createElement("div");
          wrap.innerHTML = '<label for="adm-organisationName" class="font-semibold text-navy">Organisation Name<span aria-hidden="true" class="text-blue"> *</span></label><input id="adm-organisationName" name="organisationName" autocomplete="organization" maxlength="160" aria-required="true" class="mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-navy transition-[border-color,box-shadow] focus:outline-none focus-visible:outline-none focus:ring-4 border-[#cdd8e8] hover:border-body/50 focus:border-blue focus:ring-blue/15">';
          fs.parentNode.insertBefore(wrap, fs.nextSibling);
          var oc = wrap.querySelector("input");
          oc.addEventListener("blur", function () { if (!oc.value.trim()) return; touched.organisationName = true; render(validate(values())); });
          oc.addEventListener("input", function () { if (touched.organisationName || submitted) render(validate(values())); });
        } else if (r.value === "Individual" && r.checked && existing) existing.parentElement.remove();
        render(validate(values()));
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitted = true;
      var errs = validate(values());
      render(errs);
      var card = form.parentElement;
      var old = card.querySelector(".pv-summary"); if (old) old.remove();
      var keys = Object.keys(errs);
      if (keys.length) {
        var box = document.createElement("div");
        box.className = "pv-summary mt-5 rounded-xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900";
        box.setAttribute("role", "alert"); box.tabIndex = -1;
        box.innerHTML = '<p class="font-bold">Please correct the following:</p><ul class="mt-2 list-disc space-y-1 pl-5"></ul>';
        keys.forEach(function (k) {
          var li = document.createElement("li"), a = document.createElement("a");
          var target = k === "enquiryType" ? P + "type-0" : k === "applicantType" ? P + "applicant-0" : P + k;
          a.href = "#" + target; a.className = "underline"; a.textContent = LABELS[k] + ": " + errs[k];
          a.addEventListener("click", function (ev) { ev.preventDefault(); var t = form.querySelector("#" + target); t.focus(); t.scrollIntoView({ block: "center" }); });
          li.appendChild(a); box.querySelector("ul").appendChild(li);
        });
        card.insertBefore(box, form);
        setStatus(""); box.focus();
        return;
      }
      setStatus('<div role="alert" class="flex items-start gap-3 rounded-xl border border-amber-600/40 bg-amber-50 p-4 text-amber-950"><p><strong>Your enquiry was not sent.</strong> This is a website preview and online enquiries are not connected yet. Your details are still in the form.</p></div>');
    });
  });

  fromHash();
})();
