# Photo CLI

A command line tool for organizing photo and video files using glob patterns and path templates.

- [Photo CLI](#photo-cli)
- [Installation](#installation)
- [Usage](#usage)
  - [Import](#import)
    - [List of available template properties](#list-of-available-template-properties)
      - [`from` tempalte properties](#from-tempalte-properties)
        - [Extensions](#extensions)
      - [`to` template properties](#to-template-properties)
        - [Dates](#dates)
    - [Template and preset configuration](#template-and-preset-configuration)
      - [Example config](#example-config)
- [Commands](#commands)
  - [`photo config`](#photo-config)
  - [`photo help [COMMAND]`](#photo-help-command)
  - [`photo import [PRESET]`](#photo-import-preset)

# Installation

Make sure NodeJS and npm is installed and run:
```sh-session
npm install -g photo-cli
```

# Usage

## Import

The import command copies/moves files from an input directory to an output destination. The input/output paths of each file are determined using a [mustache](https://github.com/janl/mustache.js) template:
```yaml
my-tempalte:
  - from: "{{input}}/*.jpg"
    to: "{{output}}/Pictures/{{filename}}"
```
A template consists of an array of `from`/`to` pairs where the rendered `from` string is used as a [glob](https://github.com/isaacs/node-glob) pattern to find input files and the rendered `to` string is used as the output path.

Each file is analyzed using [ExifTool](https://exiftool.org/) to extract image/video metadata. The extracted metadata is passed along when rendering the path template allowing you to use the metadata for the output path:
```yaml
my-tempalte:
  - from: "{{input}}/*.jpg"
    to: "{{output}}/Pictures/{{year}}-{{month}}-{{day}}/{{filename}}"
```
In the example above the extracted date information is used for the name of the output directory.

### List of available template properties

#### `from` tempalte properties

| Name      | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `input`   | The input path provided using the preset or the `--input` flag.             |
| `output`  | The output path provided using the preset or the `--output` flag.           |
| `project` | The project name provided using the `--project` flag.                       |
| `ext`     | Object containing different glob patterns for common media file extensions. |

##### Extensions

The `from` template receives glob patterns for common media file extensions in the `ext` object: `ext.images`, `ext.raws`, `ext.allImages`, `ext.video`, `ext.allMedia`. See [`src/lib/template.ts](src/lib/template.ts) for more info.
You can also provide your own glob pattern: 
```
// Get all .png files
*.png

// Get .png and .PNG files
*.{png,PNG}
```

#### `to` template properties

You can run the import command with the `--verbose` flag to see the template properties that are used for each file:
```
photo import --input . --template my-template --verbose
```

Here is an overview of the available properties:
| Name       | Description                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `exif`     | Object containing the extracted exif metadata. You can access the properties using javascript dot notation e.g. `exif.FileName`. |
| `filename` | The name of the file with extension. Same as `exif.FileName`.                                                                    |
| `dirname`  | Base name of the parent directory of the file (not the full path)                                                                |

##### Dates

For each file the `CreateDate` property from the exif metadata is parsed and provided to the template with the following properties: `year`, `month`, `day`, `hour`, `minute`, `second`. Additionally, you can use custom formatting using the function syntax of mustache: 
```mustache
{{# date}}yyyy-MM-dd{{/ date}}
``` 
The string between the `date` tags will be formated using [date-fns](https://date-fns.org/v2.28.0/docs/format).

In addition to `date`, two more dates will be passed along: `f_date` (first date) and `l_date` (last date) (as well as `f_year`/`l_year`, etc.). They are the dates of the earliest/latest image/video being imported and can be used to group files taken over a longer period of time.

### Template and preset configuration

The import command relies on presets and templates that are defined in the photo-cli config file. You can edit the file by running `photo config` and opening the file in your favorite text editor.

The config file is a yaml file with the following format:
```yaml
presets:
  <name>:
    input: <input path> 
    output: <output path> 
    template: <tempalte name> 
templates:
  <name>:
    - from: <from template> 
      to: <to template> 
```
Templates are configured as described above. Presets can be used to provide default values for import command flags `--input`, `--output`, and `--template`.

#### Example config

```yaml
presets:
  canon:
    input: F:/DCIM/100CANON
    output: M:/Pictures
    template: date 
templates:
  date:
    - from: "{{input}}/{{ext.allMedia}}"
      to: "{{output}}/{{year}}-{{month}}-{{day}}/{{filename}}"
```

The above config contains a preset for importing files from an SD card used in a Canon camera to a pictures directory using a date preset that organizes files in directories by date. Files can be imported using this preset with the following command:
```
photo import canon
```

# Commands
<!-- commands -->
* [`photo config`](#photo-config)
* [`photo help [COMMAND]`](#photo-help-command)
* [`photo import [PRESET]`](#photo-import-preset)

## `photo config`

Edit the photo-cli config.

```
USAGE
  $ photo config

DESCRIPTION
  Edit the photo-cli config.
```

_See code: [dist/commands/config.ts](https://github.com/FreshlyBrewedCode/photo-cli/blob/v1.0.0/dist/commands/config.ts)_

## `photo help [COMMAND]`

Display help for photo.

```
USAGE
  $ photo help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for photo.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

## `photo import [PRESET]`

Imports files from the input directory to the output directory using a path template.

```
USAGE
  $ photo import [PRESET] [-i <value>] [-o <value>] [-t <value>] [-P <value>] [-p <value>] [-c] [-m] [-f]
    [-v]

FLAGS
  -P, --preset=<value>    name of the import preset
  -c, --confirm           performs the import without additional user confirmation
  -f, --force             overwrite existing files in output directory
  -i, --input=<value>     input path
  -m, --move              move files instead of copy
  -o, --output=<value>    output path
  -p, --project=<value>   the project name of the import
  -t, --template=<value>  name of the template config
  -v, --verbose

DESCRIPTION
  Imports files from the input directory to the output directory using a path template.

EXAMPLES
  $ photo import
```

_See code: [dist/commands/import.ts](https://github.com/FreshlyBrewedCode/photo-cli/blob/v1.0.0/dist/commands/import.ts)_
<!-- commandsstop -->
- [Photo CLI](#photo-cli)
- [Installation](#installation)
- [Usage](#usage)
  - [Import](#import)
    - [List of available template properties](#list-of-available-template-properties)
      - [`from` tempalte properties](#from-tempalte-properties)
        - [Extensions](#extensions)
      - [`to` template properties](#to-template-properties)
        - [Dates](#dates)
    - [Template and preset configuration](#template-and-preset-configuration)
      - [Example config](#example-config)
- [Commands](#commands)
  - [`photo config`](#photo-config)
  - [`photo help [COMMAND]`](#photo-help-command)
  - [`photo import [PRESET]`](#photo-import-preset)

## `photo config`

Edit the photo-cli config.

```
USAGE
  $ photo config

DESCRIPTION
  Edit the photo-cli config.
```

_See code: [dist/commands/config.ts](https://github.com/FreshlyBrewedCode/photo-cli/blob/v0.0.0/dist/commands/config.ts)_

## `photo help [COMMAND]`

Display help for photo.

```
USAGE
  $ photo help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for photo.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

## `photo import [PRESET]`

Imports files from the input directory to the output directory using a path template.

```
USAGE
  $ photo import [PRESET] [-i <value>] [-o <value>] [-t <value>] [-P <value>] [-p <value>] [-c] [-m] [-f]
    [-v]

FLAGS
  -P, --preset=<value>    name of the import preset
  -c, --confirm           performs the import without additional user confirmation
  -f, --force             overwrite existing files in output directory
  -i, --input=<value>     input path
  -m, --move              move files instead of copy
  -o, --output=<value>    output path
  -p, --project=<value>   the project name of the import
  -t, --template=<value>  name of the template config
  -v, --verbose

DESCRIPTION
  Imports files from the input directory to the output directory using a path template.

EXAMPLES
  $ photo import
```

_See code: [dist/commands/import.ts](https://github.com/FreshlyBrewedCode/photo-cli/blob/v0.0.0/dist/commands/import.ts)_
<!-- commandsstop -->
