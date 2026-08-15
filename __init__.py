"""
Frontend-only patch for rgthree Power Lora Loader.

Adds a `folder` text field that restricts the LoRA chooser to a subdirectory
of models/loras. Does not register any new node types.
"""

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
WEB_DIRECTORY = "./web"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
