import {Platform, Plugin, Modal, App} from 'obsidian';
import {EditorView, PluginValue, ViewPlugin, ViewUpdate,} from "@codemirror/view";

const DEBUG = false;

class LocalImagePluginView implements PluginValue {
	constructor(
		private view: EditorView,
		private callback: (dom: HTMLElement) => void
	) {
	}

	update(update: ViewUpdate) {
		this.callback(this.view.dom);
	}

	destroy() {
		console.log("destroyed");
	}
}

export default class HtmlLocalImgPlugin extends Plugin {

	async onload() {

		// the post processor is called in reading mode
		this.registerMarkdownPostProcessor((element, _) => {
			this.processElement(element);
		})

		this.registerEditorExtension(
			ViewPlugin.define(
				(view) =>
					new LocalImagePluginView(
						view,
						this.processElement.bind(this)
					)),
		);
	}

	processElement(element: HTMLElement) {
		const images = Array.from(element.getElementsByTagName("img"));
		if (this.app?.metadataCache == null) {
			return;
		}
		for (const image of images) {
			if (image.src == "" ||
				image.src.startsWith("https://") ||
				image.src.startsWith("/")
				) {
				continue;
			}

			const src = image.src.replace('app://obsidian.md/', '').replace('capacitor://localhost/', '')
			// for encoded characters
			const decodedSrc = decodeURIComponent(src);

			const activeFile = this.app.workspace.getActiveFile();

			if (activeFile == null) {
				debug(this.app, "Active file is null")
				continue
			}

			const imageFile = this.app.metadataCache.getFirstLinkpathDest(decodedSrc, activeFile.path);
			if (imageFile == null) {
				// debug(this.app, "Image file is null")
				continue;
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
