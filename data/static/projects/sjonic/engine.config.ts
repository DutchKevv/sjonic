import { DEFAULT_ENGINE_CONFIG } from "@foreplay/client-core/src/engine.options.default";
import _CONFIG from './config.json';

export const config = Object.assign({}, DEFAULT_ENGINE_CONFIG, _CONFIG);