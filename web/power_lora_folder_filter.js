import { app } from "../../scripts/app.js";
import { rgthreeApi } from "../../rgthree/common/rgthree_api.js";

const NODE_TYPE = "Power Lora Loader (rgthree)";
const PROP_FOLDER = "Folder Prefix";
const WIDGET_NAME = "folder";
const PATCH_FLAG = "__rgthreeLoraFolderFilterPatched";
const LOG = "[rgthree-comfy-lora-loader-filter]";

function matchesFolder(file, folderPrefix) {
  const folder = String(folderPrefix || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  if (!folder) return true;
  const path = String(file || "")
    .replace(/\\/g, "/")
    .toLowerCase();
  return path === folder || path.startsWith(`${folder}/`);
}

function isPowerLoraNode(node) {
  return node?.type === NODE_TYPE || node?.comfyClass === NODE_TYPE;
}

function ensureFolderWidget(node) {
  if (!node) return;
  if (node.properties[PROP_FOLDER] == null) {
    node.properties[PROP_FOLDER] = "";
  }
  const existing = node.widgets?.find((w) => w.name === WIDGET_NAME);
  if (existing) {
    existing.value = String(node.properties[PROP_FOLDER] || "");
    existing.callback = (value) => {
      node.properties[PROP_FOLDER] = value;
    };
    existing.options = existing.options || {};
    existing.options.serialize = false;
    return;
  }
  node.addWidget(
    "text",
    WIDGET_NAME,
    String(node.properties[PROP_FOLDER] || ""),
    (value) => {
      node.properties[PROP_FOLDER] = value;
    },
    { serialize: false },
  );
  try {
    const computed = node.computeSize?.() || node.size;
    if (computed && node.size) {
      node.size[0] = Math.max(node.size[0], computed[0]);
      node.size[1] = Math.max(node.size[1], computed[1]);
    }
  } catch (_e) {
    /* ignore */
  }
}

function patchExistingNodes() {
  const nodes = app.graph?._nodes || app.graph?.nodes || [];
  for (const node of nodes) {
    if (isPowerLoraNode(node)) ensureFolderWidget(node);
  }
}

function findNodeType() {
  const types = LiteGraph.registered_node_types || {};
  if (types[NODE_TYPE]) return types[NODE_TYPE];
  const key = Object.keys(types).find(
    (k) => k.includes("Power Lora Loader") && k.includes("rgthree"),
  );
  return key ? types[key] : null;
}

function patchPrototype(proto) {
  if (proto[PATCH_FLAG]) return;
  proto[PATCH_FLAG] = true;

  const origAddNonLoraWidgets = proto.addNonLoraWidgets;
  proto.addNonLoraWidgets = function () {
    if (typeof origAddNonLoraWidgets === "function") {
      origAddNonLoraWidgets.apply(this, arguments);
    }
    ensureFolderWidget(this);
  };

  const origOnNodeCreated = proto.onNodeCreated;
  proto.onNodeCreated = function () {
    const result = origOnNodeCreated?.apply(this, arguments);
    ensureFolderWidget(this);
    return result;
  };

  const origOnPropertyChanged = proto.onPropertyChanged;
  proto.onPropertyChanged = function (name, value, prevValue) {
    if (name === PROP_FOLDER) {
      const widget = this.widgets?.find((w) => w.name === WIDGET_NAME);
      if (widget) widget.value = String(value ?? "");
    }
    if (typeof origOnPropertyChanged === "function") {
      return origOnPropertyChanged.call(this, name, value, prevValue);
    }
    return true;
  };

  const origShow = proto.showLoraChooser;
  proto.showLoraChooser = async function (event, onChoose) {
    if (typeof origShow !== "function") return;
    const origGet = rgthreeApi.getLoras.bind(rgthreeApi);
    const folder = this.properties[PROP_FOLDER];
    rgthreeApi.getLoras = (force) =>
      origGet(force).then((list) =>
        (list || []).filter((l) => matchesFolder(l?.file ?? l, folder)),
      );
    try {
      return await origShow.call(this, event, onChoose);
    } finally {
      rgthreeApi.getLoras = origGet;
    }
  };
}

function applyPatch() {
  const nodeType = findNodeType();
  if (!nodeType?.prototype) {
    console.warn(`${LOG} Power Lora Loader (rgthree) not found. Is rgthree-comfy installed?`);
    return false;
  }
  patchPrototype(nodeType.prototype);
  patchExistingNodes();
  console.log(`${LOG} patched Power Lora Loader folder filter`);
  return true;
}

app.registerExtension({
  name: "rgthree-comfy-lora-loader-filter",
  async setup() {
    if (applyPatch()) return;
    // Node defs can finish registering after the first setup tick.
    setTimeout(applyPatch, 500);
    setTimeout(applyPatch, 2000);
  },
  nodeCreated(node) {
    if (isPowerLoraNode(node)) ensureFolderWidget(node);
  },
  loadedGraphNode(node) {
    if (isPowerLoraNode(node)) ensureFolderWidget(node);
  },
});
