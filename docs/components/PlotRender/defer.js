import {ref, onMounted, onUpdated, onUnmounted} from "vue";
import * as Plot from "@observablehq/plot";

/**
 * Composable to defer `el` rendering
 *
 * @param {string} method Plot method to be used. Default `plot`
 * @param {Ref<PlotOptions>} options Plot options
 *
 * @returns {{ el: Ref<HTMLElement> }} Object `{el}` for template ref
 */
export function useDefer(method, options) {
  const el = ref(null);

  let _idling,
    _observer = null;

  const disconnect = () => {
    if (_observer !== null) {
      _observer.disconnect();
      _observer = null;
    }
    if (_idling !== null) {
      cancelIdleCallback(_idling);
      _idling = null;
    }
  };
  const unmounted = () => {
    while (el.value.lastChild) el.value.lastChild.remove();
    disconnect();
  };
  function observed() {
    unmounted(); // remove old plot (and listeners)
    el.value.append(Plot[method](options.value));
  }
  function mounted() {
    disconnect(); // remove old listeners

    const rect = el.value.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      observed();
    } else {
      _observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) observed();
        },
        {rootMargin: "100px"}
      );
      _observer.observe(el.value);
      if (typeof requestIdleCallback === "function") {
        _idling = requestIdleCallback(observed);
      }
    }
  }
  onMounted(mounted);
  onUpdated(mounted);
  onUnmounted(unmounted);

  return {el};
}
