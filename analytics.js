/* Google Analytics 4 + Microsoft Clarity.
   Paste the two IDs below. Nothing loads while an ID is empty, or when the
   site runs locally, so testing doesn't pollute the stats.
   What these tools collect is described in privacy.html — keep it in sync. */
(function () {
  var GA_ID = "";        // e.g. "G-XXXXXXXXXX" (GA → Admin → Data streams)
  var CLARITY_ID = "";   // e.g. "abcd1234ef" (Clarity → Settings → Overview)

  var host = location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1" || /\.local(host)?$/.test(host)) return;

  if (GA_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  if (CLARITY_ID) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    var c = document.createElement("script");
    c.async = true;
    c.src = "https://www.clarity.ms/tag/" + encodeURIComponent(CLARITY_ID);
    document.head.appendChild(c);
  }
})();
