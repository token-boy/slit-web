/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import webp_dec from './codec/dec/webp_dec.js';
import { initEmscriptenModule } from './utils.js';
let emscriptenModule;
export async function init(module, moduleOptionOverrides) {
    emscriptenModule = initEmscriptenModule(webp_dec, module, moduleOptionOverrides);
}
export default async function decode(buffer) {
    if (!emscriptenModule)
        init();
    const module = await emscriptenModule;
    const result = module.decode(buffer);
    if (!result)
        throw new Error('Decoding error');
    return result;
}
