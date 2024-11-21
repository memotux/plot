import * as Plot from "@observablehq/plot";
import {h, withDirectives} from "vue";
import {Document} from "./document";
import {toHyperScript} from "./toHyperScript";

export default {
  props: {
    options: Object,
    mark: Object,
    defer: Boolean,
    method: {type: String, default: "plot"}
  },
  render() {
    const {method} = this;
    const options = {
      ...(method === "plot" && {
        marks: this.mark == null ? [] : [this.mark],
        width: 688 // better default for VitePress
      }),
      ...this.options,
      className: "plot"
    };
    if (this.defer) {
      const mounted = (el) => {
        disconnect(); // remove old listeners
        function observed() {
          unmounted(el); // remove old plot (and listeners)
          el.append(Plot[method](options));
        }
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          observed();
        } else {
          this._observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) observed();
            },
            {rootMargin: "100px"}
          );
          this._observer.observe(el);
          if (typeof requestIdleCallback === "function") {
            this._idling = requestIdleCallback(observed);
          }
        }
      };
      const unmounted = (el) => {
        while (el.lastChild) el.lastChild.remove();
        disconnect();
      };
      const disconnect = () => {
        if (this._observer !== undefined) {
          this._observer.disconnect();
          this._observer = undefined;
        }
        if (this._idling !== undefined) {
          cancelIdleCallback(this._idling);
          this._idling = undefined;
        }
      };
      const {height = 400} = this.options;
      return withDirectives(
        h(
          "span",
          method === "plot"
            ? [
                h("div", {
                  style: {
                    maxWidth: "100%",
                    width: `688px`,
                    aspectRatio: `688 / ${height}`
                  }
                })
              ]
            : []
        ),
        [
          [
            {
              mounted,
              updated: mounted,
              unmounted
            }
          ]
        ]
      );
    }
    if (typeof document !== "undefined") {
      const plot = Plot[method](options);
      const replace = (el) => {
        while (el.lastChild) el.lastChild.remove();
        el.append(plot);
      };
      return withDirectives(h("span", [toHyperScript(plot)]), [[{mounted: replace, updated: replace}]]);
    }
    return h("span", [Plot[method]({...options, document: new Document()}).toHyperScript()]);
  }
};
