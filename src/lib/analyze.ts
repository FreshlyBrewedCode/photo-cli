import * as exiftool from "node-exiftool";
import * as exiftoolBin from "dist-exiftool";
import { execPath } from "process";
import { Command } from "@oclif/core";
import { compareAsc, format, parse } from "date-fns";
import path = require("path");
import PhotoCommand from "./PhotoCommand";
import { stringifyJsonPretty } from "./utils";

export const analyzeImages = async (cmd: PhotoCommand, paths: string[]) => {
  const exif = new exiftool.ExiftoolProcess(exiftoolBin);
  await exif.open();
  const result: Record<string, any> = {};
  for (let path of paths) {
    const { data, error } = await exif.readMetadata(path);
    if (error) {
      cmd.log(`Error loading file ${path}: ${error}`);
      continue;
    }
    cmd.logDebug(`${path}: ${stringifyJsonPretty(data)}`);
    result[path] = postProcessImageInfo(data[0]);
  }
  await exif.close();
  return result;
};

const postProcessImageInfo = (info: any) => ({
  exif: info,
  filename: info.FileName,
  dirname: path.basename(path.resolve(path.dirname(info.SourceFile))),
  // ext: path.extname(info.FileName),
  ...dateInfo(exifDate(info.CreateDate)),
  _date: exifDate(info.CreateDate),
});

const exifDate = (date: string) =>
  parse(date, "yyyy:MM:dd HH:mm:ss", new Date());

const dateInfo = (date: Date, namer = (name: string) => name) => {
  return {
    [namer("year")]: format(date, "yyyy"),
    [namer("month")]: format(date, "MM"),
    [namer("day")]: format(date, "dd"),
    [namer("hour")]: format(date, "HH"),
    [namer("minute")]: format(date, "mm"),
    [namer("second")]: format(date, "ss"),
    [namer("date")]: () => (text: string, render: (s: string) => string) =>
      format(date, render(text)),
  };
};

export const getProjectInfo = (fileInfo: Record<string, any>) => {
  const sortedInfo = Object.values(fileInfo).sort((a, b) =>
    compareAsc(a._date, b._date)
  );

  return {
    ...dateInfo(sortedInfo[0]._date, (name) => `f_${name}`),
    ...dateInfo(sortedInfo[sortedInfo.length - 1]._date, (name) => `l_${name}`),
  };
};
