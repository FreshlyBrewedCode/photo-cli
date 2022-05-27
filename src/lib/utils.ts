import { PathLike } from "fs";
import { mkdir, stat } from "fs/promises";
import { dirname } from "path";
import { promisify } from "util";
import { glob as globCallback } from "glob";
import G = require("glob");

export const exists = async (path: PathLike) =>
  !!(await stat(path).catch((e) => false));

export const ensureDirectory = async (path: string) => {
  const dir = dirname(path);
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
};

export const isFile = async (path: PathLike) =>
  (await exists(path)) && (await stat(path)).isFile();

export const isDirectory = async (path: PathLike) =>
  (await exists(path)) && (await stat(path)).isDirectory();

// export const glob = promisify(globCallback);
export const glob = (pattern: string, options: G.IOptions) => {
  return new Promise<string[]>((resolve, reject) => {
    globCallback(pattern, options, (err, matches) => {
      if (err) reject(err);
      else resolve(matches);
    });
  });
};

export const stringifyJsonPretty = (obj: any, indent = 2) =>
  JSON.stringify(
    obj,
    (key, value) => {
      if (
        Array.isArray(value) &&
        !value.some((x) => x && typeof x === "object")
      ) {
        return `\uE000${JSON.stringify(
          value.map((v) =>
            typeof v === "string" ? v.replace(/"/g, "\uE001") : v
          )
        )}\uE000`;
      }
      return value;
    },
    indent
  ).replace(/"\uE000([^\uE000]+)\uE000"/g, (match) =>
    match
      .substr(2, match.length - 4)
      .replace(/\\"/g, '"')
      .replace(/\uE001/g, '\\"')
  );
