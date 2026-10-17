/**
 * AURELIA cart — localStorage backed
 */
(function () {
  const KEY = "aurelia_cart_v1";

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("aurelia:cart", { detail: items }));
    updateBadges();
  }

  function getProduct(id) {
    return (window.AURELIA_PRODUCTS || []).find((p) => p.id === id);
  }

  window.AureliaCart = {
    get() {
      return read();
    },
    count() {
      return read().reduce((n, i) => n + i.qty, 0);
    },
    subtotal() {
      return read().reduce((sum, i) => {
        const p = getProduct(i.id);
        return sum + (p ? p.price * i.qty : 0);
      }, 0);
    },
    add(id, qty) {
      qty = Math.max(1, Number(qty) || 1);
      const items = read();
      const existing = items.find((i) => i.id === id);
      if (existing) existing.qty += qty;
      else items.push({ id, qty });
      write(items);
      return items;
    },
    setQty(id, qty) {
      qty = Math.max(0, Number(qty) || 0);
      let items = read();
      if (qty <= 0) items = items.filter((i) => i.id !== id);
      else {
        const row = items.find((i) => i.id === id);
        if (row) row.qty = qty;
      }
      write(items);
      return items;
    },
    remove(id) {
      write(read().filter((i) => i.id !== id));
    },
    clear() {
      write([]);
    },
    lines() {
      return read()
        .map((i) => {
          const p = getProduct(i.id);
          if (!p) return null;
          return { ...p, qty: i.qty, lineTotal: p.price * i.qty };
        })
        .filter(Boolean);
    },
  };

  function updateBadges() {
    const n = window.AureliaCart.count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  document.addEventListener("DOMContentLoaded", updateBadges);
  window.addEventListener("aurelia:cart", updateBadges);
})();
