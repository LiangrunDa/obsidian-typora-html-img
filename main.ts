import {Platform, Plugin, Modal, App} from 'obsidian';
import {EditorView, PluginValue, ViewPlugin, ViewUpdate,} from "@codemirror/view";

const DEBUG = false;

class LocalImagePluginView implements PluginValue {
	constructor(
		private app: App,
		private view: EditorView,
		private callback: (element: HTMLElement, currentPath: string) => void
	) {
	}

	update(update: ViewUpdate) {
		const currentPath = this.app.workspace.getActiveFile()?.path;
		if (currentPath == null) {
			return;
		}
		const element = this.view.dom;
		this.callback(element, currentPath);
	}

	destroy() {
		console.log("destroyed");
	}
}

export default class HtmlLocalImgPlugin extends Plugin {

	async onload() {

		// the post processor is called in reading mode
		this.registerMarkdownPostProcessor((element, ctx) => {
			this.processElement(element, ctx.sourcePath);
		})

		this.registerEditorExtension(
			ViewPlugin.define(
				(view) =>
					new LocalImagePluginView(
						this.app,
						view,
						this.processElement.bind(this)
					)),
		);
	}

	processElement(element: HTMLElement, currentPath: string) {
		debug(this.app, "Processing element" + element.innerText + " with current path: " + currentPath)
		const images = Array.from(element.getElementsByTagName("img"));
		if (this.app?.metadataCache == null) {
			return;
		}
		for (const image of images) {
			if (image.src == "" ||
				image.src.startsWith("https://") ||
				image.src.startsWith("/") ||
				(image.src.startsWith("app://") && !image.src.startsWith("app://obsidian.md/"))
				) {
				continue;
			}

			const src = image.src.replace('app://obsidian.md/', '').replace('capacitor://localhost/', '')
			// for encoded characters
			const decodedSrc = decodeURIComponent(src);


			const imageFile = this.app.metadataCache.getFirstLinkpathDest(decodedSrc, currentPath);
			if (imageFile == null) {
				debug(this.app, "trying to get image file: " + decodedSrc + " with current path: " + currentPath + " but failed")
				continue;
			} else {
				debug(this.app, "trying to get image file: " + decodedSrc + " with current path: " + currentPath + " and succeeded")
			}


			const active_path = this.app.vault.getResourcePath(imageFile)


			if (Platform.isMobile) {
				image.style.objectFit = "contain"
				image.src = active_path
				debug(this.app, "Image path updated: " + image.src)
			} else {
				image.src = active_path + '/' + decodedSrc
				debug(this.app, "Image path updated: " + image.src)
			}

		}
	}
}

const debug = (app: App, message: string) => {
	if (DEBUG){
		console.log(message);
		if (Platform.isMobile) {
			new DebugModal(app, message).open()
		}
	}
}

// Debug Modal used in iOS since console.log is not available
class DebugModal extends Modal {
	constructor(app: App, private message: string) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl('h2', {text: this.message});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
