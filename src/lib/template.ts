const imageExtensions = ["jpg", "jpeg", "png", "gif"];

const rawImageExtensions = [
  "3fr",
  "ari",
  "arw",
  "bay",
  "braw",
  "crw",
  "cr2",
  "cr3",
  "cap",
  "data",
  "dcs",
  "dcr",
  "dng",
  "drf",
  "eip",
  "erf",
  "fff",
  "gpr",
  "iiq",
  "k25",
  "kdc",
  "mdc",
  "mef",
  "mos",
  "mrw",
  "nef",
  "nrw",
  "obm",
  "orf",
  "pef",
  "ptx",
  "pxn",
  "r3d",
  "raf",
  "raw",
  "rwl",
  "rw2",
  "rwz",
  "sr2",
  "srf",
  "srw",
  "tif",
  "x3f",
];

const videoExtensions = [
  "3g2",
  "3gp",
  "aaf",
  "asf",
  "avchd",
  "avi",
  "drc",
  "flv",
  "m2v",
  "m3u8",
  "m4p",
  "m4v",
  "mkv",
  "mng",
  "mov",
  "mp2",
  "mp4",
  "mpe",
  "mpeg",
  "mpg",
  "mpv",
  "mxf",
  "nsv",
  "ogg",
  "ogv",
  "qt",
  "rm",
  "rmvb",
  "roq",
  "svi",
  "vob",
  "webm",
  "wmv",
  "yuv",
];

const ext = (exts: string[]) =>
  [...exts, ...exts.map((e) => e.toUpperCase())].join(",");

export const defaultTempalteProps = {
  ext: {
    images: `*.{${ext(imageExtensions)}}`,
    raws: `*.{${ext(rawImageExtensions)}}`,
    allImages: `*.{${ext([...imageExtensions, ...rawImageExtensions])}}`,
    video: `*.{${ext(videoExtensions)}}`,
    allMedia: `*.{${ext([
      ...imageExtensions,
      ...rawImageExtensions,
      ...videoExtensions,
    ])}}`,
  },
};
