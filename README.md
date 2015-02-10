# brackets-sencha

A Brackets extension for various Sencha integrations.

## Sencha Cmd

Currenly, you can execute `sencha app refresh`, `sencha app build testing` and `sencha app build production` commands by right-clicking within an Ext JS/Touch application. It will bubble up the directory tree to find the application's root directory.

Each time a command is executed, it will also find what version of Sencha Cmd the application is using via the `.sencha/app/sencha.cfg` file. Based on this version, it will attempt to resolve the path to Sencha Cmd. If the path is invalid, you will be asked for the location of the install directory wher eall the different Cmd versions are actually installed. For example, `/Users/myusername/bin/Sencha/Cmd` is the location on OSX. Now it should be able to find the Cmd install based on that version.

## TODO

 - Preferences UI
 - Sencha Cmd
  - If the Cmd version the application is using is not installed, it will think the path to the Cmd install directory is not set and will ask. Need to be able to specify a version.
  - Other commands, `sencha app upgrade` for example
