import { defineNuxtPlugin } from "#app";
import posthog from "posthog-js";

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();

  const posthogClient = posthog.init(runtimeConfig.public.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost,
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        posthog.debug();
      }
    },
  });

  return {
    provide: {
      posthog: () => posthogClient,
    },
  };
});
