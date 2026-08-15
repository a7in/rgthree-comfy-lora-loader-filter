# rgthree-comfy-lora-loader-filter

Frontend-only patch for **Power Lora Loader (rgthree)**. Does not modify rgthree-comfy files.

## What it does

Adds a **`folder`** text field on the node. The LoRA chooser ("Choose a lora") lists only files under that path inside `models/loras`. ComfyUI's **Filter list** then searches within that subset.

Value is stored in node property **`Folder Prefix`** (saved in workflow JSON). Optional rgthree **`Match`** regex is applied after the folder filter.

## Requirements

- [rgthree-comfy](https://github.com/rgthree/rgthree-comfy)

## Install

Place in `ComfyUI/custom_nodes/rgthree-comfy-lora-loader-filter/`, restart ComfyUI, hard-refresh the browser (Ctrl+F5).

Console should show: `[rgthree-comfy-lora-loader-filter] patched Power Lora Loader folder filter`

## Usage

| `folder` value | Shows LoRAs from |
|---|---|
| `characters` | `models/loras/characters/...` |
| `style/anime` | `models/loras/style/anime/...` |
| *(empty)* | all folders (default) |

Path is relative to `models/loras`. Slashes and backslashes both work. Matching is case-insensitive.

Already selected LoRAs are not removed — only the chooser is filtered.

## How it works

On `setup()`, patches the registered node prototype: wraps `addNonLoraWidgets`, replaces `showLoraChooser`, syncs `onPropertyChanged`.

## Troubleshooting

- **No `folder` field** — rgthree not loaded; restart + hard refresh.
- **Empty list** — wrong folder path or no LoRA files in that folder.

## License

Unofficial add-on, not affiliated with rgthree-comfy.
