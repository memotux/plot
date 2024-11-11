import * as Plot from "@observablehq/plot";
import {h, computed, ref, onUpdated, defineComponent} from "vue";
import {Document} from "./Document";
import {toHyperScript} from "./toHyperScript";
import {useDefer} from "./defer";

export default defineComponent({
  props: {
    options: Object,
    mark: Object,
    defer: Boolean,
    method: {type: String, default: "plot"}
  },
  setup(props) {
    const {method} = props;
    const options = computed(() => ({
      ...(method === "plot" && {
        marks: props.mark == null ? [] : [props.mark],
        width: 688 // better default for VitePress
      }),
      ...props.options,
      className: "plot"
    }));
    if (props.defer) {
      const {el} = useDefer(method, options);
      return () =>
        h(
          "span",
          method === "plot"
            ? [
                h(
                  "div",
                  {
                    style: {
                      maxWidth: "100%",
                      width: `688px`,
                      aspectRatio: `688 / ${props.options?.height || 400}`
                    },
                    ref: el
                  },
                  "Loading Plot defered..."
                )
              ]
            : []
        );
    }
    if (typeof document !== "undefined") {
      const el = ref(null);
      const plot = Plot[method](options.value);
      onUpdated(() => {
        while (el.value.lastChild) el.value.lastChild.remove();
        el.value.append(plot);
      });
      return () => h("span", {ref: el}, [toHyperScript(plot)]);
    }
    return () => h("span", [Plot[method]({...options.value, document: new Document()}).toHyperScript()]);
  }
});
