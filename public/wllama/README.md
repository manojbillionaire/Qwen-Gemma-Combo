# wllama WASM files

After `npm install`, copy the wllama WASM files here:

```bash
cp node_modules/@wllama/wllama/esm/single-thread/wllama.wasm public/wllama/single-thread/wllama.wasm
cp node_modules/@wllama/wllama/esm/multi-thread/wllama.wasm  public/wllama/multi-thread/wllama.wasm
cp node_modules/@wllama/wllama/esm/multi-thread/wllama.worker.mjs public/wllama/multi-thread/wllama.worker.mjs
```

Or use the postinstall script in package.json which does this automatically.
