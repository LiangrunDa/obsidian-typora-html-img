TARGET_DIR = typora-html-local-img
ZIP_FILE = $(TARGET_DIR).zip

FILES = main.js manifest.json

all: $(ZIP_FILE)

$(TARGET_DIR):
	mkdir -p $(TARGET_DIR)
	cp $(FILES) $(TARGET_DIR)

$(ZIP_FILE): $(TARGET_DIR)
	zip -r $(ZIP_FILE) $(TARGET_DIR)
	rm -rf $(TARGET_DIR)

clean:
	rm -rf $(ZIP_FILE)

.PHONY: all clean
