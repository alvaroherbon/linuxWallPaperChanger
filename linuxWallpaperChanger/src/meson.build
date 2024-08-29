pkgdatadir = get_option('prefix') / get_option('datadir') / meson.project_name()
moduledir = pkgdatadir / 'linuxwallpaperchanger'
gnome = import('gnome')

gnome.compile_resources('linuxwallpaperchanger',
  'linuxwallpaperchanger.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

python = import('python')

# Encuentra la instalación de Python3
py_installation = python.find_installation('python3')

# Añade las dependencias de Python necesarias
py_deps = ['requests']

# Definimos una tarea personalizada para instalar las dependencias de Python
install_python_dependencies = custom_target(
  'install_python_dependencies',
  command: [py_installation, '-m', 'pip', 'install', '--user', '-r', 'requirements.txt'],
  output: 'pip-install.log'
)

# Asegura que la tarea personalizada para instalar dependencias se ejecute antes de la configuración
install_python_dependencies_dep = declare_dependency(
  link_with: install_python_dependencies
)

conf = configuration_data()
conf.set('PYTHON', python.find_installation('python3').full_path())
conf.set('VERSION', meson.project_version())
conf.set('localedir', get_option('prefix') / get_option('localedir'))
conf.set('pkgdatadir', pkgdatadir)

configure_file(
  input: 'linuxwallpaperchanger.in',
  output: 'linuxwallpaperchanger',
  configuration: conf,
  install: true,
  install_dir: get_option('bindir'),
  install_mode: 'r-xr-xr-x'
)

linuxwallpaperchanger_sources = [
  '__init__.py',
  'main.py',
  'window.py',
]

# Instala los datos después de asegurarse que las dependencias están instaladas
install_data(linuxwallpaperchanger_sources, install_dir: moduledir)
