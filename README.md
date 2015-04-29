# brackets-sencha

A Brackets extension for various Sencha integrations.

## Sencha Cmd

Currenly, you can execute `sencha app refresh`, `sencha app build testing` and `sencha app build production` commands by right-clicking within an Ext JS/Touch application. It will bubble up the directory tree to find the application's root directory.

Each time a command is executed, it will also find what version of Sencha Cmd the application is using via the `.sencha/app/sencha.cfg` file. Based on this version, it will attempt to resolve the path to Sencha Cmd. If the path is invalid, you will be asked for the location of the install directory wher eall the different Cmd versions are actually installed. For example, `/Users/myusername/bin/Sencha/Cmd` is the location on OSX. Now it should be able to find the Cmd install based on that version.

If you have multiple build targets in your app.json, you will be shown a build selector to run the command under.

You can execute custom commands and save them.

## Sencha Fiddle

Sencha Fiddle integration allows you to download a public Fiddle (by URL or Fiddle ID) and run it on your local web server using local versions of the Ext JS or Sencha Touch SDK that the Fiddle is using.

## Preferences

To manage your preferences, choose "Sencha Preferences..." from the context menu. This will display a preferences manager in which you can modify your preferences.

## TODO

 - Sencha Cmd
  - Need to rewrite the .sencha dir finder.
  - If the Cmd version the application is using is not installed, it will think the path to the Cmd install directory is not set and will ask. Need to be able to specify a version.
  - Right-click in package to do a build will fail because it will find the .sencha dir but not the app dir.
   - Skip and keep bubbling up to find app dir?
   - Run a package build
    - With same menu item?
    - If menu manager add/remove items?
  - Other commands
   - `sencha app upgrade`
   - `sencha package build`
   - `sencha package upgrade`
   - etc
