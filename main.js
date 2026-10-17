(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  // Mobile nav
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = qs(".nav-toggle");
    const mobile = qs(".mobile-nav");
    if (toggle && mobile) {
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        mobile.classList.toggle("is-open", !open);
      });
    }
  });

  function toast(msg) {
    let el = qs(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("is-show"), 2200);
  }

  window.AureliaUI = { toast };

  function productCard(p) {
    const price = window.AURELIA_FORMAT(p.price);
    const compare = p.compareAt
      ? `<span class="price-compare">${window.AURELIA_FORMAT(p.compareAt)}</span>`
      : "";
    const badge = p.badge ? `<span class="badge">${p.badge}</span>` : "";
    return `<article class="product-card">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="thumb">
        ${badge}
        <img src="${p.image}" alt="${p.name}" loading="lazy" width="600" height="600"/>
      </a>
      <div class="body">
        <p class="cat">${p.category}</p>
        <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3>
        <div class="price-row"><span class="price">${price}</span>${compare}</div>
        <button type="button" class="btn btn-ghost add-btn" data-add="${p.id}">Add to cart</button>
      </div>
    </article>`;
  }

  window.AureliaRender = {
    productCard,
    grid(products, mount) {
      if (!mount) return;
      mount.innerHTML = products.map(productCard).join("");
      mount.querySelectorAll("[data-add]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const id = btn.getAttribute("data-add");
          window.AureliaCart.add(id, 1);
          toast("Added to cart");
        });
      });
    },
  };

  // Shop page filters
  document.addEventListener("DOMContentLoaded", () => {
    const grid = qs("[data-product-grid]");
    if (!grid || !window.AURELIA_PRODUCTS) return;

    const params = new URLSearchParams(location.search);
    const catParam = params.get("cat");

    function show(cat) {
      const list = cat
        ? window.AURELIA_PRODUCTS.filter(
            (p) => p.category.toLowerCase() === cat.toLowerCase()
          )
        : window.AURELIA_PRODUCTS;
      window.AureliaRender.grid(list, grid);
      qsa(".cat-chip").forEach((chip) => {
        chip.classList.toggle(
          "is-active",
          (chip.dataset.cat || "") === (cat || "")
        );
      });
    }

    qsa(".cat-chip").forEach((chip) => {
      chip.addEventListener("click", () => show(chip.dataset.cat || ""));
    });

    show(catParam || "");
  });

  // Featured on home
  document.addEventListener("DOMContentLoaded", () => {
    const featured = qs("[data-featured-grid]");
    if (featured && window.AURELIA_PRODUCTS) {
      window.AureliaRender.grid(window.AURELIA_PRODUCTS.slice(0, 4), featured);
    }
  });

  // Product detail page
  document.addEventListener("DOMContentLoaded", () => {
    const root = qs("[data-pdp]");
    if (!root || !window.AURELIA_PRODUCTS) return;
    const id = new URLSearchParams(location.search).get("id");
    const p = window.AURELIA_PRODUCTS.find((x) => x.id === id) || window.AURELIA_PRODUCTS[0];
    if (!p) {
      root.innerHTML = "<p>Product not found.</p>";
      return;
    }
    document.title = p.name + " · AURELIA";
    const compare = p.compareAt
      ? `<span class="price-compare">${window.AURELIA_FORMAT(p.compareAt)}</span>`
      : "";
    root.innerHTML = `
      <div class="pdp-grid">
        <div class="pdp-gallery">
          <img src="${p.image}" alt="${p.name}" width="900" height="900"/>
        </div>
        <div class="pdp-info">
          <p class="cat">${p.category}${p.badge ? " · " + p.badge : ""}</p>
          <h1>${p.name}</h1>
          <p class="muted">${p.short}</p>
          <div class="price-row">
            <span class="price">${window.AURELIA_FORMAT(p.price)}</span>
            ${compare}
          </div>
          <p>${p.description}</p>
          <div class="pdp-meta">
            <div><strong>Size:</strong> ${p.size}</div>
            <div><strong>Skin:</strong> ${p.skin}</div>
            <div><strong>Key ingredients:</strong> ${p.ingredients}</div>
          </div>
          <div class="qty-row">
            <div class="qty-control">
              <button type="button" data-qty-minus aria-label="Decrease">−</button>
              <input type="number" id="pdp-qty" value="1" min="1" max="20"/>
              <button type="button" data-qty-plus aria-label="Increase">+</button>
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block" id="pdp-add">Add to cart</button>
          <p class="muted" style="margin-top:1rem;font-size:.85rem">Free delivery in Lagos on orders over ₦40,000 · Ships nationwide</p>
        </div>
      </div>`;
    const qtyInput = qs("#pdp-qty");
    qs("[data-qty-minus]").addEventListener("click", () => {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    qs("[data-qty-plus]").addEventListener("click", () => {
      qtyInput.value = Math.min(20, Number(qtyInput.value) + 1);
    });
    qs("#pdp-add").addEventListener("click", () => {
      window.AureliaCart.add(p.id, Number(qtyInput.value) || 1);
      toast("Added to cart");
    });
  });

  // Cart page
  document.addEventListener("DOMContentLoaded", () => {
    const mount = qs("[data-cart-page]");
    if (!mount) return;

    function render() {
      const lines = window.AureliaCart.lines();
      if (!lines.length) {
        mount.innerHTML = `<div class="empty-cart">
          <h2>Your bag is empty</h2>
          <p class="muted" style="margin-bottom:1.5rem">Discover serums, oils, and daily essentials.</p>
          <a class="btn btn-primary" href="shop.html">Shop products</a>
        </div>`;
        return;
      }
      const rows = lines
        .map(
          (l) => `<div class="cart-line" data-id="${l.id}">
          <a href="product.html?id=${l.id}"><img src="${l.image}" alt="${l.name}"/></a>
          <div>
            <h3><a href="product.html?id=${l.id}">${l.name}</a></h3>
            <p class="muted">${window.AURELIA_FORMAT(l.price)} each</p>
            <div class="qty-control" style="margin-top:.6rem">
              <button type="button" data-dec>−</button>
              <input type="number" value="${l.qty}" min="1" max="20" data-qty/>
              <button type="button" data-inc>+</button>
            </div>
            <button type="button" class="remove" data-remove>Remove</button>
          </div>
          <div class="price">${window.AURELIA_FORMAT(l.lineTotal)}</div>
        </div>`
        )
        .join("");
      const sub = window.AureliaCart.subtotal();
      const shipping = sub >= 40000 ? 0 : 2500;
      const total = sub + shipping;
      mount.innerHTML = `<div class="cart-layout">
        <div>${rows}</div>
        <aside class="cart-summary">
          <h2>Order summary</h2>
          <div class="summary-row"><span>Subtotal</span><span>${window.AURELIA_FORMAT(sub)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : window.AURELIA_FORMAT(shipping)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${window.AURELIA_FORMAT(total)}</span></div>
          <a class="btn btn-primary btn-block" style="margin-top:1.25rem" href="checkout.html">Checkout</a>
          <a class="btn btn-ghost btn-block" style="margin-top:.75rem" href="shop.html">Continue shopping</a>
        </aside>
      </div>`;

      mount.querySelectorAll(".cart-line").forEach((row) => {
        const id = row.getAttribute("data-id");
        row.querySelector("[data-dec]").addEventListener("click", () => {
          const q = Number(row.querySelector("[data-qty]").value) - 1;
          window.AureliaCart.setQty(id, q);
          render();
        });
        row.querySelector("[data-inc]").addEventListener("click", () => {
          const q = Number(row.querySelector("[data-qty]").value) + 1;
          window.AureliaCart.setQty(id, q);
          render();
        });
        row.querySelector("[data-qty]").addEventListener("change", (e) => {
          window.AureliaCart.setQty(id, e.target.value);
          render();
        });
        row.querySelector("[data-remove]").addEventListener("click", () => {
          window.AureliaCart.remove(id);
          render();
        });
      });
    }

    render();
    window.addEventListener("aurelia:cart", render);
  });

  // Checkout
  document.addEventListener("DOMContentLoaded", () => {
    const form = qs("#checkout-form");
    const summary = qs("[data-checkout-summary]");
    if (!summary) return;

    function renderSummary() {
      const lines = window.AureliaCart.lines();
      if (!lines.length) {
        summary.innerHTML = `<p class="muted">Your bag is empty. <a href="shop.html" style="color:var(--gold)">Shop now</a></p>`;
        if (form) form.querySelector('[type="submit"]').disabled = true;
        return;
      }
      const sub = window.AureliaCart.subtotal();
      const shipping = sub >= 40000 ? 0 : 2500;
      const total = sub + shipping;
      summary.innerHTML = `
        <div class="order-lines">${lines
          .map(
            (l) => `<div class="order-line"><span class="name">${l.name} × ${l.qty}</span><span>${window.AURELIA_FORMAT(l.lineTotal)}</span></div>`
          )
          .join("")}</div>
        <div class="summary-row"><span>Subtotal</span><span>${window.AURELIA_FORMAT(sub)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : window.AURELIA_FORMAT(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${window.AURELIA_FORMAT(total)}</span></div>`;
    }

    renderSummary();
    window.addEventListener("aurelia:cart", renderSummary);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!window.AureliaCart.lines().length) return;
        const fd = new FormData(form);
        const orderId = "AR-" + Date.now().toString(36).toUpperCase();
        const payload = {
          orderId,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          address: fd.get("address"),
          city: fd.get("city"),
          state: fd.get("state"),
          notes: fd.get("notes"),
          payment: fd.get("payment"),
          items: window.AureliaCart.lines(),
          total: window.AureliaCart.subtotal() + (window.AureliaCart.subtotal() >= 40000 ? 0 : 2500),
          at: new Date().toISOString(),
        };
        try {
          localStorage.setItem("aurelia_last_order", JSON.stringify(payload));
        } catch (_) {}
        window.AureliaCart.clear();
        location.href = "success.html?order=" + encodeURIComponent(orderId);
      });
    }
  });

  // Success page
  document.addEventListener("DOMContentLoaded", () => {
    const el = qs("[data-order-id]");
    if (!el) return;
    const id = new URLSearchParams(location.search).get("order");
    if (id) el.textContent = id;
    try {
      const last = JSON.parse(localStorage.getItem("aurelia_last_order") || "null");
      const detail = qs("[data-order-detail]");
      if (last && detail) {
        detail.innerHTML = `<p class="muted">We'll contact <strong style="color:var(--text)">${last.name || ""}</strong> on ${last.phone || last.email || ""} about delivery.</p>
        <p style="margin-top:1rem">Total paid (demo): <strong style="color:var(--gold)">${window.AURELIA_FORMAT(last.total || 0)}</strong></p>`;
      }
    } catch (_) {}
  });
})();
