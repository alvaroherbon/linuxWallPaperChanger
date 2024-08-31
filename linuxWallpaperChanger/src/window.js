import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Soup from "gi://Soup";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gdk from "gi://Gdk";

// Función para aplicar el CSS
function applyCss() {
  const css = `
    .rounded-picture {
      border-radius: 20px;
    }
  `;

  const provider = Gtk.CssProvider.new();
  provider.load_from_data(css, css.length);
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
  );
}

const UNSPLASH_ACCESS_KEY = "D1MWpxMdgnJFNY6odPTuZU_H7lYyzC1cIKiYg-u9bWk";

export const LinuxwallpaperchangerWindow = GObject.registerClass(
  {
    GTypeName: "LinuxwallpaperchangerWindow",
    Template: "resource:///org/gnome/linuxWallpaperChanger/window.ui",
    InternalChildren: [
      "search_entry",
      "box_container",
      "set_background_button",
    ],
  },
  class LinuxwallpaperchangerWindow extends Adw.ApplicationWindow {
    constructor(application) {
      super({ application });
      this._search_entry.connect(
        "activate",
        this._onSearchEntryActivate.bind(this)
      );
      this._soupSession = new Soup.Session();

      const openAction = new Gio.SimpleAction({ name: "open" });
      openAction.connect("activate", () =>
        this._onSetBackgroundButtonClicked()
      );
      this.add_action(openAction);

      // Aplicar el CSS
      applyCss();

      // this._onSearchEntryActivate();
    }

    _onSearchEntryActivate() {
      const query = this._search_entry.get_text() || "nature";
      console.log(`Buscando imágenes aleatorias sobre: ${query}`);

      const cacheBuster = `cb=${new Date().getTime()}`;
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        query
      )}&collections=wallpapers&count=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}&${cacheBuster}`;

      const request = Soup.Message.new("GET", url);
      this._soupSession.send_and_read_async(
        request,
        GLib.PRIORITY_DEFAULT,
        null,
        (session, result) => {
          try {
            const response = session.send_and_read_finish(result);
            if (request.get_status() !== Soup.Status.OK) {
              throw new Error("Error en la solicitud a la API de Unsplash");
            }

            const data = JSON.parse(
              new TextDecoder().decode(response.get_data())
            );
            console.log(data);

            if (data.length > 0) {
              const image = data[0];
              const imageUrl = image.urls.full;
              console.log(`Imagen aleatoria encontrada: ${imageUrl}`);
              // Descarga la imagen, pero no cambia el fondo automáticamente
              this._downloadAndSaveImage(imageUrl, false); // Cambia el fondo solo si se pide explícitamente
            } else {
              console.log("No se encontraron imágenes.");
            }
          } catch (error) {
            console.error("Error al llamar a la API de Unsplash:", error);
          }
        }
      );
    }

    _downloadAndSaveImage(url, shouldSetBackground = false) {
      const request = Soup.Message.new("GET", url);
      this._soupSession.send_and_read_async(
        request,
        GLib.PRIORITY_DEFAULT,
        null,
        (session, result) => {
          try {
            const response = session.send_and_read_finish(result);
            if (request.get_status() !== Soup.Status.OK) {
              throw new Error("Error al descargar la imagen");
            }

            const picturesDir = GLib.get_user_special_dir(
              GLib.UserDirectory.PICTURES
            );
            this._filePath = GLib.build_filenamev([
              picturesDir,
              "unsplash_image.jpg",
            ]);
            const file = Gio.File.new_for_path(this._filePath);
            const outputStream = file.replace(
              null,
              false,
              Gio.FileCreateFlags.NONE,
              null
            );
            outputStream.write(response.get_data(), null);
            outputStream.close(null);

            this._createAndAddPicture(this._filePath);

            // Cambia el fondo solo si se solicitó explícitamente
            if (shouldSetBackground) {
              this._onSetBackgroundButtonClicked();
            }
          } catch (error) {
            console.error("Error al descargar la imagen desde la URL:", error);
          }
        }
      );
    }

    _createAndAddPicture(filePath) {
      try {
        console.log(`Creando imagen con path ${filePath}`);
        // Crea un nuevo GtkPicture con la imagen
        const newPicture = Gtk.Picture.new_for_filename(filePath);
        newPicture.get_style_context().add_class("rounded-picture");

        const child = this._box_container.get_first_child();
        if (child) {
          this._box_container.remove(child);
        }
        this._box_container.prepend(newPicture);
      } catch (error) {
        console.error("Error al crear y añadir la imagen:", error);
      }
    }

    _onSetBackgroundButtonClicked() {
      if (this._filePath) {
        this._setBackground(this._filePath);
      } else {
        console.warn("No hay imagen disponible para establecer como fondo.");
      }
    }

    _setBackground(filePath) {
      console.log("pulsado");
      try {
        const command = `gsettings set org.gnome.desktop.background picture-uri file://${filePath}`;

        GLib.spawn_command_line_async(command);
      } catch (error) {
        console.error("Error al cambiar el fondo de pantalla:", error);
      }
    }
  }
);
