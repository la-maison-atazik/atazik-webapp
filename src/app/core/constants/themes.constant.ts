import { Preset } from "@primeuix/themes/types";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";

export const customPreset: Preset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{yellow.50}",
      100: "{yellow.100}",
      200: "{yellow.200}",
      300: "{yellow.300}",
      400: "{yellow.400}",
      500: "{yellow.500}",
      600: "{yellow.600}",
      700: "{yellow.700}",
      800: "{yellow.800}",
      900: "{yellow.900}",
      950: "{yellow.950}",
    },
  },
});
