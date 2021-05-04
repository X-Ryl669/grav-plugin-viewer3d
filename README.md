# 3d Viewer Plugin

Display an interactive 3D model in your Grav CMS blog page from where you can download, measure and observe your models. 

It supports 3D model file in the following format:
- obj (with mtl and texture)
- 3ds (with texture)
- stl (text and binary)
- ply (text and binary)
- gltf (text and binary)
- off (text only)

The **3d Viewer** Plugin is an extension for [Grav CMS](http://github.com/getgrav/grav). A 3D object viewer plugin for GravCMS

## Demo page

Visit [this blog article](https://blog.cyril.by/en/documentation/3d%20models/filament-detector) for a example usage of the plugin.

## Installation

Installing the 3d Viewer plugin can be done in one of three ways: The GPM (Grav Package Manager) installation method lets you quickly install the plugin with a simple terminal command, the manual method lets you do so via a zip file, and the admin method lets you do so via the Admin Plugin.

### GPM Installation (Preferred)

To install the plugin via the [GPM](http://learn.getgrav.org/advanced/grav-gpm), through your system's terminal (also called the command line), navigate to the root of your Grav-installation, and enter:

    bin/gpm install viewer3d

This will install the 3d Viewer plugin into your `/user/plugins`-directory within Grav. Its files can be found under `/your/site/grav/user/plugins/viewer3d`.

### Manual Installation

To install the plugin manually, download the zip-version of this repository and unzip it under `/your/site/grav/user/plugins`. Then rename the folder to `viewer3d`. You can find these files on [GitHub](https://github.com/x-ryl669/grav-plugin-viewer3d) or via [GetGrav.org](http://getgrav.org/downloads/plugins#extras).

You should now have all the plugin files under

    /your/site/grav/user/plugins/viewer3d
	
> NOTE: This plugin is a modular component for Grav which may require other plugins to operate, please see its [blueprints.yaml-file on GitHub](https://github.com/x-ryl669/grav-plugin-viewer3d/blob/master/blueprints.yaml).

### Admin Plugin

If you use the Admin Plugin, you can install the plugin directly by browsing the `Plugins`-menu and clicking on the `Add` button.

## Configuration

Before configuring this plugin, you should copy the `user/plugins/viewer3d/viewer3d.yaml` to `user/config/plugins/viewer3d.yaml` and only edit that copy.

Here is the default configuration and an explanation of available options:

```yaml
enabled: true
```

Note that if you use the Admin Plugin, a file with your configuration named viewer3d.yaml will be saved in the `user/config/plugins/`-folder once the configuration is saved in the Admin.

Also, if you intend to use 3d files on your website, you must ensure that the file type is supported by Grav. Go in the *Admin* / *Configuration* page and select the *Media* tab.
You'll likely need to create an handler for your intended 3d model format.

For example, for STL file, you'll need to click: `+ Add Item` button, and add a filetype like this:
```
File extension: stl
Type: file
Thumb: media/thumb.png
Mime type: model/stl 
```



## Usage

Simply add:

````
[3dv]YourFile.stl[/3dv]
````

To your page and a 3D plugin will appear, showing **YourFile.stl** (must be in the same folder as your page).

## Credits

Makes use of [Online3DViewer](https://github.com/kovacsv/Online3DViewer) embed code. I've modified the initial code for additional features.

## License

This plugin is distributed under AGPL license, and uses Online3DViewer's plugin in MIT license. 

It's free to use on your website provided you don't make closed source modification to the plugin code. 

If you need to use it in a commercial website with private modifications, feel free to contact me for a relicensing.


