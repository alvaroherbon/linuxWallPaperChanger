/* main.js
 *
 * Copyright 2024 ahb
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw?version=1";
import GLib from "gi://GLib";

import { LinuxwallpaperchangerWindow } from "./window.js";

pkg.initGettext();
pkg.initFormat();

export const LinuxwallpaperchangerApplication = GObject.registerClass(
  class LinuxwallpaperchangerApplication extends Adw.Application {
    _settings = new Gio.Settings({
      schemaId: "org.gnome.linuxWallpaperChanger",
    });

    constructor() {
      super({
        application_id: "org.gnome.linuxWallpaperChanger",
        flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
      });

      const quit_action = new Gio.SimpleAction({ name: "quit" });
      quit_action.connect("activate", (action) => {
        this.quit();
      });
      this.add_action(quit_action);
      this.set_accels_for_action("app.quit", ["<primary>q"]);

      const isDarkMode = this._settings.get_boolean("dark-mode");
      const styleManager = Adw.StyleManager.get_default();
      styleManager.color_scheme = isDarkMode
        ? Adw.ColorScheme.FORCE_DARK
        : Adw.ColorScheme.DEFAULT;

      const darkModeAction = Gio.SimpleAction.new_stateful(
        "dark-mode",
        null,
        GLib.Variant.new_boolean(false)
      );
      darkModeAction.connect("activate", this.toggleDarkMode.bind(this));
      darkModeAction.connect("change-state", this.changeColorScheme.bind(this));
      this.add_action(darkModeAction);

      const show_about_action = new Gio.SimpleAction({ name: "about" });
      show_about_action.connect("activate", (action) => {
        let aboutParams = {
          transient_for: this.active_window,
          application_name: "linuxwallpaperchanger",
          application_icon: "org.gnome.linuxWallpaperChanger",
          developer_name: "ahb",
          version: "0.1.0",
          developers: ["ahb"],
          copyright: "© 2024 ahb",
        };
        const aboutWindow = new Adw.AboutWindow(aboutParams);
        aboutWindow.present();
      });
      this.add_action(show_about_action);
    }

    toggleDarkMode(action) {
      const oldState = action.state.get_boolean();
      const newState = !oldState;
      action.change_state(GLib.Variant.new_boolean(newState));
    }

    changeColorScheme(action, newState) {
      const isDarkMode = newState.get_boolean();
      const styleManager = Adw.StyleManager.get_default();

      styleManager.color_scheme = isDarkMode
        ? Adw.ColorScheme.FORCE_DARK
        : Adw.ColorScheme.DEFAULT;

      action.set_state(newState);
      this._settings.set_boolean("dark-mode", isDarkMode);
    }

    vfunc_activate() {
      let { active_window } = this;

      if (!active_window) active_window = new LinuxwallpaperchangerWindow(this);

      active_window.present();
    }
  }
);

export function main(argv) {
  const application = new LinuxwallpaperchangerApplication();
  return application.runAsync(argv);
}
