const COLORS = [
  "#3d2c3a",
  "#ff6b9d",
  "#ff9ec4",
  "#c56bff",
  "#6bc5ff",
  "#6bffb8",
  "#ffd56b",
  "#ff8c6b",
  "#ffffff",
];

class DrawCanvas {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = COLORS[1];
    this.size = 6;
    this.erasing = false;
    this.drawing = false;
    this.last = null;

    this._resize();
    this._fillWhite();
    this._bindEvents();
    if (options.paletteEl) this._buildPalette(options.paletteEl);
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(rect.width || 300, 600);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.logicalSize = size;
  }

  _fillWhite() {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.logicalSize, this.logicalSize);
  }

  _pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.logicalSize / rect.width;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale,
    };
  }

  _bindEvents() {
    const start = (e) => {
      e.preventDefault();
      this.drawing = true;
      this.last = this._pos(e);
      this._stroke(this.last, this.last);
    };
    const move = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      const p = this._pos(e);
      this._stroke(this.last, p);
      this.last = p;
    };
    const end = () => {
      this.drawing = false;
      this.last = null;
    };

    this.canvas.addEventListener("mousedown", start);
    this.canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    this.canvas.addEventListener("touchstart", start, { passive: false });
    this.canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("resize", () => {
      const img = this.exportDataUrl();
      this._resize();
      if (img) this.loadFromDataUrl(img);
      else this._fillWhite();
    });
  }

  _stroke(from, to) {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.lineWidth = this.size;
    if (this.erasing) {
      this.ctx.globalCompositeOperation = "destination-out";
      this.ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      this.ctx.globalCompositeOperation = "source-over";
      this.ctx.strokeStyle = this.color;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = "source-over";
  }

  _buildPalette(el) {
    COLORS.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-btn" + (i === 1 ? " active" : "");
      btn.style.background = c;
      btn.setAttribute("aria-label", `色 ${c}`);
      btn.addEventListener("click", () => {
        this.erasing = false;
        this.color = c;
        el.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      el.appendChild(btn);
    });
  }

  setBrushSize(n) {
    this.size = Number(n);
  }

  setEraser(on) {
    this.erasing = on;
  }

  clear() {
    this._fillWhite();
  }

  exportDataUrl() {
    return this.canvas.toDataURL("image/png");
  }

  loadFromDataUrl(url) {
    if (!url) {
      this.clear();
      return;
    }
    const img = new Image();
    img.onload = () => {
      this._fillWhite();
      this.ctx.drawImage(img, 0, 0, this.logicalSize, this.logicalSize);
    };
    img.src = url;
  }

  isBlank() {
    const blank = document.createElement("canvas");
    blank.width = this.canvas.width;
    blank.height = this.canvas.height;
    const bctx = blank.getContext("2d");
    bctx.fillStyle = "#fff";
    bctx.fillRect(0, 0, blank.width, blank.height);
    return this.canvas.toDataURL() === blank.toDataURL();
  }
}

window.DrawCanvas = DrawCanvas;
window.DRAW_COLORS = COLORS;
