let products = window.FITARO_PRODUCTS || [];
let selected;

const $ = x => document.getElementById(x);

/*
  مسارات الصور:
  GitHub Pages:
  /fitaro/public/suits/navy.jpg

  Vercel:
  /suits/navy.jpg
*/
function imagePath(image) {
  if (!image) return "";

  // تنظيف المسار مهما كان مكتوب في products.js
  let clean = String(image)
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .replace(/^fitaro\/public\//i, "")
    .replace(/^fitaro\//i, "")
    .replace(/^public\//i, "");

  // لو المسار بدأ بـ suits/ نتركه كما هو
  if (!clean.startsWith("suits/")) {
    clean = "suits/" + clean;
  }

  // GitHub Pages
  if (location.hostname.includes("github.io")) {
    return "/fitaro/public/" + clean;
  }

  // Vercel وأي استضافة يكون public فيها هو الجذر
  return "/" + clean;
}

async function init() {
  selected = products[0];

  render();

  if (location.protocol === "file:") {
    err("أنت فاتح الصفحة من الجهاز مباشرة. افتح الموقع من GitHub أو Vercel.");
  }
}

function render() {
  const suits = $("suits");

  if (!suits) return;

  suits.innerHTML = products.map(p => `
    <article
      class="suit ${p.id === selected.id ? "active" : ""}"
      data-id="${p.id}"
    >
      <img
        src="${imagePath(p.image)}"
        alt="${p.name}"
        onerror="this.style.display='none';"
      >

      <b>${p.name}</b>
      <small>${p.fit}</small>
    </article>
  `).join("");

  document.querySelectorAll(".suit").forEach(e => {
    e.onclick = () => {
      selected = products.find(p => p.id === e.dataset.id);
      render();
    };
  });
}

if ($("person")) {
  $("person").onchange = e => {
    const f = e.target.files[0];

    if (f) {
      $("preview").src = URL.createObjectURL(f);
      $("preview").style.display = "block";
    }
  };
}

function err(t) {
  if (!$("error")) return;

  $("error").textContent = t;
  $("error").classList.remove("hidden");
}

function clear() {
  if ($("error")) {
    $("error").classList.add("hidden");
  }
}

if ($("recommend")) {
  $("recommend").onclick = async () => {
    clear();

    try {
      const r = await fetch("api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          gender: $("gender").value,
          height: +$("height").value,
          weight: +$("weight").value,
          occasion: $("occasion").value,
          products
        })
      });

      const d = await r.json();

      if (!r.ok) {
        throw Error(d.error || "حدث خطأ في التوصية");
      }

      $("rec").innerHTML = `
        <b>${d.headline}</b><br>
        المقاس: <strong>${d.size}</strong> — ${d.fit}<br>
        ${d.text}
      `;

      $("rec").classList.remove("hidden");

    } catch (e) {
      err(e.message);
    }
  };
}

async function tryon() {
  clear();

  const f = $("person").files[0];

  if (!f) {
    return err("ارفع صورة الشخص أولاً.");
  }

  $("loading").classList.remove("hidden");
  $("empty").classList.add("hidden");
  $("result").classList.add("hidden");
  $("again").classList.add("hidden");
  $("tryon").disabled = true;

  try {
    const b = await resize(f);

    const fd = new FormData();

    fd.append("personImage", b, "person.jpg");
    fd.append("suitId", selected.id);

    const r = await fetch("api/tryon", {
      method: "POST",
      body: fd
    });

    const d = await r.json();

    if (!r.ok || !d.success) {
      throw Error(d.error || "حدث خطأ أثناء تجربة البدلة");
    }

    $("result").src = d.imageUrl;
    $("result").classList.remove("hidden");
    $("again").classList.remove("hidden");

  } catch (e) {
    err(e.message);
    $("empty").classList.remove("hidden");

  } finally {
    $("loading").classList.add("hidden");
    $("tryon").disabled = false;
  }
}

function resize(file) {
  return new Promise((ok, no) => {

    const i = new Image();
    const u = URL.createObjectURL(file);

    i.onload = () => {

      const s = Math.min(
        1,
        1600 / Math.max(i.width, i.height)
      );

      const c = document.createElement("canvas");

      c.width = i.width * s;
      c.height = i.height * s;

      c.getContext("2d").drawImage(
        i,
        0,
        0,
        c.width,
        c.height
      );

      c.toBlob(b => {

        URL.revokeObjectURL(u);

        b
          ? ok(b)
          : no(Error("تعذر تجهيز الصورة"));

      }, "image/jpeg", 0.82);
    };

    i.onerror = () => {
      URL.revokeObjectURL(u);
      no(Error("الصورة غير صالحة"));
    };

    i.src = u;
  });
}

if ($("tryon")) {
  $("tryon").onclick = tryon;
}

if ($("again")) {
  $("again").onclick = tryon;
}

if ($("send")) {
  $("send").onclick = async () => {

    const q = $("question").value.trim();

    if (!q) return;

    $("messages").innerHTML += `
      <div class="bubble user">${esc(q)}</div>
    `;

    $("question").value = "";

    try {

      const ms = [
        ...document.querySelectorAll("#messages .bubble")
      ].map(b => ({
        role: b.classList.contains("user")
          ? "user"
          : "assistant",
        content: b.textContent
      }));

      const r = await fetch("api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: ms,
          products
        })
      });

      const d = await r.json();

      if (!r.ok) {
        throw Error(d.error || "حدث خطأ في المساعد");
      }

      $("messages").innerHTML += `
        <div class="bubble ai">${esc(d.text)}</div>
      `;

    } catch (e) {

      $("messages").innerHTML += `
        <div class="bubble ai">
          حصلت مشكلة: ${esc(e.message)}
        </div>
      `;
    }
  };
}

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}

init();
