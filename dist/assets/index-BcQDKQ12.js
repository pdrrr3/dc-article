(async () => {
  (function() {
    const t = document.createElement("link").relList;
    if (t && t.supports && t.supports("modulepreload")) return;
    for (const o of document.querySelectorAll('link[rel="modulepreload"]')) s(o);
    new MutationObserver((o) => {
      for (const r of o) if (r.type === "childList") for (const a of r.addedNodes) a.tagName === "LINK" && a.rel === "modulepreload" && s(a);
    }).observe(document, {
      childList: true,
      subtree: true
    });
    function n(o) {
      const r = {};
      return o.integrity && (r.integrity = o.integrity), o.referrerPolicy && (r.referrerPolicy = o.referrerPolicy), o.crossOrigin === "use-credentials" ? r.credentials = "include" : o.crossOrigin === "anonymous" ? r.credentials = "omit" : r.credentials = "same-origin", r;
    }
    function s(o) {
      if (o.ep) return;
      o.ep = true;
      const r = n(o);
      fetch(o.href, r);
    }
  })();
  const rr = false, or = (e, t) => e === t, ye = Symbol("solid-proxy"), sr = typeof Proxy == "function", St = Symbol("solid-track"), ut = {
    equals: or
  };
  let wn = Mn;
  const De = 1, dt = 2, $n = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  var te = null;
  let Pt = null, ar = null, Z = null, ae = null, $e = null, $t = 0;
  function it(e, t) {
    const n = Z, s = te, o = e.length === 0, r = t === void 0 ? s : t, a = o ? $n : {
      owned: null,
      cleanups: null,
      context: r ? r.context : null,
      owner: r
    }, i = o ? e : () => e(() => he(() => Ye(a)));
    te = a, Z = null;
    try {
      return He(i, true);
    } finally {
      Z = n, te = s;
    }
  }
  function G(e, t) {
    t = t ? Object.assign({}, ut, t) : ut;
    const n = {
      value: e,
      observers: null,
      observerSlots: null,
      comparator: t.equals || void 0
    }, s = (o) => (typeof o == "function" && (o = o(n.value)), Pn(n, o));
    return [
      kn.bind(n),
      s
    ];
  }
  function F(e, t, n) {
    const s = Ft(e, t, false, De);
    Qe(s);
  }
  function Rt(e, t, n) {
    wn = ur;
    const s = Ft(e, t, false, De);
    s.user = true, $e ? $e.push(s) : Qe(s);
  }
  function ne(e, t, n) {
    n = n ? Object.assign({}, ut, n) : ut;
    const s = Ft(e, t, true, 0);
    return s.observers = null, s.observerSlots = null, s.comparator = n.equals || void 0, Qe(s), kn.bind(s);
  }
  function ir(e) {
    return He(e, false);
  }
  function he(e) {
    if (Z === null) return e();
    const t = Z;
    Z = null;
    try {
      return e();
    } finally {
      Z = t;
    }
  }
  function je(e) {
    Rt(() => he(e));
  }
  function Pe(e) {
    return te === null || (te.cleanups === null ? te.cleanups = [
      e
    ] : te.cleanups.push(e)), e;
  }
  function Dt() {
    return Z;
  }
  function kn() {
    if (this.sources && this.state) if (this.state === De) Qe(this);
    else {
      const e = ae;
      ae = null, He(() => mt(this), false), ae = e;
    }
    if (Z) {
      const e = this.observers ? this.observers.length : 0;
      Z.sources ? (Z.sources.push(this), Z.sourceSlots.push(e)) : (Z.sources = [
        this
      ], Z.sourceSlots = [
        e
      ]), this.observers ? (this.observers.push(Z), this.observerSlots.push(Z.sources.length - 1)) : (this.observers = [
        Z
      ], this.observerSlots = [
        Z.sources.length - 1
      ]);
    }
    return this.value;
  }
  function Pn(e, t, n) {
    let s = e.value;
    return (!e.comparator || !e.comparator(s, t)) && (e.value = t, e.observers && e.observers.length && He(() => {
      for (let o = 0; o < e.observers.length; o += 1) {
        const r = e.observers[o], a = Pt && Pt.running;
        a && Pt.disposed.has(r), (a ? !r.tState : !r.state) && (r.pure ? ae.push(r) : $e.push(r), r.observers && An(r)), a || (r.state = De);
      }
      if (ae.length > 1e6) throw ae = [], new Error();
    }, false)), t;
  }
  function Qe(e) {
    if (!e.fn) return;
    Ye(e);
    const t = $t;
    lr(e, e.value, t);
  }
  function lr(e, t, n) {
    let s;
    const o = te, r = Z;
    Z = te = e;
    try {
      s = e.fn(t);
    } catch (a) {
      return e.pure && (e.state = De, e.owned && e.owned.forEach(Ye), e.owned = null), e.updatedAt = n + 1, Cn(a);
    } finally {
      Z = r, te = o;
    }
    (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Pn(e, s) : e.value = s, e.updatedAt = n);
  }
  function Ft(e, t, n, s = De, o) {
    const r = {
      fn: e,
      state: s,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: t,
      owner: te,
      context: te ? te.context : null,
      pure: n
    };
    return te === null || te !== $n && (te.owned ? te.owned.push(r) : te.owned = [
      r
    ]), r;
  }
  function ft(e) {
    if (e.state === 0) return;
    if (e.state === dt) return mt(e);
    if (e.suspense && he(e.suspense.inFallback)) return e.suspense.effects.push(e);
    const t = [
      e
    ];
    for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < $t); ) e.state && t.push(e);
    for (let n = t.length - 1; n >= 0; n--) if (e = t[n], e.state === De) Qe(e);
    else if (e.state === dt) {
      const s = ae;
      ae = null, He(() => mt(e, t[0]), false), ae = s;
    }
  }
  function He(e, t) {
    if (ae) return e();
    let n = false;
    t || (ae = []), $e ? n = true : $e = [], $t++;
    try {
      const s = e();
      return cr(n), s;
    } catch (s) {
      n || ($e = null), ae = null, Cn(s);
    }
  }
  function cr(e) {
    if (ae && (Mn(ae), ae = null), e) return;
    const t = $e;
    $e = null, t.length && He(() => wn(t), false);
  }
  function Mn(e) {
    for (let t = 0; t < e.length; t++) ft(e[t]);
  }
  function ur(e) {
    let t, n = 0;
    for (t = 0; t < e.length; t++) {
      const s = e[t];
      s.user ? e[n++] = s : ft(s);
    }
    for (t = 0; t < n; t++) ft(e[t]);
  }
  function mt(e, t) {
    e.state = 0;
    for (let n = 0; n < e.sources.length; n += 1) {
      const s = e.sources[n];
      if (s.sources) {
        const o = s.state;
        o === De ? s !== t && (!s.updatedAt || s.updatedAt < $t) && ft(s) : o === dt && mt(s, t);
      }
    }
  }
  function An(e) {
    for (let t = 0; t < e.observers.length; t += 1) {
      const n = e.observers[t];
      n.state || (n.state = dt, n.pure ? ae.push(n) : $e.push(n), n.observers && An(n));
    }
  }
  function Ye(e) {
    let t;
    if (e.sources) for (; e.sources.length; ) {
      const n = e.sources.pop(), s = e.sourceSlots.pop(), o = n.observers;
      if (o && o.length) {
        const r = o.pop(), a = n.observerSlots.pop();
        s < o.length && (r.sourceSlots[a] = s, o[s] = r, n.observerSlots[s] = a);
      }
    }
    if (e.tOwned) {
      for (t = e.tOwned.length - 1; t >= 0; t--) Ye(e.tOwned[t]);
      delete e.tOwned;
    }
    if (e.owned) {
      for (t = e.owned.length - 1; t >= 0; t--) Ye(e.owned[t]);
      e.owned = null;
    }
    if (e.cleanups) {
      for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
      e.cleanups = null;
    }
    e.state = 0;
  }
  function dr(e) {
    return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
      cause: e
    });
  }
  function Cn(e, t = te) {
    throw dr(e);
  }
  const fr = Symbol("fallback");
  function Zt(e) {
    for (let t = 0; t < e.length; t++) e[t]();
  }
  function mr(e, t, n = {}) {
    let s = [], o = [], r = [], a = 0, i = t.length > 1 ? [] : null;
    return Pe(() => Zt(r)), () => {
      let l = e() || [], c = l.length, d, u;
      return l[St], he(() => {
        let k, A, C, S, P, v, M, y, T;
        if (c === 0) a !== 0 && (Zt(r), r = [], s = [], o = [], a = 0, i && (i = [])), n.fallback && (s = [
          fr
        ], o[0] = it((f) => (r[0] = f, n.fallback())), a = 1);
        else if (a === 0) {
          for (o = new Array(c), u = 0; u < c; u++) s[u] = l[u], o[u] = it(b);
          a = c;
        } else {
          for (C = new Array(c), S = new Array(c), i && (P = new Array(c)), v = 0, M = Math.min(a, c); v < M && s[v] === l[v]; v++) ;
          for (M = a - 1, y = c - 1; M >= v && y >= v && s[M] === l[y]; M--, y--) C[y] = o[M], S[y] = r[M], i && (P[y] = i[M]);
          for (k = /* @__PURE__ */ new Map(), A = new Array(y + 1), u = y; u >= v; u--) T = l[u], d = k.get(T), A[u] = d === void 0 ? -1 : d, k.set(T, u);
          for (d = v; d <= M; d++) T = s[d], u = k.get(T), u !== void 0 && u !== -1 ? (C[u] = o[d], S[u] = r[d], i && (P[u] = i[d]), u = A[u], k.set(T, u)) : r[d]();
          for (u = v; u < c; u++) u in C ? (o[u] = C[u], r[u] = S[u], i && (i[u] = P[u], i[u](u))) : o[u] = it(b);
          o = o.slice(0, a = c), s = l.slice(0);
        }
        return o;
      });
      function b(k) {
        if (r[u] = k, i) {
          const [A, C] = G(u);
          return i[u] = C, t(l[u], A);
        }
        return t(l[u]);
      }
    };
  }
  function x(e, t) {
    return he(() => e(t || {}));
  }
  function tt() {
    return true;
  }
  const Qt = {
    get(e, t, n) {
      return t === ye ? n : e.get(t);
    },
    has(e, t) {
      return t === ye ? true : e.has(t);
    },
    set: tt,
    deleteProperty: tt,
    getOwnPropertyDescriptor(e, t) {
      return {
        configurable: true,
        enumerable: true,
        get() {
          return e.get(t);
        },
        set: tt,
        deleteProperty: tt
      };
    },
    ownKeys(e) {
      return e.keys();
    }
  };
  function hr(e, ...t) {
    const n = t.length;
    if (sr && ye in e) {
      const o = n > 1 ? t.flat() : t[0], r = t.map((a) => new Proxy({
        get(i) {
          return a.includes(i) ? e[i] : void 0;
        },
        has(i) {
          return a.includes(i) && i in e;
        },
        keys() {
          return a.filter((i) => i in e);
        }
      }, Qt));
      return r.push(new Proxy({
        get(a) {
          return o.includes(a) ? void 0 : e[a];
        },
        has(a) {
          return o.includes(a) ? false : a in e;
        },
        keys() {
          return Object.keys(e).filter((a) => !o.includes(a));
        }
      }, Qt)), r;
    }
    const s = [];
    for (let o = 0; o <= n; o++) s[o] = {};
    for (const o of Object.getOwnPropertyNames(e)) {
      let r = n;
      for (let l = 0; l < t.length; l++) if (t[l].includes(o)) {
        r = l;
        break;
      }
      const a = Object.getOwnPropertyDescriptor(e, o);
      !a.get && !a.set && a.enumerable && a.writable && a.configurable ? s[r][o] = a.value : Object.defineProperty(s[r], o, a);
    }
    return s;
  }
  const gr = (e) => `Stale read from <${e}>.`;
  function z(e) {
    const t = "fallback" in e && {
      fallback: () => e.fallback
    };
    return ne(mr(() => e.each, e.children, t || void 0));
  }
  function j(e) {
    const t = e.keyed, n = ne(() => e.when, void 0, void 0), s = t ? n : ne(n, void 0, {
      equals: (o, r) => !o == !r
    });
    return ne(() => {
      const o = s();
      if (o) {
        const r = e.children;
        return typeof r == "function" && r.length > 0 ? he(() => r(t ? o : () => {
          if (!he(s)) throw gr("Show");
          return n();
        })) : r;
      }
      return e.fallback;
    }, void 0, void 0);
  }
  const pr = [
    "allowfullscreen",
    "async",
    "alpha",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "disabled",
    "formnovalidate",
    "hidden",
    "indeterminate",
    "inert",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "seamless",
    "selected",
    "adauctionheaders",
    "browsingtopics",
    "credentialless",
    "defaultchecked",
    "defaultmuted",
    "defaultselected",
    "defer",
    "disablepictureinpicture",
    "disableremoteplayback",
    "preservespitch",
    "shadowrootclonable",
    "shadowrootcustomelementregistry",
    "shadowrootdelegatesfocus",
    "shadowrootserializable",
    "sharedstoragewritable"
  ], vr = /* @__PURE__ */ new Set([
    "className",
    "value",
    "readOnly",
    "noValidate",
    "formNoValidate",
    "isMap",
    "noModule",
    "playsInline",
    "adAuctionHeaders",
    "allowFullscreen",
    "browsingTopics",
    "defaultChecked",
    "defaultMuted",
    "defaultSelected",
    "disablePictureInPicture",
    "disableRemotePlayback",
    "preservesPitch",
    "shadowRootClonable",
    "shadowRootCustomElementRegistry",
    "shadowRootDelegatesFocus",
    "shadowRootSerializable",
    "sharedStorageWritable",
    ...pr
  ]), yr = /* @__PURE__ */ new Set([
    "innerHTML",
    "textContent",
    "innerText",
    "children"
  ]), _r = Object.assign(/* @__PURE__ */ Object.create(null), {
    className: "class",
    htmlFor: "for"
  }), br = Object.assign(/* @__PURE__ */ Object.create(null), {
    class: "className",
    novalidate: {
      $: "noValidate",
      FORM: 1
    },
    formnovalidate: {
      $: "formNoValidate",
      BUTTON: 1,
      INPUT: 1
    },
    ismap: {
      $: "isMap",
      IMG: 1
    },
    nomodule: {
      $: "noModule",
      SCRIPT: 1
    },
    playsinline: {
      $: "playsInline",
      VIDEO: 1
    },
    readonly: {
      $: "readOnly",
      INPUT: 1,
      TEXTAREA: 1
    },
    adauctionheaders: {
      $: "adAuctionHeaders",
      IFRAME: 1
    },
    allowfullscreen: {
      $: "allowFullscreen",
      IFRAME: 1
    },
    browsingtopics: {
      $: "browsingTopics",
      IMG: 1
    },
    defaultchecked: {
      $: "defaultChecked",
      INPUT: 1
    },
    defaultmuted: {
      $: "defaultMuted",
      AUDIO: 1,
      VIDEO: 1
    },
    defaultselected: {
      $: "defaultSelected",
      OPTION: 1
    },
    disablepictureinpicture: {
      $: "disablePictureInPicture",
      VIDEO: 1
    },
    disableremoteplayback: {
      $: "disableRemotePlayback",
      AUDIO: 1,
      VIDEO: 1
    },
    preservespitch: {
      $: "preservesPitch",
      AUDIO: 1,
      VIDEO: 1
    },
    shadowrootclonable: {
      $: "shadowRootClonable",
      TEMPLATE: 1
    },
    shadowrootdelegatesfocus: {
      $: "shadowRootDelegatesFocus",
      TEMPLATE: 1
    },
    shadowrootserializable: {
      $: "shadowRootSerializable",
      TEMPLATE: 1
    },
    sharedstoragewritable: {
      $: "sharedStorageWritable",
      IFRAME: 1,
      IMG: 1
    }
  });
  function xr(e, t) {
    const n = br[e];
    return typeof n == "object" ? n[t] ? n.$ : void 0 : n;
  }
  const wr = /* @__PURE__ */ new Set([
    "beforeinput",
    "click",
    "dblclick",
    "contextmenu",
    "focusin",
    "focusout",
    "input",
    "keydown",
    "keyup",
    "mousedown",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "pointerdown",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup",
    "touchend",
    "touchmove",
    "touchstart"
  ]), $r = /* @__PURE__ */ new Set([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "foreignObject",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "set",
    "stop",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern"
  ]), kr = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace"
  }, me = (e) => ne(() => e());
  function Pr(e, t, n) {
    let s = n.length, o = t.length, r = s, a = 0, i = 0, l = t[o - 1].nextSibling, c = null;
    for (; a < o || i < r; ) {
      if (t[a] === n[i]) {
        a++, i++;
        continue;
      }
      for (; t[o - 1] === n[r - 1]; ) o--, r--;
      if (o === a) {
        const d = r < s ? i ? n[i - 1].nextSibling : n[r - i] : l;
        for (; i < r; ) e.insertBefore(n[i++], d);
      } else if (r === i) for (; a < o; ) (!c || !c.has(t[a])) && t[a].remove(), a++;
      else if (t[a] === n[r - 1] && n[i] === t[o - 1]) {
        const d = t[--o].nextSibling;
        e.insertBefore(n[i++], t[a++].nextSibling), e.insertBefore(n[--r], d), t[o] = n[r];
      } else {
        if (!c) {
          c = /* @__PURE__ */ new Map();
          let u = i;
          for (; u < r; ) c.set(n[u], u++);
        }
        const d = c.get(t[a]);
        if (d != null) if (i < d && d < r) {
          let u = a, b = 1, k;
          for (; ++u < o && u < r && !((k = c.get(t[u])) == null || k !== d + b); ) b++;
          if (b > d - i) {
            const A = t[a];
            for (; i < d; ) e.insertBefore(n[i++], A);
          } else e.replaceChild(n[i++], t[a++]);
        } else a++;
        else t[a++].remove();
      }
    }
  }
  const en = "_$DX_DELEGATE";
  function Mr(e, t, n, s = {}) {
    let o;
    return it((r) => {
      o = r, t === document ? e() : p(t, e(), t.firstChild ? null : void 0, n);
    }, s.owner), () => {
      o(), t.textContent = "";
    };
  }
  function E(e, t, n, s) {
    let o;
    const r = () => {
      const i = s ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
      return i.innerHTML = e, n ? i.content.firstChild.firstChild : s ? i.firstChild : i.content.firstChild;
    }, a = t ? () => he(() => document.importNode(o || (o = r()), true)) : () => (o || (o = r())).cloneNode(true);
    return a.cloneNode = a, a;
  }
  function _e(e, t = window.document) {
    const n = t[en] || (t[en] = /* @__PURE__ */ new Set());
    for (let s = 0, o = e.length; s < o; s++) {
      const r = e[s];
      n.has(r) || (n.add(r), t.addEventListener(r, Er));
    }
  }
  function D(e, t, n) {
    n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
  }
  function Ar(e, t, n, s) {
    s == null ? e.removeAttributeNS(t, n) : e.setAttributeNS(t, n, s);
  }
  function Cr(e, t, n) {
    n ? e.setAttribute(t, "") : e.removeAttribute(t);
  }
  function ke(e, t) {
    t == null ? e.removeAttribute("class") : e.className = t;
  }
  function Ie(e, t, n, s) {
    if (s) Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
    else if (Array.isArray(n)) {
      const o = n[0];
      e.addEventListener(t, n[0] = (r) => o.call(e, n[1], r));
    } else e.addEventListener(t, n, typeof n != "function" && n);
  }
  function It(e, t, n = {}) {
    const s = Object.keys(t || {}), o = Object.keys(n);
    let r, a;
    for (r = 0, a = o.length; r < a; r++) {
      const i = o[r];
      !i || i === "undefined" || t[i] || (tn(e, i, false), delete n[i]);
    }
    for (r = 0, a = s.length; r < a; r++) {
      const i = s[r], l = !!t[i];
      !i || i === "undefined" || n[i] === l || !l || (tn(e, i, true), n[i] = l);
    }
    return n;
  }
  function K(e, t, n) {
    if (!t) return n ? D(e, "style") : t;
    const s = e.style;
    if (typeof t == "string") return s.cssText = t;
    typeof n == "string" && (s.cssText = n = void 0), n || (n = {}), t || (t = {});
    let o, r;
    for (r in n) t[r] == null && s.removeProperty(r), delete n[r];
    for (r in t) o = t[r], o !== n[r] && (s.setProperty(r, o), n[r] = o);
    return n;
  }
  function Sr(e, t = {}, n, s) {
    const o = {};
    return F(() => o.children = Ke(e, t.children, o.children)), F(() => typeof t.ref == "function" && qe(t.ref, e)), F(() => Dr(e, t, n, true, o, true)), o;
  }
  function qe(e, t, n) {
    return he(() => e(t, n));
  }
  function p(e, t, n, s) {
    if (n !== void 0 && !s && (s = []), typeof t != "function") return Ke(e, t, s, n);
    F((o) => Ke(e, t(), o, n), s);
  }
  function Dr(e, t, n, s, o = {}, r = false) {
    t || (t = {});
    for (const a in o) if (!(a in t)) {
      if (a === "children") continue;
      o[a] = nn(e, a, null, o[a], n, r, t);
    }
    for (const a in t) {
      if (a === "children") continue;
      const i = t[a];
      o[a] = nn(e, a, i, o[a], n, r, t);
    }
  }
  function Tr(e) {
    return e.toLowerCase().replace(/-([a-z])/g, (t, n) => n.toUpperCase());
  }
  function tn(e, t, n) {
    const s = t.trim().split(/\s+/);
    for (let o = 0, r = s.length; o < r; o++) e.classList.toggle(s[o], n);
  }
  function nn(e, t, n, s, o, r, a) {
    let i, l, c, d, u;
    if (t === "style") return K(e, n, s);
    if (t === "classList") return It(e, n, s);
    if (n === s) return s;
    if (t === "ref") r || n(e);
    else if (t.slice(0, 3) === "on:") {
      const b = t.slice(3);
      s && e.removeEventListener(b, s, typeof s != "function" && s), n && e.addEventListener(b, n, typeof n != "function" && n);
    } else if (t.slice(0, 10) === "oncapture:") {
      const b = t.slice(10);
      s && e.removeEventListener(b, s, true), n && e.addEventListener(b, n, true);
    } else if (t.slice(0, 2) === "on") {
      const b = t.slice(2).toLowerCase(), k = wr.has(b);
      if (!k && s) {
        const A = Array.isArray(s) ? s[0] : s;
        e.removeEventListener(b, A);
      }
      (k || n) && (Ie(e, b, n, k), k && _e([
        b
      ]));
    } else if (t.slice(0, 5) === "attr:") D(e, t.slice(5), n);
    else if (t.slice(0, 5) === "bool:") Cr(e, t.slice(5), n);
    else if ((u = t.slice(0, 5) === "prop:") || (c = yr.has(t)) || !o && ((d = xr(t, e.tagName)) || (l = vr.has(t))) || (i = e.nodeName.includes("-") || "is" in a)) u && (t = t.slice(5), l = true), t === "class" || t === "className" ? ke(e, n) : i && !l && !c ? e[Tr(t)] = n : e[d || t] = n;
    else {
      const b = o && t.indexOf(":") > -1 && kr[t.split(":")[0]];
      b ? Ar(e, b, t, n) : D(e, _r[t] || t, n);
    }
    return n;
  }
  function Er(e) {
    let t = e.target;
    const n = `$$${e.type}`, s = e.target, o = e.currentTarget, r = (l) => Object.defineProperty(e, "target", {
      configurable: true,
      value: l
    }), a = () => {
      const l = t[n];
      if (l && !t.disabled) {
        const c = t[`${n}Data`];
        if (c !== void 0 ? l.call(t, c, e) : l.call(t, e), e.cancelBubble) return;
      }
      return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && r(t.host), true;
    }, i = () => {
      for (; a() && (t = t._$host || t.parentNode || t.host); ) ;
    };
    if (Object.defineProperty(e, "currentTarget", {
      configurable: true,
      get() {
        return t || document;
      }
    }), e.composedPath) {
      const l = e.composedPath();
      r(l[0]);
      for (let c = 0; c < l.length - 2 && (t = l[c], !!a()); c++) {
        if (t._$host) {
          t = t._$host, i();
          break;
        }
        if (t.parentNode === o) break;
      }
    } else i();
    r(s);
  }
  function Ke(e, t, n, s, o) {
    for (; typeof n == "function"; ) n = n();
    if (t === n) return n;
    const r = typeof t, a = s !== void 0;
    if (e = a && n[0] && n[0].parentNode || e, r === "string" || r === "number") {
      if (r === "number" && (t = t.toString(), t === n)) return n;
      if (a) {
        let i = n[0];
        i && i.nodeType === 3 ? i.data !== t && (i.data = t) : i = document.createTextNode(t), n = Ne(e, n, s, i);
      } else n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
    } else if (t == null || r === "boolean") n = Ne(e, n, s);
    else {
      if (r === "function") return F(() => {
        let i = t();
        for (; typeof i == "function"; ) i = i();
        n = Ke(e, i, n, s);
      }), () => n;
      if (Array.isArray(t)) {
        const i = [], l = n && Array.isArray(n);
        if (Tt(i, t, n, o)) return F(() => n = Ke(e, i, n, s, true)), () => n;
        if (i.length === 0) {
          if (n = Ne(e, n, s), a) return n;
        } else l ? n.length === 0 ? rn(e, i, s) : Pr(e, n, i) : (n && Ne(e), rn(e, i));
        n = i;
      } else if (t.nodeType) {
        if (Array.isArray(n)) {
          if (a) return n = Ne(e, n, s, t);
          Ne(e, n, null, t);
        } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
        n = t;
      }
    }
    return n;
  }
  function Tt(e, t, n, s) {
    let o = false;
    for (let r = 0, a = t.length; r < a; r++) {
      let i = t[r], l = n && n[e.length], c;
      if (!(i == null || i === true || i === false)) if ((c = typeof i) == "object" && i.nodeType) e.push(i);
      else if (Array.isArray(i)) o = Tt(e, i, l) || o;
      else if (c === "function") if (s) {
        for (; typeof i == "function"; ) i = i();
        o = Tt(e, Array.isArray(i) ? i : [
          i
        ], Array.isArray(l) ? l : [
          l
        ]) || o;
      } else e.push(i), o = true;
      else {
        const d = String(i);
        l && l.nodeType === 3 && l.data === d ? e.push(l) : e.push(document.createTextNode(d));
      }
    }
    return o;
  }
  function rn(e, t, n = null) {
    for (let s = 0, o = t.length; s < o; s++) e.insertBefore(t[s], n);
  }
  function Ne(e, t, n, s) {
    if (n === void 0) return e.textContent = "";
    const o = s || document.createTextNode("");
    if (t.length) {
      let r = false;
      for (let a = t.length - 1; a >= 0; a--) {
        const i = t[a];
        if (o !== i) {
          const l = i.parentNode === e;
          !r && !a ? l ? e.replaceChild(o, i) : e.insertBefore(o, n) : l && i.remove();
        } else r = true;
      }
    } else e.insertBefore(o, n);
    return [
      o
    ];
  }
  const Lr = "http://www.w3.org/2000/svg";
  function Or(e, t = false, n = void 0) {
    return t ? document.createElementNS(Lr, e) : document.createElement(e, {
      is: n
    });
  }
  function qr(e, t) {
    const n = ne(e);
    return ne(() => {
      const s = n();
      switch (typeof s) {
        case "function":
          return he(() => s(t));
        case "string":
          const o = $r.has(s), r = Or(s, o, he(() => t.is));
          return Sr(r, t, o), r;
      }
    });
  }
  function Nr(e) {
    const [, t] = hr(e, [
      "component"
    ]);
    return qr(() => e.component, t);
  }
  const Et = Symbol("store-raw"), Fe = Symbol("store-node"), we = Symbol("store-has"), Sn = Symbol("store-self");
  function Dn(e) {
    let t = e[ye];
    if (!t && (Object.defineProperty(e, ye, {
      value: t = new Proxy(e, Ir)
    }), !Array.isArray(e))) {
      const n = Object.keys(e), s = Object.getOwnPropertyDescriptors(e);
      for (let o = 0, r = n.length; o < r; o++) {
        const a = n[o];
        s[a].get && Object.defineProperty(e, a, {
          enumerable: s[a].enumerable,
          get: s[a].get.bind(t)
        });
      }
    }
    return t;
  }
  function ht(e) {
    let t;
    return e != null && typeof e == "object" && (e[ye] || !(t = Object.getPrototypeOf(e)) || t === Object.prototype || Array.isArray(e));
  }
  function Je(e, t = /* @__PURE__ */ new Set()) {
    let n, s, o, r;
    if (n = e != null && e[Et]) return n;
    if (!ht(e) || t.has(e)) return e;
    if (Array.isArray(e)) {
      Object.isFrozen(e) ? e = e.slice(0) : t.add(e);
      for (let a = 0, i = e.length; a < i; a++) o = e[a], (s = Je(o, t)) !== o && (e[a] = s);
    } else {
      Object.isFrozen(e) ? e = Object.assign({}, e) : t.add(e);
      const a = Object.keys(e), i = Object.getOwnPropertyDescriptors(e);
      for (let l = 0, c = a.length; l < c; l++) r = a[l], !i[r].get && (o = e[r], (s = Je(o, t)) !== o && (e[r] = s));
    }
    return e;
  }
  function gt(e, t) {
    let n = e[t];
    return n || Object.defineProperty(e, t, {
      value: n = /* @__PURE__ */ Object.create(null)
    }), n;
  }
  function Ze(e, t, n) {
    if (e[t]) return e[t];
    const [s, o] = G(n, {
      equals: false,
      internal: true
    });
    return s.$ = o, e[t] = s;
  }
  function Rr(e, t) {
    const n = Reflect.getOwnPropertyDescriptor(e, t);
    return !n || n.get || !n.configurable || t === ye || t === Fe || (delete n.value, delete n.writable, n.get = () => e[ye][t]), n;
  }
  function Tn(e) {
    Dt() && Ze(gt(e, Fe), Sn)();
  }
  function Fr(e) {
    return Tn(e), Reflect.ownKeys(e);
  }
  const Ir = {
    get(e, t, n) {
      if (t === Et) return e;
      if (t === ye) return n;
      if (t === St) return Tn(e), n;
      const s = gt(e, Fe), o = s[t];
      let r = o ? o() : e[t];
      if (t === Fe || t === we || t === "__proto__") return r;
      if (!o) {
        const a = Object.getOwnPropertyDescriptor(e, t);
        Dt() && (typeof r != "function" || e.hasOwnProperty(t)) && !(a && a.get) && (r = Ze(s, t, r)());
      }
      return ht(r) ? Dn(r) : r;
    },
    has(e, t) {
      return t === Et || t === ye || t === St || t === Fe || t === we || t === "__proto__" ? true : (Dt() && Ze(gt(e, we), t)(), t in e);
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    ownKeys: Fr,
    getOwnPropertyDescriptor: Rr
  };
  function pt(e, t, n, s = false) {
    if (!s && e[t] === n) return;
    const o = e[t], r = e.length;
    n === void 0 ? (delete e[t], e[we] && e[we][t] && o !== void 0 && e[we][t].$()) : (e[t] = n, e[we] && e[we][t] && o === void 0 && e[we][t].$());
    let a = gt(e, Fe), i;
    if ((i = Ze(a, t, o)) && i.$(() => n), Array.isArray(e) && e.length !== r) {
      for (let l = e.length; l < r; l++) (i = a[l]) && i.$();
      (i = Ze(a, "length", r)) && i.$(e.length);
    }
    (i = a[Sn]) && i.$();
  }
  function En(e, t) {
    const n = Object.keys(t);
    for (let s = 0; s < n.length; s += 1) {
      const o = n[s];
      pt(e, o, t[o]);
    }
  }
  function jr(e, t) {
    if (typeof t == "function" && (t = t(e)), t = Je(t), Array.isArray(t)) {
      if (e === t) return;
      let n = 0, s = t.length;
      for (; n < s; n++) {
        const o = t[n];
        e[n] !== o && pt(e, n, o);
      }
      pt(e, "length", s);
    } else En(e, t);
  }
  function Ge(e, t, n = []) {
    let s, o = e;
    if (t.length > 1) {
      s = t.shift();
      const a = typeof s, i = Array.isArray(e);
      if (Array.isArray(s)) {
        for (let l = 0; l < s.length; l++) Ge(e, [
          s[l]
        ].concat(t), n);
        return;
      } else if (i && a === "function") {
        for (let l = 0; l < e.length; l++) s(e[l], l) && Ge(e, [
          l
        ].concat(t), n);
        return;
      } else if (i && a === "object") {
        const { from: l = 0, to: c = e.length - 1, by: d = 1 } = s;
        for (let u = l; u <= c; u += d) Ge(e, [
          u
        ].concat(t), n);
        return;
      } else if (t.length > 1) {
        Ge(e[s], t, [
          s
        ].concat(n));
        return;
      }
      o = e[s], n = [
        s
      ].concat(n);
    }
    let r = t[0];
    typeof r == "function" && (r = r(o, n), r === o) || s === void 0 && r == null || (r = Je(r), s === void 0 || ht(o) && ht(r) && !Array.isArray(r) ? En(o, r) : pt(e, s, r));
  }
  function Hr(...[e, t]) {
    const n = Je(e || {}), s = Array.isArray(n), o = Dn(n);
    function r(...a) {
      ir(() => {
        s && a.length === 1 ? jr(n, a[0]) : Ge(n, a);
      });
    }
    return [
      o,
      r
    ];
  }
  const on = 500, [_a, Wr] = G([]);
  function Oe(e, t) {
    const n = (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
    Wr((s) => {
      const o = [
        ...s,
        {
          ts: n,
          level: e,
          text: t
        }
      ];
      return o.length > on ? o.slice(o.length - on) : o;
    });
  }
  const [Y, be] = Hr({
    layers: {},
    bpm: 120,
    playing: false
  }), [ba, Gr] = G(false), [Br, Lt] = G(null), [jt, Ln] = G({}), [vt, Mt] = G(null), [sn, Ot] = G(null);
  let Ve = null;
  function Te(e, t) {
    Ot(e), Ve && clearTimeout(Ve), t && (Ve = setTimeout(() => Ot(null), t));
  }
  function On() {
    Ot(null), Ve && clearTimeout(Ve);
  }
  const [Vr, zr] = G([]), [Xr, Ur] = G([]), Yr = {
    oscillator: {
      inputs: [
        "pitch_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    lfo: {
      inputs: [
        "rate_cv",
        "sync"
      ],
      outputs: [
        "cv_out"
      ]
    },
    vca: {
      inputs: [
        "audio_in",
        "level_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    filter: {
      inputs: [
        "audio_in",
        "cutoff_cv",
        "res_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    adsr: {
      inputs: [
        "gate"
      ],
      outputs: [
        "cv_out"
      ]
    },
    mixer: {
      inputs: [
        "in_1",
        "in_2",
        "in_3",
        "in_4",
        "in_5",
        "in_6",
        "in_7",
        "in_8"
      ],
      outputs: [
        "audio_out"
      ]
    },
    cv_mixer: {
      inputs: [
        "cv_1",
        "cv_2",
        "cv_3",
        "cv_4"
      ],
      outputs: [
        "cv_out"
      ]
    },
    attenuverter: {
      inputs: [
        "cv_in"
      ],
      outputs: [
        "cv_out"
      ]
    },
    sample_hold: {
      inputs: [
        "cv_in",
        "gate"
      ],
      outputs: [
        "cv_out"
      ]
    },
    clock: {
      inputs: [],
      outputs: [
        "gate",
        "ramp"
      ]
    },
    sequencer: {
      inputs: [],
      outputs: [
        "gate",
        "pitch_cv",
        "velocity_cv"
      ]
    },
    global_seq: {
      inputs: [
        "reset"
      ],
      outputs: [
        "gate",
        "pitch_cv",
        "velocity_cv",
        "accent"
      ]
    },
    master_output: {
      inputs: [
        "left",
        "right"
      ],
      outputs: []
    },
    scope: {
      inputs: [
        "audio_in",
        "cv_in"
      ],
      outputs: [
        "sig_out"
      ]
    },
    kick_drum: {
      inputs: [
        "gate",
        "pitch_cv",
        "tune_cv",
        "decay_cv",
        "punch_cv",
        "sub_cv",
        "drive_cv"
      ],
      outputs: [
        "audio"
      ]
    },
    snare: {
      inputs: [
        "gate",
        "pitch_cv",
        "decay_cv",
        "noise_cv",
        "snap_cv"
      ],
      outputs: [
        "audio"
      ]
    },
    hihat: {
      inputs: [
        "gate",
        "decay_cv",
        "tone_cv",
        "edge_cv"
      ],
      outputs: [
        "audio"
      ]
    },
    bass_line: {
      inputs: [
        "gate_cv",
        "pitch_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    pwm_oscillator: {
      inputs: [
        "pitch_cv",
        "pw_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    fm_operator: {
      inputs: [
        "pitch_cv",
        "mod_cv",
        "phase_mod"
      ],
      outputs: [
        "audio_out"
      ]
    },
    ring_mod: {
      inputs: [
        "carrier",
        "modulator"
      ],
      outputs: [
        "audio_out"
      ]
    },
    svf: {
      inputs: [
        "audio_in",
        "cutoff_cv",
        "res_cv"
      ],
      outputs: [
        "lp",
        "hp",
        "bp",
        "notch"
      ]
    },
    moog_filter: {
      inputs: [
        "audio_in",
        "cutoff_cv",
        "res_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    wavefolder: {
      inputs: [
        "audio_in",
        "drive_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    delay_line: {
      inputs: [
        "audio_in",
        "time_cv",
        "feedback_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    euclidean: {
      inputs: [
        "clock",
        "reset"
      ],
      outputs: [
        "gate",
        "accent"
      ]
    },
    slew_limiter: {
      inputs: [
        "cv_in"
      ],
      outputs: [
        "cv_out"
      ]
    },
    pitch_quantizer: {
      inputs: [
        "cv_in"
      ],
      outputs: [
        "cv_out"
      ]
    },
    supersaw: {
      inputs: [
        "pitch_cv"
      ],
      outputs: [
        "out_l",
        "out_r"
      ]
    },
    wavetable: {
      inputs: [
        "pitch_cv",
        "position_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    comb_filter: {
      inputs: [
        "audio_in",
        "pitch_cv",
        "gate"
      ],
      outputs: [
        "audio_out"
      ]
    },
    chorus: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    reverb: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    bitcrusher: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    envelope_follower: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "cv_out"
      ]
    },
    clock_divider: {
      inputs: [
        "clock",
        "reset"
      ],
      outputs: [
        "div_out",
        "mult_out"
      ]
    },
    bernoulli_gate: {
      inputs: [
        "gate_in",
        "cv_in"
      ],
      outputs: [
        "out_a",
        "out_b"
      ]
    },
    noise_gen: {
      inputs: [],
      outputs: [
        "audio_out",
        "cv_out"
      ]
    },
    phaser: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    flanger: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    formant_filter: {
      inputs: [
        "audio_in",
        "vowel_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    ms20_filter: {
      inputs: [
        "audio_in",
        "cutoff_cv",
        "res_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    tape_saturation: {
      inputs: [
        "audio_in"
      ],
      outputs: [
        "audio_out"
      ]
    },
    compressor: {
      inputs: [
        "audio_in",
        "sidechain"
      ],
      outputs: [
        "audio_out"
      ]
    },
    stereo_panner: {
      inputs: [
        "audio_in",
        "pan_cv"
      ],
      outputs: [
        "out_l",
        "out_r"
      ]
    },
    additive_osc: {
      inputs: [
        "pitch_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    phase_distortion: {
      inputs: [
        "pitch_cv",
        "dist_cv"
      ],
      outputs: [
        "audio_out"
      ]
    },
    arpeggiator: {
      inputs: [
        "pitch_cv",
        "gate"
      ],
      outputs: [
        "pitch_out",
        "gate_out"
      ]
    }
  }, Kr = {
    oscillator: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      waveform: [
        0,
        3,
        0
      ]
    },
    lfo: {
      rate: [
        0.01,
        50,
        1
      ],
      depth: [
        0,
        1,
        1
      ],
      waveform: [
        0,
        3,
        0
      ]
    },
    vca: {
      level: [
        0,
        1,
        0.8
      ]
    },
    filter: {
      cutoff: [
        20,
        2e4,
        1e3
      ],
      resonance: [
        0.1,
        20,
        0.707
      ],
      type: [
        0,
        2,
        0
      ]
    },
    adsr: {
      attack: [
        1e-3,
        10,
        0.01
      ],
      decay: [
        1e-3,
        10,
        0.1
      ],
      sustain: [
        0,
        1,
        0.7
      ],
      release: [
        1e-3,
        10,
        0.3
      ]
    },
    mixer: {
      level_1: [
        0,
        1,
        0.4
      ],
      level_2: [
        0,
        1,
        0.4
      ],
      level_3: [
        0,
        1,
        0.4
      ],
      level_4: [
        0,
        1,
        0.4
      ],
      level_5: [
        0,
        1,
        0.4
      ],
      level_6: [
        0,
        1,
        0.4
      ],
      level_7: [
        0,
        1,
        0.4
      ],
      level_8: [
        0,
        1,
        0.4
      ]
    },
    cv_mixer: {
      amount_1: [
        -1,
        1,
        0.5
      ],
      amount_2: [
        -1,
        1,
        0.5
      ],
      amount_3: [
        -1,
        1,
        0.5
      ],
      amount_4: [
        -1,
        1,
        0.5
      ]
    },
    attenuverter: {
      amount: [
        -1,
        1,
        1
      ],
      offset: [
        -1,
        1,
        0
      ]
    },
    clock: {
      bpm: [
        20,
        300,
        120
      ],
      division: [
        0.25,
        32,
        4
      ],
      pulse_width: [
        0.01,
        0.99,
        0.5
      ]
    },
    sequencer: {
      bpm: [
        20,
        300,
        120
      ],
      length: [
        1,
        64,
        16
      ],
      division: [
        0.25,
        16,
        4
      ],
      swing: [
        0.5,
        0.75,
        0.5
      ],
      direction: [
        0,
        3,
        0
      ]
    },
    global_seq: {
      length: [
        1,
        64,
        16
      ],
      division: [
        0.25,
        32,
        4
      ],
      direction: [
        0,
        3,
        0
      ]
    },
    kick_drum: {
      tune: [
        20,
        120,
        60
      ],
      punch: [
        0,
        1,
        0.72
      ],
      pitch_tau: [
        5,
        100,
        18
      ],
      pitch_end: [
        0.1,
        2,
        1
      ],
      decay: [
        50,
        3e3,
        520
      ],
      body_attack: [
        0.1,
        20,
        0.5
      ],
      body_mix: [
        0,
        1,
        0.65
      ],
      sub: [
        0,
        1,
        0.65
      ],
      sub_decay: [
        100,
        6e3,
        1100
      ],
      click: [
        0,
        1,
        0.55
      ],
      click_tone: [
        0,
        12e3,
        0
      ],
      drive: [
        1,
        8,
        2.2
      ],
      level: [
        0,
        1,
        0.92
      ]
    },
    snare: {
      tone: [
        80,
        600,
        180
      ],
      tone_ratio: [
        1,
        3,
        1.83
      ],
      t2_freq: [
        0,
        1200,
        0
      ],
      pitch_tau: [
        1,
        50,
        8
      ],
      snap: [
        0,
        1,
        0.65
      ],
      noise: [
        0,
        1,
        0.72
      ],
      body_mix: [
        0,
        1,
        0.45
      ],
      decay: [
        0.04,
        2,
        0.16
      ],
      hpf: [
        200,
        6e3,
        1500
      ],
      lpf: [
        2e3,
        2e4,
        8e3
      ],
      drive: [
        1,
        6,
        2
      ],
      level: [
        0,
        1,
        0.88
      ]
    },
    hihat: {
      tune: [
        0.25,
        4,
        1
      ],
      tone: [
        1e3,
        18e3,
        6e3
      ],
      bp_freq: [
        500,
        12e3,
        3e3
      ],
      open: [
        0,
        1,
        0
      ],
      decay: [
        5e-3,
        1,
        0.055
      ],
      edge: [
        0.5,
        10,
        2.5
      ],
      noise: [
        0,
        1,
        0.25
      ],
      drive: [
        1,
        6,
        1.6
      ],
      level: [
        0,
        1,
        0.75
      ],
      choke: [
        0,
        1,
        1
      ]
    },
    bass_line: {
      bpm: [
        20,
        300,
        120
      ],
      freq: [
        20,
        200,
        55
      ],
      cutoff: [
        20,
        2e3,
        400
      ],
      resonance: [
        0.1,
        20,
        4
      ],
      decay: [
        0.05,
        2,
        0.2
      ],
      level: [
        0,
        1,
        0.8
      ]
    },
    pwm_oscillator: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      pulse_width: [
        0.01,
        0.99,
        0.5
      ],
      pw_mod_depth: [
        0,
        1,
        0
      ]
    },
    fm_operator: {
      frequency: [
        0.1,
        2e4,
        440
      ],
      ratio: [
        0.5,
        16,
        1
      ],
      mod_index: [
        0,
        20,
        0
      ],
      feedback: [
        0,
        1,
        0
      ],
      level: [
        0,
        1,
        1
      ]
    },
    ring_mod: {
      mix: [
        0,
        1,
        1
      ],
      mode: [
        0,
        1,
        0
      ]
    },
    svf: {
      cutoff: [
        20,
        2e4,
        1e3
      ],
      resonance: [
        0,
        1,
        0
      ],
      drive: [
        0,
        5,
        0
      ]
    },
    moog_filter: {
      cutoff: [
        20,
        2e4,
        1e3
      ],
      resonance: [
        0,
        1.1,
        0
      ],
      drive: [
        1,
        5,
        1
      ],
      compensation: [
        0,
        1,
        0.5
      ]
    },
    wavefolder: {
      drive: [
        1,
        10,
        1
      ],
      symmetry: [
        -1,
        1,
        0
      ],
      stages: [
        1,
        6,
        3
      ],
      mix: [
        0,
        1,
        1
      ]
    },
    delay_line: {
      time: [
        0.1,
        5e3,
        250
      ],
      feedback: [
        0,
        0.99,
        0.3
      ],
      mix: [
        0,
        1,
        0.5
      ],
      filter: [
        0,
        1,
        1
      ]
    },
    euclidean: {
      steps: [
        1,
        32,
        16
      ],
      pulses: [
        0,
        32,
        4
      ],
      rotation: [
        0,
        31,
        0
      ],
      probability: [
        0,
        1,
        1
      ]
    },
    slew_limiter: {
      rise: [
        0,
        10,
        0.01
      ],
      fall: [
        0,
        10,
        0.01
      ],
      shape: [
        0,
        1,
        0
      ]
    },
    pitch_quantizer: {
      root: [
        0,
        11,
        0
      ],
      scale: [
        0,
        4095,
        2741
      ],
      glide: [
        0,
        1,
        0
      ]
    },
    supersaw: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      voices: [
        1,
        9,
        7
      ],
      detune: [
        0,
        1,
        0.3
      ],
      mix: [
        0,
        1,
        0.5
      ],
      stereo_spread: [
        0,
        1,
        0.7
      ]
    },
    wavetable: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      position: [
        0,
        1,
        0
      ]
    },
    comb_filter: {
      frequency: [
        20,
        5e3,
        220
      ],
      feedback: [
        -0.999,
        0.999,
        0.5
      ],
      damping: [
        0,
        1,
        0.5
      ],
      mode: [
        0,
        2,
        1
      ]
    },
    chorus: {
      rate: [
        0.1,
        10,
        1.5
      ],
      depth: [
        0,
        20,
        5
      ],
      voices: [
        1,
        4,
        2
      ],
      mix: [
        0,
        1,
        0.5
      ],
      feedback: [
        0,
        0.5,
        0
      ]
    },
    reverb: {
      decay: [
        0.1,
        0.99,
        0.7
      ],
      damping: [
        0,
        1,
        0.5
      ],
      size: [
        0.1,
        2,
        0.5
      ],
      pre_delay: [
        0,
        100,
        10
      ],
      mix: [
        0,
        1,
        0.3
      ]
    },
    bitcrusher: {
      bit_depth: [
        1,
        24,
        16
      ],
      downsample: [
        1,
        64,
        1
      ],
      mix: [
        0,
        1,
        1
      ]
    },
    envelope_follower: {
      attack: [
        0.1,
        100,
        5
      ],
      release: [
        1,
        1e3,
        50
      ],
      gain: [
        0.1,
        10,
        1
      ]
    },
    clock_divider: {
      divide: [
        1,
        64,
        2
      ],
      multiply: [
        1,
        16,
        1
      ],
      reset_count: [
        0,
        64,
        0
      ]
    },
    bernoulli_gate: {
      probability: [
        0,
        1,
        0.5
      ],
      mode: [
        0,
        1,
        0
      ]
    },
    noise_gen: {
      mode: [
        0,
        4,
        0
      ],
      rate: [
        0.01,
        100,
        1
      ],
      range_lo: [
        -1,
        1,
        -1
      ],
      range_hi: [
        -1,
        1,
        1
      ]
    },
    phaser: {
      rate: [
        0.01,
        10,
        0.5
      ],
      depth: [
        0,
        1,
        0.7
      ],
      stages: [
        2,
        12,
        6
      ],
      feedback: [
        -0.95,
        0.95,
        0.5
      ],
      center: [
        100,
        5e3,
        1e3
      ],
      mix: [
        0,
        1,
        0.5
      ]
    },
    flanger: {
      rate: [
        0.01,
        10,
        0.3
      ],
      depth: [
        0,
        10,
        3
      ],
      feedback: [
        -0.99,
        0.99,
        0.7
      ],
      mix: [
        0,
        1,
        0.5
      ]
    },
    formant_filter: {
      vowel: [
        0,
        1,
        0
      ],
      resonance: [
        0.5,
        20,
        5
      ],
      shift: [
        -12,
        12,
        0
      ]
    },
    ms20_filter: {
      cutoff: [
        20,
        2e4,
        1e3
      ],
      resonance: [
        0,
        1.2,
        0
      ],
      mode: [
        0,
        1,
        0
      ]
    },
    tape_saturation: {
      drive: [
        0,
        5,
        1
      ],
      bias: [
        0,
        1,
        0.5
      ],
      tone: [
        0,
        1,
        0.5
      ],
      wow_flutter: [
        0,
        1,
        0
      ]
    },
    compressor: {
      threshold: [
        -60,
        0,
        -12
      ],
      ratio: [
        1,
        20,
        4
      ],
      attack: [
        0.1,
        100,
        5
      ],
      release: [
        10,
        1e3,
        100
      ],
      makeup: [
        0,
        30,
        0
      ],
      knee: [
        0,
        20,
        6
      ]
    },
    stereo_panner: {
      pan: [
        -1,
        1,
        0
      ]
    },
    additive_osc: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      h1: [
        0,
        1,
        1
      ],
      h2: [
        0,
        1,
        0.5
      ],
      h3: [
        0,
        1,
        0.33
      ],
      h4: [
        0,
        1,
        0.25
      ],
      h5: [
        0,
        1,
        0
      ],
      h6: [
        0,
        1,
        0
      ],
      h7: [
        0,
        1,
        0
      ],
      h8: [
        0,
        1,
        0
      ],
      h9: [
        0,
        1,
        0
      ],
      h10: [
        0,
        1,
        0
      ],
      h11: [
        0,
        1,
        0
      ],
      h12: [
        0,
        1,
        0
      ],
      h13: [
        0,
        1,
        0
      ],
      h14: [
        0,
        1,
        0
      ],
      h15: [
        0,
        1,
        0
      ],
      h16: [
        0,
        1,
        0
      ]
    },
    phase_distortion: {
      frequency: [
        20,
        2e4,
        440
      ],
      amplitude: [
        0,
        1,
        0.8
      ],
      distortion: [
        0,
        1,
        0
      ],
      mode: [
        0,
        3,
        0
      ]
    },
    arpeggiator: {
      mode: [
        0,
        5,
        0
      ],
      octaves: [
        1,
        4,
        2
      ],
      gate_length: [
        0.01,
        1,
        0.5
      ],
      division: [
        0.25,
        16,
        4
      ]
    }
  };
  function qn(e) {
    return Yr[e] || {
      inputs: [],
      outputs: []
    };
  }
  function et(e) {
    return Kr[e] || {};
  }
  let Jr = 0;
  const yt = (e) => `${e}_${Date.now().toString(36)}_${(++Jr).toString(36)}`, Nn = [
    "oscillator",
    "pwm_oscillator",
    "fm_operator",
    "supersaw",
    "wavetable",
    "additive_osc",
    "phase_distortion",
    "noise_gen",
    "lfo",
    "adsr",
    "envelope_follower",
    "slew_limiter",
    "sample_hold",
    "attenuverter",
    "pitch_quantizer",
    "filter",
    "svf",
    "moog_filter",
    "ms20_filter",
    "formant_filter",
    "comb_filter",
    "wavefolder",
    "ring_mod",
    "bitcrusher",
    "tape_saturation",
    "vca",
    "compressor",
    "stereo_panner",
    "delay_line",
    "reverb",
    "chorus",
    "phaser",
    "flanger",
    "clock",
    "clock_divider",
    "sequencer",
    "global_seq",
    "euclidean",
    "arpeggiator",
    "bernoulli_gate",
    "kick_drum",
    "snare",
    "hihat",
    "bass_line",
    "mixer",
    "cv_mixer"
  ], Zr = /* @__PURE__ */ new Set([
    "sequencer",
    "global_seq"
  ]);
  let Re = null, lt = null, ze = null, Se = false, nt = null, At = /* @__PURE__ */ new Map();
  const de = /* @__PURE__ */ new Map(), _t = /* @__PURE__ */ new Map(), bt = /* @__PURE__ */ new Map(), ct = /* @__PURE__ */ new Map(), qt = /* @__PURE__ */ new Set();
  let Qr = 0;
  const Xe = /* @__PURE__ */ new Map();
  function Rn() {
    return `t${++Qr}`;
  }
  function Fn(e) {
    return new Promise((t, n) => {
      Xe.set(e, {
        resolve: t,
        reject: n
      }), setTimeout(() => {
        Xe.has(e) && (Xe.delete(e), n(new Error("worklet timeout")));
      }, 5e3);
    });
  }
  function ue(e) {
    try {
      lt == null ? void 0 : lt.port.postMessage(e);
    } catch (t) {
      Oe("err", `post: ${t.message}`);
    }
  }
  async function Ht() {
    if (!Se) return nt || (nt = (async () => {
      Re = new (window.AudioContext || window.webkitAudioContext)(), Re.state === "suspended" && await Re.resume();
      const t = await (await fetch("/wasm-pkg/dc_wasm_bg.wasm")).arrayBuffer(), n = await WebAssembly.compile(t);
      await Re.audioWorklet.addModule("/drone-worklet.js"), lt = new AudioWorkletNode(Re, "drone-processor", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [
          2
        ],
        processorOptions: {
          wasmModule: n
        }
      }), lt.port.onmessage = (s) => {
        const o = s.data;
        switch (o.type) {
          case "ready":
            ze = o.masterId;
            break;
          case "module_added":
          case "connected": {
            const r = Xe.get(o.token);
            r && (Xe.delete(o.token), r.resolve(o.id));
            break;
          }
          case "meters": {
            try {
              const r = JSON.parse(o.data), a = {};
              for (const [i, l, c] of r) {
                const d = _t.get(i);
                d && (a[d] = [
                  Math.min(1, l * 4),
                  c
                ]);
              }
              Ln(a);
            } catch {
            }
            break;
          }
          case "step": {
            const r = _t.get(o.id);
            if (!r) break;
            const a = ct.get(r);
            if (a) for (const i of a) try {
              i(o.step);
            } catch {
            }
            break;
          }
          case "error":
            Oe("err", o.error);
            break;
        }
      }, lt.connect(Re.destination), await new Promise((s) => {
        const o = Date.now(), r = () => {
          if (ze || Date.now() - o > 4e3) return s();
          setTimeout(r, 20);
        };
        r();
      }), Se = true;
      for (const s of Object.keys(Y.layers || {})) {
        const o = Y.layers[s];
        for (const r of Object.keys(o.modules || {})) await Wt(s, r);
        for (const r of o.connections || []) await In(s, r);
        Wn(s);
      }
    })(), nt);
  }
  async function an(e) {
    if (At.has(e)) return At.get(e);
    const t = qn(e) || {
      inputs: [],
      outputs: []
    };
    return At.set(e, t), t;
  }
  function ln(e, t, n) {
    const o = (e[n] || []).indexOf(t);
    return o >= 0 ? o : 0;
  }
  async function Wt(e, t) {
    var _a2, _b, _c;
    if (!Se || de.has(t)) return;
    const n = (_c = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.modules) == null ? void 0 : _c[t];
    if (!n) return;
    const s = Rn();
    ue({
      type: "add_module",
      type_name: n.type_name,
      token: s
    });
    let o;
    try {
      o = await Fn(s);
    } catch (r) {
      Oe("err", `add_module ${n.type_name}: ${r.message}`);
      return;
    }
    if (!o) {
      Oe("err", `unsupported wasm module: ${n.type_name}`);
      return;
    }
    de.set(t, o), _t.set(o, t);
    for (const [r, a] of Object.entries(n.params || {})) typeof a == "number" && ue({
      type: "set_param",
      id: o,
      name: r,
      value: a
    });
    Zr.has(n.type_name) && ue({
      type: "register_sequencer",
      id: o
    }), n.type_name === "mixer" && ue({
      type: "enable_meter",
      id: o
    });
  }
  async function In(e, t) {
    var _a2, _b, _c, _d, _e2, _f;
    if (!Se || bt.has(t.id)) return;
    const n = de.get(t.from_module), s = de.get(t.to_module);
    if (!n || !s) return;
    const o = (_c = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.modules) == null ? void 0 : _c[t.from_module], r = (_f = (_e2 = (_d = Y.layers) == null ? void 0 : _d[e]) == null ? void 0 : _e2.modules) == null ? void 0 : _f[t.to_module];
    if (!o || !r) return;
    const a = await an(o.type_name), i = await an(r.type_name), l = ln(a, t.from_port, "outputs"), c = ln(i, t.to_port, "inputs"), d = Rn();
    ue({
      type: "connect",
      from: n,
      from_port: l,
      to: s,
      to_port: c,
      token: d
    });
    try {
      const u = await Fn(d);
      u && bt.set(t.id, u);
    } catch (u) {
      Oe("err", `connect: ${u.message}`);
    }
  }
  function jn(e) {
    const t = de.get(e);
    t && (ue({
      type: "remove_module",
      id: t
    }), de.delete(e), _t.delete(t));
  }
  function Hn(e) {
    const t = bt.get(e);
    t && (ue({
      type: "disconnect",
      id: t
    }), bt.delete(e));
  }
  function Wn(e) {
    var _a2;
    if (!Se || !ze || qt.has(e)) return;
    const t = (_a2 = Y.layers) == null ? void 0 : _a2[e];
    if (!(t == null ? void 0 : t.mixer_id)) return;
    const n = de.get(t.mixer_id);
    n && (ue({
      type: "connect",
      from: n,
      from_port: 0,
      to: ze,
      to_port: 0
    }), ue({
      type: "connect",
      from: n,
      from_port: 0,
      to: ze,
      to_port: 1
    }), qt.add(e));
  }
  function Gt({ name: e } = {}) {
    const t = yt("layer"), n = yt("mod"), s = {};
    for (const [r, [, , a]] of Object.entries(et("mixer"))) s[r] = a;
    const o = {
      id: t,
      name: e || `layer ${Object.keys(Y.layers || {}).length + 1}`,
      mixer_id: n,
      modules: {
        [n]: {
          id: n,
          name: "mixer",
          type_name: "mixer",
          params: s,
          seq: 0
        }
      },
      connections: []
    };
    return be("layers", t, o), Se && Wt(t, n).then(() => Wn(t)), o;
  }
  function Gn(e, { type: t, name: n } = {}) {
    var _a2;
    const s = (_a2 = Y.layers) == null ? void 0 : _a2[e];
    if (!s) return {
      error: "no such layer"
    };
    const o = yt("mod"), r = {};
    for (const [c, [, , d]] of Object.entries(et(t) || {})) r[c] = d;
    const i = Object.values(s.modules || {}).reduce((c, d) => Math.max(c, d.seq ?? 0), 0) + 1, l = {
      id: o,
      type_name: t,
      name: n || `${t}_${i}`,
      params: r,
      seq: i
    };
    return be("layers", e, "modules", o, l), Se && Wt(e, o), l;
  }
  function Bn(e, t) {
    var _a2, _b;
    const n = (((_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.connections) || []).filter((s) => s.from_module === t || s.to_module === t);
    for (const s of n) Bt(e, s.id);
    return jn(t), be("layers", e, "modules", t, void 0), {
      ok: true
    };
  }
  function Vn(e, { from_module: t, from_port: n, to_module: s, to_port: o }) {
    var _a2, _b;
    const a = {
      id: yt("conn"),
      from_module: t,
      from_port: n,
      to_module: s,
      to_port: o
    }, i = ((_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.connections) || [];
    return be("layers", e, "connections", [
      ...i,
      a
    ]), Se && In(e, a), a;
  }
  function Bt(e, t) {
    var _a2, _b;
    Hn(t);
    const n = (((_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.connections) || []).filter((s) => s.id !== t);
    return be("layers", e, "connections", n), {
      ok: true
    };
  }
  function Vt(e, t, n, s) {
    be("layers", e, "modules", t, "params", n, s);
    const o = de.get(t);
    o && ue({
      type: "set_param",
      id: o,
      name: n,
      value: s
    });
  }
  function eo(e, t) {
    be("layers", e, "name", t);
  }
  function zn(e) {
    var _a2;
    const t = (_a2 = Y.layers) == null ? void 0 : _a2[e];
    if (t) {
      for (const n of t.connections || []) Hn(n.id);
      for (const n of Object.keys(t.modules || {})) jn(n);
      qt.delete(e), be("layers", e, void 0);
    }
  }
  function to(e, t) {
    t.forEach((n, s) => be("layers", e, "modules", n, "seq", s));
  }
  function no(e) {
    var _a2;
    return ((_a2 = xt.get(e)) == null ? void 0 : _a2.steps) || [];
  }
  const xt = /* @__PURE__ */ new Map();
  function Xn(e, t = 16) {
    let n = xt.get(e);
    return n || (n = {
      steps: Array.from({
        length: t
      }, (s, o) => ({
        gate: false,
        pitch: 60 + o % 12,
        velocity: 1,
        length: 0.5,
        probability: 1,
        plocks: {}
      }))
    }, xt.set(e, n)), n;
  }
  function ro(e, t, n) {
    const s = Xn(e);
    s.steps[t] = {
      ...s.steps[t] || {
        gate: false,
        pitch: 60,
        velocity: 1,
        length: 0.5,
        probability: 1,
        plocks: {}
      },
      ...n
    };
    const o = de.get(e);
    if (o) {
      const r = s.steps[t];
      ue({
        type: "set_step",
        id: o,
        step: t,
        gate: r.gate,
        pitch: r.pitch != null ? (r.pitch - 60) / 12 : void 0,
        velocity: r.velocity,
        length: r.length,
        probability: r.probability
      });
    }
  }
  function oo(e, t, n, s, o) {
    var _a2, _b;
    const r = Xn(e), a = (_a2 = r.steps)[t] || (_a2[t] = {
      gate: false,
      pitch: 60,
      velocity: 1,
      length: 0.5,
      probability: 1,
      plocks: {}
    });
    a.plocks || (a.plocks = {}), (_b = a.plocks)[n] || (_b[n] = {}), a.plocks[n][s] = o;
    const i = de.get(e), l = de.get(n);
    i && l && ue({
      type: "set_plock",
      id: i,
      step: t,
      target: l,
      param: s,
      value: o
    });
  }
  function so(e, t, n, s) {
    var _a2;
    const o = xt.get(e);
    if (!o) return;
    const r = o.steps[t];
    ((_a2 = r == null ? void 0 : r.plocks) == null ? void 0 : _a2[n]) && delete r.plocks[n][s];
    const a = de.get(e), i = de.get(n);
    a && i && ue({
      type: "clear_plock",
      id: a,
      step: t,
      target: i,
      param: s
    });
  }
  const Q = (e) => new Response(JSON.stringify(e), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  }), Ct = (e, t) => new Response(JSON.stringify({
    error: t
  }), {
    status: e,
    headers: {
      "Content-Type": "application/json"
    }
  }), cn = typeof fetch == "function" ? fetch.bind(window) : null;
  function ee(e, t) {
    const s = new URL(e, location.origin).pathname.split("/").filter(Boolean), o = t.split("/").filter(Boolean);
    if (s.length !== o.length) return null;
    const r = {};
    for (let a = 0; a < s.length; a++) if (o[a].startsWith(":")) r[o[a].slice(1)] = decodeURIComponent(s[a]);
    else if (o[a] !== s[a]) return null;
    return r;
  }
  async function xe(e) {
    if (!e || !e.body) return {};
    try {
      return JSON.parse(e.body);
    } catch {
      return {};
    }
  }
  async function ao(e, t = {}) {
    var _a2;
    const n = typeof e == "string" ? e : e.url, s = (t.method || "GET").toUpperCase();
    let o;
    if (s === "GET" && ee(n, "/session")) return Q(JSON.parse(JSON.stringify(Y)));
    if (s === "GET" && ee(n, "/modules")) return Q(Nn);
    if (s === "GET" && ee(n, "/wasm/modules")) return Q({
      types: []
    });
    if (s === "GET" && ee(n, "/meters")) return Q({});
    if (s === "GET" && ee(n, "/layers")) return Q(Object.values(Y.layers || {}).map((r) => ({
      id: r.id,
      name: r.name
    })));
    if ((o = ee(n, "/layer/:id")) && s === "GET") {
      const r = (_a2 = Y.layers) == null ? void 0 : _a2[o.id];
      return r ? Q(JSON.parse(JSON.stringify(r))) : Ct(404, "no such layer");
    }
    if (ee(n, "/layer") && s === "POST") return Q(Gt(await xe(t)));
    if ((o = ee(n, "/layer/:id")) && s === "PATCH") {
      const r = await xe(t);
      return r.name && eo(o.id, r.name), Q({
        ok: true
      });
    }
    if ((o = ee(n, "/layer/:id")) && s === "DELETE") return zn(o.id), Q({
      ok: true
    });
    if ((o = ee(n, "/layer/:id/module")) && s === "POST") {
      const r = Gn(o.id, await xe(t));
      return r.error ? Ct(400, r.error) : Q(r);
    }
    if ((o = ee(n, "/layer/:id/module/:mid")) && s === "DELETE") return Q(Bn(o.id, o.mid));
    if ((o = ee(n, "/layer/:id/module/:mid/param")) && s === "PUT") {
      const r = await xe(t);
      return Vt(o.id, o.mid, r.name, r.value), Q({
        ok: true
      });
    }
    if ((o = ee(n, "/layer/:id/patch")) && s === "POST") return Q(Vn(o.id, await xe(t)));
    if ((o = ee(n, "/layer/:id/patch/:cid")) && s === "DELETE") return Q(Bt(o.id, o.cid));
    if ((o = ee(n, "/layer/:id/reorder")) && s === "PUT") return to(o.id, (await xe(t)).order || []), Q({
      ok: true
    });
    if ((o = ee(n, "/layer/:id/sequencer/:mid")) && s === "GET") return Q(no(o.mid));
    if ((o = ee(n, "/layer/:id/sequencer/:mid/step/:n")) && s === "PUT") return ro(o.mid, Number(o.n), await xe(t)), Q({
      ok: true
    });
    if ((o = ee(n, "/layer/:id/sequencer/:mid/step/:n/plock")) && s === "POST") {
      const r = await xe(t);
      return oo(o.mid, Number(o.n), r.target_id, r.param, r.value), Q({
        ok: true
      });
    }
    if ((o = ee(n, "/layer/:id/sequencer/:mid/step/:n/plock")) && s === "DELETE") {
      const r = await xe(t);
      return so(o.mid, Number(o.n), r.target_id, r.param), Q({
        ok: true
      });
    }
    return cn ? cn(e, t) : Ct(404, "no handler");
  }
  class io {
    constructor(t) {
      this.url = t, this.readyState = 1, this.binaryType = "arraybuffer", this.onopen = null, this.onmessage = null, this.onclose = null, this.onerror = null, this._installed = null, queueMicrotask(() => this.onopen && this.onopen({}));
      const n = t.match(/\/seq\/([^/]+)\/clock/);
      if (n) {
        const s = n[1], o = (a) => {
          this.onmessage && this.onmessage({
            data: new Uint8Array([
              a
            ]).buffer
          });
        };
        let r = ct.get(s);
        r || (r = /* @__PURE__ */ new Set(), ct.set(s, r)), r.add(o), this._installed = {
          modId: s,
          listener: o
        };
      }
    }
    send() {
    }
    close() {
      if (this.readyState = 3, this._installed) {
        const t = ct.get(this._installed.modId);
        t && t.delete(this._installed.listener);
      }
      this.onclose && this.onclose({});
    }
  }
  function lo() {
    if (typeof window > "u") return;
    window.fetch = (t, n) => ao(t, n);
    const e = window.WebSocket;
    window.WebSocket = function(t, ...n) {
      return typeof t == "string" && t.startsWith("ws://0.0.0.0:0") ? new io(t) : new e(t, ...n);
    }, window.WebSocket.CONNECTING = 0, window.WebSocket.OPEN = 1, window.WebSocket.CLOSING = 2, window.WebSocket.CLOSED = 3;
  }
  const rt = {};
  function Ue(e, t, n, s) {
    const o = `${e}/${t}/${n}`;
    rt[o] && clearTimeout(rt[o]), Vt(e, t, n, s), rt[o] = setTimeout(() => {
      delete rt[o];
    }, 30);
  }
  async function co() {
    return lo(), zr(Nn), Ur([]), Gr(true), Object.keys(Y.layers || {}).length === 0 && Gt({
      name: "main"
    }), Oe("sys", "local engine ready"), true;
  }
  const I = {
    ensureAudio: Ht,
    createLayer: Gt,
    addModule: Gn,
    removeModule: Bn,
    addConnection: Vn,
    removeConnection: Bt,
    setParam: Vt,
    deleteLayer: zn
  };
  G("standalone");
  G("");
  function Un(e) {
    return `ws://0.0.0.0:0${e}`;
  }
  var uo = E('<div class="px-2 pt-1 pb-1.5 border-t border-border"><canvas class="block w-full h-[60px] bg-bg-primary border border-border"></canvas><div class="data-label text-right mt-0.5 text-sm">scope');
  function fo(e) {
    let t, n = null, s = null, o = 0;
    je(() => {
      t.width = 256 * 2, t.height = 80 * 2, s = new Float32Array(256 * 2), r();
    }), Pe(() => {
      n && n.close();
    });
    function r() {
      n && n.close(), n = new WebSocket(Un(`/scope/${e.moduleId}`)), n.binaryType = "arraybuffer";
      const a = t.getContext("2d"), i = t.width, l = t.height;
      n.onmessage = (c) => {
        if (!(c.data instanceof ArrayBuffer)) return;
        const d = c.data;
        if (d.byteLength < 5) return;
        const b = new DataView(d).getUint8(0), k = (d.byteLength - 1) / 4, A = d.slice(1), C = new Float32Array(A, 0, k);
        if (a.clearRect(0, 0, i, l), b === 0) {
          let S = 0;
          for (let v = 1; v < k - 1; v++) if (C[v - 1] < 0 && C[v] >= 0) {
            S = v;
            break;
          }
          a.strokeStyle = "#44dd44", a.lineWidth = 1.5, a.shadowColor = "#44dd44", a.shadowBlur = 3, a.beginPath();
          const P = Math.min(k - S, i);
          for (let v = 0; v < P; v++) {
            const M = C[S + v], y = v / P * i, T = l / 2 - M * (l / 2 - 4);
            v === 0 ? a.moveTo(y, T) : a.lineTo(y, T);
          }
          a.stroke(), a.shadowBlur = 0, a.strokeStyle = "#333344", a.lineWidth = 1, a.beginPath(), a.moveTo(0, l / 2), a.lineTo(i, l / 2), a.stroke();
        } else {
          const S = Math.max(1, Math.floor(k / i));
          for (let M = 0; M < k; M += S) s[o % s.length] = C[M], o++;
          const P = Math.min(o, s.length), v = o - P;
          a.strokeStyle = "#7799bb", a.lineWidth = 1.5, a.beginPath();
          for (let M = 0; M < i; M++) {
            const y = (v + M) % s.length, T = s[y], f = l / 2 - T * (l / 2 - 4);
            M === 0 ? a.moveTo(M, f) : a.lineTo(M, f);
          }
          a.stroke(), a.strokeStyle = "#333344", a.lineWidth = 1;
          for (const M of [
            0.5,
            0,
            -0.5
          ]) {
            const y = l / 2 - M * (l / 2 - 4);
            a.beginPath(), a.moveTo(0, y), a.lineTo(i, y), a.stroke();
          }
        }
      }, n.onclose = () => {
        if (!t.isConnected) return;
        const c = t.getContext("2d");
        c.clearRect(0, 0, t.width, t.height), c.fillStyle = "#666", c.font = "16px VT323, monospace", c.fillText("disconnected", 6, t.height / 2 + 4);
      };
    }
    return (() => {
      var a = uo(), i = a.firstChild, l = t;
      return typeof l == "function" ? qe(l, i) : t = i, a;
    })();
  }
  var mo = E('<div data-no-ctx-menu class="px-2 pt-6 pb-1">'), ho = E('<div class="flex flex-col gap-0.5 mb-1"><div class="grid gap-0.5"></div><div class="grid gap-0.5">'), go = E('<div class="text-xs text-border text-center leading-none">'), po = E('<div class="absolute pointer-events-none"style=width:4px;height:4px;top:2px;right:2px;background:#000>'), vo = E("<div><div></div><div>"), yo = E('<div class="flex items-center gap-1.5"><span class="data-label w-[52px] flex-shrink-0 text-base">:</span><input type=range class=flex-1><span class="data-value w-[42px] text-right flex-shrink-0 text-base tabular-nums">'), _o = E('<div class="seq-popover-panel fixed z-[500] bg-bg-primary border border-border p-2.5 flex flex-col gap-1.5 min-w-[250px] max-h-[90vh] overflow-y-auto shadow-[0_4px_20px_rgba(0,0,0,0.9)]"><div class=section-title>STEP </div><button class="self-end text-base text-text-secondary bg-transparent border border-border cursor-pointer py-0.5 px-2 font-mono hover:text-text-primary hover:border-text-secondary transition-colors mt-0.5">close'), bo = E('<div class="border-t border-border mt-0.5 pt-1.5 flex flex-col gap-1"><div class="section-title text-warning border-none mb-0.5"style=font-size:0.65rem>PER-STEP OVERRIDES'), xo = E('<div class="flex items-center gap-1.5"><div class="w-1 h-1 flex-shrink-0 rounded-none"></div><span class="data-label flex-shrink-0 text-base">:</span><input type=range class=flex-1><span class="tabular-nums text-base flex-shrink-0"></span><button class="text-base bg-transparent border-none cursor-pointer leading-none flex-shrink-0 transition-opacity"title="clear override">\xD7'), wo = E('<div class="flex flex-col gap-0.5 mb-1">'), $o = E('<select class="bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 w-full"><option value>\u2014 param \u2014'), ko = E('<div class="flex items-center gap-1.5"><input type=range class=flex-1><input type=number class="w-[48px] bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 tabular-nums">'), Po = E('<div class="border-t border-border mt-0.5 pt-1.5 flex flex-col gap-1"><div class="section-title text-warning border-none mb-0.5"style=font-size:0.65rem>PLOCKS</div><div class="flex flex-col gap-1 border border-border/40 p-1.5"><div class="data-label text-base text-text-secondary uppercase">add</div><select class="bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 w-full"><option value>\u2014 module \u2014</option></select><button class="self-start text-base bg-transparent border border-border cursor-pointer py-0.5 px-2 font-mono transition-colors">+ lock'), Mo = E('<div class="text-base text-text-secondary italic">none'), Ao = E('<div class="flex items-center gap-1 min-w-0"><span class="data-value text-base flex-1 truncate min-w-0"><span class=text-text-secondary>.</span></span><span class="data-value tabular-nums text-base w-[34px] text-right flex-shrink-0"></span><button class="text-danger text-base bg-transparent border-none cursor-pointer px-0.5 leading-none opacity-60 hover:opacity-100">\xD7'), un = E("<option>");
  const Co = [
    "kick_drum",
    "snare",
    "hihat"
  ];
  function zt(e) {
    const t = Number(e);
    return Math.abs(t) >= 1e3 ? t.toFixed(0) : Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(3);
  }
  function dn(e, t, n, s) {
    fetch(`/layer/${e}/sequencer/${t}/step/${n}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(s)
    }).catch((o) => console.warn("seq step PUT failed", o));
  }
  function So(e, t, n, s, o, r) {
    return fetch(`/layer/${e}/sequencer/${t}/step/${n}/plock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target_id: s,
        param: o,
        value: r
      })
    }).catch((a) => console.warn("plock POST failed", a));
  }
  function Do(e, t, n, s, o) {
    return fetch(`/layer/${e}/sequencer/${t}/step/${n}/plock`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target_id: s,
        param: o
      })
    }).catch((r) => console.warn("plock DELETE failed", r));
  }
  function To(e) {
    const [t, n] = G([]), [s, o] = G(void 0), [r, a] = G(null);
    let i = [], l, c = null, d = false, u = false;
    const b = () => {
      var _a2;
      const h = (_a2 = e.params) == null ? void 0 : _a2.call(e);
      return Math.max(1, Math.min(64, Math.round((h == null ? void 0 : h.length) ?? 16)));
    };
    je(async () => {
      try {
        const g = await fetch(`/layer/${e.layerId}/sequencer/${e.modId}`);
        g.ok && n(await g.json());
      } catch {
      }
      k();
      const h = () => {
        d = false;
      };
      window.addEventListener("mouseup", h), Pe(() => window.removeEventListener("mouseup", h));
    }), Pe(() => {
      c && c.close();
    });
    function k() {
      c && c.close(), c = new WebSocket(Un(`/seq/${e.modId}/clock`)), c.binaryType = "arraybuffer", c.onmessage = (h) => {
        const g = new Uint8Array(h.data)[0];
        l !== void 0 && i[l] && i[l].classList.remove("seq-playing"), l = g, o(g), i[g] && i[g].classList.add("seq-playing");
      }, c.onclose = () => {
        c = null;
      };
    }
    function A(h, g) {
      var _a2;
      ((_a2 = t()[h]) == null ? void 0 : _a2.gate) !== g && (n(($) => {
        const L = [
          ...$
        ];
        return L[h] = {
          ...L[h] || {},
          gate: g
        }, L;
      }), dn(e.layerId, e.modId, h, {
        gate: g
      }));
    }
    const C = (h, g) => {
      var _a2;
      h.button === 0 && (h.preventDefault(), d = true, u = !((_a2 = t()[g]) == null ? void 0 : _a2.gate), A(g, u));
    }, S = (h) => {
      d && A(h, u);
    };
    function P(h, g, _, $) {
      n((L) => {
        var _a2;
        const O = [
          ...L
        ], R = [
          ...((_a2 = O[h]) == null ? void 0 : _a2.p_locks) || []
        ], N = R.findIndex((q) => q.target_id === g && q.param === _);
        return N >= 0 ? R[N] = {
          target_id: g,
          param: _,
          value: $
        } : R.push({
          target_id: g,
          param: _,
          value: $
        }), O[h] = {
          ...O[h] || {},
          p_locks: R
        }, O;
      }), So(e.layerId, e.modId, h, g, _, $);
    }
    function v(h, g, _) {
      n(($) => {
        var _a2;
        const L = [
          ...$
        ], O = (((_a2 = L[h]) == null ? void 0 : _a2.p_locks) || []).filter((R) => !(R.target_id === g && R.param === _));
        return L[h] = {
          ...L[h] || {},
          p_locks: O
        }, L;
      }), Do(e.layerId, e.modId, h, g, _);
    }
    const M = 16, y = () => b(), T = () => Math.ceil(y() / M), f = () => (y(), "100%"), m = () => "aspect-square cursor-pointer relative min-w-0 transition-colors duration-75 select-none", w = (h) => `background:${(h == null ? void 0 : h.gate) ? "var(--color-label)" : "var(--color-bg-primary)"}; outline:1px solid #000;outline-offset:-1px`;
    return (() => {
      var h = mo();
      return p(h, x(z, {
        get each() {
          return Array.from({
            length: T()
          }, (g, _) => _);
        },
        children: (g) => {
          const _ = g * M, $ = Math.min(M, y() - _);
          return (() => {
            var L = ho(), O = L.firstChild, R = O.nextSibling;
            return p(O, x(z, {
              get each() {
                return Array.from({
                  length: $
                }, (N, q) => _ + q);
              },
              children: (N) => (() => {
                var q = go();
                return p(q, () => N % 4 === 0 ? String(N / 4 + 1) : ""), q;
              })()
            })), p(R, x(z, {
              get each() {
                return Array.from({
                  length: $
                }, (N, q) => _ + q);
              },
              children: (N) => {
                const q = () => t()[N] || {
                  gate: false,
                  pitch: 0,
                  velocity: 1,
                  length: 0.5,
                  probability: 1,
                  p_locks: []
                }, W = () => `${Math.round((q().velocity ?? 1) * 100)}%`, re = () => q().pitch ?? 0, Me = () => Math.abs(re()) / 2, ge = () => {
                  var _a2;
                  return (((_a2 = q().p_locks) == null ? void 0 : _a2.length) || 0) > 0;
                };
                return (() => {
                  var J = vo(), le = J.firstChild, X = le.nextSibling;
                  return J.$$contextmenu = (B) => {
                    B.preventDefault(), B.stopPropagation(), a({
                      stepIdx: N,
                      x: B.clientX,
                      y: B.clientY
                    });
                  }, J.addEventListener("mouseenter", () => S(N)), J.$$mousedown = (B) => C(B, N), qe((B) => {
                    i[N] = B;
                  }, J), p(J, x(j, {
                    get when() {
                      return ge();
                    },
                    get children() {
                      return po();
                    }
                  }), null), F((B) => {
                    var _a2, _b, _c;
                    var fe = m(), er = w(q()), Yt = `step ${N + 1}${ge() ? " [plocked]" : ""}`, Kt = `absolute left-0.5 w-0.5 ${((_a2 = q()) == null ? void 0 : _a2.gate) ? "bg-black/30" : "bg-warning/60"}`, tr = `bottom:1px;height:calc(${W()} - 2px)`, Jt = `absolute h-0.5 ${re() >= 0 ? "left-1" : "right-1"} ${((_b = q()) == null ? void 0 : _b.gate) ? "bg-black/40" : "bg-text-primary"}`, nr = `bottom:2px;${re() >= 0 ? "right" : "left"}:${Math.round((1 - Me()) * 100)}%;opacity:${((_c = q()) == null ? void 0 : _c.gate) ? 1 : 0}`;
                    return fe !== B.e && ke(J, B.e = fe), B.t = K(J, er, B.t), Yt !== B.a && D(J, "title", B.a = Yt), Kt !== B.o && ke(le, B.o = Kt), B.i = K(le, tr, B.i), Jt !== B.n && ke(X, B.n = Jt), B.s = K(X, nr, B.s), B;
                  }, {
                    e: void 0,
                    t: void 0,
                    a: void 0,
                    o: void 0,
                    i: void 0,
                    n: void 0,
                    s: void 0
                  }), J;
                })();
              }
            })), F((N) => {
              var q = `grid-template-columns:repeat(${$},1fr)`, W = `grid-template-columns:repeat(${$},1fr)`;
              return N.e = K(O, q, N.e), N.t = K(R, W, N.t), N;
            }, {
              e: void 0,
              t: void 0
            }), L;
          })();
        }
      }), null), p(h, x(j, {
        get when() {
          return r();
        },
        get children() {
          return x(Eo, {
            get stepIdx() {
              return r().stepIdx;
            },
            get x() {
              return r().x;
            },
            get y() {
              return r().y;
            },
            get seqId() {
              return e.modId;
            },
            get layerId() {
              return e.layerId;
            },
            get modType() {
              return e.modType;
            },
            get modParams() {
              return e.modParams;
            },
            get layer() {
              return e.layer;
            },
            step: () => t()[r().stepIdx] || {
              gate: false,
              pitch: 0,
              velocity: 1,
              length: 0.5,
              probability: 1,
              p_locks: []
            },
            onChange: (g, _) => {
              n(($) => {
                const L = [
                  ...$
                ];
                return L[r().stepIdx] = {
                  ...L[r().stepIdx] || {},
                  [g]: _
                }, L;
              }), dn(e.layerId, e.modId, r().stepIdx, {
                [g]: _
              });
            },
            onAddPlock: (g, _, $) => P(r().stepIdx, g, _, $),
            onRemovePlock: (g, _) => v(r().stepIdx, g, _),
            onClose: () => a(null)
          });
        }
      }), null), F((g) => K(h, `width:${f()}`, g)), h;
    })();
  }
  function Eo(e) {
    const t = window.innerWidth, n = window.innerHeight;
    let s = e.x + 8, o = e.y + 8;
    s + 250 > t && (s = e.x - 258), o + 420 > n && (o = Math.max(8, n - 428));
    const r = () => Co.includes(e.modType);
    je(() => {
      const i = (l) => {
        l.target.closest(".seq-popover-panel") || e.onClose();
      };
      setTimeout(() => document.addEventListener("click", i), 0), Pe(() => document.removeEventListener("click", i));
    });
    const a = (i, l, c, d, u) => {
      const [b, k] = G(e.step()[u] ?? 0);
      return (() => {
        var A = yo(), C = A.firstChild, S = C.firstChild, P = C.nextSibling, v = P.nextSibling;
        return p(C, i, S), P.$$input = (M) => {
          const y = parseFloat(M.target.value);
          k(y), e.onChange(u, y);
        }, D(P, "min", l), D(P, "max", c), D(P, "step", d), p(v, () => zt(b())), F(() => P.value = b()), A;
      })();
    };
    return (() => {
      var i = _o(), l = i.firstChild;
      l.firstChild;
      var c = l.nextSibling;
      return p(l, () => e.stepIdx + 1, null), p(i, () => a("vel", 0, 1, 0.01, "velocity"), c), p(i, () => a("prob", 0, 1, 0.01, "probability"), c), p(i, x(j, {
        get when() {
          return e.modType !== "hihat";
        },
        get children() {
          return a("pitch", -2, 2, 0.01, "pitch");
        }
      }), c), p(i, x(j, {
        get when() {
          return !r();
        },
        get children() {
          return a("length", 0.01, 1, 0.01, "length");
        }
      }), c), p(i, x(j, {
        get when() {
          return r();
        },
        get children() {
          return x(Lo, {
            get seqId() {
              return e.seqId;
            },
            get modType() {
              return e.modType;
            },
            get modParams() {
              return e.modParams;
            },
            plocks: () => e.step().p_locks || [],
            get onAddPlock() {
              return e.onAddPlock;
            },
            get onRemovePlock() {
              return e.onRemovePlock;
            }
          });
        }
      }), c), p(i, x(j, {
        get when() {
          return !r();
        },
        get children() {
          return x(Oo, {
            get seqId() {
              return e.seqId;
            },
            get layer() {
              return e.layer;
            },
            plocks: () => e.step().p_locks || [],
            get onAddPlock() {
              return e.onAddPlock;
            },
            get onRemovePlock() {
              return e.onRemovePlock;
            }
          });
        }
      }), c), Ie(c, "click", e.onClose, true), F((d) => K(i, `left:${s}px;top:${o}px`, d)), i;
    })();
  }
  function Lo(e) {
    const t = () => et(e.modType) || {}, n = (o) => e.plocks().find((r) => r.target_id === e.seqId && r.param === o), s = (o, r) => {
      var _a2;
      return ((_a2 = typeof e.modParams == "function" ? e.modParams() : e.modParams) == null ? void 0 : _a2[o]) ?? (r == null ? void 0 : r[2]) ?? 0;
    };
    return (() => {
      var o = bo();
      return o.firstChild, p(o, x(z, {
        get each() {
          return Object.entries(t());
        },
        children: ([r, [a, i, l]]) => {
          const c = () => n(r), d = () => {
            var _a2;
            return ((_a2 = c()) == null ? void 0 : _a2.value) ?? s(r, [
              a,
              i,
              l
            ]);
          }, [u, b] = G(d()), k = () => {
            const S = c();
            return S ? S.value : s(r, [
              a,
              i,
              l
            ]);
          }, A = (S) => {
            b(S), e.onAddPlock(e.seqId, r, S);
          }, C = (S) => {
            S.stopPropagation(), b(s(r, [
              a,
              i,
              l
            ])), e.onRemovePlock(e.seqId, r);
          };
          return (() => {
            var S = xo(), P = S.firstChild, v = P.nextSibling, M = v.firstChild, y = v.nextSibling, T = y.nextSibling, f = T.nextSibling;
            return p(v, r, M), y.$$input = (m) => A(parseFloat(m.target.value)), D(y, "min", a), D(y, "max", i), D(y, "step", (i - a) / 200), p(T, () => zt(k())), f.$$click = C, F((m) => {
              var w = `background:${c() ? "#7799bb" : "#333"};border:1px solid ${c() ? "#7799bb" : "#555"}`, h = `width:60px;color:${c() ? "#7799bb" : "var(--color-text-secondary)"}`, g = c() ? "accent-color:#7799bb" : "opacity:0.5", _ = `width:38px;text-align:right;color:${c() ? "#7799bb" : "var(--color-text-secondary)"}`, $ = `color:#7799bb;opacity:${c() ? 1 : 0};pointer-events:${c() ? "auto" : "none"};width:12px`;
              return m.e = K(P, w, m.e), m.t = K(v, h, m.t), m.a = K(y, g, m.a), m.o = K(T, _, m.o), m.i = K(f, $, m.i), m;
            }, {
              e: void 0,
              t: void 0,
              a: void 0,
              o: void 0,
              i: void 0
            }), F(() => y.value = k()), S;
          })();
        }
      }), null), o;
    })();
  }
  function Oo(e) {
    const [t, n] = G(""), [s, o] = G(""), [r, a] = G(0), i = () => {
      const P = typeof e.layer == "function" ? e.layer() : e.layer;
      return (P == null ? void 0 : P.modules) ? Object.values(P.modules).filter((v) => v.id !== e.seqId) : [];
    }, l = () => {
      var _a2, _b;
      if (!t()) return {};
      const v = (_b = (_a2 = typeof e.layer == "function" ? e.layer() : e.layer) == null ? void 0 : _a2.modules) == null ? void 0 : _b[t()];
      return v ? et(v.type_name) || {} : {};
    }, c = (P) => {
      n(P.target.value), o(""), a(0);
    }, d = (P) => {
      const v = P.target.value;
      o(v);
      const M = l()[v];
      M && a(M[2] ?? 0);
    }, u = () => t() && s(), b = () => {
      u() && (e.onAddPlock(t(), s(), r()), o(""), a(0));
    }, k = (P) => {
      var _a2, _b, _c;
      return ((_c = (_b = (_a2 = typeof e.layer == "function" ? e.layer() : e.layer) == null ? void 0 : _a2.modules) == null ? void 0 : _b[P]) == null ? void 0 : _c.name) || P.slice(0, 8);
    }, A = () => e.plocks(), C = () => {
      var _a2;
      return ((_a2 = l()[s()]) == null ? void 0 : _a2[0]) ?? -99999;
    }, S = () => {
      var _a2;
      return ((_a2 = l()[s()]) == null ? void 0 : _a2[1]) ?? 99999;
    };
    return (() => {
      var P = Po(), v = P.firstChild, M = v.nextSibling, y = M.firstChild, T = y.nextSibling;
      T.firstChild;
      var f = T.nextSibling;
      return p(P, x(j, {
        get when() {
          return A().length > 0;
        },
        get fallback() {
          return Mo();
        },
        get children() {
          var m = wo();
          return p(m, x(z, {
            get each() {
              return A();
            },
            children: (w) => (() => {
              var h = Ao(), g = h.firstChild, _ = g.firstChild, $ = g.nextSibling, L = $.nextSibling;
              return p(g, () => k(w.target_id), _), p(g, () => w.param, null), p($, () => zt(w.value)), L.$$click = () => e.onRemovePlock(w.target_id, w.param), h;
            })()
          })), m;
        }
      }), M), T.addEventListener("change", c), p(T, x(z, {
        get each() {
          return i();
        },
        children: (m) => (() => {
          var w = un();
          return p(w, () => m.name), F(() => w.value = m.id), w;
        })()
      }), null), p(M, x(j, {
        get when() {
          return t();
        },
        get children() {
          var m = $o();
          return m.firstChild, m.addEventListener("change", d), p(m, x(z, {
            get each() {
              return Object.keys(l());
            },
            children: (w) => (() => {
              var h = un();
              return h.value = w, p(h, w), h;
            })()
          }), null), F(() => m.value = s()), m;
        }
      }), f), p(M, x(j, {
        get when() {
          return s();
        },
        get children() {
          var m = ko(), w = m.firstChild, h = w.nextSibling;
          return w.$$input = (g) => a(parseFloat(g.target.value)), h.$$input = (g) => a(parseFloat(g.target.value) || 0), F((g) => {
            var _ = C(), $ = S(), L = (S() - C()) / 200, O = C(), R = S();
            return _ !== g.e && D(w, "min", g.e = _), $ !== g.t && D(w, "max", g.t = $), L !== g.a && D(w, "step", g.a = L), O !== g.o && D(h, "min", g.o = O), R !== g.i && D(h, "max", g.i = R), g;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0
          }), F(() => w.value = r()), F(() => h.value = r()), m;
        }
      }), f), f.$$click = b, F((m) => {
        var w = !u(), h = {
          "text-warning border-warning hover:bg-warning/10": u(),
          "text-text-secondary opacity-40 cursor-not-allowed": !u()
        };
        return w !== m.e && (f.disabled = m.e = w), m.t = It(f, h, m.t), m;
      }, {
        e: void 0,
        t: void 0
      }), F(() => T.value = t()), P;
    })();
  }
  _e([
    "mousedown",
    "contextmenu",
    "input",
    "click"
  ]);
  var qo = E("<svg><path fill=none stroke=rgba(136,153,170,0.25) stroke-width=3.5 stroke-linecap=round>"), No = E("<svg><path fill=none stroke-width=3.5 stroke-linecap=round></svg>", false, true, false);
  let pe = null;
  function fn(e, t, n) {
    pe || (pe = document.createElement("div"), pe.style.cssText = "position:fixed;pointer-events:none;z-index:9999;padding:2px 6px;background:var(--color-bg-secondary,#1a1a1d);border:0.5px solid var(--color-border,rgba(255,255,255,0.2));color:var(--color-text-primary,#e8ecea);font:10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums;white-space:nowrap;transform:translate(10px,10px)", document.body.appendChild(pe)), pe.style.left = `${e}px`, pe.style.top = `${t}px`, pe.textContent = n, pe.style.display = "";
  }
  function Ro() {
    pe && (pe.style.display = "none");
  }
  function Be(e) {
    const t = () => e.size || 32, n = () => t() / 2 - 3, s = () => t() / 2, o = () => t() / 2, [l, c] = G(false), [d, u] = G(false), b = (y) => y * Math.PI / 180, k = (y, T) => {
      const f = b(y), m = b(T), w = s() + n() * Math.cos(f), h = o() + n() * Math.sin(f), g = s() + n() * Math.cos(m), _ = o() + n() * Math.sin(m), $ = T - y > 180 ? 1 : 0;
      return `M${w},${h} A${n()},${n()} 0 ${$} 1 ${g},${_}`;
    }, A = () => Math.max(0, Math.min(1, e.value)), C = () => 135 + A() * 270, S = () => l() || d() ? "#ccddee" : "#8899aa", P = (y) => {
      y.preventDefault(), y.stopPropagation();
      const T = y.clientY, f = A();
      u(true), e.display && fn(y.clientX, y.clientY, e.display);
      const m = (h) => {
        const g = T - h.clientY, _ = h.shiftKey ? 1e-3 : h.ctrlKey || h.metaKey ? 3e-4 : 5e-3, $ = Math.max(0, Math.min(1, f + g * _));
        e.onChange($), e.display && fn(h.clientX, h.clientY, e.display);
      }, w = () => {
        u(false), Ro(), window.removeEventListener("mousemove", m), window.removeEventListener("mouseup", w);
      };
      window.addEventListener("mousemove", m), window.addEventListener("mouseup", w);
    }, v = (y) => {
      y.preventDefault(), e.defaultValue !== void 0 && e.onChange(e.defaultValue);
    }, M = (y) => {
      y.preventDefault(), e.defaultValue !== void 0 && e.onChange(e.defaultValue);
    };
    return (() => {
      var y = qo(), T = y.firstChild;
      return y.addEventListener("mouseleave", () => c(false)), y.addEventListener("mouseenter", () => c(true)), y.$$contextmenu = M, y.$$dblclick = v, y.$$mousedown = P, p(y, (() => {
        var f = me(() => A() > 5e-3);
        return () => f() && (() => {
          var m = No();
          return F((w) => {
            var h = k(135, C()), g = S();
            return h !== w.e && D(m, "d", w.e = h), g !== w.t && D(m, "stroke", w.t = g), w;
          }, {
            e: void 0,
            t: void 0
          }), m;
        })();
      })(), null), F((f) => {
        var m = t(), w = t(), h = `0 0 ${t()} ${t()}`, g = `cursor:${d() ? "grabbing" : "ns-resize"}`, _ = k(135, 405);
        return m !== f.e && D(y, "width", f.e = m), w !== f.t && D(y, "height", f.t = w), h !== f.a && D(y, "viewBox", f.a = h), f.o = K(y, g, f.o), _ !== f.i && D(T, "d", f.i = _), f;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      }), y;
    })();
  }
  _e([
    "mousedown",
    "dblclick",
    "contextmenu"
  ]);
  var Fo = E("<svg><g><circle r=10 fill=transparent></circle><circle r=5 fill=#141414 stroke=#8899aa stroke-width=1.5 style=pointer-events:none></svg>", false, true, false), Io = E("<svg><circle r=8 fill=none stroke=#8899aa stroke-width=1 opacity=0.7 style=pointer-events:none></svg>", false, true, false), jo = E('<div class="px-2 py-2"><svg viewBox="0 0 280 90"class="block w-full"style=cursor:default;height:auto><line x1=8 y1=78 x2=272 y2=78 stroke=rgba(136,153,170,0.22) stroke-width=0.5></line><path fill=rgba(136,153,170,0.18)></path><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="flex justify-between mt-2 px-1"><div class="flex flex-col items-center"style=gap:1px><span class="type-port text-text-secondary"style=font-size:8px>Atck</span><span class="type-port text-label"style=font-size:9px;font-variant-numeric:tabular-nums></span></div><div class="flex flex-col items-center"style=gap:1px><span class="type-port text-text-secondary"style=font-size:8px>Dcay</span><span class="type-port text-label"style=font-size:9px;font-variant-numeric:tabular-nums></span></div><div class="flex flex-col items-center"style=gap:1px><span class="type-port text-text-secondary"style=font-size:8px>Sus</span><span class="type-port text-label"style=font-size:9px;font-variant-numeric:tabular-nums></span></div><div class="flex flex-col items-center"style=gap:1px><span class="type-port text-text-secondary"style=font-size:8px>Rel</span><span class="type-port text-label"style=font-size:9px;font-variant-numeric:tabular-nums>'), Ho = E("<svg><line y1=12 y2=78 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></svg>", false, true, false);
  function Wo(e) {
    const c = (f, m, w) => {
      const h = Math.log(m), g = Math.log(w);
      return Math.max(0, Math.min(1, (Math.log(f) - h) / (g - h)));
    }, d = (f, m, w) => {
      const h = Math.log(m), g = Math.log(w);
      return Math.exp(h + f * (g - h));
    }, u = ne(() => {
      const f = c(e.attack, 1e-3, 10), m = c(e.decay, 1e-3, 10), w = c(e.release, 1e-3, 10), h = e.sustain, g = f + m + w + 0.01, _ = f / g * 264 * 0.85, $ = m / g * 264 * 0.85, L = 264 * 0.15, O = 264 - _ - $ - L, R = 8, N = 78, q = 12;
      return {
        p0: {
          x: R,
          y: N
        },
        p1: {
          x: R + _,
          y: q
        },
        p2: {
          x: R + _ + $,
          y: q + (1 - h) * 66
        },
        p3: {
          x: R + _ + $ + L,
          y: q + (1 - h) * 66
        },
        p4: {
          x: R + _ + $ + L + O,
          y: N
        }
      };
    }), b = ne(() => {
      const { p0: f, p1: m, p2: w, p3: h, p4: g } = u(), _ = m.x + (w.x - m.x) * 0.7, $ = m.y, L = h.x + (g.x - h.x) * 0.3, O = h.y;
      return `M${f.x},${f.y} L${m.x},${m.y} C${_},${$} ${w.x},${w.y} ${w.x},${w.y} L${h.x},${h.y} C${L},${O} ${g.x},${g.y} ${g.x},${g.y}`;
    }), [k, A] = G(null), [C, S] = G(null), P = (f, m) => {
      m.preventDefault(), m.stopPropagation(), A(f);
      const w = m.target.closest("svg").getBoundingClientRect(), h = (_) => {
        const $ = k();
        if (!$) return;
        const L = _.clientX - w.left, O = _.clientY - w.top;
        if ($ === "sustain") {
          const R = 1 - Math.max(0, Math.min(1, (O - 12) / 66));
          e.onParam("sustain", R);
        } else {
          const R = Math.max(0, Math.min(1, (L - 8) / 264)), N = d(Math.max(1e-3, R), 1e-3, 10);
          e.onParam($, Math.max(1e-3, Math.min(10, N)));
        }
      }, g = () => {
        A(null), window.removeEventListener("mousemove", h), window.removeEventListener("mouseup", g);
      };
      window.addEventListener("mousemove", h), window.addEventListener("mouseup", g);
    }, v = (f) => f >= 1 ? `${f.toFixed(2)} s` : `${(f * 1e3).toFixed(0)} ms`, M = (f) => `${(f * 100).toFixed(0)}%`, y = [
      0.01,
      0.1,
      1,
      10
    ], T = (f) => (() => {
      var m = Fo(), w = m.firstChild, h = w.nextSibling;
      return w.addEventListener("mouseleave", () => S(null)), w.addEventListener("mouseenter", () => S(f.param)), w.$$mousedown = (g) => P(f.param, g), p(m, (() => {
        var g = me(() => C() === f.param || k() === f.param);
        return () => g() && (() => {
          var _ = Io();
          return F(($) => {
            var L = f.cx, O = f.cy;
            return L !== $.e && D(_, "cx", $.e = L), O !== $.t && D(_, "cy", $.t = O), $;
          }, {
            e: void 0,
            t: void 0
          }), _;
        })();
      })(), null), F((g) => {
        var _ = f.cx, $ = f.cy, L = `cursor:${f.cursor}`, O = f.cx, R = f.cy;
        return _ !== g.e && D(w, "cx", g.e = _), $ !== g.t && D(w, "cy", g.t = $), g.a = K(w, L, g.a), O !== g.o && D(h, "cx", g.o = O), R !== g.i && D(h, "cy", g.i = R), g;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0
      }), m;
    })();
    return (() => {
      var f = jo(), m = f.firstChild, w = m.firstChild, h = w.nextSibling, g = h.nextSibling, _ = m.nextSibling, $ = _.firstChild, L = $.firstChild, O = L.nextSibling, R = $.nextSibling, N = R.firstChild, q = N.nextSibling, W = R.nextSibling, re = W.firstChild, Me = re.nextSibling, ge = W.nextSibling, J = ge.firstChild, le = J.nextSibling;
      return p(m, x(z, {
        each: y,
        children: (X) => {
          const B = 8 + c(X, 1e-3, 10) * 264 * 0.85;
          return (() => {
            var fe = Ho();
            return D(fe, "x1", B), D(fe, "x2", B), fe;
          })();
        }
      }), w), p(m, x(T, {
        get cx() {
          return u().p1.x;
        },
        get cy() {
          return u().p1.y;
        },
        param: "attack",
        cursor: "ew-resize"
      }), null), p(m, x(T, {
        get cx() {
          return u().p2.x;
        },
        get cy() {
          return u().p2.y;
        },
        param: "sustain",
        cursor: "ns-resize"
      }), null), p(m, x(T, {
        get cx() {
          return u().p3.x;
        },
        get cy() {
          return u().p3.y;
        },
        param: "decay",
        cursor: "ew-resize"
      }), null), p(m, x(T, {
        get cx() {
          return u().p4.x;
        },
        get cy() {
          return u().p4.y;
        },
        param: "release",
        cursor: "ew-resize"
      }), null), p($, x(Be, {
        get value() {
          return c(e.attack, 1e-3, 10);
        },
        onChange: (X) => e.onParam("attack", d(X, 1e-3, 10)),
        get defaultValue() {
          return c(0.01, 1e-3, 10);
        },
        get display() {
          return v(e.attack);
        }
      }), L), p(O, () => v(e.attack)), p(R, x(Be, {
        get value() {
          return c(e.decay, 1e-3, 10);
        },
        onChange: (X) => e.onParam("decay", d(X, 1e-3, 10)),
        get defaultValue() {
          return c(0.1, 1e-3, 10);
        },
        get display() {
          return v(e.decay);
        }
      }), N), p(q, () => v(e.decay)), p(W, x(Be, {
        get value() {
          return e.sustain;
        },
        onChange: (X) => e.onParam("sustain", X),
        defaultValue: 0.7,
        get display() {
          return M(e.sustain);
        }
      }), re), p(Me, () => M(e.sustain)), p(ge, x(Be, {
        get value() {
          return c(e.release, 1e-3, 10);
        },
        onChange: (X) => e.onParam("release", d(X, 1e-3, 10)),
        get defaultValue() {
          return c(0.3, 1e-3, 10);
        },
        get display() {
          return v(e.release);
        }
      }), J), p(le, () => v(e.release)), F((X) => {
        var B = `${b()} L272,78 L8,78 Z`, fe = b();
        return B !== X.e && D(h, "d", X.e = B), fe !== X.t && D(g, "d", X.t = fe), X;
      }, {
        e: void 0,
        t: void 0
      }), f;
    })();
  }
  _e([
    "mousedown"
  ]);
  var Go = E('<div class="flex flex-col items-center"style=min-width:44px;gap:1px><span class="type-port text-text-secondary"style=font-size:8px;letter-spacing:0.02em></span><span class="type-port text-label"style=font-variant-numeric:tabular-nums;font-size:9px>'), Bo = E("<svg><g></svg>", false, true, false), Vo = E("<svg><line stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,2></svg>", false, true, false), zo = E("<svg><line stroke=rgba(136,153,170,0.22) stroke-width=0.5 stroke-dasharray=2,2></svg>", false, true, false), Xo = E("<svg><text fill=rgba(136,153,170,0.5) font-size=7 font-family=ui-monospace,monospace text-anchor=middle></svg>", false, true, false), Uo = E("<svg><g><circle r=10 fill=transparent></circle><circle r=5 fill=#141414 stroke=#8899aa stroke-width=1.5 style=pointer-events:none></circle><circle r=8 fill=none stroke=#8899aa stroke-width=1 opacity=0 class=graph-node-ring style=pointer-events:none></svg>", false, true, false), Yo = E('<div class="flex justify-center gap-1">'), Ko = E('<button class="type-port px-2 py-0.5 border-none cursor-pointer">'), Xt = E("<div class=mt-1>"), Jo = E('<div class="px-2 py-2"><svg viewBox="0 0 280 96"class="block w-full"style=cursor:crosshair;height:auto><line x1=8 y1=32.8 x2=272 y2=32.8 stroke=rgba(136,153,170,0.12) stroke-width=0.5></line><path fill=rgba(136,153,170,0.18)></path><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="flex justify-around mt-2 px-1">'), Zo = E('<div class="px-2 py-2"><svg viewBox="0 0 280 60"class="block w-full"style=height:auto><line x1=8 y1=30 x2=272 y2=30 stroke=rgba(136,153,170,0.22) stroke-width=0.5></line><line x1=8 y1=12.4 x2=272 y2=12.4 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></line><line x1=8 y1=47.6 x2=272 y2=47.6 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></line><path fill=rgba(136,153,170,0.18)></path><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="flex justify-around mt-2 px-1 flex-wrap"style=gap:4px>'), Qo = E('<div class="px-2 py-2"><svg viewBox="0 0 280 60"class="block w-full"style=height:auto><line x1=8 y1=30 x2=272 y2=30 stroke=rgba(136,153,170,0.22) stroke-width=0.5></line><path fill=rgba(136,153,170,0.18)></path><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="flex justify-around mt-2 px-1">'), es = E('<div class="px-2 py-2"><svg viewBox="0 0 280 110"class="block w-full"style=cursor:default;height:auto><line x1=8 y1=102 x2=272 y2=8 stroke=rgba(136,153,170,0.22) stroke-width=0.5></line><path fill=rgba(136,153,170,0.18)></path><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="grid mt-2 px-1"style="grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 6px;justify-items:center">'), ts = E("<svg><g><line x1=8 x2=272 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></line><line y1=8 y2=102 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></svg>", false, true, false), ns = E('<div class="px-2 py-2"><div class="flex justify-between items-end gap-1"style=height:120px>'), rs = E('<div class="flex flex-col items-center"><div class="flex items-end gap-0.5"><div class=relative style=width:10px;height:92px;background:rgba(136,153,170,0.2);cursor:ns-resize><div class="absolute bottom-0 left-0 w-full pointer-events-none"></div></div><div class=relative style=width:3px;height:92px;background:rgba(136,153,170,0.1);pointer-events:none><div class="absolute bottom-0 left-0 w-full"></div></div></div><span class="type-port text-text-secondary mt-1"style=font-size:8px></span><span class="type-port text-label"style=font-size:8px;font-variant-numeric:tabular-nums>'), os = E('<div class="px-2 py-2"><svg viewBox="0 0 280 60"class="block w-full"style=height:auto><line x1=8 y1=30 x2=272 y2=30 stroke=rgba(136,153,170,0.12) stroke-width=0.5></line><g style=pointer-events:none></g></svg><div class="flex justify-around mt-2 px-1 flex-wrap"style=gap:4px>'), ss = E("<svg><line stroke=#8899aa stroke-width=1.5 stroke-linecap=round></svg>", false, true, false), as = E("<svg><circle r=3 fill=#ffdd88></svg>", false, true, false), is = E('<div class="px-2 py-2"><svg viewBox="0 0 280 80"class="block w-full"style=height:auto><line x1=140 y1=8 x2=140 y2=72 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></line><line x1=8 y1=40 x2=272 y2=40 stroke=rgba(136,153,170,0.12) stroke-width=0.5 stroke-dasharray=2,3></line><line x1=8 y1=72 x2=272 y2=8 stroke=rgba(136,153,170,0.22) stroke-width=0.5></line><path fill=none stroke=#8899aa stroke-width=1.5 stroke-linecap=round stroke-linejoin=round></path></svg><div class="grid mt-2 px-1"style="grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 6px;justify-items:center">'), ls = E("<div style=grid-column:1/-1;width:100%>"), cs = E('<div class="grid px-1 pt-1"style="grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center;border-top:0.5px solid rgba(136,153,170,0.12)">'), us = E('<div class="px-2 py-2">'), ds = E('<div class="grid px-1"style=grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center>'), fs = E('<div class=mb-2><div class="type-port text-text-secondary mb-1 px-1"style=font-size:8px;letter-spacing:0.18em;opacity:0.7></div><div class="grid px-1"style=grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center>');
  const Nt = "#8899aa", ms = "rgba(136,153,170,0.22)", ie = (e, t, n) => e <= 0 ? 0 : (Math.log(e) - Math.log(t)) / (Math.log(n) - Math.log(t)), Ae = (e, t, n) => Math.exp(Math.log(t) + e * (Math.log(n) - Math.log(t))), se = (e, t, n) => (e - t) / (n - t), Ce = (e, t, n) => t + e * (n - t), V = (e) => Math.max(0, Math.min(1, e)), Yn = (e) => e >= 1e3 ? `${(e / 1e3).toFixed(2)} kHz` : `${e.toFixed(0)} Hz`, mn = (e) => e >= 1 ? `${e.toFixed(2)}s` : `${(e * 1e3).toFixed(0)}ms`, ve = (e) => `${(e * 100).toFixed(0)}%`, hn = (e) => `${e > 0 ? "+" : ""}${e.toFixed(1)} dB`, hs = {
    attack: "Atck",
    decay: "Dcay",
    sustain: "Sus",
    release: "Rel",
    cutoff: "Freq",
    frequency: "Freq",
    formant_freq: "Form",
    resonance: "Reso",
    drive: "Drive",
    emphasis: "Emph",
    amplitude: "Level",
    level: "Level",
    waveform: "Wave",
    pulse_width: "PW",
    detune: "Dtun",
    spread: "Sprd",
    mod_index: "Mod",
    mod_freq: "Mod Hz",
    carrier_freq: "Carr",
    feedback: "Fdbk",
    threshold: "Thrsh",
    ratio: "Ratio",
    knee: "Knee",
    makeup: "Makup",
    time: "Time",
    mix: "Mix",
    filter: "Filt",
    symmetry: "Sym",
    stages: "Stgs",
    bits: "Bits",
    sample_rate_div: "Rate",
    bias: "Bias",
    tone: "Tone",
    damping: "Damp",
    size: "Size",
    pre_delay: "PreDly",
    decay_time: "Dcay",
    depth: "Depth",
    rate: "Rate",
    voices: "Vcs",
    width: "Wdth",
    pan: "Pan",
    center: "Cntr",
    rise: "Rise",
    fall: "Fall",
    shape: "Shape",
    root: "Root",
    scale: "Scale",
    glide: "Glide",
    amount: "Amt",
    offset: "Ofs",
    division: "Div",
    pulse: "Pulse",
    bpm: "BPM",
    length: "Len",
    swing: "Swing",
    direction: "Dir",
    density: "Dens",
    pitch_spread: "Pitch",
    attack_ms: "Atck",
    release_ms: "Rel",
    base_grain_ms: "Grain"
  }, Kn = (e) => hs[e] || (e.length > 6 ? e.slice(0, 6) : e);
  function U(e) {
    return (() => {
      var t = Go(), n = t.firstChild, s = n.nextSibling;
      return p(t, x(Be, {
        get value() {
          return e.value;
        },
        get onChange() {
          return e.onChange;
        },
        get defaultValue() {
          return e.defaultValue;
        },
        get display() {
          return e.display;
        }
      }), n), p(n, () => e.label), p(s, () => e.display), t;
    })();
  }
  function gs(e) {
    const t = [
      100,
      1e3,
      1e4
    ], n = [
      50,
      200,
      500,
      2e3,
      5e3
    ], s = 20, o = 2e4, r = (a) => e.padX + ie(a, s, o) * e.w;
    return (() => {
      var a = Bo();
      return p(a, x(z, {
        each: n,
        children: (i) => (() => {
          var l = Vo();
          return F((c) => {
            var d = r(i), u = e.padY, b = r(i), k = e.padY + e.h;
            return d !== c.e && D(l, "x1", c.e = d), u !== c.t && D(l, "y1", c.t = u), b !== c.a && D(l, "x2", c.a = b), k !== c.o && D(l, "y2", c.o = k), c;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0
          }), l;
        })()
      }), null), p(a, x(z, {
        each: t,
        children: (i) => [
          (() => {
            var l = zo();
            return F((c) => {
              var d = r(i), u = e.padY, b = r(i), k = e.padY + e.h;
              return d !== c.e && D(l, "x1", c.e = d), u !== c.t && D(l, "y1", c.t = u), b !== c.a && D(l, "x2", c.a = b), k !== c.o && D(l, "y2", c.o = k), c;
            }, {
              e: void 0,
              t: void 0,
              a: void 0,
              o: void 0
            }), l;
          })(),
          (() => {
            var l = Xo();
            return p(l, i >= 1e3 ? `${i / 1e3}k` : `${i}`), F((c) => {
              var d = r(i), u = e.padY + e.h - 2;
              return d !== c.e && D(l, "x", c.e = d), u !== c.t && D(l, "y", c.t = u), c;
            }, {
              e: void 0,
              t: void 0
            }), l;
          })()
        ]
      }), null), a;
    })();
  }
  function Jn(e) {
    return (() => {
      var t = Uo(), n = t.firstChild, s = n.nextSibling, o = s.nextSibling;
      return Ie(n, "mousedown", e.onMouseDown, true), F((r) => {
        var a = e.cx, i = e.cy, l = `cursor:${e.cursor || "grab"}`, c = e.cx, d = e.cy, u = e.cx, b = e.cy;
        return a !== r.e && D(n, "cx", r.e = a), i !== r.t && D(n, "cy", r.t = i), r.a = K(n, l, r.a), c !== r.o && D(s, "cx", r.o = c), d !== r.i && D(s, "cy", r.i = d), u !== r.n && D(o, "cx", r.n = u), b !== r.s && D(o, "cy", r.s = b), r;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0,
        n: void 0,
        s: void 0
      }), t;
    })();
  }
  const ps = [
    {
      id: 0,
      label: "LP"
    },
    {
      id: 1,
      label: "HP"
    },
    {
      id: 2,
      label: "BP"
    }
  ], Ut = [
    {
      id: 0,
      label: "SIN"
    },
    {
      id: 1,
      label: "TRI"
    },
    {
      id: 2,
      label: "SQR"
    },
    {
      id: 3,
      label: "SAW"
    }
  ];
  function kt(e) {
    return (() => {
      var t = Yo();
      return p(t, x(z, {
        get each() {
          return e.options;
        },
        children: (n) => (() => {
          var s = Ko();
          return s.$$click = () => e.onChange(n.id), p(s, () => n.label), F((o) => K(s, `font-size:9px;background:${e.value === n.id ? Nt : "transparent"};color:${e.value === n.id ? "#141414" : "rgba(136,153,170,0.7)"};border:0.5px solid ${ms}`, o)), s;
        })()
      })), t;
    })();
  }
  function We(e) {
    const l = () => {
      const P = e.paramDefs || {};
      return "cutoff" in P ? "cutoff" : "frequency" in P ? "frequency" : "formant_freq" in P ? "formant_freq" : "cutoff";
    }, c = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2[l()]) ?? 1e3;
    }, d = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.resonance) ?? 0;
    }, u = () => {
      var _a2, _b;
      return ((_a2 = e.params) == null ? void 0 : _a2.drive) ?? ((_b = e.params) == null ? void 0 : _b.emphasis) ?? 0;
    }, b = () => {
      var _a2;
      return Math.round(((_a2 = e.params) == null ? void 0 : _a2.type) ?? 0);
    }, k = ne(() => {
      const P = c(), v = Math.max(0.05, 1 - d() * 0.95), M = b(), y = [], T = 100;
      for (let f = 0; f <= T; f++) {
        const m = f / T, h = Ae(m, 20, 2e4) / P;
        let g = 1;
        M === 0 ? g = 1 / Math.sqrt(Math.pow(1 - h * h, 2) + Math.pow(h * v, 2)) : M === 1 ? g = h * h / Math.sqrt(Math.pow(1 - h * h, 2) + Math.pow(h * v, 2)) : g = h * v / Math.sqrt(Math.pow(1 - h * h, 2) + Math.pow(h * v, 2));
        const _ = 20 * Math.log10(Math.max(1e-3, g)), $ = Math.max(-40, Math.min(18, _)), L = 8 + m * 264, O = 8 + (18 - $) / 58 * 80;
        y.push([
          L,
          O
        ]);
      }
      return "M" + y.map((f) => f.join(",")).join(" L");
    }), A = ne(() => `${k()} L272,88 L8,88 Z`), C = () => {
      const P = 8 + ie(c(), 20, 2e4) * 264, v = 8 + (1 - V(d())) * 80 * 0.8 + 80 * 0.1;
      return {
        x: P,
        y: v
      };
    }, S = (P) => {
      P.preventDefault(), P.stopPropagation();
      const M = P.currentTarget.closest("svg").getBoundingClientRect(), y = (f) => {
        var _a2;
        const m = (f.clientX - M.left) / M.width * 280, w = (f.clientY - M.top) / M.height * 96, h = V((m - 8) / 264), g = V((w - 8) / 80);
        e.onParam(l(), Ae(h, 20, 2e4)), ((_a2 = e.paramDefs) == null ? void 0 : _a2.resonance) && e.onParam("resonance", V(1 - (g - 0.1) / 0.8));
      }, T = () => {
        window.removeEventListener("mousemove", y), window.removeEventListener("mouseup", T);
      };
      window.addEventListener("mousemove", y), window.addEventListener("mouseup", T);
    };
    return (() => {
      var P = Jo(), v = P.firstChild, M = v.firstChild, y = M.nextSibling, T = y.nextSibling, f = v.nextSibling;
      return p(v, x(gs, {
        padX: 8,
        padY: 8,
        w: 264,
        h: 80
      }), M), p(v, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.resonance;
        },
        get children() {
          return x(Jn, {
            get cx() {
              return C().x;
            },
            get cy() {
              return C().y;
            },
            onMouseDown: S,
            cursor: "move"
          });
        }
      }), null), p(P, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.type;
        },
        get children() {
          var m = Xt();
          return p(m, x(kt, {
            options: ps,
            get value() {
              return b();
            },
            onChange: (w) => e.onParam("type", w)
          })), m;
        }
      }), f), p(f, x(U, {
        label: "Freq",
        get value() {
          return ie(c(), 20, 2e4);
        },
        onChange: (m) => e.onParam(l(), Ae(m, 20, 2e4)),
        get display() {
          return Yn(c());
        },
        get defaultValue() {
          return ie(1e3, 20, 2e4);
        }
      }), null), p(f, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.resonance;
        },
        get children() {
          return x(U, {
            label: "Reso",
            get value() {
              return V(d());
            },
            onChange: (m) => e.onParam("resonance", m),
            get display() {
              return ve(V(d()));
            },
            defaultValue: 0.3
          });
        }
      }), null), p(f, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.drive;
        },
        get children() {
          return x(U, {
            label: "Drive",
            get value() {
              return se(u(), e.paramDefs.drive[0], e.paramDefs.drive[1]);
            },
            onChange: (m) => e.onParam("drive", Ce(m, e.paramDefs.drive[0], e.paramDefs.drive[1])),
            get display() {
              return u().toFixed(2);
            },
            get defaultValue() {
              return se(e.paramDefs.drive[2], e.paramDefs.drive[0], e.paramDefs.drive[1]);
            }
          });
        }
      }), null), p(f, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.emphasis;
        },
        get children() {
          return x(U, {
            label: "Emph",
            get value() {
              var _a2;
              return V(((_a2 = e.params) == null ? void 0 : _a2.emphasis) ?? 0);
            },
            onChange: (m) => e.onParam("emphasis", m),
            get display() {
              var _a2;
              return ve(V(((_a2 = e.params) == null ? void 0 : _a2.emphasis) ?? 0));
            }
          });
        }
      }), null), F((m) => {
        var w = A(), h = k();
        return w !== m.e && D(y, "d", m.e = w), h !== m.t && D(T, "d", m.t = h), m;
      }, {
        e: void 0,
        t: void 0
      }), P;
    })();
  }
  function ot(e) {
    const l = () => {
      const M = e.paramDefs || {};
      return "frequency" in M ? "frequency" : "carrier_freq" in M ? "carrier_freq" : "frequency";
    }, c = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2[l()]) ?? 440;
    }, d = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.amplitude) ?? 0.5;
    }, u = () => {
      var _a2;
      return Math.round(((_a2 = e.params) == null ? void 0 : _a2.waveform) ?? 0);
    }, b = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.pulse_width) ?? 0.5;
    }, k = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.detune) ?? 0;
    }, A = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.spread) ?? 0;
    }, C = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.mod_index) ?? 0;
    }, S = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.feedback) ?? 0;
    }, P = ne(() => {
      const y = [], T = u(), f = b();
      for (let m = 0; m <= 140; m++) {
        const w = m / 140;
        let h = 0;
        if (e.type === "pwm_oscillator") h = w < f ? 1 : -1;
        else if (e.type === "supersaw") {
          const $ = k() * 0.02;
          h = 0.5 * (2 * ((w + $) % 1) - 1 + (2 * ((w - $ + 1) % 1) - 1));
        } else if (e.type === "fm_operator") {
          const $ = Math.sin(w * Math.PI * 2 * 3);
          h = Math.sin(w * Math.PI * 2 + $ * C());
        } else T === 0 ? h = Math.sin(w * Math.PI * 2) : T === 1 ? h = w < 0.5 ? 4 * w - 1 : 3 - 4 * w : T === 2 ? h = w < 0.5 ? 1 : -1 : h = 2 * w - 1;
        const g = 8 + w * 264, _ = 8 + 44 / 2 - h * (44 / 2) * 0.9;
        y.push([
          g,
          _
        ]);
      }
      return "M" + y.map((m) => m.join(",")).join(" L");
    }), v = ne(() => `${P()} L272,${8 + 44 / 2} L8,${8 + 44 / 2} Z`);
    return (() => {
      var M = Zo(), y = M.firstChild, T = y.firstChild, f = T.nextSibling, m = f.nextSibling, w = m.nextSibling, h = w.nextSibling, g = y.nextSibling;
      return p(M, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.waveform;
        },
        get children() {
          var _ = Xt();
          return p(_, x(kt, {
            options: Ut,
            get value() {
              return u();
            },
            onChange: ($) => e.onParam("waveform", $)
          })), _;
        }
      }), g), p(g, x(U, {
        label: "Freq",
        get value() {
          return ie(c(), 20, 2e4);
        },
        onChange: (_) => e.onParam(l(), Ae(_, 20, 2e4)),
        get display() {
          return Yn(c());
        },
        get defaultValue() {
          return ie(440, 20, 2e4);
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.amplitude;
        },
        get children() {
          return x(U, {
            label: "Level",
            get value() {
              return V(d());
            },
            onChange: (_) => e.onParam("amplitude", _),
            get display() {
              return ve(V(d()));
            },
            defaultValue: 0.5
          });
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.pulse_width;
        },
        get children() {
          return x(U, {
            label: "PW",
            get value() {
              return V(b());
            },
            onChange: (_) => e.onParam("pulse_width", _),
            get display() {
              return ve(V(b()));
            },
            defaultValue: 0.5
          });
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.detune;
        },
        get children() {
          return x(U, {
            label: "Dtun",
            get value() {
              return se(k(), e.paramDefs.detune[0], e.paramDefs.detune[1]);
            },
            onChange: (_) => e.onParam("detune", Ce(_, e.paramDefs.detune[0], e.paramDefs.detune[1])),
            get display() {
              return k().toFixed(2);
            }
          });
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.spread;
        },
        get children() {
          return x(U, {
            label: "Sprd",
            get value() {
              return V(A());
            },
            onChange: (_) => e.onParam("spread", _),
            get display() {
              return ve(V(A()));
            }
          });
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.mod_index;
        },
        get children() {
          return x(U, {
            label: "Mod",
            get value() {
              return se(C(), e.paramDefs.mod_index[0], e.paramDefs.mod_index[1]);
            },
            onChange: (_) => e.onParam("mod_index", Ce(_, e.paramDefs.mod_index[0], e.paramDefs.mod_index[1])),
            get display() {
              return C().toFixed(2);
            }
          });
        }
      }), null), p(g, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.feedback;
        },
        get children() {
          return x(U, {
            label: "Fdbk",
            get value() {
              return V(S());
            },
            onChange: (_) => e.onParam("feedback", _),
            get display() {
              return ve(V(S()));
            }
          });
        }
      }), null), F((_) => {
        var $ = v(), L = P();
        return $ !== _.e && D(w, "d", _.e = $), L !== _.t && D(h, "d", _.t = L), _;
      }, {
        e: void 0,
        t: void 0
      }), M;
    })();
  }
  function vs(e) {
    const a = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.rate) ?? 1;
    }, i = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.depth) ?? 0.5;
    }, l = () => {
      var _a2;
      return Math.round(((_a2 = e.params) == null ? void 0 : _a2.waveform) ?? 0);
    }, c = ne(() => {
      const b = [], k = l();
      for (let A = 0; A <= 140; A++) {
        const C = A / 140;
        let S = 0;
        k === 0 ? S = Math.sin(C * Math.PI * 2) : k === 1 ? S = C < 0.5 ? 4 * C - 1 : 3 - 4 * C : k === 2 ? S = C < 0.5 ? 1 : -1 : S = 1 - 2 * C, S *= V(i());
        const P = 8 + C * 264, v = 8 + 44 / 2 - S * (44 / 2) * 0.9;
        b.push([
          P,
          v
        ]);
      }
      return "M" + b.map((A) => A.join(",")).join(" L");
    }), d = ne(() => `${c()} L272,${8 + 44 / 2} L8,${8 + 44 / 2} Z`);
    return (() => {
      var u = Qo(), b = u.firstChild, k = b.firstChild, A = k.nextSibling, C = A.nextSibling, S = b.nextSibling;
      return p(u, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.waveform;
        },
        get children() {
          var P = Xt();
          return p(P, x(kt, {
            options: Ut,
            get value() {
              return l();
            },
            onChange: (v) => e.onParam("waveform", v)
          })), P;
        }
      }), S), p(S, x(U, {
        label: "Rate",
        get value() {
          return ie(Math.max(0.01, a()), 0.01, 50);
        },
        onChange: (P) => e.onParam("rate", Ae(P, 0.01, 50)),
        get display() {
          return `${a().toFixed(2)} Hz`;
        },
        get defaultValue() {
          return ie(1, 0.01, 50);
        }
      }), null), p(S, x(U, {
        label: "Depth",
        get value() {
          return V(i());
        },
        onChange: (P) => e.onParam("depth", P),
        get display() {
          return ve(V(i()));
        },
        defaultValue: 0.5
      }), null), F((P) => {
        var v = d(), M = c();
        return v !== P.e && D(A, "d", P.e = v), M !== P.t && D(C, "d", P.t = M), P;
      }, {
        e: void 0,
        t: void 0
      }), u;
    })();
  }
  function ys(e) {
    const l = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.threshold) ?? -24;
    }, c = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.ratio) ?? 4;
    }, d = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.knee) ?? 6;
    }, u = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.attack) ?? 5e-3;
    }, b = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.release) ?? 0.1;
    }, k = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.makeup) ?? 0;
    }, A = ne(() => {
      const y = l(), T = Math.max(1, c()), f = Math.max(1e-3, d()), m = [], w = 100;
      for (let h = 0; h <= w; h++) {
        const _ = -60 + h / w * 66;
        let $;
        const L = _ - y;
        L < -f / 2 ? $ = _ : L > f / 2 ? $ = y + (_ - y) / T : $ = _ + (1 / T - 1) * (L + f / 2) * (L + f / 2) / (2 * f), $ += k();
        const O = 8 + (_ - -60) / 66 * 264, R = 8 + (1 - ($ - -60) / 66) * 94;
        m.push([
          O,
          R
        ]);
      }
      return "M" + m.map((h) => h.join(",")).join(" L");
    }), C = ne(() => `${A()} L272,102 L8,102 Z`), S = () => {
      const y = 8 + (l() - -60) / 66 * 264, T = 8 + (1 - (l() - -60) / 66) * 94;
      return {
        x: y,
        y: T
      };
    }, P = (y) => {
      y.preventDefault(), y.stopPropagation();
      const f = y.currentTarget.closest("svg").getBoundingClientRect(), m = (h) => {
        const g = (h.clientX - f.left) / f.width * 280, $ = -60 + V((g - 8) / 264) * 66;
        e.onParam("threshold", Math.max(-60, Math.min(0, $)));
      }, w = () => {
        window.removeEventListener("mousemove", m), window.removeEventListener("mouseup", w);
      };
      window.addEventListener("mousemove", m), window.addEventListener("mouseup", w);
    }, v = (y) => 8 + (1 - (y - -60) / 66) * 94, M = (y) => 8 + (y - -60) / 66 * 264;
    return (() => {
      var y = es(), T = y.firstChild, f = T.firstChild, m = f.nextSibling, w = m.nextSibling, h = T.nextSibling;
      return p(T, x(z, {
        each: [
          -40,
          -20,
          0
        ],
        children: (g) => (() => {
          var _ = ts(), $ = _.firstChild, L = $.nextSibling;
          return F((O) => {
            var R = v(g), N = v(g), q = M(g), W = M(g);
            return R !== O.e && D($, "y1", O.e = R), N !== O.t && D($, "y2", O.t = N), q !== O.a && D(L, "x1", O.a = q), W !== O.o && D(L, "x2", O.o = W), O;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0
          }), _;
        })()
      }), f), p(T, x(Jn, {
        get cx() {
          return S().x;
        },
        get cy() {
          return S().y;
        },
        onMouseDown: P,
        cursor: "ew-resize"
      }), null), p(h, x(U, {
        label: "Thrsh",
        get value() {
          return se(l(), -60, 0);
        },
        onChange: (g) => e.onParam("threshold", Ce(g, -60, 0)),
        get display() {
          return hn(l());
        },
        get defaultValue() {
          return se(-24, -60, 0);
        }
      }), null), p(h, x(U, {
        label: "Ratio",
        get value() {
          return se(Math.log(Math.max(1, c())), 0, Math.log(20));
        },
        onChange: (g) => e.onParam("ratio", Math.exp(g * Math.log(20))),
        get display() {
          return `${c().toFixed(1)}:1`;
        },
        get defaultValue() {
          return se(Math.log(4), 0, Math.log(20));
        }
      }), null), p(h, x(U, {
        label: "Knee",
        get value() {
          return se(d(), 0, 24);
        },
        onChange: (g) => e.onParam("knee", Ce(g, 0, 24)),
        get display() {
          return `${d().toFixed(1)} dB`;
        },
        get defaultValue() {
          return se(6, 0, 24);
        }
      }), null), p(h, x(U, {
        label: "Atck",
        get value() {
          return ie(Math.max(1e-4, u()), 1e-4, 1);
        },
        onChange: (g) => e.onParam("attack", Ae(g, 1e-4, 1)),
        get display() {
          return mn(u());
        },
        get defaultValue() {
          return ie(5e-3, 1e-4, 1);
        }
      }), null), p(h, x(U, {
        label: "Rel",
        get value() {
          return ie(Math.max(1e-3, b()), 1e-3, 5);
        },
        onChange: (g) => e.onParam("release", Ae(g, 1e-3, 5)),
        get display() {
          return mn(b());
        },
        get defaultValue() {
          return ie(0.1, 1e-3, 5);
        }
      }), null), p(h, x(U, {
        label: "Makup",
        get value() {
          return se(k(), 0, 24);
        },
        onChange: (g) => e.onParam("makeup", Ce(g, 0, 24)),
        get display() {
          return hn(k());
        },
        get defaultValue() {
          return se(0, 0, 24);
        }
      }), null), F((g) => {
        var _ = C(), $ = A();
        return _ !== g.e && D(m, "d", g.e = _), $ !== g.t && D(w, "d", g.t = $), g;
      }, {
        e: void 0,
        t: void 0
      }), y;
    })();
  }
  function gn(e) {
    const t = () => Object.keys(e.paramDefs || {}).filter((o) => o.startsWith("level_")), n = (o) => {
      var _a2;
      const r = jt()[e.modId];
      if (!r) return 0;
      const a = Array.isArray(r) ? r[0] : r, i = `level_${o + 1}`, l = ((_a2 = e.params) == null ? void 0 : _a2[i]) ?? 0;
      return V(a * (1 + l));
    }, s = (o, r, a) => {
      a.preventDefault();
      const i = r[1], l = r[0], d = a.currentTarget.getBoundingClientRect(), u = (A) => {
        const C = 1 - V((A - d.top) / d.height);
        e.onParam(o, l + C * (i - l));
      };
      u(a.clientY);
      const b = (A) => u(A.clientY), k = () => {
        window.removeEventListener("mousemove", b), window.removeEventListener("mouseup", k);
      };
      window.addEventListener("mousemove", b), window.addEventListener("mouseup", k);
    };
    return (() => {
      var o = ns(), r = o.firstChild;
      return p(r, x(z, {
        get each() {
          return t();
        },
        children: (a, i) => {
          const l = e.paramDefs[a], c = () => {
            var _a2;
            return ((_a2 = e.params) == null ? void 0 : _a2[a]) ?? l[2];
          }, d = () => V((c() - l[0]) / (l[1] - l[0])), u = () => {
            var _a2;
            return ((_a2 = e.inactiveChannels) == null ? void 0 : _a2.has(i())) ?? false;
          };
          return (() => {
            var b = rs(), k = b.firstChild, A = k.firstChild, C = A.firstChild, S = A.nextSibling, P = S.firstChild, v = k.nextSibling, M = v.nextSibling;
            return A.$$contextmenu = (y) => {
              y.preventDefault(), e.onParam(a, l[2]);
            }, A.$$dblclick = () => e.onParam(a, l[2]), A.$$mousedown = (y) => s(a, l, y), p(v, () => i() + 1), p(M, () => c().toFixed(2)), F((y) => {
              var T = `flex:1;opacity:${u() ? 0.3 : 1}`, f = u() ? "No input connected" : `channel ${i() + 1}`, m = `height:${d() * 100}%;background:${Nt}`, w = `height:${n(i()) * 100}%;background:${Nt};transition:height 0.08s linear`;
              return y.e = K(b, T, y.e), f !== y.t && D(b, "title", y.t = f), y.a = K(C, m, y.a), y.o = K(P, w, y.o), y;
            }, {
              e: void 0,
              t: void 0,
              a: void 0,
              o: void 0
            }), b;
          })();
        }
      })), o;
    })();
  }
  function _s(e) {
    const a = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.time) ?? 250;
    }, i = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.feedback) ?? 0.3;
    }, l = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.mix) ?? 0.3;
    }, c = () => {
      var _a2;
      return ((_a2 = e.params) == null ? void 0 : _a2.filter) ?? 1;
    }, d = ne(() => {
      const b = [];
      let k = 1;
      const A = 8;
      for (let C = 0; C < A && !(k < 0.02); C++) b.push({
        t: (C + 1) / (A + 1),
        amp: k
      }), k *= V(i()) * 0.95;
      return b;
    }), u = (b) => b < 1e3 ? `${b.toFixed(0)} ms` : `${(b / 1e3).toFixed(2)} s`;
    return (() => {
      var b = os(), k = b.firstChild, A = k.firstChild, C = A.nextSibling, S = k.nextSibling;
      return p(C, x(z, {
        get each() {
          return d();
        },
        children: (P) => {
          const v = 8 + P.t * 264, M = P.amp * 44 * 0.9, y = 8 + (44 - M) / 2;
          return (() => {
            var T = ss();
            return D(T, "x1", v), D(T, "y1", y), D(T, "x2", v), D(T, "y2", y + M), F(() => D(T, "opacity", 0.3 + P.amp * 0.7)), T;
          })();
        }
      })), p(S, x(U, {
        label: "Time",
        get value() {
          return ie(Math.max(0.1, a()), 0.1, 5e3);
        },
        onChange: (P) => e.onParam("time", Ae(P, 0.1, 5e3)),
        get display() {
          return u(a());
        },
        get defaultValue() {
          return ie(250, 0.1, 5e3);
        }
      }), null), p(S, x(U, {
        label: "Fdbk",
        get value() {
          return V(i());
        },
        onChange: (P) => e.onParam("feedback", P * 0.99),
        get display() {
          return ve(V(i()));
        },
        defaultValue: 0.3
      }), null), p(S, x(j, {
        get when() {
          var _a2;
          return (_a2 = e.paramDefs) == null ? void 0 : _a2.filter;
        },
        get children() {
          return x(U, {
            label: "Filt",
            get value() {
              return V(c());
            },
            onChange: (P) => e.onParam("filter", P),
            get display() {
              return ve(V(c()));
            },
            defaultValue: 1
          });
        }
      }), null), p(S, x(U, {
        label: "Mix",
        get value() {
          return V(l());
        },
        onChange: (P) => e.onParam("mix", P),
        get display() {
          return ve(V(l()));
        },
        defaultValue: 0.3
      }), null), b;
    })();
  }
  function st(e) {
    const a = () => {
      const d = jt()[e.modId];
      if (!d) return null;
      const u = Array.isArray(d) ? d[0] : d;
      return V(u);
    }, i = (d) => {
      var _a2, _b, _c, _d;
      const u = ((_a2 = e.params) == null ? void 0 : _a2.drive) ?? 1, b = ((_b = e.params) == null ? void 0 : _b.symmetry) ?? 0, k = ((_c = e.params) == null ? void 0 : _c.bits) ?? 16, A = ((_d = e.params) == null ? void 0 : _d.bias) ?? 0;
      let C = d;
      if (e.type === "wavefolder") {
        let S = (d + b) * u;
        S = S - 4 * Math.floor((S + 1) / 4), C = Math.max(-1, Math.min(1, -(Math.abs(S - 2) - 1)));
      } else if (e.type === "bitcrusher") {
        const S = Math.pow(2, Math.max(1, k));
        C = Math.round(d * S / 2) / (S / 2);
      } else e.type === "tape_saturation" ? C = Math.tanh((d + A) * (1 + u)) : e.type === "ring_mod" ? C = d * Math.sin(d * Math.PI * 2) : C = Math.tanh(d * u);
      return Math.max(-1, Math.min(1, C));
    }, l = ne(() => {
      const d = [];
      for (let b = 0; b <= 100; b++) {
        const k = b / 100, A = k * 2 - 1, C = i(A), S = 8 + k * 264, P = 8 + (1 - (C + 1) / 2) * 64;
        d.push([
          S,
          P
        ]);
      }
      return "M" + d.map((b) => b.join(",")).join(" L");
    }), c = () => {
      const d = a();
      if (d === null) return null;
      const u = d, b = i(u);
      return {
        cx: 8 + (u + 1) / 2 * 264,
        cy: 8 + (1 - (b + 1) / 2) * 64
      };
    };
    return (() => {
      var d = is(), u = d.firstChild, b = u.firstChild, k = b.nextSibling, A = k.nextSibling, C = A.nextSibling, S = u.nextSibling;
      return p(u, x(j, {
        get when() {
          return c();
        },
        get children() {
          var P = as();
          return F((v) => {
            var M = c().cx, y = c().cy;
            return M !== v.e && D(P, "cx", v.e = M), y !== v.t && D(P, "cy", v.t = y), v;
          }, {
            e: void 0,
            t: void 0
          }), P;
        }
      }), null), p(S, x(z, {
        get each() {
          return Object.entries(e.paramDefs || {});
        },
        children: ([P, v]) => {
          const M = () => {
            var _a2;
            return ((_a2 = e.params) == null ? void 0 : _a2[P]) ?? v[2];
          };
          return x(U, {
            get label() {
              return Kn(P);
            },
            get value() {
              return se(M(), v[0], v[1]);
            },
            onChange: (y) => e.onParam(P, Ce(y, v[0], v[1])),
            get defaultValue() {
              return se(v[2], v[0], v[1]);
            },
            get display() {
              return M().toFixed(2);
            }
          });
        }
      })), F(() => D(C, "d", l())), d;
    })();
  }
  const bs = {
    reverb: {
      Space: [
        "size",
        "decay",
        "decay_time",
        "pre_delay"
      ],
      Tone: [
        "damping",
        "tone",
        "filter"
      ],
      Mix: [
        "mix",
        "level"
      ]
    },
    chorus: {
      Modulation: [
        "rate",
        "depth",
        "voices"
      ],
      Mix: [
        "mix",
        "feedback"
      ]
    },
    flanger: {
      Modulation: [
        "rate",
        "depth",
        "feedback"
      ],
      Mix: [
        "mix"
      ]
    },
    phaser: {
      Modulation: [
        "rate",
        "depth",
        "stages"
      ],
      Tone: [
        "center",
        "feedback"
      ],
      Mix: [
        "mix"
      ]
    }
  };
  function oe(e) {
    const t = () => bs[e.type], n = () => Object.keys(e.paramDefs || {}), s = (o) => {
      var _a2;
      const r = (_a2 = e.paramDefs) == null ? void 0 : _a2[o];
      if (!r) return null;
      const a = () => {
        var _a3;
        return ((_a3 = e.params) == null ? void 0 : _a3[o]) ?? r[2];
      };
      return o === "waveform" ? (() => {
        var i = ls();
        return p(i, x(kt, {
          options: Ut,
          get value() {
            return Math.round(a());
          },
          onChange: (l) => e.onParam(o, l)
        })), i;
      })() : x(U, {
        get label() {
          return Kn(o);
        },
        get value() {
          return se(a(), r[0], r[1]);
        },
        onChange: (i) => e.onParam(o, Ce(i, r[0], r[1])),
        get defaultValue() {
          return se(r[2], r[0], r[1]);
        },
        get display() {
          return a().toFixed(2);
        }
      });
    };
    return (() => {
      var o = us();
      return p(o, x(j, {
        get when() {
          return t();
        },
        get fallback() {
          return (() => {
            var r = ds();
            return p(r, x(z, {
              get each() {
                return n();
              },
              children: (a) => s(a)
            })), r;
          })();
        },
        get children() {
          return [
            x(z, {
              get each() {
                return Object.entries(t());
              },
              children: ([r, a]) => {
                const i = () => a.filter((l) => l in (e.paramDefs || {}));
                return x(j, {
                  get when() {
                    return i().length > 0;
                  },
                  get children() {
                    var l = fs(), c = l.firstChild, d = c.nextSibling;
                    return p(c, () => r.toUpperCase()), p(d, x(z, {
                      get each() {
                        return i();
                      },
                      children: (u) => s(u)
                    })), l;
                  }
                });
              }
            }),
            x(j, {
              get when() {
                return n().filter((r) => !Object.values(t()).flat().includes(r)).length > 0;
              },
              get children() {
                var r = cs();
                return p(r, x(z, {
                  get each() {
                    return n().filter((a) => !Object.values(t()).flat().includes(a));
                  },
                  children: (a) => s(a)
                })), r;
              }
            })
          ];
        }
      })), o;
    })();
  }
  _e([
    "mousedown",
    "click",
    "dblclick",
    "contextmenu"
  ]);
  var xs = E('<div class="relative w-full cursor-ew-resize h-2"style=background:rgba(136,153,170,0.25)><div class="absolute top-0 left-0 h-full pointer-events-none bg-label">'), ws = E('<button class="text-base bg-transparent border-none cursor-pointer px-0.5 py-0 leading-none opacity-40 hover:opacity-100 hover:text-danger transition-all text-text-secondary">\u2715'), $s = E('<span class="type-label text-label leading-none opacity-60"style=position:relative;top:1px>INST'), ks = E('<div class="flex items-center gap-2"><span class="type-tag text-label">'), Ps = E('<div class="flex flex-col px-2 py-1 gap-3">'), Ms = E('<div class="flex-shrink-0 flex flex-col border border-border px-0.5 pt-1 pb-0.5 bg-bg-secondary self-start"><div class="px-2 pt-0.5 pb-4 cursor-grab select-none"><div class="flex items-center justify-between"><span class="type-module border-none m-0 pb-0 text-text-primary">'), As = E('<div class="flex flex-col"style=gap:1px><div class="flex justify-between items-baseline"><span class="type-label data-label">:</span><span class="type-value data-value">'), Cs = E('<div><div class="flex flex-col gap-1">'), Ss = E('<div class="flex items-center gap-2 cursor-pointer"><span class="type-port text-label leading-none"style=min-width:20px></span><span class="type-port data-label leading-none truncate flex-1 italic"></span><div>');
  const at = {
    filter: We,
    svf: We,
    moog_filter: We,
    ms20_filter: We,
    formant_filter: We,
    oscillator: ot,
    pwm_oscillator: ot,
    supersaw: ot,
    fm_operator: ot,
    lfo: vs,
    compressor: ys,
    mixer: gn,
    cv_mixer: gn,
    delay_line: _s,
    wavefolder: st,
    ring_mod: st,
    bitcrusher: st,
    tape_saturation: st,
    reverb: oe,
    chorus: oe,
    flanger: oe,
    phaser: oe,
    comb_filter: oe,
    slew_limiter: oe,
    envelope_follower: oe,
    attenuverter: oe,
    pitch_quantizer: oe,
    vca: oe,
    stereo_panner: oe,
    clock: oe,
    clock_divider: oe,
    noise_gen: oe,
    grain_player: oe,
    wavetable: oe,
    additive_osc: oe
  };
  function Ds(e) {
    const t = Number(e);
    return Math.abs(t) >= 1e3 ? t.toFixed(0) : Math.abs(t) >= 10 ? t.toFixed(1) : t.toFixed(3);
  }
  function Ts(e) {
    let t;
    const [n, s] = G(false), o = () => {
      const l = ((typeof e.value == "function" ? e.value() : e.value) - e.min) / (e.max - e.min);
      return Math.max(0, Math.min(1, l));
    }, r = (i) => {
      const l = t.getBoundingClientRect(), c = Math.max(0, Math.min(1, (i.clientX - l.left) / l.width));
      return e.min + c * (e.max - e.min);
    }, a = (i) => {
      i.preventDefault(), s(true), e.onValue(r(i));
      const l = (d) => {
        n() && e.onValue(r(d));
      }, c = () => {
        s(false), window.removeEventListener("mousemove", l), window.removeEventListener("mouseup", c);
      };
      window.addEventListener("mousemove", l), window.addEventListener("mouseup", c);
    };
    return Pe(() => s(false)), (() => {
      var i = xs(), l = i.firstChild;
      i.$$dblclick = (d) => {
        d.preventDefault(), e.defaultValue !== void 0 && e.onValue(e.defaultValue);
      }, i.$$mousedown = a;
      var c = t;
      return typeof c == "function" ? qe(c, i) : t = i, F((d) => K(l, `width:${o() * 100}%`, d)), i;
    })();
  }
  function pn(e) {
    const t = () => e.mod, n = () => e.layer, s = () => t().id === n().mixer_id;
    G(null);
    const o = () => t().type_name, r = () => et(o()), a = () => qn(o()), i = () => new Set((n().connections || []).filter((v) => v.from_module === t().id).map((v) => v.from_port)), l = () => new Set((n().connections || []).filter((v) => v.to_module === t().id).map((v) => v.to_port)), c = async () => {
      await fetch(`/layer/${n().id}/module/${t().id}`, {
        method: "DELETE"
      }).catch((v) => console.warn("delete module failed", v));
    }, d = async (v, M) => {
      const y = Br();
      if (y === null) {
        if (M !== "output") {
          Te("Click an OUTPUT port first (top of card)", 3e3);
          return;
        }
        Lt({
          layerId: n().id,
          moduleId: t().id,
          port: v
        }), Te(`FROM: ${t().name} [${a().outputs[v]}] \u2014 now click an INPUT`);
      } else {
        if (M !== "input") {
          Te("Click an INPUT port (bottom of card) to complete", 3e3);
          return;
        }
        const T = {
          from_module: y.moduleId,
          from_port: y.port,
          to_module: t().id,
          to_port: v
        };
        Lt(null), On();
        const f = await fetch(`/layer/${n().id}/patch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(T)
        }).catch((m) => (Te(`Network error: ${m.message}`, 3e3), null));
        if (f && !f.ok) {
          const m = await f.json().catch(() => ({}));
          Te(`Error: ${m.error || f.status}`, 3e3);
        }
      }
    }, u = () => s() ? [] : a().outputs, b = () => s() ? Array.from({
      length: 8
    }, (v, M) => `in_${M + 1}`) : a().inputs, k = () => [
      "sequencer",
      "global_seq",
      "kick_drum",
      "snare",
      "hihat",
      "bass_line"
    ].includes(o()), A = () => o() === "adsr", C = () => at[o()] !== void 0, S = () => k() ? "290px" : A() || C() ? "200px" : "190px", P = () => S();
    return (() => {
      var v = Ms(), M = v.firstChild, y = M.firstChild, T = y.firstChild;
      return M.$$mousedown = (f) => {
        if (f.target.closest("button")) return;
        f.preventDefault();
        const m = f.target.closest("[data-module-id]");
        if (!m) return;
        let w = null;
        m.style.opacity = "0.3";
        let h = document.createElement("div");
        h.style.cssText = "position:absolute;width:1px;background:rgba(0,0,0,0.3);pointer-events:none;z-index:9999;transition:top 0.1s,left 0.1s,height 0.1s", document.body.appendChild(h), h.style.display = "none";
        const g = ($) => {
          m.style.pointerEvents = "none";
          const L = document.elementFromPoint($.clientX, $.clientY);
          m.style.pointerEvents = "";
          const O = L == null ? void 0 : L.closest("[data-module-id]");
          if (O && O !== m && O.dataset.layerId === m.dataset.layerId) {
            w = O;
            const R = O.getBoundingClientRect();
            h.style.display = "", h.style.left = `${R.left - 7}px`, h.style.top = `${R.top}px`, h.style.height = `${R.height}px`;
          } else w = null, h.style.display = "none";
        }, _ = () => {
          if (window.removeEventListener("mousemove", g), window.removeEventListener("mouseup", _), m.style.opacity = "", h.remove(), w) {
            const $ = m.dataset.moduleId, L = w.dataset.moduleId, O = Object.values(n().modules || {}).sort((q, W) => (q.seq ?? 0) - (W.seq ?? 0)), R = O.findIndex((q) => q.id === $), N = O.findIndex((q) => q.id === L);
            if (R >= 0 && N >= 0) {
              const q = O.map((W) => W.id);
              q.splice(R, 1), q.splice(N, 0, $), q.forEach((W, re) => {
                be("layers", n().id, "modules", W, "seq", re);
              }), fetch(`/layer/${n().id}/reorder`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  order: q
                })
              }).catch((W) => console.warn("reorder failed", W));
            }
          }
        };
        window.addEventListener("mousemove", g), window.addEventListener("mouseup", _);
      }, p(T, (() => {
        var f = me(() => !!s());
        return () => f() ? "Main Mixer" : t().name;
      })()), p(y, x(j, {
        get when() {
          return !s();
        },
        get children() {
          var f = ws();
          return f.$$click = c, f;
        }
      }), null), p(M, x(j, {
        get when() {
          return !s();
        },
        get children() {
          var f = ks(), m = f.firstChild;
          return p(m, o), p(f, x(j, {
            get when() {
              return k();
            },
            get children() {
              return $s();
            }
          }), null), f;
        }
      }), null), p(v, x(j, {
        get when() {
          return o() === "adsr";
        },
        get children() {
          return x(Wo, {
            get attack() {
              var _a2;
              return ((_a2 = t().params) == null ? void 0 : _a2.attack) ?? 0.01;
            },
            get decay() {
              var _a2;
              return ((_a2 = t().params) == null ? void 0 : _a2.decay) ?? 0.1;
            },
            get sustain() {
              var _a2;
              return ((_a2 = t().params) == null ? void 0 : _a2.sustain) ?? 0.7;
            },
            get release() {
              var _a2;
              return ((_a2 = t().params) == null ? void 0 : _a2.release) ?? 0.3;
            },
            onParam: (f, m) => Ue(n().id, t().id, f, m)
          });
        }
      }), null), p(v, x(j, {
        get when() {
          return me(() => o() !== "adsr" && !k())() && at[o()];
        },
        get children() {
          return x(Nr, {
            get component() {
              return at[o()];
            },
            get type() {
              return o();
            },
            get modId() {
              return t().id;
            },
            get params() {
              return t().params || {};
            },
            get paramDefs() {
              return r();
            },
            get inactiveChannels() {
              return me(() => !!s())() ? new Set(Array.from({
                length: 8
              }, (f, m) => m).filter((f) => !l().has(`in_${f + 1}`))) : void 0;
            },
            onParam: (f, m) => Ue(n().id, t().id, f, m)
          });
        }
      }), null), p(v, x(j, {
        get when() {
          return me(() => o() !== "adsr" && !k() && !at[o()])() && Object.keys(r()).length > 0;
        },
        get children() {
          var f = Ps();
          return p(f, x(z, {
            get each() {
              return Object.entries(r());
            },
            children: ([m, [w, h, g]]) => {
              const _ = () => {
                var _a2;
                const $ = (_a2 = t().params) == null ? void 0 : _a2[m];
                return $ !== void 0 ? $ : g;
              };
              return (() => {
                var $ = As(), L = $.firstChild, O = L.firstChild, R = O.firstChild, N = O.nextSibling;
                return p(O, m, R), p(N, () => Ds(_())), p($, x(Ts, {
                  min: w,
                  max: h,
                  value: _,
                  defaultValue: g,
                  onValue: (q) => Ue(n().id, t().id, m, q)
                }), null), $;
              })();
            }
          })), f;
        }
      }), null), p(v, x(j, {
        get when() {
          return o() === "scope";
        },
        get children() {
          return x(fo, {
            get moduleId() {
              return t().id;
            }
          });
        }
      }), null), p(v, x(j, {
        get when() {
          return k();
        },
        get children() {
          return x(To, {
            get modId() {
              return t().id;
            },
            get layerId() {
              return n().id;
            },
            get modType() {
              return o();
            },
            modParams: () => t().params,
            params: () => t().params,
            layer: n
          });
        }
      }), null), p(v, x(j, {
        get when() {
          return u().length > 0;
        },
        get children() {
          return x(vn, {
            get ports() {
              return u();
            },
            dir: "output",
            get connected() {
              return i();
            },
            get moduleId() {
              return t().id;
            },
            get layerId() {
              return n().id;
            },
            onPortClick: d
          });
        }
      }), null), p(v, x(j, {
        get when() {
          return b().length > 0;
        },
        get children() {
          return x(vn, {
            get ports() {
              return b();
            },
            dir: "input",
            get connected() {
              return l();
            },
            get moduleId() {
              return t().id;
            },
            get layerId() {
              return n().id;
            },
            onPortClick: d
          });
        }
      }), null), F((f) => {
        var m = t().id, w = n().id, h = `width:${S()};min-width:${P()};border-width:0.5px`;
        return m !== f.e && D(v, "data-module-id", f.e = m), w !== f.t && D(v, "data-layer-id", f.t = w), f.a = K(v, h, f.a), f;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      }), v;
    })();
  }
  function vn(e) {
    const t = () => e.dir === "output" ? "OUT" : "IN";
    return (() => {
      var n = Cs(), s = n.firstChild;
      return p(s, x(z, {
        get each() {
          return e.ports;
        },
        children: (o, r) => x(Es, {
          portName: o,
          get index() {
            return r();
          },
          get dir() {
            return e.dir;
          },
          get dirLabel() {
            return t();
          },
          get showLabel() {
            return r() === 0;
          },
          get moduleId() {
            return e.moduleId;
          },
          get layerId() {
            return e.layerId;
          },
          get connected() {
            return e.connected.has(o);
          },
          onClick: () => e.onPortClick(o, e.dir)
        })
      })), F(() => ke(n, `px-2 ${e.dir === "output" ? "pt-6 pb-1" : "pt-2 pb-2"}`)), n;
    })();
  }
  function Es(e) {
    const t = () => e.connected ? "#0d8a3d" : "#a8a8a0", n = () => e.connected ? "#0d8a3d" : "transparent", s = () => {
      const r = vt();
      return r && e.dir === "input" && r.hoverModuleId === e.moduleId && r.hoverPort === e.index;
    }, o = (r) => {
      if (e.dir !== "output") return;
      r.preventDefault(), r.stopPropagation();
      const a = r.target.getBoundingClientRect(), i = a.left + a.width / 2, l = a.top + a.height / 2;
      let c = false;
      Mt({
        layerId: e.layerId,
        moduleId: e.moduleId,
        port: e.portName,
        startX: i,
        startY: l,
        curX: i,
        curY: l,
        hoverModuleId: null,
        hoverPort: null
      });
      const d = (b) => {
        var _a2, _b;
        c = true;
        const A = (_b = (_a2 = document.elementFromPoint(b.clientX, b.clientY)) == null ? void 0 : _a2.closest) == null ? void 0 : _b.call(_a2, ".port-dot.input");
        Mt((C) => {
          var _a3;
          return {
            ...C,
            curX: b.clientX,
            curY: b.clientY,
            hoverModuleId: ((_a3 = A == null ? void 0 : A.dataset) == null ? void 0 : _a3.moduleId) || null,
            hoverPort: A ? A.dataset.port : null
          };
        });
      }, u = async (b) => {
        window.removeEventListener("mousemove", d), window.removeEventListener("mouseup", u);
        const k = vt();
        if (Mt(null), !c) {
          e.onClick();
          return;
        }
        if ((k == null ? void 0 : k.hoverModuleId) && k.hoverPort !== null) {
          const A = {
            from_module: k.moduleId,
            from_port: k.port,
            to_module: k.hoverModuleId,
            to_port: k.hoverPort
          }, C = await fetch(`/layer/${k.layerId}/patch`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(A)
          }).catch((S) => (Te(`Network error: ${S.message}`, 3e3), null));
          if (C && !C.ok) {
            const S = await C.json().catch(() => ({}));
            Te(`Error: ${S.error || C.status}`, 3e3);
          }
        }
      };
      window.addEventListener("mousemove", d), window.addEventListener("mouseup", u);
    };
    return (() => {
      var r = Ss(), a = r.firstChild, i = a.nextSibling, l = i.nextSibling;
      return Ie(r, "click", e.onClick, true), p(a, (() => {
        var c = me(() => !!e.showLabel);
        return () => c() ? e.dirLabel : "";
      })()), p(i, () => e.portName), l.$$mousedown = o, F((c) => {
        var d = `${e.dir}: ${e.portName}`, u = `flex-shrink-0 cursor-pointer port-dot ${e.dir === "input" ? "!rounded-full" : ""}`, b = {
          [e.dir]: true
        }, k = e.portName, A = e.moduleId, C = `width:10px;height:10px;border:1px solid ${s() ? "#1aa650" : t()};background:${s() ? "#0d8a3d" : n()}`;
        return d !== c.e && D(r, "title", c.e = d), u !== c.t && ke(l, c.t = u), c.a = It(l, b, c.a), k !== c.o && D(l, "data-port", c.o = k), A !== c.i && D(l, "data-module-id", c.i = A), c.n = K(l, C, c.n), c;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0,
        i: void 0,
        n: void 0
      }), r;
    })();
  }
  _e([
    "mousedown",
    "dblclick",
    "click"
  ]);
  var Ls = E('<span class="type-section border-none m-0 pb-0">'), Os = E('<input type=text data-no-drag class="type-section border-none m-0 p-0 bg-transparent outline-none text-text-primary"style=font-family:var(--font-heading);width:auto;min-width:1ch>'), qs = E('<div class="flex gap-3 px-12 items-start"style=padding-bottom:24px><div class="flex-shrink-0 sticky z-10 self-start"style=top:66px></div><div class="flex flex-wrap gap-3 items-start flex-1 min-w-0">'), Ns = E('<div><div class="flex items-center justify-between px-12 pt-6 pb-4 select-none sticky top-0 z-20"style=cursor:grab><div class="flex items-center gap-3"><svg width=24 height=24 viewBox="0 0 24 24"class="flex-shrink-0 cursor-pointer meter-dot"data-no-drag><circle class=meter-dot-ring cx=12 cy=12 r=11 fill=#141414 stroke=rgba(255,255,255,0.08) stroke-width=1></circle></svg><span class="type-tag text-label"style=position:relative;top:1px>'), Rs = E('<svg><circle cx=12 cy=12 style="transition:r 0.1s ease,fill 0.2s ease,opacity 0.1s ease"></svg>', false, true, false), Fs = E("<svg><line x1=6 y1=6 x2=18 y2=18 stroke=#fff stroke-width=1.5 opacity=0.08></svg>", false, true, false);
  const yn = /* @__PURE__ */ new Map();
  function Is(e) {
    const t = () => e.layer, [n, s] = G(null), o = () => {
      const f = S();
      if (!(f == null ? void 0 : f.params)) return false;
      const m = Object.entries(f.params).filter(([w]) => w.startsWith("level_"));
      return m.length === 0 ? false : m.every(([, w]) => w === 0);
    }, [r, a] = G(false), [i, l] = G(""), [c, d] = G(yn.get(e.layer.id) ?? false), u = (f) => {
      d(f), yn.set(e.layer.id, f);
    }, [b, k] = G(false);
    Rt(() => {
      if (b()) {
        const f = () => k(false);
        setTimeout(() => window.addEventListener("click", f), 0), Pe(() => window.removeEventListener("click", f));
      }
    });
    const A = async () => {
      const f = i().trim();
      a(false), !(!f || f === t().name) && await fetch(`/layer/${t().id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: f
        })
      }).catch((m) => console.warn("rename layer failed", m));
    }, C = () => Object.values(t().modules || {}).sort((f, m) => (f.seq ?? 0) - (m.seq ?? 0)), S = () => {
      var _a2;
      const f = t().mixer_id;
      return f ? (_a2 = t().modules) == null ? void 0 : _a2[f] : null;
    }, P = () => {
      const f = t().mixer_id;
      if (!f) return [
        0,
        0
      ];
      const w = jt()[f];
      return Array.isArray(w) ? w : [
        w ?? 0,
        0
      ];
    };
    let v = 0.01;
    const M = () => {
      const f = P()[0];
      return f > v && (v = f), v = v * 0.9995 + f * 5e-4, Math.min(1, f / Math.max(5e-3, v));
    }, y = () => Math.max(0, Math.min(1, P()[1])), T = () => Math.round(y() * 360);
    return (() => {
      var f = Ns(), m = f.firstChild, w = m.firstChild, h = w.firstChild;
      h.firstChild;
      var g = h.nextSibling;
      return m.$$mousedown = (_) => {
        if (_.button !== 0 || r() || _.target.closest("[data-no-drag]")) return;
        const $ = _.clientX, L = _.clientY;
        let O = false;
        const R = 5, N = _.currentTarget.closest("[data-layer-reorder]");
        if (!N) return;
        let q = null, W = null;
        const re = () => {
          O = true, document.body.style.cursor = "grabbing", N.style.opacity = "0.3", W = document.createElement("div"), W.style.cssText = "position:absolute;height:1px;background:rgba(255,255,255,0.6);pointer-events:none;z-index:9999;display:none", document.body.appendChild(W);
        }, Me = (J) => {
          if (!O) {
            const B = J.clientX - $, fe = J.clientY - L;
            if (B * B + fe * fe < R * R) return;
            re();
          }
          N.style.pointerEvents = "none";
          const le = document.elementFromPoint(J.clientX, J.clientY);
          N.style.pointerEvents = "";
          const X = le == null ? void 0 : le.closest("[data-layer-reorder]");
          if (X && X !== N) {
            q = X;
            const B = X.getBoundingClientRect();
            W.style.display = "", W.style.left = `${B.left}px`, W.style.top = `${B.top - 1}px`, W.style.width = `${B.width}px`;
          } else q = null, W && (W.style.display = "none");
        }, ge = () => {
          var _a2;
          if (window.removeEventListener("mousemove", Me), window.removeEventListener("mouseup", ge), !O) return;
          document.body.style.cursor = "", N.style.opacity = "", W == null ? void 0 : W.remove();
          const J = (le) => {
            le.preventDefault(), le.stopPropagation(), window.removeEventListener("click", J, true);
          };
          if (window.addEventListener("click", J, true), q) {
            const le = N.dataset.layerReorder, X = q.dataset.layerReorder;
            le !== X && ((_a2 = e.onReorder) == null ? void 0 : _a2.call(e, le, X));
          }
        };
        window.addEventListener("mousemove", Me), window.addEventListener("mouseup", ge);
      }, m.$$click = (_) => {
        _.defaultPrevented || r() || _.target.closest("[data-no-drag]") || u(!c());
      }, h.$$click = (_) => {
        var _a2;
        _.stopPropagation();
        const $ = t().mixer_id;
        if (!$) return;
        const L = 6, O = 160;
        if (o()) {
          const R = n() || {};
          for (let N = 1; N <= L; N++) setTimeout(() => {
            const q = N / L;
            for (let W = 1; W <= 8; W++) Ue(t().id, $, `level_${W}`, (R[`level_${W}`] ?? 0.4) * q);
          }, (N - 1) * (O / L));
        } else {
          const R = S(), N = {};
          for (let q = 1; q <= 8; q++) N[`level_${q}`] = ((_a2 = R == null ? void 0 : R.params) == null ? void 0 : _a2[`level_${q}`]) ?? 0.4;
          s(N);
          for (let q = 1; q <= L; q++) setTimeout(() => {
            const W = 1 - q / L;
            for (let re = 1; re <= 8; re++) Ue(t().id, $, `level_${re}`, N[`level_${re}`] * W);
          }, (q - 1) * (O / L));
        }
      }, p(h, (() => {
        var _ = me(() => !o());
        return () => _() && (() => {
          var $ = Rs();
          return F((L) => {
            var O = Math.max(0.5, Math.min(10, M() * 10)), R = (() => {
              const q = T(), W = M(), re = Math.max(0, (W - 0.85) / 0.15), Me = 60 + re * 35, ge = 70 - re * 50;
              return `hsl(${q}, ${ge}%, ${Me}%)`;
            })(), N = 0.1 + Math.min(1, M() * 1.3) * 0.9;
            return O !== L.e && D($, "r", L.e = O), R !== L.t && D($, "fill", L.t = R), N !== L.a && D($, "opacity", L.a = N), L;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          }), $;
        })();
      })(), null), p(h, (() => {
        var _ = me(() => !!o());
        return () => _() && Fs();
      })(), null), p(w, x(j, {
        get when() {
          return !r();
        },
        get children() {
          var _ = Ls();
          return p(_, () => t().name), _;
        }
      }), g), p(w, x(j, {
        get when() {
          return r();
        },
        get children() {
          var _ = Os();
          return qe(($) => setTimeout(() => $.focus(), 0), _), _.$$keydown = ($) => {
            $.key === "Enter" && A(), $.key === "Escape" && a(false);
          }, _.$$click = ($) => $.stopPropagation(), _.addEventListener("blur", A), _.$$input = ($) => {
            l($.target.value), $.target.size = Math.max(1, $.target.value.length);
          }, F(() => D(_, "size", Math.max(1, i().length))), F(() => _.value = i()), _;
        }
      }), g), p(g, () => t().id.slice(0, 8)), p(f, x(j, {
        get when() {
          return !c();
        },
        get children() {
          var _ = qs(), $ = _.firstChild, L = $.nextSibling;
          return p($, x(z, {
            get each() {
              return C().filter((O) => O.id === t().mixer_id);
            },
            children: (O) => x(pn, {
              mod: O,
              get layer() {
                return t();
              }
            })
          })), p(L, x(z, {
            get each() {
              return C().filter((O) => O.id !== t().mixer_id);
            },
            children: (O) => x(pn, {
              mod: O,
              get layer() {
                return t();
              }
            })
          })), _;
        }
      }), null), F((_) => {
        var $ = `${e.showBorder ? "border-b border-border" : ""} ${b() ? "relative z-[500]" : ""}`, L = t().id;
        return $ !== _.e && ke(f, _.e = $), L !== _.t && D(f, "data-layer-reorder", _.t = L), _;
      }, {
        e: void 0,
        t: void 0
      }), f;
    })();
  }
  _e([
    "click",
    "mousedown",
    "input",
    "keydown"
  ]);
  const js = "modulepreload", Hs = function(e) {
    return "/" + e;
  }, _n = {}, Ws = function(t, n, s) {
    let o = Promise.resolve();
    if (n && n.length > 0) {
      document.getElementsByTagName("link");
      const a = document.querySelector("meta[property=csp-nonce]"), i = (a == null ? void 0 : a.nonce) || (a == null ? void 0 : a.getAttribute("nonce"));
      o = Promise.allSettled(n.map((l) => {
        if (l = Hs(l), l in _n) return;
        _n[l] = true;
        const c = l.endsWith(".css"), d = c ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${l}"]${d}`)) return;
        const u = document.createElement("link");
        if (u.rel = c ? "stylesheet" : js, c || (u.as = "script"), u.crossOrigin = "", u.href = l, i && u.setAttribute("nonce", i), document.head.appendChild(u), c) return new Promise((b, k) => {
          u.addEventListener("load", b), u.addEventListener("error", () => k(new Error(`Unable to preload CSS for ${l}`)));
        });
      }));
    }
    function r(a) {
      const i = new Event("vite:preloadError", {
        cancelable: true
      });
      if (i.payload = a, window.dispatchEvent(i), !i.defaultPrevented) throw a;
    }
    return o.then((a) => {
      for (const i of a || []) i.status === "rejected" && r(i.reason);
      return t().catch(r);
    });
  };
  var Gs = E('<canvas class="absolute top-0 left-0 pointer-events-none z-50"style=width:100%;height:100%>');
  const wt = 256, Ee = 8, Le = typeof SharedArrayBuffer < "u", Zn = Le ? new SharedArrayBuffer(wt * Ee * 4) : null, Qn = Le ? new SharedArrayBuffer(3 * 4) : null, H = Le ? new Float32Array(Zn) : new Float32Array(wt * Ee), ce = Le ? new Int32Array(Qn) : new Int32Array(3), Bs = [
    5,
    12
  ];
  function bn(e, t, n, s) {
    const o = n - e, r = s - t, a = Math.sqrt(o * o + r * r), i = Math.max(80, a * 0.55), l = (e + n) / 2, c = (t + s) / 2 + i;
    return {
      cp1x: (e * 2 + l) / 3,
      cp1y: (t * 2 + c) / 3,
      cp2x: (n * 2 + l) / 3,
      cp2y: (s * 2 + c) / 3
    };
  }
  function Vs(e, t) {
    const n = ce[0], s = ce[1], o = ce[2];
    if (e.clearRect(0, 0, s, o), n !== 0) {
      e.lineWidth = 8, e.lineCap = "round";
      for (let r = 0; r < n; r++) {
        const a = r * Ee, i = 0.5 + 0.5 * Math.sin(t * 2.8 + r * 1.3);
        e.globalAlpha = 0.12 + 0.08 * i, e.strokeStyle = "#0d8a3d", e.beginPath(), e.moveTo(H[a], H[a + 1]), e.bezierCurveTo(H[a + 2], H[a + 3], H[a + 4], H[a + 5], H[a + 6], H[a + 7]), e.stroke();
      }
      e.lineWidth = 3;
      for (let r = 0; r < n; r++) {
        const a = r * Ee, i = 0.5 + 0.5 * Math.sin(t * 2.8 + r * 1.3);
        e.globalAlpha = 0.4 + 0.25 * i, e.strokeStyle = "#1aa650", e.beginPath(), e.moveTo(H[a], H[a + 1]), e.bezierCurveTo(H[a + 2], H[a + 3], H[a + 4], H[a + 5], H[a + 6], H[a + 7]), e.stroke();
      }
      e.lineWidth = 1.5, e.globalAlpha = 0.85, e.setLineDash(Bs);
      for (let r = 0; r < n; r++) {
        const a = r * Ee;
        e.lineDashOffset = -((t * 55 + r * 17) % 17);
        const l = 138 + 40 * (0.5 + 0.5 * Math.sin(t * 3.2 + r * 1.3)) | 0;
        e.strokeStyle = `rgb(13,${l},61)`, e.beginPath(), e.moveTo(H[a], H[a + 1]), e.bezierCurveTo(H[a + 2], H[a + 3], H[a + 4], H[a + 5], H[a + 6], H[a + 7]), e.stroke();
      }
      e.setLineDash([]), e.globalAlpha = 1;
    }
  }
  function zs() {
    let e, t, n, s;
    function o() {
      const r = window.devicePixelRatio || 1, a = e == null ? void 0 : e.getBoundingClientRect(), i = a ? a.left : 0, l = a ? a.top : 0;
      let c = 0;
      for (const u of Object.values(Y.layers || {})) for (const b of u.connections || []) {
        if (c >= wt) break;
        const k = document.querySelector(`[data-module-id="${b.from_module}"] .port-dot.output[data-port="${b.from_port}"]`), A = document.querySelector(`[data-module-id="${b.to_module}"] .port-dot.input[data-port="${b.to_port}"]`);
        if (!k || !A) continue;
        const C = k.getBoundingClientRect(), S = A.getBoundingClientRect(), P = (C.left - i + C.width / 2) * r, v = (C.top - l + C.height / 2) * r, M = (S.left - i + S.width / 2) * r, y = (S.top - l + S.height / 2) * r, { cp1x: T, cp1y: f, cp2x: m, cp2y: w } = bn(P, v, M, y), h = c * Ee;
        H[h] = P, H[h + 1] = v, H[h + 2] = T, H[h + 3] = f, H[h + 4] = m, H[h + 5] = w, H[h + 6] = M, H[h + 7] = y, c++;
      }
      const d = vt();
      if (d && c < wt) {
        const u = (d.startX - i) * r, b = (d.startY - l) * r, k = (d.curX - i) * r, A = (d.curY - l) * r, { cp1x: C, cp1y: S, cp2x: P, cp2y: v } = bn(u, b, k, A), M = c * Ee;
        H[M] = u, H[M + 1] = b, H[M + 2] = C, H[M + 3] = S, H[M + 4] = P, H[M + 5] = v, H[M + 6] = k, H[M + 7] = A, c++;
      }
      Le ? Atomics.store(ce, 0, c) : ce[0] = c;
    }
    return je(() => {
      const r = window.devicePixelRatio || 1, a = ((e == null ? void 0 : e.clientWidth) || window.innerWidth) * r | 0, i = ((e == null ? void 0 : e.clientHeight) || window.innerHeight) * r | 0;
      if (Le) Atomics.store(ce, 1, a), Atomics.store(ce, 2, i), Ws(async () => {
        const { default: c } = await import("./cable.worker-B44i7V7l.js");
        return {
          default: c
        };
      }, []).then(({ default: c }) => {
        t = new c();
        const d = e.transferControlToOffscreen();
        t.postMessage({
          type: "init",
          canvas: d,
          controlSAB: Zn,
          headerSAB: Qn
        }, [
          d
        ]);
      });
      else {
        let c = function() {
          Vs(d, performance.now() / 1e3), n = requestAnimationFrame(c);
        };
        ce[1] = a, ce[2] = i, e.width = a, e.height = i;
        const d = e.getContext("2d");
        n = requestAnimationFrame(c);
      }
      function l() {
        const c = window.devicePixelRatio || 1, d = ((e == null ? void 0 : e.clientWidth) || window.innerWidth) * c | 0, u = ((e == null ? void 0 : e.clientHeight) || window.innerHeight) * c | 0;
        Le ? (Atomics.store(ce, 1, d), Atomics.store(ce, 2, u), t == null ? void 0 : t.postMessage({
          type: "resize",
          w: d,
          h: u
        })) : (ce[1] = d, ce[2] = u, e.width = d, e.height = u), o();
      }
      window.addEventListener("resize", l), s = setInterval(o, 100), o(), Pe(() => {
        window.removeEventListener("resize", l), clearInterval(s), cancelAnimationFrame(n), t == null ? void 0 : t.terminate();
      });
    }), Rt(() => {
      JSON.stringify(Object.values(Y.layers || {}).map((r) => r.connections)), vt(), o();
    }), (() => {
      var r = Gs(), a = e;
      return typeof a == "function" ? qe(a, r) : e = r, r;
    })();
  }
  var Xs = E('<svg width=22 height=22 viewBox="-12 -12 24 24"class=flex-shrink-0>'), Us = E("<svg><circle cx=0 cy=0 r=8 fill=none stroke-width=1.2></svg>", false, true, false), Ys = E('<svg><polygon points="8,0 4,6.928 -4,6.928 -8,0 -4,-6.928 4,-6.928"fill=none stroke-width=1.2></svg>', false, true, false), Ks = E("<svg><rect x=-8 y=-6 width=16 height=12 fill=none stroke-width=1.2></svg>", false, true, false), Js = E('<div class="fixed inset-0 z-[300] bg-black/85">'), Zs = E('<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] flex flex-col bg-bg-primary border border-border p-4 gap-3"style=width:min(720px,92vw);max-height:86vh><div class="type-section section-title">Add Module</div><div class="flex flex-wrap gap-1.5 overflow-y-auto"style=max-height:60vh></div><div class="flex items-center gap-2"><span class="type-label data-label">Name:</span><input type=text placeholder=(auto) class=flex-1></div><div class="flex gap-2 justify-end"><button class="type-button cursor-pointer px-3 py-0.5 transition-colors bg-bg-primary border border-border text-text-secondary hover:text-text-primary">cancel</button><button class="type-button cursor-pointer px-3 py-0.5 transition-colors bg-bg-primary border border-label text-label hover:bg-label hover:text-white">add'), Qs = E("<button><span class=type-button>");
  const ea = {
    mixer: {
      fam: "core",
      shape: "rect"
    },
    oscillator: {
      fam: "audio",
      shape: "circle"
    },
    pwm_oscillator: {
      fam: "audio",
      shape: "circle"
    },
    fm_operator: {
      fam: "audio",
      shape: "circle"
    },
    supersaw: {
      fam: "audio",
      shape: "circle"
    },
    wavetable: {
      fam: "audio",
      shape: "circle"
    },
    additive_osc: {
      fam: "audio",
      shape: "circle"
    },
    phase_distortion: {
      fam: "audio",
      shape: "circle"
    },
    noise_gen: {
      fam: "audio",
      shape: "circle"
    },
    filter: {
      fam: "audio",
      shape: "rect"
    },
    svf: {
      fam: "audio",
      shape: "rect"
    },
    moog_filter: {
      fam: "audio",
      shape: "rect"
    },
    ms20_filter: {
      fam: "audio",
      shape: "rect"
    },
    formant_filter: {
      fam: "audio",
      shape: "rect"
    },
    comb_filter: {
      fam: "audio",
      shape: "rect"
    },
    adsr: {
      fam: "control",
      shape: "rect"
    },
    lfo: {
      fam: "control",
      shape: "circle"
    },
    envelope_follower: {
      fam: "control",
      shape: "rect"
    },
    slew_limiter: {
      fam: "control",
      shape: "circle"
    },
    vca: {
      fam: "audio",
      shape: "circle"
    },
    ring_mod: {
      fam: "audio",
      shape: "circle"
    },
    compressor: {
      fam: "audio",
      shape: "rect"
    },
    delay_line: {
      fam: "audio",
      shape: "rect"
    },
    reverb: {
      fam: "audio",
      shape: "rect"
    },
    chorus: {
      fam: "audio",
      shape: "rect"
    },
    phaser: {
      fam: "audio",
      shape: "rect"
    },
    flanger: {
      fam: "audio",
      shape: "rect"
    },
    wavefolder: {
      fam: "audio",
      shape: "rect"
    },
    bitcrusher: {
      fam: "audio",
      shape: "rect"
    },
    tape_saturation: {
      fam: "audio",
      shape: "rect"
    },
    stereo_panner: {
      fam: "audio",
      shape: "rect"
    },
    sequencer: {
      fam: "timing",
      shape: "rect"
    },
    global_seq: {
      fam: "timing",
      shape: "rect"
    },
    clock: {
      fam: "timing",
      shape: "rect"
    },
    euclidean: {
      fam: "timing",
      shape: "rect"
    },
    clock_divider: {
      fam: "timing",
      shape: "rect"
    },
    arpeggiator: {
      fam: "timing",
      shape: "rect"
    },
    cv_mixer: {
      fam: "control",
      shape: "rect"
    },
    attenuverter: {
      fam: "utility",
      shape: "circle"
    },
    sample_hold: {
      fam: "utility",
      shape: "rect"
    },
    pitch_quantizer: {
      fam: "control",
      shape: "rect"
    },
    bernoulli_gate: {
      fam: "control",
      shape: "rect"
    },
    scope: {
      fam: "utility",
      shape: "rect"
    },
    bass_line: {
      fam: "inst",
      shape: "hex"
    },
    kick_drum: {
      fam: "inst",
      shape: "hex"
    },
    snare: {
      fam: "inst",
      shape: "hex"
    },
    hihat: {
      fam: "inst",
      shape: "hex"
    }
  };
  function ta(e) {
    return ea[e] || {
      fam: "utility",
      shape: "rect"
    };
  }
  function na(e) {
    return e === "timing" ? "#D5BE59" : e === "inst" ? "#E8ECEB" : e === "core" || e === "audio" ? "#4D8BC6" : "#A2AB73";
  }
  function ra(e) {
    const t = () => ta(e.type), n = () => na(t().fam);
    return (() => {
      var s = Xs();
      return p(s, (() => {
        var o = me(() => t().shape === "circle");
        return () => o() && (() => {
          var r = Us();
          return F(() => D(r, "stroke", n())), r;
        })();
      })(), null), p(s, (() => {
        var o = me(() => t().shape === "hex");
        return () => o() && (() => {
          var r = Ys();
          return F(() => D(r, "stroke", n())), r;
        })();
      })(), null), p(s, (() => {
        var o = me(() => t().shape === "rect");
        return () => o() && (() => {
          var r = Ks();
          return F(() => D(r, "stroke", n())), r;
        })();
      })(), null), s;
    })();
  }
  function oa(e) {
    const [t, n] = G(null), [s, o] = G(""), r = () => [
      ...Vr().map((l) => ({
        label: l,
        type: l,
        wasm: false
      })),
      ...Xr().map((l) => ({
        label: l,
        type: l,
        wasm: true
      }))
    ], a = async () => {
      if (!t()) return;
      const l = {
        type: t()
      };
      s().trim() && (l.name = s().trim());
      const c = e.layerId;
      e.onClose();
      const d = await fetch(`/layer/${c}/module`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(l)
      }).catch((u) => (console.warn("add module failed", u), null));
      if (d && !d.ok) {
        const u = await d.json().catch(() => ({}));
        alert(`Error: ${u.error || d.status}`);
      }
    }, i = (l) => t() === l;
    return [
      (() => {
        var l = Js();
        return Ie(l, "click", e.onClose, true), l;
      })(),
      (() => {
        var l = Zs(), c = l.firstChild, d = c.nextSibling, u = d.nextSibling, b = u.firstChild, k = b.nextSibling, A = u.nextSibling, C = A.firstChild, S = C.nextSibling;
        return p(d, x(z, {
          get each() {
            return r();
          },
          children: ({ label: P, type: v, wasm: M }) => (() => {
            var y = Qs(), T = y.firstChild;
            return y.$$click = () => n(v), D(y, "title", v), p(y, x(ra, {
              type: v
            }), T), p(T, P, null), p(T, M ? " [wasm]" : "", null), F(() => ke(y, `cursor-pointer transition-colors px-2 py-1 border flex items-center gap-2 ${i(v) ? "bg-accent border-accent text-white" : "bg-bg-primary border-border text-text-primary hover:border-label"}`)), y;
          })()
        })), k.$$input = (P) => o(P.target.value), Ie(C, "click", e.onClose, true), S.$$click = a, F(() => k.value = s()), l;
      })()
    ];
  }
  _e([
    "click",
    "input"
  ]);
  var sa = E('<aside class="flex flex-col border-r border-border bg-bg-secondary sticky self-start"style="width:380px;min-width:340px;top:48px;max-height:calc(100vh - 48px)"><header class="px-3 py-2 border-b border-border type-section section-title">Agent</header><div class="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"></div><footer class="border-t border-border p-2 flex flex-col gap-1.5">'), aa = E("<div>"), ia = E('<pre class="type-mono text-label whitespace-pre-wrap border border-border px-2 py-1 bg-bg-primary text-text-secondary">'), la = E('<button class="type-button text-left text-sm border border-border px-2 py-1.5 bg-bg-primary hover:border-label hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary cursor-pointer">');
  const ca = [
    {
      label: "Add seven oscillators across a frequency range, into a filter",
      user: "Add seven oscillators across a frequency range and route them through a filter.",
      run: async (e) => {
        var _a2, _b;
        const t = I.addModule(e, {
          type: "filter",
          name: "cluster_filt"
        });
        I.setParam(e, t.id, "cutoff", 900), I.setParam(e, t.id, "resonance", 3);
        const n = I.addModule(e, {
          type: "lfo",
          name: "sweep"
        });
        I.setParam(e, n.id, "rate", 0.18), I.setParam(e, n.id, "depth", 0.4), I.addConnection(e, {
          from_module: n.id,
          from_port: "cv_out",
          to_module: t.id,
          to_port: "cutoff_cv"
        });
        const s = 80, o = 540;
        for (let a = 0; a < 7; a++) {
          const i = Math.round(s + (o - s) / 6 * a), l = I.addModule(e, {
            type: "oscillator",
            name: `osc_${a + 1}`
          });
          I.setParam(e, l.id, "frequency", i), I.setParam(e, l.id, "amplitude", 0.12), I.setParam(e, l.id, "waveform", 1), I.addConnection(e, {
            from_module: l.id,
            from_port: "audio_out",
            to_module: t.id,
            to_port: "audio_in"
          });
        }
        const r = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.mixer_id;
        return r && I.addConnection(e, {
          from_module: t.id,
          from_port: "audio_out",
          to_module: r,
          to_port: "in_1"
        }), [
          "add filter cluster_filt cutoff=900 resonance=3",
          "add lfo sweep rate=0.18 depth=0.4",
          "patch sweep.cv_out -> cluster_filt.cutoff_cv",
          "add oscillator osc_1..osc_7 frequency=80..540",
          "patch osc_*.audio_out -> cluster_filt.audio_in",
          "patch cluster_filt.audio_out -> mixer.in_1"
        ];
      }
    },
    {
      label: "Add a noise-and-delay wash on channel 2",
      user: "Layer some noise through tape saturation and a long delay.",
      run: async (e) => {
        var _a2, _b;
        const t = I.addModule(e, {
          type: "noise_gen",
          name: "wash_noise"
        }), n = I.addModule(e, {
          type: "tape_saturation",
          name: "tape"
        });
        I.setParam(e, n.id, "drive", 2.5);
        const s = I.addModule(e, {
          type: "delay_line",
          name: "long_delay"
        });
        I.setParam(e, s.id, "time", 420), I.setParam(e, s.id, "feedback", 0.55), I.setParam(e, s.id, "mix", 0.6), I.addConnection(e, {
          from_module: t.id,
          from_port: "audio_out",
          to_module: n.id,
          to_port: "audio_in"
        }), I.addConnection(e, {
          from_module: n.id,
          from_port: "audio_out",
          to_module: s.id,
          to_port: "audio_in"
        });
        const o = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.mixer_id;
        return o && I.addConnection(e, {
          from_module: s.id,
          from_port: "audio_out",
          to_module: o,
          to_port: "in_2"
        }), [
          "add noise_gen wash_noise",
          "add tape_saturation tape drive=2.5",
          "add delay_line long_delay time=420 feedback=0.55 mix=0.6",
          "patch wash_noise -> tape -> long_delay -> mixer.in_2"
        ];
      }
    },
    {
      label: "Add a slow FM bell into reverb",
      user: "Build a soft FM bell tone with a long reverb tail.",
      run: async (e) => {
        var _a2, _b;
        const t = I.addModule(e, {
          type: "fm_operator",
          name: "bell"
        });
        I.setParam(e, t.id, "frequency", 220), I.setParam(e, t.id, "ratio", 3.5), I.setParam(e, t.id, "mod_index", 4), I.setParam(e, t.id, "level", 0.3);
        const n = I.addModule(e, {
          type: "reverb",
          name: "hall"
        });
        I.setParam(e, n.id, "decay", 0.9), I.setParam(e, n.id, "mix", 0.6), I.addConnection(e, {
          from_module: t.id,
          from_port: "audio_out",
          to_module: n.id,
          to_port: "audio_in"
        });
        const s = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.mixer_id;
        return s && I.addConnection(e, {
          from_module: n.id,
          from_port: "audio_out",
          to_module: s,
          to_port: "in_3"
        }), [
          "add fm_operator bell ratio=3.5 mod_index=4",
          "add reverb hall decay=0.9 mix=0.6",
          "patch bell -> hall -> mixer.in_3"
        ];
      }
    },
    {
      label: "Build a four-on-the-floor drum pattern",
      user: "Set up a basic kick / snare / hihat pattern with a sequencer.",
      run: async (e) => {
        var _a2, _b;
        const t = I.addModule(e, {
          type: "kick_drum",
          name: "kick"
        }), n = I.addModule(e, {
          type: "snare",
          name: "snare"
        }), s = I.addModule(e, {
          type: "hihat",
          name: "hat"
        }), o = I.addModule(e, {
          type: "sequencer",
          name: "seq_kick"
        }), r = I.addModule(e, {
          type: "sequencer",
          name: "seq_snare"
        }), a = I.addModule(e, {
          type: "sequencer",
          name: "seq_hat"
        });
        await new Promise((c) => setTimeout(c, 20));
        const i = async (c, d) => {
          for (let u = 0; u < 16; u++) await fetch(`/layer/${e}/sequencer/${c}/step/${u}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              gate: !!d[u],
              pitch: 60,
              velocity: 1
            })
          });
        };
        await i(o.id, [
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]), await i(r.id, [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]), await i(a.id, [
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0,
          1,
          0
        ]), I.addConnection(e, {
          from_module: o.id,
          from_port: "gate",
          to_module: t.id,
          to_port: "gate"
        }), I.addConnection(e, {
          from_module: r.id,
          from_port: "gate",
          to_module: n.id,
          to_port: "gate"
        }), I.addConnection(e, {
          from_module: a.id,
          from_port: "gate",
          to_module: s.id,
          to_port: "gate"
        });
        const l = (_b = (_a2 = Y.layers) == null ? void 0 : _a2[e]) == null ? void 0 : _b.mixer_id;
        return l && (I.addConnection(e, {
          from_module: t.id,
          from_port: "audio_out",
          to_module: l,
          to_port: "in_4"
        }), I.addConnection(e, {
          from_module: n.id,
          from_port: "audio_out",
          to_module: l,
          to_port: "in_5"
        }), I.addConnection(e, {
          from_module: s.id,
          from_port: "audio_out",
          to_module: l,
          to_port: "in_6"
        })), [
          "add kick_drum kick",
          "add snare snare",
          "add hihat hat",
          "add sequencer seq_kick / seq_snare / seq_hat",
          "program: kick on 1,5,9,13 \u2022 snare on 5,13 \u2022 hat on every off-beat",
          "patch each seq.gate -> drum.gate -> mixer"
        ];
      }
    },
    {
      label: "Clear all modules",
      user: "Reset the patch.",
      run: async (e) => {
        var _a2;
        const t = (_a2 = Y.layers) == null ? void 0 : _a2[e];
        if (!t) return [];
        for (const n of Object.keys(t.modules || {})) n !== t.mixer_id && I.removeModule(e, n);
        return [
          "cleared all modules except mixer"
        ];
      }
    }
  ];
  function ua() {
    const [e, t] = G([
      {
        role: "assistant",
        text: "Welcome. Pick a prompt below to ask the agent to build a patch. Modules appear on the right; tweak the knobs and patch ports directly."
      }
    ]), [n, s] = G(false);
    let o;
    const r = () => Object.keys(Y.layers || {})[0], a = async (i) => {
      if (!n()) {
        s(true), t((l) => [
          ...l,
          {
            role: "user",
            text: i.user
          }
        ]);
        try {
          await Ht();
          const l = r();
          if (!l) throw new Error("no layer");
          t((d) => [
            ...d,
            {
              role: "assistant",
              text: "patching..."
            }
          ]);
          const c = await i.run(l);
          t((d) => {
            const u = d.slice(0, -1);
            return u.push({
              role: "assistant",
              kind: "cmd",
              text: c.join(`
`)
            }), u.push({
              role: "assistant",
              text: "done \u2014 adjust knobs and ports on the right."
            }), u;
          }), Oe("sys", `chat: ${i.label}`);
        } catch (l) {
          t((c) => [
            ...c,
            {
              role: "assistant",
              text: `error: ${l.message}`
            }
          ]);
        } finally {
          s(false), queueMicrotask(() => {
            o && (o.scrollTop = o.scrollHeight);
          });
        }
      }
    };
    return je(() => {
      o && (o.scrollTop = o.scrollHeight);
    }), (() => {
      var i = sa(), l = i.firstChild, c = l.nextSibling, d = c.nextSibling;
      return qe((u) => o = u, c), p(c, x(z, {
        get each() {
          return e();
        },
        children: (u) => x(j, {
          get when() {
            return u.kind !== "cmd";
          },
          get fallback() {
            return (() => {
              var b = ia();
              return p(b, () => u.text), b;
            })();
          },
          get children() {
            var b = aa();
            return p(b, () => u.text), F(() => ke(b, `type-body text-sm leading-snug ${u.role === "user" ? "self-end text-text-primary border border-border bg-bg-primary px-2 py-1 max-w-[85%]" : "text-text-secondary max-w-[90%]"}`)), b;
          }
        })
      })), p(d, x(z, {
        each: ca,
        children: (u) => (() => {
          var b = la();
          return b.$$click = () => a(u), p(b, () => u.label), F(() => b.disabled = n()), b;
        })()
      })), i;
    })();
  }
  _e([
    "click"
  ]);
  var da = E('<span class="type-status text-text-primary flex items-center gap-1.5"><span class="inline-block w-2 h-2 bg-success"></span> live'), fa = E('<div class="p-6 data-label text-base">Engine failed to start.'), ma = E('<div class="type-label fixed bottom-3 left-1/2 -translate-x-1/2 border border-border px-4 py-1 z-[200] whitespace-nowrap bg-bg-secondary text-text-primary">'), ha = E('<div class="dc-engine relative flex flex-col bg-bg-primary bg-dotted border border-border"tabindex=-1 style=min-height:560px><header class="flex items-center justify-between px-3 py-1.5 border-b border-border sticky top-0 z-40 bg-bg-primary"><div class="flex items-center gap-3"><span class="type-title border-none m-0 pb-0">Drone Circle \u2014 Interactive Demo</span></div><div class="flex items-center gap-3"></div></header><div class="flex relative items-start"><div class="flex-1 relative min-w-0">'), ga = E('<button class="type-button text-sm border border-accent px-2 py-1 bg-bg-primary hover:bg-accent hover:text-white transition-colors cursor-pointer">\u25B6 Start audio'), pa = E('<div class="flex flex-col min-h-full"style=gap:0;padding-bottom:120px>');
  function va() {
    const [e, t] = G(false), [n, s] = G(null), [o, r] = G(false);
    je(async () => {
      await co() || t(true);
      const c = setInterval(async () => {
        try {
          const d = await fetch("/meters");
          d.ok && Ln(await d.json());
        } catch {
        }
      }, 150);
      Pe(() => clearInterval(c));
    });
    const a = (l) => {
      l.key === "Escape" && (Lt(null), On(), n() && s(null));
    }, i = async () => {
      await Ht(), r(true);
    };
    return (() => {
      var l = ha(), c = l.firstChild, d = c.firstChild, u = d.nextSibling, b = c.nextSibling, k = b.firstChild;
      return l.$$keydown = a, p(u, x(j, {
        get when() {
          return o();
        },
        get fallback() {
          return (() => {
            var A = ga();
            return A.$$click = i, A;
          })();
        },
        get children() {
          return da();
        }
      })), p(b, x(ua, {}), k), p(k, x(j, {
        get when() {
          return e();
        },
        get children() {
          return fa();
        }
      }), null), p(k, x(j, {
        get when() {
          return !e();
        },
        get children() {
          return x(ya, {
            onAddModule: (A) => s(A)
          });
        }
      }), null), p(l, x(zs, {}), null), p(l, x(j, {
        get when() {
          return sn();
        },
        get children() {
          var A = ma();
          return p(A, sn), A;
        }
      }), null), p(l, x(j, {
        get when() {
          return n();
        },
        get children() {
          return x(oa, {
            get layerId() {
              return n();
            },
            onClose: () => s(null)
          });
        }
      }), null), l;
    })();
  }
  function ya(e) {
    const t = () => Object.values(Y.layers || {});
    return (() => {
      var n = pa();
      return p(n, x(z, {
        get each() {
          return t();
        },
        children: (s) => x(Is, {
          layer: s,
          get onAddModule() {
            return e.onAddModule;
          },
          showBorder: false,
          onReorder: () => {
          }
        })
      })), n;
    })();
  }
  _e([
    "keydown",
    "click"
  ]);
  const xn = document.getElementById("drone-interactive-root");
  xn && Mr(() => x(va, {}), xn);
  fetch("/content.json").then((e) => e.json()).then((e) => {
    document.querySelectorAll("[data-content]").forEach((t) => {
      const n = t.dataset.content;
      n === "title_word_1" ? e.title && (t.textContent = e.title.split(" ")[0] || t.textContent) : n === "title_word_2" ? e.title && (t.textContent = e.title.split(" ").slice(1).join(" ") || t.textContent) : e[n] !== void 0 && (t.innerHTML = e[n]);
    });
  }).catch(() => {
  });
})();
