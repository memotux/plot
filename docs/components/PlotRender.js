import * as Plot from "@observablehq/plot";
import {h, defineComponent} from "vue";
import {Document} from "./document";
import {toHyperScript} from "./toHyperScript";

export default defineComponent({
  name: "PlotRender",
  props: {
    options: Object,
    mark: Object,
    defer: Boolean,
    method: {type: String, default: "plot"}
  },
  computed: {
    opts() {
      return {
        ...(this.method === "plot" && {
          marks: !this.mark ? [] : [this.mark],
          width: 688 // better default for VitePress
        }),
        ...this.options,
        className: "plot"
      };
    }
  },
  created() {
    this._observer = null;
    this._idling = null;
  },
  mounted() {
    if (this.defer) {
      this.observe();
    }
  },
  updated() {
    if (this.defer) {
      this.observe();
    } else {
      this.replace();
    }
  },
  unmounted() {
    if (this.defer) {
      this.clean();
    }
  },
  methods: {
    observe() {
      this.disconnect(); // remove old listeners
      const rect = this.$refs.el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        this.replace();
      } else {
        this._observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) this.replace();
          },
          {rootMargin: "100px"}
        );
        this._observer.observe(this.$refs.el);
        if (typeof requestIdleCallback === "function") {
          this._idling = requestIdleCallback(this.replace);
        }
      }
    },
    disconnect() {
      if (this._observer !== null) {
        this._observer.disconnect();
        this._observer = null;
      }
      if (this._idling !== null) {
        cancelIdleCallback(this._idling);
        this._idling = null;
      }
    },
    clean() {
      while (this.$refs.el.lastChild) this.$refs.el.lastChild.remove();
      this.disconnect();
    },
    replace() {
      this.clean();
      this.$refs.el.append(Plot[this.method](this.opts));
    }
  },
  render() {
    const {method} = this;
    if (this.defer) {
      const height = this.options?.height || 400;
      return h(
        "span",
        method === "plot"
          ? [
              h("div", {
                style: {
                  maxWidth: "100%",
                  width: `688px`,
                  aspectRatio: `688 / ${height}`
                },
                ref: "el"
              })
            ]
          : []
      );
    }
    if (typeof document !== "undefined") {
      return h("span", {ref: "el"}, [toHyperScript(Plot[method](this.opts))]);
    }
    return h("span", [Plot[method]({...this.opts, document: new Document()}).toHyperScript()]);
  }
});
