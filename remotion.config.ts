/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

// Use PNG for intermediate frame captures so the source going into the
// encoder is lossless. JPEG (the previous default) introduced subtle
// chroma artefacts on gradients and text edges. PNG renders are slower
// and use more disk for intermediates, but the final MP4 is meaningfully
// cleaner — no compression-on-compression smearing.
Config.setVideoImageFormat("png");

Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);
